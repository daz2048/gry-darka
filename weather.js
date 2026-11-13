(() => {
  'use strict';

  const panel = document.querySelector('.weather-panel');
  const shortcut = document.querySelector('.weather-shortcut');
  const shortcutLocation = document.querySelector('#weather-shortcut-location');
  const shortcutConditions = document.querySelector('#weather-shortcut-conditions');
  const locationOptions = document.querySelector('.weather-location');
  const status = document.querySelector('#weather-status');
  const notice = document.querySelector('#weather-notice');
  const searchForm = document.querySelector('#weather-search');
  const cityInput = document.querySelector('#weather-city');
  const searchStatus = document.querySelector('#weather-search-status');
  const results = document.querySelector('#weather-results');
  const locationStatus = document.querySelector('#weather-location-status');
  const deviceButton = document.querySelector('#weather-device');
  const autoButton = document.querySelector('#weather-auto');
  const cookieName = 'gry_weather_location';
  const cookiePath = new URL('.', location.href).pathname;
  const refreshMs = 30 * 60 * 1000;
  const london = { name: 'London, United Kingdom', latitude: 51.51, longitude: -0.13, source: 'default' };
  let selectedLocation;
  let locationRevision = 0;
  let weatherController;
  let searchController;
  let lastAttempt = 0;

  function report(error) {
    console.warn('Homepage weather:', error.message);
  }

  function validateLocation(value) {
    if (!value || typeof value.name !== 'string' || !value.name.trim() || value.name.length > 160 ||
        !Number.isFinite(value.latitude) || Math.abs(value.latitude) > 90 ||
        !Number.isFinite(value.longitude) || Math.abs(value.longitude) > 180 ||
        !['chosen', 'device', 'estimated', 'default'].includes(value.source)) {
      throw new Error('Invalid location data.');
    }
    return {
      name: value.name.trim(),
      latitude: Math.round(value.latitude * 100) / 100,
      longitude: Math.round(value.longitude * 100) / 100,
      source: value.source,
    };
  }

  function readSavedLocation() {
    const cookie = document.cookie.split('; ').find(item => item.startsWith(`${cookieName}=`));
    if (!cookie) return null;
    const value = JSON.parse(decodeURIComponent(cookie.slice(cookieName.length + 1)));
    if (value.version !== 1 || !['chosen', 'device'].includes(value.source)) {
      throw new Error('Invalid saved location. Choose a city again.');
    }
    return validateLocation(value);
  }

  function writeCookie(value, maxAge) {
    document.cookie = `${cookieName}=${value}; Max-Age=${maxAge}; Path=${cookiePath}; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
  }

  function saveLocation(value) {
    try {
      writeCookie(encodeURIComponent(JSON.stringify({ version: 1, ...value })), 180 * 24 * 60 * 60);
      const saved = readSavedLocation();
      if (!saved || JSON.stringify(saved) !== JSON.stringify(value)) throw new Error('Cookies are blocked.');
      locationStatus.textContent = 'Location saved for 180 days. You can change it here anytime.';
    } catch (error) {
      report(error);
      locationStatus.textContent = 'Location changed for this visit, but could not be saved. Check your cookie settings.';
    }
  }

  async function fetchJson(url, controller = new AbortController()) {
    const timeout = setTimeout(() => controller.abort(), 6500);
    try {
      const response = await fetch(url, { signal: controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
      if (!response.ok) throw new Error(`Service returned HTTP ${response.status}.`);
      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  function weatherTheme(code) {
    if (code === 0) return ['clear', 'Clear'];
    if (code === 1 || code === 2) return ['partly-cloudy', 'Partly cloudy'];
    if (code === 3) return ['cloudy', 'Overcast'];
    if (code === 45 || code === 48) return ['fog', 'Fog'];
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return ['rain', 'Rain'];
    if ([71, 73, 75, 77, 85, 86].includes(code)) return ['snow', 'Snow'];
    if ([95, 96, 99].includes(code)) return ['storm', 'Thunderstorm'];
    throw new Error('Unrecognised weather code.');
  }

  function locationLabel(value) {
    const labels = { default: 'default; IP estimate unavailable', estimated: 'IP estimate', chosen: 'chosen city', device: 'chosen approximate area' };
    return `${value.name} (${labels[value.source]})`;
  }

  function clearSky() {
    delete document.body.dataset.weather;
    delete document.body.dataset.day;
  }

  function updateShortcut(value, conditions) {
    shortcutLocation.textContent = value ? value.name : 'Finding city...';
    shortcutConditions.textContent = conditions;
    const label = `${value ? locationLabel(value) : 'Finding approximate city'} - ${conditions}. Open weather and location options.`;
    shortcut.setAttribute('aria-label', label);
    shortcut.title = label;
  }

  function rainChance(hourly) {
    const hour = Math.floor(Date.now() / (60 * 60 * 1000)) * 60 * 60;
    const index = Array.isArray(hourly?.time) ? hourly.time.indexOf(hour) : -1;
    const probability = index >= 0 ? hourly.precipitation_probability?.[index] : undefined;
    if (!Number.isFinite(probability) || probability < 0 || probability > 100) {
      report(new Error('Rain chance for this hour is unavailable.'));
      return 'Rain this hour: unavailable';
    }
    return `Rain this hour: ${Math.round(probability)}%`;
  }

  async function updateWeather() {
    const value = selectedLocation;
    if (!value) return;
    weatherController?.abort();
    const controller = new AbortController();
    weatherController = controller;
    lastAttempt = Date.now();
    status.textContent = `${locationLabel(value)} - loading weather...`;
    updateShortcut(value, 'Loading weather...');
    const query = new URLSearchParams({
      latitude: value.latitude, longitude: value.longitude,
      current: 'weather_code,is_day,temperature_2m', timeformat: 'unixtime',
      hourly: 'precipitation_probability', forecast_days: '2',
    });
    try {
      const data = await fetchJson(`https://api.open-meteo.com/v1/forecast?${query}`, controller);
      if (weatherController !== controller) return;
      const current = data.current;
      if (!current || ![0, 1].includes(current.is_day) || !Number.isFinite(current.temperature_2m) ||
          !Number.isFinite(current.time) || Math.abs(Date.now() - current.time * 1000) > 2 * 60 * 60 * 1000) {
        throw new Error('Weather data is missing or out of date.');
      }
      const [theme, description] = weatherTheme(current.weather_code);
      const chance = rainChance(data.hourly);
      const temperature = `${Math.round(current.temperature_2m)} °C`;
      updateShortcut(value, `${temperature} · ${chance}`);
      document.body.dataset.weather = theme;
      document.body.dataset.day = String(current.is_day === 1);
      const time = new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(new Date(current.time * 1000));
      status.textContent = `${locationLabel(value)} - ${description}, ${temperature} - ${current.is_day ? 'day' : 'night'}. ${chance} (precipitation, including snow). Updated ${time} (your time).`;
    } catch (error) {
      if (weatherController !== controller) return;
      report(error);
      clearSky();
      updateShortcut(value, 'Weather unavailable');
      status.textContent = `${locationLabel(value)} - weather unavailable. Showing the neutral background; retrying in 30 minutes.`;
    }
  }

  function applyLocation(value, remember = false) {
    selectedLocation = validateLocation(value);
    locationRevision++;
    deviceButton.disabled = false;
    notice.textContent = '';
    clearSky();
    if (remember) saveLocation(selectedLocation);
    void updateWeather();
  }

  async function estimateLocation() {
    const revision = ++locationRevision;
    weatherController?.abort();
    weatherController = undefined;
    selectedLocation = undefined;
    clearSky();
    status.textContent = 'Finding approximate city...';
    updateShortcut(null, 'Loading weather...');
    try {
      const data = await fetchJson('https://ipwho.is/?fields=success,message,city,country,latitude,longitude');
      if (revision !== locationRevision) return;
      if (data.success !== true || typeof data.city !== 'string' || !data.city.trim()) {
        throw new Error('IP city estimate unavailable.');
      }
      const value = validateLocation({
        name: [data.city, data.country].filter(Boolean).join(', '),
        latitude: data.latitude, longitude: data.longitude, source: 'estimated',
      });
      applyLocation(value);
    } catch (error) {
      if (revision !== locationRevision) return;
      report(error);
      applyLocation(london);
      notice.textContent = 'Could not estimate your city. Using London; choose a different location anytime.';
    }
  }

  searchForm.addEventListener('submit', async event => {
    event.preventDefault();
    searchController?.abort();
    const controller = new AbortController();
    searchController = controller;
    results.replaceChildren();
    const name = cityInput.value.trim();
    if (name.length < 2) {
      searchStatus.textContent = 'Enter at least two characters.';
      return;
    }
    searchStatus.textContent = 'Searching cities...';
    const query = new URLSearchParams({ name, count: '5', language: 'en', format: 'json' });
    try {
      const data = await fetchJson(`https://geocoding-api.open-meteo.com/v1/search?${query}`, controller);
      if (searchController !== controller) return;
      if (data.results !== undefined && !Array.isArray(data.results)) throw new Error('Invalid city search response.');
      const cities = (data.results || []).map(city => validateLocation({
        name: [...new Set([city.name, city.admin1, city.country].filter(Boolean))].join(', '),
        latitude: city.latitude, longitude: city.longitude, source: 'chosen',
      }));
      searchStatus.textContent = cities.length ? 'Select a city to use and remember:' : 'No cities found. Try a nearby city or a different spelling.';
      for (const city of cities) {
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = city.name;
        button.addEventListener('click', () => {
          applyLocation(city, true);
          results.replaceChildren();
          searchStatus.textContent = '';
        });
        item.append(button);
        results.append(item);
      }
    } catch (error) {
      if (searchController !== controller) return;
      report(error);
      searchStatus.textContent = 'City search unavailable. Please try again; your current location has not changed.';
    }
  });

  deviceButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
      locationStatus.textContent = 'Device location is unavailable. Search for a city instead.';
      return;
    }
    const revision = ++locationRevision;
    deviceButton.disabled = true;
    locationStatus.textContent = 'Waiting for location permission and an approximate position...';
    navigator.geolocation.getCurrentPosition(position => {
      if (revision !== locationRevision) return;
      deviceButton.disabled = false;
      try {
        const value = validateLocation({
          name: 'Selected area', latitude: position.coords.latitude, longitude: position.coords.longitude, source: 'device',
        });
        value.name = `Area near ${value.latitude}, ${value.longitude}`;
        applyLocation(value, true);
      } catch (error) {
        report(error);
        locationStatus.textContent = 'Device location was invalid. Search for a city instead.';
        if (!selectedLocation) void estimateLocation();
      }
    }, error => {
      if (revision !== locationRevision) return;
      report(error);
      deviceButton.disabled = false;
      locationStatus.textContent = error.code === 1 ?
        'Location permission denied. Search for a city instead; we will not ask again automatically.' :
        'Could not get your device location. Search for a city instead.';
      if (!selectedLocation) void estimateLocation();
    }, { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 });
  });

  autoButton.addEventListener('click', () => {
    try {
      writeCookie('', 0);
      if (readSavedLocation()) throw new Error('Could not remove saved cookie.');
      locationStatus.textContent = 'Saved choice cleared. Using an automatic estimate.';
    } catch (error) {
      report(error);
      locationStatus.textContent = 'Could not clear the saved cookie. Automatic estimate applies to this visit only.';
    }
    deviceButton.disabled = false;
    void estimateLocation();
  });

  function refreshIfNeeded() {
    document.body.classList.toggle('weather-paused', document.hidden);
    if (!document.hidden && Date.now() - lastAttempt >= refreshMs) void updateWeather();
  }

  shortcut.addEventListener('click', () => {
    locationOptions.open = true;
    panel.focus({ preventScroll: true });
  });
  panel.hidden = false;
  shortcut.hidden = false;
  document.addEventListener('visibilitychange', refreshIfNeeded);
  setInterval(refreshIfNeeded, refreshMs);
  try {
    const saved = readSavedLocation();
    if (saved) applyLocation(saved);
    else void estimateLocation();
  } catch (error) {
    report(error);
    locationStatus.textContent = 'Saved location could not be read. Choose a city to save it again.';
    void estimateLocation();
  }
})();
