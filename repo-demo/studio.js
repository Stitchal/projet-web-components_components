import { initDraggable } from './dragManager.js';

await Promise.all([
    customElements.whenDefined('my-audio-player'),
    customElements.whenDefined('my-eq'),
    customElements.whenDefined('my-waveform'),
    customElements.whenDefined('my-butterchurn'),
]);
const player      = document.querySelector('#player');
const eq          = document.querySelector('#eq');
const waveform    = document.querySelector('#waveform');
const butterchurn = document.querySelector('#butterchurn');
player.connectComponent(eq);
eq.connectComponent(waveform);
waveform.connectComponent(butterchurn);

document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, select')) return;
    switch (e.code) {
        case 'Space':
            e.preventDefault();
            player.shadowRoot.querySelector('#myplayer')?.paused
                ? player.play()
                : player.pause();
            break;
        case 'ArrowLeft':  e.preventDefault(); player.prev(); break;
        case 'ArrowRight': e.preventDefault(); player.next(); break;
        case 'KeyM': player.toggleMute(); break;
    }
});

customElements.whenDefined('wam-host').then(() => {
    const wamHost = document.querySelector('wam-host');
    if (!wamHost) return;
    const slider  = document.querySelector('#wam-volume');
    const display = document.querySelector('#wam-volume-display');
    let gainNode = null;
    const poll = setInterval(() => {
        const ctx = wamHost.audioContext;
        if (!ctx) return;
        const plugins = wamHost.plugins;
        if (!plugins?.length) return;
        Promise.resolve(plugins[0]?.instance).then(instance => {
            if (!instance?.audioNode) return;
            if (gainNode) return;
            clearInterval(poll);
            const audioNode = instance.audioNode;
            gainNode = ctx.createGain();
            gainNode.gain.value = parseFloat(slider?.value ?? 3);
            gainNode.connect(ctx.destination);
            try { audioNode.disconnect(ctx.destination); } catch (_) {}
            try { audioNode.disconnect(); } catch (_) {}
            audioNode.connect(gainNode);
            slider?.addEventListener('input', (e) => {
                gainNode.gain.value = parseFloat(e.target.value);
                if (display) display.textContent = `${Math.round(parseFloat(e.target.value) * 100)}%`;
            });
        });
    }, 200);
});

// Fenêtres draggables avec positionnement initial
const wins = ['win-player', 'win-playlist', 'win-eq', 'win-waveform', 'win-wam', 'win-butterchurn']
    .map(id => document.querySelector('#' + id));

window.addEventListener('load', () => layout());

function layout() {
    const GAP      = 12;
    const W_PLAYER = 340;
    const H_PLAYER = 242;
    const W_EQ     = 320;
    const H_PLAYLIST = 280;

    const colLeft  = GAP;
    const colMid   = colLeft + W_PLAYER + GAP;
    const colRight = colMid  + W_EQ     + GAP;
    const topH     = H_PLAYER + GAP + H_PLAYLIST;
    const totalW   = window.innerWidth;

    // Col 1 : player + playlist
    wins[0].style.cssText = `left:${colLeft}px; top:${GAP}px; width:${W_PLAYER}px; height:${H_PLAYER}px`;
    wins[1].style.cssText = `left:${colLeft}px; top:${GAP + H_PLAYER + GAP}px; width:${W_PLAYER}px; height:${H_PLAYLIST}px`;
    // Col 2 : eq (même hauteur que player) + waveform (même hauteur que playlist)
    wins[2].style.cssText = `left:${colMid}px; top:${GAP}px; width:${W_EQ}px; height:${H_PLAYER}px`;
    wins[3].style.cssText = `left:${colMid}px; top:${GAP + H_PLAYER + GAP}px; width:${W_EQ}px; height:${H_PLAYLIST}px`;
    // Col 3 : butterchurn — largeur restante de l'écran, hauteur des deux colonnes
    const wButter = totalW - colRight - GAP;
    wins[5].style.cssText = `left:${colRight}px; top:${GAP}px; width:${wButter}px; height:${topH}px`;

    // Piano : pleine largeur en bas
    wins[4].style.cssText = `left:${GAP}px; top:${GAP + topH + GAP}px; width:${totalW - 2 * GAP}px`;

    const totalH = GAP + topH + GAP + (wins[4].offsetHeight || 300) + GAP;
    const scaleY = window.innerHeight < totalH ? window.innerHeight / totalH : 1;
    if (scaleY < 1) {
        const arena = document.querySelector('main');
        arena.style.transformOrigin = '0 0';
        arena.style.transform = `scale(${scaleY})`;
        arena.style.width  = `${totalW / scaleY}px`;
        arena.style.height = `${window.innerHeight / scaleY}px`;
    }

    initDraggable(wins);
}
