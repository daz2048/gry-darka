const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const script = fs.readFileSync(path.join(__dirname, '..', 'weather.js'), 'utf8');
const city = { name: 'Paris', admin1: 'Ile-de-France', country: 'France', latitude: 48.8566, longitude: 2.3522 };
const ipCity = { success: true, city: 'Manchester', country: 'United Kingdom', latitude: 53.4808, longitude: -2.2426 };
const cookieName = 'gry_weather_location';
const settle = () => new Promise(resolve => setImmediate(resolve));

function element() {
  return {
    hidden: true, disabled: false, textContent: '', value: '', dataset: {}, children: [], events: {},
    addEventListener(name, callback) { this.events[name] = callback; },
    replaceChildren(...children) { this.children = children; },
    append(child) { this.children.push(child); },
    fire(name) { return this.events[name]({ preventDefault() {} }); },
    focus(options) { this.focused = true; this.focusOptions = options; },
    setAttribute(name, value) { this[name] = value; },
    classList: { toggle() {} },
  };
}

async function createPage(options = {}) {
  const elements = new Map();
  const get = selector => {
    if (!elements.has(selector)) elements.set(selector, element());
    return elements.get(selector);
  };
  const requests = [];
  const warnings = [];
  const cookies = new Map(options.cookie ? [[cookieName, options.cookie]] : []);
  const writes = [];
  const timers = new Map();
  const intervals = [];
  let now = Date.now();
  let nextTimer = 0;
  const document = {
    body: element(), hidden: false, events: {},
    querySelector: get, createElement: element,
    addEventListener(name, callback) { this.events[name] = callback; },
    get cookie() {
      if (options.cookiesUnavailable) throw new Error('Cookie access denied');
      return [...cookies].map(([key, value]) => `${key}=${value}`).join('; ');
    },
    set cookie(value) {
      writes.push(value);
      if (options.cookiesBlocked) return;
      const [pair] = value.split(';');
      const index = pair.indexOf('=');
      if (value.includes('Max-Age=0;')) cookies.delete(pair.slice(0, index));
      else cookies.set(pair.slice(0, index), pair.slice(index + 1));
    },
  };
  const geoCalls = [];
  const navigator = { geolocation: {
    getCurrentPosition(success, failure, config) { geoCalls.push({ success, failure, config }); },
  } };
  const state = {
    code: 61, isDay: 1, temperature: 12, ip: ipCity, cities: [city], ...options,
  };
  const fetch = async (url, config) => {
    requests.push({ url, config });
    const request = new URL(url);
    if (options.respond) {
      const response = options.respond(request, config);
      if (response !== undefined) return response;
    }
    let data;
    if (request.hostname === 'ipwho.is') {
      if (state.ipError) throw new Error('IP service offline');
      data = state.ip;
    } else if (request.hostname === 'geocoding-api.open-meteo.com') {
      if (state.searchError) throw new Error('Search offline');
      data = { results: state.cities };
    } else if (request.hostname === 'api.open-meteo.com') {
      if (state.weatherError) return { ok: false, status: 429 };
      const hour = Math.floor(now / 3600000) * 3600;
      data = {
        current: { weather_code: state.code, is_day: state.isDay, temperature_2m: state.temperature, time: now / 1000 },
        hourly: { time: [hour - 3600, hour, hour + 3600], precipitation_probability: [90, 35, 75] },
      };
      if (Object.hasOwn(state, 'hourly')) data.hourly = state.hourly;
      if (state.weatherData) data = state.weatherData;
    } else {
      throw new Error(`Unexpected request: ${url}`);
    }
    return { ok: true, json: async () => data };
  };
  vm.runInNewContext(script, {
    document, navigator, fetch, location: { href: 'https://example.test/gry-darka/', protocol: 'https:' },
    URL, URLSearchParams, AbortController, Intl,
    Date: class extends Date { static now() { return now; } },
    console: { warn: (...args) => warnings.push(args) },
    setTimeout(callback) { timers.set(++nextTimer, callback); return nextTimer; },
    clearTimeout(id) { timers.delete(id); },
    setInterval(callback) { intervals.push(callback); },
  });
  await settle();
  return {
    get, document, requests, warnings, cookies, writes, timers, intervals, geoCalls, state,
    advance(ms) { now += ms; },
    async chooseCity() {
      get('#weather-city').value = 'Paris';
      await get('#weather-search').fire('submit');
      get('#weather-results').children[0].children[0].fire('click');
      await settle();
    },
  };
}

