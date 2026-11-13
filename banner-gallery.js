const bannerGallery = document.getElementById('banner-gallery');
const bannerGalleryGroups = document.getElementById('banner-gallery-groups');
const bannerGalleryStatus = document.getElementById('banner-gallery-status');
const bannerPreview = document.getElementById('banner-preview');
const bannerPreviewContainer = document.querySelector('.banner-gallery-preview');
const bannerPreviewName = document.getElementById('banner-preview-name');
const bannerGroups = [
  ['Games', gameBannerEffects],
  ['Year-round', [...brandEffects, ...highImpactBrandEffects].filter(effect => !gameBannerEffects.includes(effect))],
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

function saveBannerSelection() {
  const selected = bannerCheckboxes().filter(checkbox => checkbox.checked).map(checkbox => checkbox.value);
  if (!selected.length) {
    bannerGalleryStatus.textContent = 'Choose at least one style. Your previous selection or defaults remain active.';
    return;
  }
  try {
    localStorage.setItem(bannerStorageKey, JSON.stringify(selected));
  } catch (error) {
    bannerGalleryStatus.textContent = 'Could not save banner styles. Check your browser storage settings.';
    return;
  }
  reportBannerStorageError('');
  if (selected.length === 1) {
    const currentFace = brandFaces[brandFlip.classList.contains('is-flipped') ? 1 : 0];
    currentFace.dataset.effect = selected[0];
  }
  bannerGalleryStatus.textContent = selected.length === 1
    ? 'Saved 1 style. It will remain active until you change your selection.'
    : `Saved ${selected.length} styles. They will be used on the next flip.`;
}

function initializeBannerGallery() {
  if (bannerGalleryInitialized) return;
  const saved = readBannerSelection();
  for (const [title, effects] of bannerGroups) {
    const groupHeading = document.createElement('div');
    groupHeading.className = 'banner-gallery-group-heading';
    const heading = document.createElement('h3');
    heading.textContent = title;
    const selectAll = document.createElement('button');
    selectAll.type = 'button';
    selectAll.textContent = 'Select all in this category';
    selectAll.setAttribute('aria-label', `Select all banner styles in the ${title} category`);
    selectAll.addEventListener('click', () => {
      const groupEffects = new Set(effects);
      bannerCheckboxes().forEach(checkbox => {
        if (groupEffects.has(checkbox.value)) checkbox.checked = true;
      });
      saveBannerSelection();
    });
    const groupActions = document.createElement('div');
    groupActions.className = 'banner-gallery-group-actions';
    const scrollToTop = document.createElement('button');
    scrollToTop.type = 'button';
    scrollToTop.className = 'banner-gallery-top-button';
    scrollToTop.setAttribute('aria-label', 'Back to top');
    scrollToTop.title = 'Back to top';
    scrollToTop.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"></circle><path d="M12 16V8m0 0-3.5 3.5M12 8l3.5 3.5"></path></svg>';
    scrollToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    groupActions.append(selectAll, scrollToTop);
    groupHeading.append(heading, groupActions);
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
      checkbox.addEventListener('change', saveBannerSelection);
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
    bannerGalleryGroups.append(groupHeading, grid);
  }
  bannerGalleryStatus.textContent = saved
    ? 'Your saved selection is active.'
    : 'Default seasonal random selection is active. Changing the checked styles saves your selection.';
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
  saveBannerSelection();
});
document.getElementById('banner-clear').addEventListener('click', () => {
  bannerCheckboxes().forEach(checkbox => { checkbox.checked = false; });
  saveBannerSelection();
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
