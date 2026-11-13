(() => {
  'use strict';

  const sources = [
    { key: 'news', label: 'News', hosts: ['minecraft.net', 'www.minecraft.net'] },
    { key: 'videos', label: 'Videos', hosts: ['www.youtube.com'] },
  ];
  const staleMs = 24 * 60 * 60 * 1000;

  function displaySource(source, data) {
    const status = document.querySelector(`#minecraft-${source.key}-status`);
    const list = document.querySelector(`#minecraft-${source.key}-items`);
    if (!data || !Array.isArray(data.items) || !data.updated || !Number.isFinite(Date.parse(data.updated))) {
      status.textContent = `${source.label} unavailable. Visit the source link below.`;
      return;
    }

    const items = data.items.map(item => {
      if (!item || typeof item.title !== 'string' || !item.title.trim() ||
          typeof item.url !== 'string' || typeof item.published !== 'string' ||
          !Number.isFinite(Date.parse(item.published))) throw new Error(`Invalid ${source.key} item.`);
      const url = new URL(item.url);
      if (url.protocol !== 'https:' || !source.hosts.includes(url.hostname) || url.username || url.password || url.port) {
        throw new Error(`Invalid ${source.key} link.`);
      }
      return { title: item.title, url: url.href, published: item.published };
    });
    if (!items.length) throw new Error(`Empty ${source.key} feed.`);

    const formatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' });
    const dayFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });
    const updated = new Date(data.updated);
    status.textContent = `Last checked: ${formatter.format(updated)}${Date.now() - updated.getTime() > staleMs ? ' (may be outdated)' : ''}.`;
    list.replaceChildren(...items.map(item => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = item.url;
      link.textContent = item.title;
      const time = document.createElement('time');
      time.dateTime = item.published;
      time.textContent = ` — ${dayFormatter.format(new Date(item.published))}`;
      li.append(link, time);
      return li;
    }));
  }

  async function load() {
    try {
      const response = await fetch('minecraft-news.json', { cache: 'no-store', credentials: 'omit' });
      if (!response.ok) throw new Error(`News data returned HTTP ${response.status}.`);
      const data = await response.json();
      for (const source of sources) {
        try {
          displaySource(source, data[source.key]);
        } catch (error) {
          console.warn('Minecraft news:', error.message);
          displaySource(source, null);
        }
      }
    } catch (error) {
      console.warn('Minecraft news:', error.message);
      for (const source of sources) displaySource(source, null);
    }
  }

  void load();
})();