function savedCookie(value = {}) {
  return encodeURIComponent(JSON.stringify({
    version: 1, name: 'Paris, France', latitude: 48.86, longitude: 2.35, source: 'chosen', ...value,
  }));
}

test('weather shortcut expands options and focuses the panel without changing location or requesting permission', async () => {
  const page = await createPage();
  const shortcut = page.get('.weather-shortcut');
  const options = page.get('.weather-location');
  assert.equal(shortcut.hidden, false);
  const requestCount = page.requests.length;
  for (let click = 0; click < 2; click++) {
    options.open = false;
    shortcut.fire('click');
    assert.equal(options.open, true);
    assert.equal(page.get('.weather-panel').focused, true);
    assert.equal(page.get('.weather-panel').focusOptions.preventScroll, true);
  }
  assert.equal(page.requests.length, requestCount);
  assert.equal(page.geoCalls.length, 0);
});

test('IP estimate sets rain background without requesting device permission or saving a cookie', async () => {
  const page = await createPage();
  assert.equal(page.document.body.dataset.weather, 'rain');
  assert.equal(page.document.body.dataset.day, 'true');
  assert.match(page.get('#weather-status').textContent, /Manchester.*IP estimate.*Rain/);
  assert.equal(page.geoCalls.length, 0);
  assert.equal(page.cookies.size, 0);
  assert.equal(page.get('.weather-panel').hidden, false);
  const weather = new URL(page.requests[1].url);
  assert.equal(weather.searchParams.get('latitude'), '53.48');
  for (const { config } of page.requests) {
    assert.equal(config.credentials, 'omit');
    assert.equal(config.referrerPolicy, 'no-referrer');
  }
});

test('shortcut shows selected location, temperature and rain probability for the matching hour', async () => {
  const page = await createPage();
  assert.equal(page.get('#weather-shortcut-location').textContent, 'Manchester, United Kingdom');
  assert.equal(page.get('#weather-shortcut-conditions').textContent, '12 °C · Rain this hour: 35%');
  assert.match(page.get('.weather-shortcut')['aria-label'], /Manchester.*IP estimate.*12 °C.*35%.*Open weather/);
  const query = new URL(page.requests.at(-1).url).searchParams;
  assert.equal(query.get('hourly'), 'precipitation_probability');
  await page.chooseCity();
  assert.match(page.get('#weather-shortcut-location').textContent, /Paris/);
  assert.match(page.get('#weather-status').textContent, /Rain this hour: 35%/);
  page.state.weatherError = true;
  page.advance(30 * 60 * 1000);
  page.intervals[0]();
  await settle();
  assert.match(page.get('#weather-shortcut-location').textContent, /Paris/);
  assert.equal(page.get('#weather-shortcut-conditions').textContent, 'Weather unavailable');
});

test('rain chances of zero and 100 are valid, while missing, invalid or wrong-hour probabilities are unavailable', async () => {
  const hour = Math.floor(Date.now() / 3600000) * 3600;
  for (const probability of [0, 100, null, -1, 101, '35']) {
    const page = await createPage({ hourly: { time: [hour], precipitation_probability: [probability] } });
    const valid = probability === 0 || probability === 100;
    assert.equal(page.get('#weather-shortcut-conditions').textContent,
      `12 °C · Rain this hour: ${valid ? `${probability}%` : 'unavailable'}`);
    assert.equal(page.document.body.dataset.weather, 'rain');
    assert.equal(page.warnings.length, valid ? 0 : 1);
  }
  for (const hourly of [null, {}, { time: [hour - 3600], precipitation_probability: [90] }]) {
    const page = await createPage({ hourly });
    assert.match(page.get('#weather-shortcut-conditions').textContent, /Rain this hour: unavailable/);
    assert.equal(page.document.body.dataset.weather, 'rain');
    assert.equal(page.warnings.length, 1);
  }
});

