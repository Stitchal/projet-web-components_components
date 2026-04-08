import { initDraggable } from './dragManager.js';

// ── Plein écran ──────────────────────────────────────────────
const fsBtn = document.querySelector('#fullscreen-btn');
fsBtn?.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        fsBtn.textContent = '✕';
        fsBtn.title = 'Quitter le plein écran';
    } else {
        document.exitFullscreen().catch(() => {});
    }
});
document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
        fsBtn.textContent = '⛶';
        fsBtn.title = 'Plein écran';
    }
});


// Doit être enregistré immédiatement — track-changed est émis dès le
// chargement des pistes, avant window.onload.
const bg = document.querySelector('#bg');

function applyBackground(cover) {
    if (!bg) return;
    if (cover) {
        bg.style.backgroundImage = `url('${cover}')`;
        bg.classList.add('has-cover');
    } else {
        bg.classList.remove('has-cover');
    }
}

document.addEventListener('track-changed', (e) => {
    applyBackground(e.detail?.track?.cover);
});

// Si le composant a déjà émis track-changed avant que ce listener soit enregistré
// (fetch depuis le cache, exécution des modules dans l'ordre), on lit la piste
// courante directement sur le composant une fois le DOM prêt.
document.addEventListener('DOMContentLoaded', () => {
    const player = document.querySelector('my-audio-player');
    if (!player) return;
    customElements.whenDefined('my-audio-player').then(() => {
        const cover = player.currentTrack?.cover;
        if (cover) applyBackground(cover);
    });
});

/**
 * Contrôle du volume du piano WAM.
 *
 * Après chargement du plugin, on intercepte les connexions vers ctx.destination
 * en surchargeant AudioDestinationNode.prototype.connect de manière ciblée,
 * puis on réachemine via un GainNode intermédiaire.
 *
 * Approche : polling sur wamHost.audioContext, puis on remplace la méthode
 * `connect` du destination node pour capturer la connexion du plugin,
 * et on insère un GainNode entre plugin et destination.
 */
customElements.whenDefined('wam-host').then(() => {
    const wamHost = document.querySelector('wam-host');
    if (!wamHost) return;

    const slider = document.querySelector('#wam-volume');
    const display = document.querySelector('#wam-volume-display');

    // Attendre que le contexte ET le plugin soient prêts
    let gainNode = null;
    const poll = setInterval(() => {
        const ctx = wamHost.audioContext;
        if (!ctx) return;

        const plugins = wamHost.plugins;
        if (!plugins?.length) return;

        Promise.resolve(plugins[0]?.instance).then(instance => {
            if (!instance?.audioNode) return;
            if (gainNode) return; // déjà initialisé

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

/**
 * Orchestrateur optionnel du layout Studio.
 *
 * Ce fichier n'est PAS requis pour que les composants fonctionnent.
 * Chaque composant (<my-audio-player>, <my-eq>, <my-waveform>) est autonome :
 * il initialise son propre graphe audio via le singleton audioContext.js
 * et se connecte seul à ctx.destination.
 *
 * Ce script sert uniquement à :
 * 1. Câbler la chaîne studio : player → eq → waveform → destination
 *    (connectComponent() reroute chaque sortie depuis ctx.destination vers le suivant)
 * 2. Positionner et activer le système de fenêtres draggables
 */
window.onload = async () => {
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

    document.addEventListener('keydown', async (e) => {
        // Ignorer si focus sur un input/textarea
        if (e.target.matches('input, textarea, select')) return;

        const audioEl = player?.shadowRoot?.querySelector('#myplayer');
        if (!audioEl) return;

        switch (e.code) {
            case 'Space': {
                e.preventDefault();
                const switchEl = player?.shadowRoot?.querySelector('#sw1');
                const coverImage = player?.shadowRoot?.querySelector('#coverImage');
                if (audioEl.paused) {
                    const mod = await import('../components/modules/audioContext.js').catch(() => null);
                    await mod?.resumeAudioContext?.();
                    audioEl.play().catch(() => {});
                } else {
                    audioEl.pause();
                }
                break;
            }
            case 'ArrowLeft':
                e.preventDefault();
                player?.shadowRoot?.querySelector('#btnPrev')?.click();
                break;
            case 'ArrowRight':
                e.preventDefault();
                player?.shadowRoot?.querySelector('#btnNext')?.click();
                break;
            case 'KeyM':
                audioEl.muted = !audioEl.muted;
                break;
        }
    });

    // Fenêtres draggables avec magnétisme
    const wins = ['win-player', 'win-playlist', 'win-eq', 'win-waveform', 'win-wam','win-butterchurn']
        .map(id => document.querySelector('#' + id));

    // Positionner après rendu pour lire les vraies dimensions
    requestAnimationFrame(() => {
        const GAP = 12;

        const wPlayer   = wins[0].offsetWidth  || 340;
        const hPlayer   = wins[0].offsetHeight || 160;
        const wPlaylist = wins[1].offsetWidth  || 340;
        const hPlaylist = wins[1].offsetHeight || 220;
        const wEq       = wins[2].offsetWidth  || 300;
        const hEq       = wins[2].offsetHeight || 260;
        const wWave     = wins[3].offsetWidth  || 300;
        const hWave     = wins[3].offsetHeight || 120;
        const wWam      = wins[4].offsetWidth  || 600;
        const hWam      = wins[4].offsetHeight || 300;

        const colLeftW  = Math.max(wPlayer, wPlaylist);
        const colRightW = Math.max(wEq, wWave);

        const colLeft  = GAP;
        const colRight = colLeft + colLeftW + GAP;
        const colWam   = colRight + colRightW + GAP;
        const topRow   = GAP;

        wins[0].style.cssText = `left:${colLeft}px;  top:${topRow}px`;
        wins[1].style.cssText = `left:${colLeft}px;  top:${topRow + hPlayer + GAP}px; width:${wPlayer}px`;
        wins[2].style.cssText = `left:${colRight}px; top:${topRow}px; height:${hPlayer}px`;
        wins[3].style.cssText = `left:${colRight}px; top:${topRow + hEq + GAP}px; width:${wEq}px`;
        wins[4].style.cssText = `left:${colWam}px;   top:${topRow}px`;

        // Scaler si le layout dépasse l'écran
        const totalW = colWam + wWam + GAP;
        const totalH = topRow + Math.max(hPlayer + GAP + hPlaylist, hEq + GAP + hWave, hWam) + GAP;
        const arenaW = window.innerWidth;
        const arenaH = window.innerHeight;
        const scaleX = arenaW < totalW ? arenaW / totalW : 1;
        const scaleY = arenaH < totalH ? arenaH / totalH : 1;
        const scale  = Math.min(scaleX, scaleY);

        const arena = document.querySelector('main');
        if (scale < 1) {
            arena.style.transformOrigin = '0 0';
            arena.style.transform = `scale(${scale})`;
            arena.style.width  = `${arenaW / scale}px`;
            arena.style.height = `${arenaH / scale}px`;
        }

        initDraggable(wins);
    });
};
