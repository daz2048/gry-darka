import test from 'node:test';
import assert from 'node:assert/strict';
import { BIOMES, BLOCKS, STRUCTURES, World } from '../world.js';
import { DEFAULT_LANGUAGE, LANGUAGES, MESSAGES, resolveLanguage, setLanguage, t } from '../i18n.js';

test('English is the default and Polish is only chosen explicitly', () => {
  assert.equal(DEFAULT_LANGUAGE, 'en');
  assert.equal(resolveLanguage('', null), 'en');
  assert.equal(resolveLanguage('', 'pl'), 'pl');
  assert.equal(resolveLanguage('?lang=pl', 'en'), 'pl');
  assert.equal(resolveLanguage('?lang=en', 'pl'), 'en');
  assert.equal(resolveLanguage('?lang=de', 'xx'), 'en');
});

test('every language defines the same messages and placeholders', () => {
  const placeholders = text => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
  const reference = MESSAGES.en;
  for (const language of LANGUAGES) {
    const messages = MESSAGES[language];
    assert.deepEqual(Object.keys(messages).sort(), Object.keys(reference).sort(), language);
    for (const [key, text] of Object.entries(reference)) {
      if (typeof text === 'string') assert.deepEqual(placeholders(messages[key]), placeholders(text), `${language} ${key}`);
    }
    assert.equal(messages.blocks.length, BLOCKS.length, `${language} blocks`);
    assert.equal(messages.structures.length, STRUCTURES.length, `${language} structures`);
    assert.deepEqual(Object.keys(messages.biomes).sort(), Object.keys(BIOMES).sort(), `${language} biomes`);
  }
  assert.deepEqual(MESSAGES.pl.blocks, BLOCKS.map(block => block.name));
  assert.deepEqual(MESSAGES.pl.structures, STRUCTURES.map(site => site.name));
  assert.deepEqual(MESSAGES.pl.biomes, Object.fromEntries(Object.entries(BIOMES).map(([key, biome]) => [key, biome.name])));
});

test('world edit results are translatable message keys in both languages', () => {
  const world = new World(1);
  world.blocks.fill(0);
  world.water.fill(0);
  for (let z = 0; z < 256; z++) for (let x = 0; x < 256; x++) world.blocks[x + 256 * z] = 3;
  const results = [
    world.edit(1, 0, 1, 0, null),
    world.edit(2, 2, 2, 999, null),
    world.edit(2, 2, 2, 0, null),
    world.edit(4, 3, 4, 1, { x: 4.5, y: 3, z: 4.5 })
  ];
  world.edit(2, 2, 2, 1, null);
  results.push(world.edit(2, 2, 2, 1, null));
  assert.deepEqual(results, ['edit.boundary', 'edit.unknown', 'edit.empty', 'edit.player', 'edit.occupied']);
  for (const language of LANGUAGES) {
    for (const key of results) assert.equal(typeof MESSAGES[language][key], 'string', `${language} ${key}`);
  }
});

test('translation switches language and fills placeholders', () => {
  setLanguage('pl', { persist: false });
  assert.equal(t('save.saved', { time: '08:26' }), 'Zapisano 08:26');
  setLanguage('en', { persist: false });
  assert.equal(t('save.saved', { time: '08:26' }), 'Saved 08:26');
  assert.equal(t('missing.key'), 'missing.key');
});
