import "./libs/webaudiocontrols.js";
import { ConnectableComponent } from "./ConnectableComponent.js";
import { resumeAudioContext } from "./modules/audioContext.js";

const BASE = new URL('.', import.meta.url).href;

const sheet = new CSSStyleSheet();
sheet.replaceSync(/* css */`
    * { box-sizing: border-box; }

    #container {
        width: 340px;
        background: #11111c;
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-top-color: rgba(255, 255, 255, 0.12);
        color: #ede9e0;
        font-family: 'Barlow Condensed', sans-serif;
        padding: 10px;
        border-radius: 14px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        position: relative;
        overflow: hidden;
    }

    #container::before {
        content: '';
        position: absolute;
        top: 0; left: 20%; right: 20%;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
    }

    #playerRow {
        display: flex;
        flex-direction: row;
        align-items: stretch;
        gap: 10px;
    }

    #coverWrapper {
        width: 86px;
        height: 86px;
        border-radius: 50%;
        flex-shrink: 0;
        align-self: center;
        display: flex;
        justify-content: center;
        align-items: center;
        background: conic-gradient(#1a1a2a 0%, #1a1a2a 0%);
        cursor: pointer;
    }

    #coverImage {
        width: 78px;
        height: 78px;
        border-radius: 50%;
        object-fit: cover;
        border: 3px solid #0d0d17;
        position: relative;
        z-index: 1;
    }

    #coverImage.playing {
        animation: rotate 12s linear infinite;
    }

    @keyframes rotate {
        to { transform: rotate(360deg); }
    }

    #playerCenter {
        display: flex;
        flex-direction: column;
        gap: 6px;
        flex: 1;
        min-width: 0;
    }

    #trackInfo {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    #trackTitle {
        font-size: 0.9rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    #trackArtist {
        font-family: 'Space Mono', monospace;
        font-size: 0.58rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: rgba(237, 233, 224, 0.38);
    }

    #navControls {
        display: flex;
        gap: 6px;
        align-items: center;
    }

    .nav-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 5px;
        color: rgba(237, 233, 224, 0.6);
        cursor: pointer;
        padding: 3px 8px;
        font-family: 'Space Mono', monospace;
        font-size: 9px;
        transition: background 0.15s, color 0.15s;
    }

    .nav-btn:hover {
        background: rgba(232, 160, 32, 0.15);
        border-color: rgba(232, 160, 32, 0.4);
        color: #e8a020;
    }

    .controls {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 16px;
        padding-top: 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    audio { display: none; }

    webaudio-knob { cursor: pointer; position: relative; }

    #knobVolume::after, #knobPan::after, #knobSpeed::after {
        position: absolute;
        bottom: -13px;
        left: 0;
        width: 100%;
        text-align: center;
        font-family: 'Space Mono', monospace;
        font-size: 7px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: rgba(237, 233, 224, 0.3);
        pointer-events: none;
    }

    #knobVolume::after { content: "VOL"; }
    #knobPan::after    { content: "PAN"; }
    #knobSpeed::after  { content: "SPD"; }
`);

const html = /* html */`
<div id="container">
    <div id="playerRow">
        <div id="coverWrapper">
            <img id="coverImage" src="" alt="Track Cover">
        </div>
        <div id="playerCenter">
            <div id="trackInfo">
                <span id="trackTitle">Titre</span>
                <span id="trackArtist">Artiste</span>
            </div>
            <div id="navControls">
                <button class="nav-btn" id="btnPrev">&#9664;&#9664;</button>
                <webaudio-switch
                    src="${BASE}images/S_pinkponk-ON-OFF.png"
                    id="sw1" type="toggle" width="60" height="40">
                </webaudio-switch>
                <button class="nav-btn" id="btnStop">&#9632;</button>
                <button class="nav-btn" id="btnNext">&#9654;&#9654;</button>
            </div>
        </div>
    </div>
    <div class="controls">
        <webaudio-knob
            id="knobVolume" src="${BASE}images/707.png"
            width=26 height=72 sprites=98 min=0 max=1 step=0.01 value=0.5>
        </webaudio-knob>
        <webaudio-knob
            id="knobPan" src="${BASE}images/707.png"
            width=26 height=72 sprites=98 min=-1 max=1 step=0.01 value=0>
        </webaudio-knob>
        <webaudio-knob
            id="knobSpeed" src="${BASE}images/707.png"
            width=26 height=72 sprites=98 min=0.1 max=2 step=0.01 value=1>
        </webaudio-knob>
    </div>
    <audio id="myplayer"></audio>
</div>
`;

/**
 * Lecteur audio avec contrôles de volume/pan/vitesse.
 *
 * ## Attributs HTML
 * - `src`      : URL du fichier JSON de playlist
 * - `autoplay` : présence de l'attribut → lecture automatique au chargement
 *
 * ## Événements émis (sur l'élément, bubbles + composed)
 * - `track-changed` : { track, index, tracks } — à chaque changement de piste
 *
 * ## Événements écoutés (sur document)
 * - `track-select` : { index } — sélection depuis la playlist externe
 *
 * ## Usage standalone
 * <my-audio-player src="./assets/tracks.json"></my-audio-player>
 */
