import "./libs/webaudiocontrols.js";
import {ConnectableComponent} from "./ConnectableComponent.js";

const butterchurnModule = await import('https://cdn.skypack.dev/butterchurn@2.6.7');
const butterchurnPresetsModule = await import('https://cdn.skypack.dev/butterchurn-presets@2.4.7');

const createVisualizer = butterchurnModule.default?.createVisualizer ?? butterchurnModule.createVisualizer;
const getPresets = butterchurnPresetsModule.default?.getPresets ?? butterchurnPresetsModule.getPresets;
const sheet = new CSSStyleSheet();
sheet.replaceSync(/* css */`
    * { box-sizing: border-box; }

    :host { display: block; width: 100%; height: 100%; }

    #container {
        font-family: 'Barlow Condensed', sans-serif;
        background: var(--bg-component, #11111c);
        border: 1px solid var(--border, rgba(255,255,255,0.07));
        border-top-color: var(--border-top, rgba(255,255,255,0.12));
        padding: 10px;
        border-radius: 0 0 14px 14px;
        color: var(--text, #ede9e0);
        width: 100%;
        position: relative;
        overflow: hidden;
    }

    #container::before {
        content: '';
        position: absolute;
        top: 0; left: 20%; right: 20%;
        // height: 1px;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
    }
    #canvasWrapper {
    width: 100%;
    aspect-ratio: 4/3;
    border-radius: 8px;
    overflow: hidden;
    min-height: 300px;
    }
    #myCanvas {
    position: absolute;
    width: 100%;
    }
`);

const html = `
    <div id="container">
    <div id="presets"></div>
<!--        <canvas id="myCanvas" width=300 height=100></canvas>-->
    </div>
`;

class Butterchurn extends ConnectableComponent {
    #gainNode = null;
    #visualizer = null;
    #presets = {};
    #presetNames = [];
    #currentIndex = 0;
    #animating = false;
    #rafId = null;
    #blendTime = 2.0;
    #abortController = null;
    #connectedToPlayer = false;
    #analyser = null;
    #analyserData = null;
    #isPlaying = false;

    static get observedAttributes() {
        return ['blend'];
    }

    constructor() {
        super();
        this.attachShadow({mode: 'open'});
    }

    connectedCallback() {
        this.shadowRoot.adoptedStyleSheets = [sheet];

        const blendAttr = this.getAttribute('blend');
        if (blendAttr) this.#blendTime = parseFloat(blendAttr) || 2.0;

        this.#buildDOM();

        this.initAudioGraph();

        this.#setupVisualizer();
        this.#defineListeners();
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal === newVal) return;
        if (name === 'blend') this.#blendTime = parseFloat(newVal) || 2.0;
    }

    #buildDOM() {
        const tpl = document.createElement('template');
        tpl.setHTMLUnsafe(/* html */`
            <div id="container">
                <div id="canvasWrapper">
                    <canvas id="myCanvas"></canvas>
                </div>
            </div>
        `);
        this.shadowRoot.append(tpl.content.cloneNode(true));
    }

    buildAudioGraph() {
        this.#gainNode = this.audioCtx.createGain();
        this.#gainNode.gain.value = 1;
        this.#analyser = this.audioCtx.createAnalyser();
        this.#gainNode.connect(this.#analyser);
        this.#analyser.connect(this.audioCtx.destination);
        this._markConnectedToDestination();
    }

    getInputNode() {
        return this.#gainNode;
    }

    getOutputNode() {
        return this.#analyser;
    }

    #setupVisualizer() {
        const canvas = this.shadowRoot.querySelector('#myCanvas');
        const wrapper = this.shadowRoot.querySelector('#canvasWrapper');

        // Dimensionner le canvas sur son wrapper rendu
        const w = wrapper.clientWidth || 400;
        const h = wrapper.clientHeight || 300;
        canvas.width = w;
        canvas.height = h;

        if (typeof createVisualizer !== 'function') {
            console.error('my-butterchurn: createVisualizer introuvable');
            return;
        }

        this.#visualizer = createVisualizer(this.audioCtx, canvas, {width: w, height: h});
        this.#visualizer.connectAudio(this.#gainNode);

        try {
            this.#presets = getPresets();
            this.#presetNames = Object.keys(this.#presets);
        } catch (err) {
            console.warn('my-butterchurn: impossible de charger les presets', err);
        }

        // Preset aléatoire au démarrage
        this.#currentIndex = Math.floor(Math.random() * this.#presetNames.length);
        this.#applyCurrentPreset(0.0);
        this.#updatePresetLabel();

        // Boucle de rendu
        this.#animating = true;
        this.#visualizer.render();
        this.#renderFrame();
    }

    #renderFrame() {
        if (!this.#animating || !this.#visualizer) return;
        const player = document.querySelector('my-audio-player');
        const audio = player?.shadowRoot?.querySelector('#myplayer');
        const isPlaying = audio ? !audio.paused && !audio.ended : false;

        if (isPlaying) {
            this.#visualizer.render();
        }
        this.#rafId = requestAnimationFrame(() => this.#renderFrame());
    }

    #applyCurrentPreset(blend = null) {
        if (!this.#visualizer || !this.#presetNames.length) return;
        const preset = this.#presets[this.#presetNames[this.#currentIndex]];
        this.#visualizer.loadPreset(preset, blend ?? this.#blendTime);
        this.#updatePresetLabel();
    }

    #updatePresetLabel() {
        const el = this.shadowRoot?.querySelector('#presetName');
        if (el) el.textContent = this.#presetNames[this.#currentIndex] ?? '—';
    }

    #defineListeners() {
        this.#abortController = new AbortController();
        const {signal} = this.#abortController;
        document.addEventListener('track-changed', () => {
            const player = document.querySelector('my-audio-player');
            if (player && !this.#connectedToPlayer) {
                player.connectComponent(this);
                this.#connectedToPlayer = true;
                const audio = player.shadowRoot?.querySelector('#myplayer');
                if (audio && !audio.paused) this.#isPlaying = true;
            }
        }, {signal});
        document.addEventListener('audio-play', () => {
            this.#isPlaying = true;
        }, {signal});
        document.addEventListener('audio-pause', () => {
            this.#isPlaying = false;
        }, {signal});
    }

    disconnectedCallback() {
        this.#animating = false;
        if (this.#rafId) cancelAnimationFrame(this.#rafId);
        this.#rafId = null;
        this.#abortController?.abort();
        this.#abortController = null;
        try {
            this.#gainNode?.disconnect();
        } catch (_) {
        }
        this.#gainNode = null;
        this.#visualizer = null;
        super.disconnectedCallback();
    }
}


customElements.define('my-butterchurn', Butterchurn);