test('network errors, rejected estimates, empty cities and invalid coordinates fall back to London', async () => {
  for (const options of [
    { ipError: true }, { ip: { success: false } },
    { ip: { ...ipCity, city: '' } }, { ip: { ...ipCity, latitude: null } },
    { ip: { ...ipCity, longitude: 181 } },
  ]) {
    const page = await createPage(options);
    assert.match(page.get('#weather-status').textContent, /London.*default/);
    assert.match(page.get('#weather-notice').textContent, /Could not estimate/);
    assert.equal(new URL(page.requests.at(-1).url).searchParams.get('latitude'), '51.51');
    assert.ok(page.warnings.length);
  }
});

test('IP lookup timeout also falls back to London', async () => {
  const page = await createPage({
    respond(url, config) {
      if (url.hostname === 'ipwho.is') return new Promise((resolve, reject) => {
        config.signal.addEventListener('abort', () => reject(new Error('Timed out')));
      });
    },
  });
  assert.match(page.get('#weather-status').textContent, /Finding/);
  [...page.timers.values()][0]();
  await settle();
  assert.match(page.get('#weather-status').textContent, /London.*default/);
});

test('all supported weather codes map to effects, including clear nights', async () => {
  const groups = [
    ['clear', [0]], ['partly-cloudy', [1, 2]], ['cloudy', [3]], ['fog', [45, 48]],
    ['rain', [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82]],
    ['snow', [71, 73, 75, 77, 85, 86]], ['storm', [95, 96, 99]],
  ];
  for (const [effect, codes] of groups) {
    for (const code of codes) {
      const page = await createPage({ code, isDay: 0 });
      assert.equal(page.document.body.dataset.weather, effect, `code ${code}`);
      assert.equal(page.document.body.dataset.day, 'false');
    }
  }
});

test('choosing a search result persists rounded coordinates and reload skips IP and geolocation', async () => {
  const page = await createPage();
  await page.chooseCity();
  const cookie = page.cookies.get(cookieName);
  const saved = JSON.parse(decodeURIComponent(cookie));
  assert.equal(saved.latitude, 48.86);
  assert.equal(saved.longitude, 2.35);
  assert.equal(saved.source, 'chosen');
  assert.match(page.writes[0], /Max-Age=15552000; Path=\/gry-darka\/; SameSite=Lax; Secure/);
  assert.match(page.get('#weather-location-status').textContent, /saved for 180 days/);
  const reload = await createPage({ cookie });
  assert.equal(reload.requests.length, 1);
  assert.equal(new URL(reload.requests[0].url).hostname, 'api.open-meteo.com');
  assert.match(reload.get('#weather-status').textContent, /Paris.*chosen city/);
  assert.equal(reload.geoCalls.length, 0);
  // The chooser remains active even with a previously saved choice.
  await reload.chooseCity();
  assert.equal(reload.writes.length, 1);
});

test('device location is opt-in, rounded and reused without another permission request', async () => {
  const page = await createPage();
  page.get('#weather-device').fire('click');
  assert.equal(page.geoCalls.length, 1);
  assert.equal(page.geoCalls[0].config.enableHighAccuracy, false);
  page.geoCalls[0].success({ coords: { latitude: 52.123456, longitude: 21.987654 } });
  await settle();
  const cookie = page.cookies.get(cookieName);
  const saved = JSON.parse(decodeURIComponent(cookie));
  assert.equal(saved.latitude, 52.12);
  assert.equal(saved.longitude, 21.99);
  assert.ok(!decodeURIComponent(cookie).includes('123456'));
  const reload = await createPage({ cookie });
  assert.equal(reload.geoCalls.length, 0);
  assert.equal(reload.requests.length, 1);
});

