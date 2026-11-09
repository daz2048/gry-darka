(() => {
  const canvas = document.getElementById('unity-canvas');
  const loadingCover = document.getElementById('loading-cover');
  const progressBar = document.getElementById('unity-progress-bar-empty');
  const progressFill = document.getElementById('unity-progress-bar-full');
  const loadingStatus = document.getElementById('loading-status');
  const diagnostics = document.getElementById('loading-diagnostics');
  let failed = false;

  function log(message) {
    diagnostics.textContent += `${message}\n`;
  }

  function showLoadError(error) {
    failed = true;
    const message = error instanceof Error ? error.message : String(error);
    console.error('Unity game:', error);
    log(`ERROR: ${message}`);
    loadingStatus.textContent = `Unable to load the game: ${message}`;
    loadingCover.hidden = false;
    loadingCover.classList.add('error');
    diagnostics.parentElement.open = true;
  }

  log(`Page: ${location.href}`);
  window.addEventListener('error', event => {
    showLoadError(event.error || event.message);
  });
  window.addEventListener('unhandledrejection', event => {
    showLoadError(event.reason);
  });

  if (location.protocol === 'file:') {
    const gameFolder = location.pathname.split('/').slice(-2, -1)[0];
    const gameUrl = `http://localhost:8765/${encodeURIComponent(gameFolder)}/`;
    const help = document.getElementById('local-server-help');
    const gameLink = document.getElementById('local-game-link');
    gameLink.href = gameUrl;
    loadingStatus.textContent = 'Checking the local game server...';
    log(`Checking local game server: ${gameUrl}`);

    const serverCheck = new Image();
    serverCheck.onload = () => location.replace(gameUrl);
    serverCheck.onerror = () => {
      showLoadError('Unity cannot load its assets from a file:// address. Start the local server and open the HTTP link below.');
      help.hidden = false;
    };
    serverCheck.src = `${gameUrl}favicon.jpeg?server-check=${Date.now()}`;
    return;
  }

  const config = {
    dataUrl: './6697b6deba8b617c67b69c55dcd07cb1.data.unityweb',
    frameworkUrl: './0be3c3ee7115b26e1ae28e643afdf1f2.js.unityweb',
    codeUrl: './b3397c29f6878557c1c614cbf9e196ea.wasm.unityweb',
    streamingAssetsUrl: './StreamingAssets',
    companyName: 'Ericetto',
    productName: 'Ragdoll Archers',
    productVersion: '0.1',
    showBanner(message, type) {
      if (type === 'error') {
        showLoadError(message);
      } else {
        console.warn('Unity game:', message);
        log(`${type}: ${message}`);
      }
    },
    errorHandler(message) {
      showLoadError(message);
      return true;
    }
  };
  const loader = document.createElement('script');
  loader.src = './v11121212.js';
  loader.onload = async () => {
    try {
      log('Unity loader ready. Downloading and initializing game assets...');
      await createUnityInstance(canvas, config, progress => {
        if (failed) return;
        const percent = Math.round(progress * 100);
        progressFill.style.width = `${percent}%`;
        progressBar.setAttribute('aria-valuenow', String(percent));
        loadingStatus.textContent = `Loading game... ${percent}%`;
      });
      if (!failed) loadingCover.hidden = true;
      log('Unity initialization finished.');
    } catch (error) {
      showLoadError(error);
    }
  };
  loader.onerror = () => showLoadError(`Unity loader could not be loaded: ${loader.src}`);
  log(`Loading Unity loader: ${loader.src}`);
  document.body.appendChild(loader);
})();
