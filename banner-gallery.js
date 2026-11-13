const bannerGallery = document.getElementById('banner-gallery');
const bannerGalleryGroups = document.getElementById('banner-gallery-groups');
const bannerGalleryStatus = document.getElementById('banner-gallery-status');
const bannerPreview = document.getElementById('banner-preview');
const bannerPreviewContainer = document.querySelector('.banner-gallery-preview');
const bannerPreviewName = document.getElementById('banner-preview-name');
const bannerGroups = [
  ['Year-round', [...brandEffects, ...highImpactBrandEffects]],
  ['Winter · November–February', ['snow', 'frost', 'frost-hearts', 'winter-night']],
  ['Christmas · December', ['festive-lights', 'presents']],
  ['Spring · March–May', ['blossoms', 'spring-storm', 'meadow-burst', 'easter-eggs']],
  ['Summer · June–August', ['summer-sun', 'summer-waves']],
  ['Autumn · September', ['autumn-leaves', 'autumn-woodland']],
  ['October', ['pumpkins', 'spooky-stars']],
];
let bannerGalleryInitialized = false;

function bannerEffectName(effect) {
  return effect.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join(' ');
}

function bannerCheckboxes() {
  return [...bannerGalleryGroups.querySelectorAll('input[type="checkbox"]')];
}

function initializeBannerGallery() {
  if (bannerGalleryInitialized) return;
  const saved = readBannerSelection();
  for (const [title, effects] of bannerGroups) {
    const heading = document.createElement('h3');
    heading.textContent = title;
    const grid = document.createElement('div');
    grid.className = 'banner-gallery-grid';
    for (const effect of effects) {
      const name = bannerEffectName(effect);
      const card = document.createElement('div');
      card.className = 'banner-gallery-card';
      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = effect;
      checkbox.checked = saved ? saved.includes(effect) : true;
      label.append(checkbox, document.createTextNode(name));

      const preview = document.createElement('div');
      preview.className = 'brand-face';
      preview.dataset.effect = effect;
      preview.setAttribute('aria-hidden', 'true');
      const previewTitle = document.createElement('span');
      previewTitle.className = 'brand-title';
      previewTitle.textContent = 'Pixel Otter Rocket';
      preview.append(previewTitle);

      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Preview';
      button.setAttribute('aria-label', `Preview ${name}`);
      button.addEventListener('click', () => {
        bannerPreview.dataset.effect = effect;
        bannerPreviewName.textContent = `Preview: ${name}`;
        bannerPreviewContainer.hidden = false;
        bannerPreviewContainer.scrollIntoView({ block: 'nearest' });
      });
      card.append(label, preview, button);
      grid.append(card);
    }
    bannerGalleryGroups.append(heading, grid);
  }
  bannerGalleryStatus.textContent = saved
    ? 'Your saved selection is active.'
    : 'Default seasonal random selection is active. Save to use the checked styles instead.';
  const storageStatus = document.getElementById('banner-storage-status');
  if (!storageStatus.hidden) bannerGalleryStatus.textContent = storageStatus.textContent;
  bannerGalleryInitialized = true;
}

bannerGallery.addEventListener('toggle', () => {
  if (bannerGallery.open) initializeBannerGallery();
});
document.querySelector('.banner-gallery-link').addEventListener('click', () => {
  bannerGallery.open = true;
  initializeBannerGallery();
  bannerGallery.querySelector('summary').focus({ preventScroll: true });
});
document.getElementById('banner-select-all').addEventListener('click', () => {
  bannerCheckboxes().forEach(checkbox => { checkbox.checked = true; });
  bannerGalleryStatus.textContent = 'All styles selected. Save to apply.';
});
document.getElementById('banner-clear').addEventListener('click', () => {
  bannerCheckboxes().forEach(checkbox => { checkbox.checked = false; });
  bannerGalleryStatus.textContent = 'Selection cleared. Choose at least one style before saving.';
});
document.getElementById('banner-save').addEventListener('click', () => {
  const selected = bannerCheckboxes().filter(checkbox => checkbox.checked).map(checkbox => checkbox.value);
  if (!selected.length) {
    bannerGalleryStatus.textContent = 'Choose at least one style before saving.';
    return;
  }
  try {
    localStorage.setItem(bannerStorageKey, JSON.stringify(selected));
  } catch (error) {
    bannerGalleryStatus.textContent = 'Could not save banner styles. Check your browser storage settings.';
    return;
  }
  reportBannerStorageError('');
  bannerGalleryStatus.textContent = `Saved ${selected.length} styles. They will be used on the next flip.`;
});
document.getElementById('banner-reset').addEventListener('click', () => {
  try {
    localStorage.removeItem(bannerStorageKey);
  } catch (error) {
    bannerGalleryStatus.textContent = 'Could not restore defaults. Check your browser storage settings.';
    return;
  }
  bannerCheckboxes().forEach(checkbox => { checkbox.checked = true; });
  reportBannerStorageError('');
  bannerGalleryStatus.textContent = 'Default seasonal random selection restored.';
});

if (location.hash === '#banner-gallery') {
  bannerGallery.open = true;
  initializeBannerGallery();
}
