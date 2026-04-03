import "./libs/webaudiocontrols.js";
import { ConnectableComponent } from "./ConnectableComponent.js";
import { resumeAudioContext } from "./modules/audioContext.js";

const BASE = new URL('.', import.meta.url).href;

const sheet = new CSSStyleSheet();
sheet.replaceSync(/* css */`
    * { box-sizing: border-box; }

    :host { display: block; width: 100%; height: 100%; }

    #container {
        width: 100%;
        height: 100%;
        background: var(--bg-component, #11111c);
        border: 1px solid var(--border, rgba(255,255,255,0.07));
        border-top-color: var(--border-top, rgba(255,255,255,0.12));
        color: var(--text, #ede9e0);
        font-family: 'Barlow Condensed', sans-serif;
        padding: 10px;
        border-radius: 0 0 14px 14px;
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
        background: conic-gradient(var(--ring-bg, #1a1a2a) 0%, var(--ring-bg, #1a1a2a) 0%);
        cursor: pointer;
    }

    #coverImage {
        width: 78px;
        height: 78px;
        border-radius: 50%;
        object-fit: cover;
        border: 3px solid var(--cover-border, #0d0d17);
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
        color: var(--text-dim, rgba(237,233,224,0.38));
    }

    #navControls {
        display: flex;
        gap: 6px;
        align-items: center;
    }

    .nav-btn {
        background: var(--bg-input, rgba(255,255,255,0.05));
        border: 1px solid var(--border, rgba(255,255,255,0.1));
        border-radius: 5px;
        color: var(--text-dim, rgba(237,233,224,0.6));
        cursor: pointer;
        padding: 3px 8px;
        font-family: 'Space Mono', monospace;
        font-size: 9px;
        transition: background 0.15s, color 0.15s;
    }

    .nav-btn:hover {
        background: var(--btn-hover-bg, rgba(232,160,32,0.15));
        border-color: var(--btn-hover-border, rgba(232,160,32,0.4));
        color: var(--accent, #e8a020);
    }

    /* ── Barre de progression ── */
    #progressBar {
        width: 100%;
        height: 4px;
        background: var(--bg-input, rgba(255,255,255,0.08));
        border-radius: 2px;
        cursor: pointer;
        position: relative;
        flex-shrink: 0;
    }

    #progressFill {
        height: 100%;
        width: 0%;
        background: var(--accent, #e8a020);
        border-radius: 2px;
        transition: width 0.1s linear;
        pointer-events: none;
    }

    #progressBar:hover #progressFill {
        box-shadow: 0 0 6px var(--accent-glow, rgba(232,160,32,0.7));
    }

    /* ── VU-mètre ── */
    #vuMeter {
        display: flex;
        gap: 2px;
        align-items: flex-end;
        height: 18px;
        flex-shrink: 0;
    }

    .vu-bar {
        flex: 1;
        border-radius: 1px;
        background: var(--accent, #e8a020);
        opacity: 0.7;
        transform-origin: bottom;
        transition: transform 0.05s;
    }

    /* ── Knobs row ── */
    .controls {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 16px;
        padding-top: 8px;
        border-top: 1px solid var(--border, rgba(255,255,255,0.05));
    }

    .knob-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        position: relative;
    }

    .knob-label {
        font-family: 'Space Mono', monospace;
        font-size: 7px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--text-faint, rgba(237,233,224,0.3));
    }

    .knob-val {
        font-family: 'Space Mono', monospace;
        font-size: 7px;
        color: var(--accent, #e8a020);
        min-width: 32px;
        text-align: center;
    }

    audio { display: none; }
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
            <div id="progressBar"><div id="progressFill"></div></div>
        </div>
    </div>
    <div id="vuMeter"></div>
    <div class="controls">
        <div class="knob-wrap">
            <webaudio-knob id="knobVolume" src="${BASE}images/707.png"
                width=26 height=72 sprites=98 min=0 max=1 step=0.01 value=0.5>
            </webaudio-knob>
            <span class="knob-label">VOL</span>
            <span class="knob-val" id="valVolume">50%</span>
        </div>
        <div class="knob-wrap">
            <webaudio-knob id="knobPan" src="${BASE}images/707.png"
                width=26 height=72 sprites=98 min=-1 max=1 step=0.01 value=0>
            </webaudio-knob>
            <span class="knob-label">PAN</span>
            <span class="knob-val" id="valPan">C</span>
        </div>
        <div class="knob-wrap">
            <webaudio-knob id="knobSpeed" src="${BASE}images/707.png"
                width=26 height=72 sprites=98 min=0.1 max=2 step=0.01 value=1>
            </webaudio-knob>
            <span class="knob-label">SPD</span>
            <span class="knob-val" id="valSpeed">1.00×</span>
        </div>
    </div>
    <audio id="myplayer"></audio>
</div>
`;

class MyAudioPlayer extends ConnectableComponent {
    #currentIndex = 0;
    #tracks = [];
    #abortController = null;
    #analyser = null;
    #vuBars = [];
    #vuAnimating = false;

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

        this.#buildVuMeter();
        this.initAudioGraph();
        this.#defineListeners();
        this.#loadTracks(this.getAttribute('src'));
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal === newVal) return;
        if (!this.shadowRoot.querySelector('#myplayer')) return;
        if (name === 'src') this.#loadTracks(newVal);
    }

    // --- VU-mètre ---

    #buildVuMeter() {
        const vuEl = this.shadowRoot.querySelector('#vuMeter');
        if (!vuEl) return;
        for (let i = 0; i < 20; i++) {
            const bar = document.createElement('div');
            bar.className = 'vu-bar';
            bar.style.height = '100%';
            bar.style.transform = 'scaleY(0.05)';
            vuEl.append(bar);
            this.#vuBars.push(bar);
        }
    }

    #startVuAnimation() {
        if (this.#vuAnimating) return;
        this.#vuAnimating = true;
        const draw = () => {
            if (!this.#vuAnimating || !this.#analyser) return;
            const data = new Uint8Array(this.#analyser.frequencyBinCount);
            this.#analyser.getByteFrequencyData(data);
            const step = Math.floor(data.length / this.#vuBars.length);
            this.#vuBars.forEach((bar, i) => {
                const val = data[i * step] / 255;
                const hue = 60 - val * 40; // jaune → rouge
                bar.style.transform = `scaleY(${Math.max(0.05, val)})`;
                bar.style.background = `hsl(${hue}, 90%, 55%)`;
            });
            requestAnimationFrame(draw);
        };
        requestAnimationFrame(draw);
    }

    #stopVuAnimation() {
        this.#vuAnimating = false;
        this.#vuBars.forEach(bar => {
            bar.style.transform = 'scaleY(0.05)';
            bar.style.background = 'var(--accent, #e8a020)';
        });
    }

    // --- Graphe audio ---

    buildAudioGraph() {
        const audioElement = this.shadowRoot.querySelector('#myplayer');
        this.sourceNode = this.audioCtx.createMediaElementSource(audioElement);
        this.gain       = this.audioCtx.createGain();
        this.panner     = this.audioCtx.createStereoPanner();
        this.#analyser  = this.audioCtx.createAnalyser();
        this.#analyser.fftSize = 64;
        this.outputNode = this.audioCtx.createGain();

        this.sourceNode.connect(this.gain);
        this.gain.connect(this.panner);
        this.panner.connect(this.#analyser);
        this.#analyser.connect(this.outputNode);

        this.outputNode.connect(this.audioCtx.destination);
        this._markConnectedToDestination();
    }

    getInputNode()  { return this.sourceNode; }
    getOutputNode() { return this.outputNode; }

    get currentTrack() {
        return this.#tracks[this.#currentIndex] ?? null;
    }

    disconnectedCallback() {
        this.#vuAnimating = false;
        this.#abortController?.abort();
        this.#abortController = null;
        this.shadowRoot?.querySelector('#myplayer')?.pause();
        try {
            this.sourceNode?.disconnect();
            this.gain?.disconnect();
            this.panner?.disconnect();
            this.#analyser?.disconnect();
            this.outputNode?.disconnect();
        } catch (_) {}
        this.sourceNode  = null;
        this.gain        = null;
        this.panner      = null;
        this.#analyser   = null;
        this.outputNode  = null;
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
        if (switchEl) switchEl.setValue(0);
        if (coverImage) { coverImage.classList.remove('playing'); coverImage.style.transform = 'rotate(0deg)'; }

        const coverWrapper = this.shadowRoot.querySelector('#coverWrapper');
        if (coverWrapper) coverWrapper.style.background = `conic-gradient(var(--ring-bg, #1a1a2a) 0%, var(--ring-bg, #1a1a2a) 0%)`;

        const progressFill = this.shadowRoot.querySelector('#progressFill');
        if (progressFill) progressFill.style.width = '0%';

        audioEl.pause();
        this.#stopVuAnimation();

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
        const progressBar  = this.shadowRoot.querySelector('#progressBar');
        const progressFill = this.shadowRoot.querySelector('#progressFill');

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
            switchEl?.setValue(1);
            coverImage?.classList.add('playing');
            this.#startVuAnimation();
        }, { signal });

        audioEl.addEventListener('pause', () => {
            switchEl?.setValue(0);
            coverImage?.classList.remove('playing');
            this.#stopVuAnimation();
        }, { signal });

        audioEl.addEventListener('ended', () => {
            switchEl?.setValue(0);
            coverImage?.classList.remove('playing');
            this.#stopVuAnimation();
            if (this.#currentIndex < this.#tracks.length - 1) {
                this.#selectTrack(this.#currentIndex + 1, audioEl, coverImage);
                audioEl.play().catch(() => {});
            }
        }, { signal });

        // Anneau de progression + barre
        audioEl.addEventListener('timeupdate', () => {
            if (!audioEl.duration) return;
            const progress = (audioEl.currentTime / audioEl.duration) * 100;
            if (coverWrapper) {
                coverWrapper.style.background = `conic-gradient(var(--accent, #e8a020) ${progress}%, var(--ring-bg, #1a1a2a) ${progress}%)`;
            }
            if (progressFill) progressFill.style.width = progress + '%';
        }, { signal });

        // Seek via barre de progression
        progressBar?.addEventListener('click', (e) => {
            if (!audioEl.duration) return;
            const rect = progressBar.getBoundingClientRect();
            audioEl.currentTime = ((e.clientX - rect.left) / rect.width) * audioEl.duration;
        }, { signal });

        // Boutons Précédent / Suivant
        this.shadowRoot.querySelector('#btnPrev')?.addEventListener('click', () => {
            this.#selectTrack(this.#currentIndex - 1, audioEl, coverImage);
        }, { signal });

        this.shadowRoot.querySelector('#btnNext')?.addEventListener('click', () => {
            this.#selectTrack(this.#currentIndex + 1, audioEl, coverImage);
        }, { signal });

        // Stop
        this.shadowRoot.querySelector('#btnStop')?.addEventListener('click', () => {
            audioEl.pause();
            audioEl.currentTime = 0;
            switchEl?.setValue(0);
            coverImage?.classList.remove('playing');
            this.#stopVuAnimation();
            if (coverWrapper) coverWrapper.style.background = `conic-gradient(var(--ring-bg, #1a1a2a) 0%, var(--ring-bg, #1a1a2a) 0%)`;
            if (progressFill) progressFill.style.width = '0%';
        }, { signal });

        // Knob volume + tooltip
        this.shadowRoot.querySelector('#knobVolume')?.addEventListener('input', (e) => {
            if (this.gain) this.gain.gain.value = e.target.value;
            else audioEl.volume = e.target.value;
            const v = this.shadowRoot.querySelector('#valVolume');
            if (v) v.textContent = Math.round(e.target.value * 100) + '%';
        }, { signal });

        // Knob pan + tooltip
        this.shadowRoot.querySelector('#knobPan')?.addEventListener('input', (e) => {
            if (this.panner) this.panner.pan.value = e.target.value;
            const val = parseFloat(e.target.value);
            const v = this.shadowRoot.querySelector('#valPan');
            if (v) v.textContent = val === 0 ? 'C' : (val > 0 ? `R${Math.round(val*100)}` : `L${Math.round(-val*100)}`);
        }, { signal });

        // Knob vitesse + tooltip
        this.shadowRoot.querySelector('#knobSpeed')?.addEventListener('input', (e) => {
            audioEl.playbackRate = e.target.value;
            const v = this.shadowRoot.querySelector('#valSpeed');
            if (v) v.textContent = parseFloat(e.target.value).toFixed(2) + '×';
        }, { signal });

        // Seek par clic sur la cover
        coverWrapper?.addEventListener('click', (event) => {
            if (!audioEl.duration) return;
            const rect = coverWrapper.getBoundingClientRect();
            const x = event.clientX - (rect.left + rect.width  / 2);
            const y = event.clientY - (rect.top  + rect.height / 2);
            let degrees = Math.atan2(y, x) * (180 / Math.PI) + 90;
            if (degrees < 0) degrees += 360;
            audioEl.currentTime = (degrees / 360) * audioEl.duration;
        }, { signal });

        // Sélection depuis la playlist
        document.addEventListener('track-select', async (e) => {
            this.#selectTrack(e.detail.index, audioEl, coverImage);
            await resumeAudioContext();
            audioEl.play().catch(() => {});
            switchEl?.setValue(1);
            coverImage?.classList.add('playing');
        }, { signal });

        document.addEventListener('track-import', (e) => {
            this.#tracks.push(e.detail.track);
        }, { signal });

        document.addEventListener('playlist-clear', () => {
            this.#tracks = [];
            this.#currentIndex = 0;
            audioEl.pause();
            audioEl.src = '';
            this.#stopVuAnimation();
            const titleEl  = this.shadowRoot.querySelector('#trackTitle');
            const artistEl = this.shadowRoot.querySelector('#trackArtist');
            if (titleEl)  titleEl.textContent  = 'Titre';
            if (artistEl) artistEl.textContent = 'Artiste';
            switchEl?.setValue(0);
            coverImage?.classList.remove('playing');
            coverImage.src = '';
            coverImage.style.background = '#0d0d17';
            if (coverWrapper) coverWrapper.style.background = `conic-gradient(var(--ring-bg, #1a1a2a) 0%, var(--ring-bg, #1a1a2a) 0%)`;
            if (progressFill) progressFill.style.width = '0%';
        }, { signal });
    }
}

customElements.define('my-audio-player', MyAudioPlayer);