test('denied permission keeps the current city; blocked cookies warn instead of claiming persistence', async () => {
  const page = await createPage();
  page.get('#weather-device').fire('click');
  page.geoCalls[0].failure({ code: 1, message: 'Denied' });
  assert.match(page.get('#weather-location-status').textContent, /permission denied/);
  assert.match(page.get('#weather-status').textContent, /Manchester/);
  assert.equal(page.geoCalls.length, 1);
  const blocked = await createPage({ cookiesBlocked: true });
  await blocked.chooseCity();
  assert.match(blocked.get('#weather-location-status').textContent, /could not be saved/);
  assert.match(blocked.get('#weather-status').textContent, /Paris/);
  assert.ok(blocked.warnings.length);
});

test('corrupt cookies and denied cookie access recover with an estimate and visible warning', async () => {
  for (const options of [
    { cookie: '%broken' }, { cookie: savedCookie({ latitude: '48.86' }) },
    { cookie: savedCookie({ source: 'estimated' }) }, { cookiesUnavailable: true },
  ]) {
    const page = await createPage(options);
    assert.match(page.get('#weather-status').textContent, /Manchester/);
    assert.match(page.get('#weather-location-status').textContent, /could not be read/);
    assert.ok(page.warnings.length);
  }
});

test('invalid, stale or failed weather stays neutral without substituting London', async () => {
  for (const options of [
    { weatherError: true }, { code: 999 }, { isDay: null }, { temperature: null },
    { weatherData: { current: { weather_code: 0, is_day: 1, temperature_2m: 12, time: 1 } } },
  ]) {
    const page = await createPage({ cookie: savedCookie(), ...options });
    assert.equal(page.document.body.dataset.weather, undefined);
    assert.match(page.get('#weather-status').textContent, /Paris.*weather unavailable/);
    assert.equal(page.requests.length, 1);
    assert.ok(page.warnings.length);
  }
});

test('late IP or weather responses cannot overwrite a chosen location', async () => {
  for (const hostname of ['ipwho.is', 'api.open-meteo.com']) {
    let resolve;
    const page = await createPage({
      respond(url) {
        if (url.hostname === hostname && !resolve) {
          return new Promise(done => { resolve = done; });
        }
      },
    });
    await page.chooseCity();
    resolve({ ok: true, json: async () => hostname === 'ipwho.is' ? ipCity : {
      current: { weather_code: 71, is_day: 0, temperature_2m: -1, time: Date.now() / 1000 },
    } });
    await settle();
    assert.match(page.get('#weather-status').textContent, /Paris.*Rain/);
    assert.equal(page.document.body.dataset.weather, 'rain');
  }
});

test('automatic mode clears the cookie; search failures preserve the current city', async () => {
  const page = await createPage({ cookie: savedCookie() });
  page.get('#weather-auto').fire('click');
  await settle();
  assert.equal(page.cookies.size, 0);
  assert.match(page.get('#weather-status').textContent, /Manchester.*IP estimate/);
  page.state.searchError = true;
  page.get('#weather-city').value = 'Paris';
  await page.get('#weather-search').fire('submit');
  assert.match(page.get('#weather-search-status').textContent, /search unavailable/);
  assert.match(page.get('#weather-status').textContent, /Manchester/);
  page.state.searchError = false;
  page.state.cities = [];
  await page.get('#weather-search').fire('submit');
  assert.match(page.get('#weather-search-status').textContent, /No cities found/);
});

test('weather refresh is throttled, skips hidden tabs and clears old effects on failure', async () => {
  const page = await createPage();
  page.advance(30 * 60 * 1000);
  page.document.hidden = true;
  page.intervals[0]();
  assert.equal(page.requests.length, 2);
  page.document.hidden = false;
  page.state.weatherError = true;
  page.document.events.visibilitychange();
  await settle();
  assert.equal(page.requests.length, 3);
  assert.equal(page.document.body.dataset.weather, undefined);
  page.document.events.visibilitychange();
  assert.equal(page.requests.length, 3);
});
