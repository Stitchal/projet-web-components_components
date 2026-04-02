import { initDraggable } from './dragManager.js';

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
    const poll = setInterval(() => {
        const ctx = wamHost.audioContext;
        if (!ctx) return;

        const plugins = wamHost.plugins;
        if (!plugins?.length) return;

        // Attendre que le premier plugin ait un instance résolue
        Promise.resolve(plugins[0]?.instance).then(instance => {
            if (!instance?.audioNode) return;

            clearInterval(poll);

            const audioNode = instance.audioNode;
            const gainNode = ctx.createGain();
            gainNode.gain.value = parseFloat(slider?.value ?? 1);
            gainNode.connect(ctx.destination);

            // Déconnecter le plugin de destination et le reconnecter via gainNode
            try {
                audioNode.disconnect(ctx.destination);
            } catch (_) {}
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
    // Attendre que les custom elements soient définis et upgradés
    await Promise.all([
        customElements.whenDefined('my-audio-player'),
        customElements.whenDefined('my-eq'),
        customElements.whenDefined('my-waveform'),
    ]);

    const player   = document.querySelector('#player');
    const eq       = document.querySelector('#eq');
    const waveform = document.querySelector('#waveform');

    player.connectComponent(eq);
    eq.connectComponent(waveform);

    // Fenêtres draggables avec magnétisme
    const wins = ['win-player', 'win-playlist', 'win-eq', 'win-waveform', 'win-wam']
        .map(id => document.querySelector('#' + id));

    // Positionner après rendu pour lire les vraies dimensions
    requestAnimationFrame(() => {
        const GAP = 10;
        const arenaW = window.innerWidth;

        const w0 = wins[0].offsetWidth  || 360;
        const h0 = wins[0].offsetHeight || 160;
        const h1 = wins[1].offsetHeight || 200;
        const w2 = wins[2].offsetWidth  || 460;
        const h2 = wins[2].offsetHeight || 300;

        const colLeft  = Math.max(10, (arenaW / 2 - Math.max(w0, w2)) / 2);
        const colRight = Math.max(colLeft + Math.max(w0, w2) + GAP, arenaW / 2);

        wins[0].style.cssText = `left:${colLeft}px;  top:10px`;
        wins[1].style.cssText = `left:${colLeft}px;  top:${10 + h0 + GAP}px`;
        wins[2].style.cssText = `left:${colRight}px; top:10px`;
        wins[3].style.cssText = `left:${colLeft}px;  top:${10 + h0 + GAP + h1 + GAP}px`;
        wins[4].style.cssText = `left:${colRight}px; top:${10 + h2 + GAP}px`;

        initDraggable(wins);
    });
};
