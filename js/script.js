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
    const wins = ['win-player', 'win-eq', 'win-waveform']
        .map(id => document.querySelector('#' + id));

    // Positions initiales : 2 fenêtres côte à côte, 1 en dessous à gauche
    const W = 420, H = 322, GAP = 10; // 300px composant + 22px titlebar
    const arenaH = window.innerHeight - 50;
    const sx = Math.max(10, (window.innerWidth - W * 2 - GAP) / 2);
    const sy = Math.max(10, (arenaH - H * 2 - GAP) / 2);

    wins[0].style.cssText = `left:${sx}px; top:${sy}px`;
    wins[1].style.cssText = `left:${sx + W + GAP}px; top:${sy}px`;
    wins[2].style.cssText = `left:${sx}px; top:${sy + H + GAP}px`;

    initDraggable(wins);
};
