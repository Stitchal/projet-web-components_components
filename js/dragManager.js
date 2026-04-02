const SNAP = 20; // pixels — distance de déclenchement du magnétisme

export function initDraggable(windows) {
  windows.forEach(win => {
    const handle = win.querySelector('.titlebar');

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

        // Contraindre à l'arène (parent)
        const arena = win.parentElement;
        propX = Math.max(0, Math.min(propX, arena.offsetWidth  - win.offsetWidth));
        propY = Math.max(0, Math.min(propY, arena.offsetHeight - win.offsetHeight));

        // Appliquer le magnétisme
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

  // Bords prospectifs de la fenêtre en cours de déplacement
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

    // Candidats X : [mon_bord, leur_bord, left_résultant]
    for (const [me, them, result] of [
      [dl, ol, ol    ],   // mon gauche → leur gauche
      [dl, or, or    ],   // mon gauche → leur droit
      [dr, ol, ol - w],   // mon droit  → leur gauche
      [dr, or, or - w],   // mon droit  → leur droit
    ]) {
      const d = Math.abs(me - them);
      if (d < SNAP && d < bestDX) { bestDX = d; snapX = result; }
    }

    // Candidats Y : [mon_bord, leur_bord, top_résultant]
    for (const [me, them, result] of [
      [dt, ot, ot    ],   // mon haut   → leur haut
      [dt, ob, ob    ],   // mon haut   → leur bas
      [db, ot, ot - h],   // mon bas    → leur haut
      [db, ob, ob - h],   // mon bas    → leur bas
    ]) {
      const d = Math.abs(me - them);
      if (d < SNAP && d < bestDY) { bestDY = d; snapY = result; }
    }
  }

  return { x: snapX, y: snapY };
}
