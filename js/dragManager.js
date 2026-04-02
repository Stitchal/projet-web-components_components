const SNAP = 20;
const MIN_W = 160;
const MIN_H = 60;

export function initDraggable(windows) {
  windows.forEach(win => {
    const handle = win.querySelector('.titlebar');

    // Boutons macOS
    const dot = handle.querySelector('.titlebar-dot');
    const controls = document.createElement('div');
    controls.className = 'titlebar-controls';

    const btnClose = document.createElement('button');
    btnClose.className = 'titlebar-btn titlebar-btn-close';
    btnClose.title = 'Fermer';

    const btnMin = document.createElement('button');
    btnMin.className = 'titlebar-btn titlebar-btn-min';
    btnMin.title = 'Réduire';

    const btnMax = document.createElement('button');
    btnMax.className = 'titlebar-btn titlebar-btn-max';
    btnMax.title = 'Agrandir';

    controls.append(btnClose, btnMin, btnMax);
    if (dot) dot.replaceWith(controls);
    else handle.prepend(controls);

    btnMin.addEventListener('click', (e) => {
      e.stopPropagation();
      win.classList.add('collapsed');
    });

    btnMax.addEventListener('click', (e) => {
      e.stopPropagation();
      win.classList.remove('collapsed');
    });

    // Poignée de resize (désactivée si data-no-resize, axe contrôlé par data-resize="x|xy")
    if (!win.hasAttribute('data-no-resize')) {
      const resizeMode = win.dataset.resize || 'xy';
      const resizeHandle = document.createElement('div');
      resizeHandle.className = 'resize-handle';
      win.append(resizeHandle);

      resizeHandle.addEventListener('mousedown', e => {
        e.preventDefault();
        e.stopPropagation();

        const startMouseX = e.clientX;
        const startMouseY = e.clientY;
        const startW = win.offsetWidth;
        const startH = win.offsetHeight;

        const onMove = e => {
          if (resizeMode === 'x' || resizeMode === 'xy') {
            win.style.width  = Math.max(MIN_W, startW + (e.clientX - startMouseX)) + 'px';
          }
          if (resizeMode === 'xy') {
            win.style.height = Math.max(MIN_H, startH + (e.clientY - startMouseY)) + 'px';
          }
        };

        const onUp = () => {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup',   onUp);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup',   onUp);
      });
    }

    // Double-clic sur la titlebar → toggle collapsed
    handle.addEventListener('dblclick', (e) => {
      if (e.target.closest('button')) return;
      win.classList.toggle('collapsed');
    });

    // Amener au premier plan au clic
    win.addEventListener('mousedown', () => bringToFront(win, windows), true);

    handle.addEventListener('mousedown', e => {
      if (e.target.closest('input, button, select')) return;
      e.preventDefault();

      const startMouseX = e.clientX;
      const startMouseY = e.clientY;
      const startWinX   = win.offsetLeft;
      const startWinY   = win.offsetTop;

      handle.style.cursor = 'grabbing';

      const onMove = e => {
        let propX = startWinX + (e.clientX - startMouseX);
        let propY = startWinY + (e.clientY - startMouseY);

        const arena = win.parentElement;
        propX = Math.max(0, Math.min(propX, arena.offsetWidth  - win.offsetWidth));
        propY = Math.max(0, Math.min(propY, arena.offsetHeight - win.offsetHeight));

        const { x, y } = trySnap(win, propX, propY, windows);
        win.style.left = x + 'px';
        win.style.top  = y + 'px';
      };

      const onUp = () => {
        handle.style.cursor = '';
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup',   onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup',   onUp);
    });
  });
}

function bringToFront(win, windows) {
  const max = Math.max(...windows.map(w => parseInt(w.style.zIndex) || 10));
  win.style.zIndex = max + 1;
}

function trySnap(dragging, propX, propY, windows) {
  const w = dragging.offsetWidth;
  const h = dragging.offsetHeight;

  const dl = propX, dr = propX + w;
  const dt = propY, db = propY + h;

  let snapX = propX, snapY = propY;
  let bestDX = SNAP + 1, bestDY = SNAP + 1;

  for (const other of windows) {
    if (other === dragging) continue;

    const ol = other.offsetLeft;
    const ot = other.offsetTop;
    const or = ol + other.offsetWidth;
    const ob = ot + other.offsetHeight;

    for (const [me, them, result] of [
      [dl, ol, ol    ],
      [dl, or, or    ],
      [dr, ol, ol - w],
      [dr, or, or - w],
    ]) {
      const d = Math.abs(me - them);
      if (d < SNAP && d < bestDX) { bestDX = d; snapX = result; }
    }

    for (const [me, them, result] of [
      [dt, ot, ot    ],
      [dt, ob, ob    ],
      [db, ot, ot - h],
      [db, ob, ob - h],
    ]) {
      const d = Math.abs(me - them);
      if (d < SNAP && d < bestDY) { bestDY = d; snapY = result; }
    }
  }

  return { x: snapX, y: snapY };
}
