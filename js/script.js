import { initDraggable } from './dragManager.js';

window.onload = () => {
    const ctx = new AudioContext();

    // 1ere phase : on cree les composants et on partage l'AudioContext
    const player = document.querySelector('#player');
    player.setAudioContext(ctx);

    const eq = document.querySelector('#eq');
    eq.setAudioContext(ctx);

    const waveform = document.querySelector('#waveform');
    waveform.setAudioContext(ctx);

    // 2eme phase : on cree le graphe des composants
    // player -> eq -> waveform -> destination
    player.connectComponent(eq);
    eq.connectComponent(waveform);

    // 3eme phase : on connecte le dernier composant à la destination audio
    waveform.getOutputNode().connect(ctx.destination);

    // 4eme phase : fenêtres draggables avec magnétisme
    const wins = ['win-player', 'win-eq', 'win-waveform', 'win-wam']
        .map(id => document.querySelector('#' + id));

    // Positionner après rendu pour lire les vraies dimensions
    requestAnimationFrame(() => {
        const GAP = 10;
        const arenaW = window.innerWidth;
        const arenaH = window.innerHeight - 50;

        const w0 = wins[0].offsetWidth  || 440;
        const h0 = wins[0].offsetHeight || 340;
        const w1 = wins[1].offsetWidth  || 460;
        const h1 = wins[1].offsetHeight || 300;
        const w2 = wins[2].offsetWidth  || 440;
        const h2 = wins[2].offsetHeight || 200;
        const w3 = wins[3].offsetWidth  || 320;
        const h3 = wins[3].offsetHeight || 300;

        const colLeft  = Math.max(10, (arenaW / 2 - Math.max(w0, w2)) / 2);
        const colRight = Math.max(colLeft + Math.max(w0, w2) + GAP, arenaW / 2);

        const rowTop    = Math.max(10, (arenaH - Math.max(h0, h1) - GAP - Math.max(h2, h3)) / 2);
        const rowBottom = rowTop + Math.max(h0, h1) + GAP;

        wins[0].style.cssText = `left:${colLeft}px;  top:${rowTop}px`;
        wins[1].style.cssText = `left:${colRight}px; top:${rowTop}px`;
        wins[2].style.cssText = `left:${colLeft}px;  top:${rowBottom}px`;
        wins[3].style.cssText = `left:${colRight}px; top:${Math.min(rowBottom, arenaH - h3 - 10)}px`;

        initDraggable(wins);
    });
};
