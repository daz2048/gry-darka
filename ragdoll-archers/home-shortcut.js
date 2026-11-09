window.addEventListener('keydown', event => {
  if (event.repeat || event.isComposing || event.ctrlKey || event.altKey || event.metaKey ||
      event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement ||
      event.target.isContentEditable || event.key.toLowerCase() !== 'h') return;

  event.preventDefault();
  event.stopImmediatePropagation();
  location.href = '../index.html';
}, true);