class MyAudioPlayer extends ConnectableComponent {
    #currentIndex = 0;
    #tracks = [];
    #abortController = null;

    static get observedAttributes() { return ['src', 'autoplay']; }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.shadowRoot.adoptedStyleSheets = [sheet];
        this.shadowRoot.setHTMLUnsafe(html);

        const audioElement = this.shadowRoot.querySelector('#myplayer');
        audioElement.crossOrigin = 'anonymous';

        this.initAudioGraph();
        this.#defineListeners();
        this.#loadTracks(this.getAttribute('src'));
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal === newVal) return;
        if (!this.shadowRoot.querySelector('#myplayer')) return;
        if (name === 'src') this.#loadTracks(newVal);
    }

    // --- Graphe audio ---

    buildAudioGraph() {
        const audioElement = this.shadowRoot.querySelector('#myplayer');
        this.sourceNode = this.audioCtx.createMediaElementSource(audioElement);
        this.gain       = this.audioCtx.createGain();
        this.panner     = this.audioCtx.createStereoPanner();
        this.outputNode = this.audioCtx.createGain();

        this.sourceNode.connect(this.gain);
        this.gain.connect(this.panner);
        this.panner.connect(this.outputNode);

        this.outputNode.connect(this.audioCtx.destination);
        this._markConnectedToDestination();
    }

    getInputNode()  { return this.sourceNode; }
    getOutputNode() { return this.outputNode; }

    disconnectedCallback() {
        this.#abortController?.abort();
        this.#abortController = null;
        this.shadowRoot?.querySelector('#myplayer')?.pause();
        try {
            this.sourceNode?.disconnect();
            this.gain?.disconnect();
            this.panner?.disconnect();
            this.outputNode?.disconnect();
        } catch (_) {}
        this.sourceNode = null;
        this.gain       = null;
        this.panner     = null;
        this.outputNode = null;
        super.disconnectedCallback();
    }

    // --- Tracks ---

    async #loadTracks(srcAttr) {
        const tracksUrl = srcAttr
            ? new URL(srcAttr, document.baseURI).href
            : new URL('../assets/tracks.json', import.meta.url).href;

        try {
            const response = await fetch(tracksUrl);
            const rawTracks = await response.json();
            this.#tracks = rawTracks.map(t => ({
                ...t,
                audio: new URL(t.audio, document.baseURI).href,
                cover: t.cover ? new URL(t.cover, document.baseURI).href : null,
            }));

            const audioEl    = this.shadowRoot.querySelector('#myplayer');
            const coverImage = this.shadowRoot.querySelector('#coverImage');
            if (this.#tracks.length > 0) {
                this.#selectTrack(0, audioEl, coverImage);
            }
        } catch (err) {
            console.error('AudioPlayer: impossible de charger les pistes depuis', tracksUrl, err);
        }
    }

    #selectTrack(index, audioEl, coverImage) {
        if (index < 0 || index >= this.#tracks.length) return;
        this.#currentIndex = index;

        const track = this.#tracks[index];

        audioEl.src = track.audio;
        if (coverImage) {
            if (track.cover) {
                coverImage.src = track.cover;
                coverImage.style.background = '';
            } else {
                coverImage.src = '';
                coverImage.style.background = '#0d0d17';
            }
        }

        const titleEl  = this.shadowRoot.querySelector('#trackTitle');
        const artistEl = this.shadowRoot.querySelector('#trackArtist');
        if (titleEl)  titleEl.textContent  = track.title  || 'Titre inconnu';
        if (artistEl) artistEl.textContent = track.artist || 'Artiste inconnu';

        const switchEl = this.shadowRoot.querySelector('#sw1');
        if (switchEl) { switchEl.removeAttribute('on'); switchEl.value = 0; }
        if (coverImage) { coverImage.classList.remove('playing'); coverImage.style.transform = 'rotate(0deg)'; }

        const coverWrapper = this.shadowRoot.querySelector('#coverWrapper');
        if (coverWrapper) coverWrapper.style.background = 'conic-gradient(#1a1a2a 0%, #1a1a2a 0%)';

        audioEl.pause();

        // tracks inclus pour permettre à la playlist de se (re)construire
        this.dispatchEvent(new CustomEvent('track-changed', {
            detail: { track, index, tracks: [...this.#tracks] },
            bubbles: true,
            composed: true,
        }));
    }

    // --- Listeners ---

    #defineListeners() {
        this.#abortController = new AbortController();
        const { signal } = this.#abortController;

        const audioEl      = this.shadowRoot.querySelector('#myplayer');
        const coverImage   = this.shadowRoot.querySelector('#coverImage');
        const coverWrapper = this.shadowRoot.querySelector('#coverWrapper');
        const switchEl     = this.shadowRoot.querySelector('#sw1');

        // Play/Pause
        switchEl?.addEventListener('click', async () => {
            if (audioEl.paused) {
                await resumeAudioContext();
                audioEl.play().catch(() => {});
            } else {
                audioEl.pause();
            }
        }, { signal });

        audioEl.addEventListener('play', () => {
            switchEl?.setAttribute('on', '');
            coverImage?.classList.add('playing');
        }, { signal });

        audioEl.addEventListener('pause', () => {
            switchEl?.removeAttribute('on');
            coverImage?.classList.remove('playing');
        }, { signal });

        // Avance automatique à la fin de la piste
        audioEl.addEventListener('ended', () => {
            switchEl?.removeAttribute('on');
            coverImage?.classList.remove('playing');
            if (this.#currentIndex < this.#tracks.length - 1) {
                this.#selectTrack(this.#currentIndex + 1, audioEl, coverImage);
                audioEl.play().catch(() => {});
            }
        }, { signal });

        // Anneau de progression
        audioEl.addEventListener('timeupdate', () => {
            if (audioEl.duration && coverWrapper) {
                const progress = (audioEl.currentTime / audioEl.duration) * 100;
                coverWrapper.style.background = `conic-gradient(#e8a020 ${progress}%, #1a1a2a ${progress}%)`;
            }
        }, { signal });

        // Boutons Précédent / Suivant
        this.shadowRoot.querySelector('#btnPrev')?.addEventListener('click', () => {
            this.#selectTrack(this.#currentIndex - 1, audioEl, coverImage);
        }, { signal });

        this.shadowRoot.querySelector('#btnNext')?.addEventListener('click', () => {
            this.#selectTrack(this.#currentIndex + 1, audioEl, coverImage);
        }, { signal });

        // Stop — remet la lecture à zéro
        this.shadowRoot.querySelector('#btnStop')?.addEventListener('click', () => {
            audioEl.pause();
            audioEl.currentTime = 0;
            switchEl?.setValue(0);
            coverImage?.classList.remove('playing');
            if (coverWrapper) coverWrapper.style.background = 'conic-gradient(#1a1a2a 0%, #1a1a2a 0%)';
        }, { signal });

        // Knob volume
        this.shadowRoot.querySelector('#knobVolume')?.addEventListener('input', (e) => {
            if (this.gain) this.gain.gain.value = e.target.value;
            else audioEl.volume = e.target.value;
        }, { signal });

        // Knob pan
        this.shadowRoot.querySelector('#knobPan')?.addEventListener('input', (e) => {
            if (this.panner) this.panner.pan.value = e.target.value;
        }, { signal });

        // Knob vitesse
        this.shadowRoot.querySelector('#knobSpeed')?.addEventListener('input', (e) => {
            audioEl.playbackRate = e.target.value;
        }, { signal });

        // Seek par clic sur la cover (angle polaire → position)
        coverWrapper?.addEventListener('click', (event) => {
            if (!audioEl.duration) return;
            const rect = coverWrapper.getBoundingClientRect();
            const x = event.clientX - (rect.left + rect.width  / 2);
            const y = event.clientY - (rect.top  + rect.height / 2);
            let degrees = Math.atan2(y, x) * (180 / Math.PI) + 90;
            if (degrees < 0) degrees += 360;
            audioEl.currentTime = (degrees / 360) * audioEl.duration;
        }, { signal });

        // Sélection depuis la playlist externe → lance la lecture immédiatement
        document.addEventListener('track-select', async (e) => {
            this.#selectTrack(e.detail.index, audioEl, coverImage);
            await resumeAudioContext();
            audioEl.play().catch(() => {});
            switchEl?.setValue(1);
            coverImage?.classList.add('playing');
        }, { signal });

        // Import de fichier local depuis la playlist
        document.addEventListener('track-import', (e) => {
            this.#tracks.push(e.detail.track);
        }, { signal });

        // Clear playlist
        document.addEventListener('playlist-clear', () => {
            this.#tracks = [];
            this.#currentIndex = 0;
            audioEl.pause();
            audioEl.src = '';
            const titleEl  = this.shadowRoot.querySelector('#trackTitle');
            const artistEl = this.shadowRoot.querySelector('#trackArtist');
            if (titleEl)  titleEl.textContent  = 'Titre';
            if (artistEl) artistEl.textContent = 'Artiste';
            switchEl?.setValue(0);
            coverImage?.classList.remove('playing');
            coverImage.src = '';
            coverImage.style.background = '#0d0d17';
            const coverWrapper = this.shadowRoot.querySelector('#coverWrapper');
            if (coverWrapper) coverWrapper.style.background = 'conic-gradient(#1a1a2a 0%, #1a1a2a 0%)';
        }, { signal });
    }
}

customElements.define('my-audio-player', MyAudioPlayer);
