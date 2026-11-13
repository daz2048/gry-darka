const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'minecraft-news.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const now = Date.parse('2026-11-13T12:00:00Z');
const data = {
  news: { updated: '2026-11-11T12:00:00Z', items: [
    { title: '<b>Update</b>', url: 'https://www.minecraft.net/en-us/article/update', published: '2026-11-10T14:00:00Z' },
  ] },
  videos: { updated: '2026-11-13T10:00:00Z', items: [
    { title: 'Video', url: 'https://www.youtube.com/watch?v=x7nvbiNKkio', published: '2026-11-10T18:00:00Z' },
  ] },
};

function element() {
  return {
    textContent: '', children: [],
    append(...children) { this.children.push(...children); },
    replaceChildren(...children) { this.children = children; },
  };
}

async function page(response) {
  const elements = new Map();
  const warnings = [];
  const document = {
    querySelector(selector) {
      if (!elements.has(selector)) elements.set(selector, element());
      return elements.get(selector);
    },
    createElement: element,
  };
  vm.runInNewContext(script, {
    document, URL, Intl,
    Date: class extends Date { static now() { return now; } },
    fetch: async () => {
      if (response instanceof Error) throw response;
      return { ok: true, json: async () => response };
    },
    console: { warn: (...args) => warnings.push(args) },
  });
  await new Promise(resolve => setImmediate(resolve));
  return { get: selector => elements.get(selector), warnings };
}

test('shortcut and source links exist without JavaScript, and panel follows weather', () => {
  assert.match(html, /href="#minecraft-news"/);
  assert.ok(html.indexOf('id="weather-panel"') < html.indexOf('id="minecraft-news"'));
  assert.ok(html.indexOf('id="minecraft-news"') < html.indexOf('id="banner-gallery"'));
  assert.match(html, /href="https:\/\/www\.minecraft\.net\/en-us\/articles"/);
  assert.match(html, /href="https:\/\/www\.youtube\.com\/@minecraft"/);
});

test('renders text safely and marks old data without marking fresh data', async () => {
  const result = await page(data);
  assert.match(result.get('#minecraft-news-status').textContent, /may be outdated/);
  assert.doesNotMatch(result.get('#minecraft-videos-status').textContent, /outdated/);
  const newsLink = result.get('#minecraft-news-items').children[0].children[0];
  assert.equal(newsLink.textContent, '<b>Update</b>');
  assert.equal(newsLink.href, data.news.items[0].url);
  assert.equal(result.get('#minecraft-videos-items').children.length, 1);
});

test('a bad source cannot inject links or prevent the other source from rendering', async () => {
  const bad = { ...data, news: { ...data.news, items: [{ ...data.news.items[0], url: 'https://evil.example/' }] } };
  const result = await page(bad);
  assert.match(result.get('#minecraft-news-status').textContent, /unavailable/);
  assert.equal(result.get('#minecraft-news-items').children.length, 0);
  assert.equal(result.get('#minecraft-videos-items').children.length, 1);
  assert.equal(result.warnings.length, 1);
});

test('network failures show source links rather than a loading message', async () => {
  const result = await page(new Error('offline'));
  assert.match(result.get('#minecraft-news-status').textContent, /unavailable/);
  assert.match(result.get('#minecraft-videos-status').textContent, /unavailable/);
  assert.equal(result.warnings.length, 1);
});
