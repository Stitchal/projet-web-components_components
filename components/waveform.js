import { ConnectableComponent } from "./ConnectableComponent.js";

const sheet = new CSSStyleSheet();
sheet.replaceSync(/* css */`
    * { box-sizing: border-box; }

    :host { display: block; width: 100%; height: 100%; }

    canvas {
        border-radius: 8px;
        width: 100%;
        height: 100%;
        display: block;
    }

    #container {
        font-family: 'Barlow Condensed', sans-serif;
        background: #11111c;
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-top-color: rgba(255, 255, 255, 0.12);
        padding: 10px;
        border-radius: 14px;
        height: 100%;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
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
`);

const html = /* html */`
    <div id="container">
        <canvas id="myCanvas"></canvas>
    </div>
`;

/**
 * Composant visualiseur de forme d'onde en temps réel.
 *
 * ## Attributs HTML
 * - `color`    : couleur du tracé (défaut : #39e082)
 * - `fft-size` : taille FFT de l'analyseur (défaut : 1024, puissance de 2)
 *
 * ## Autonomie
 * Ce composant fonctionne seul : il récupère le singleton AudioContext,
 * construit un AnalyserNode et le connecte à ctx.destination (passthrough).
 * Il peut être inséré dans une chaîne via connectComponent() depuis un autre composant.
 *
 * ## Usage standalone
 * <my-waveform></my-waveform>
 * <my-waveform color="#e8a020" fft-size="2048"></my-waveform>
 */
class Waveform extends ConnectableComponent {
    #analyser = null;
    #bufferLength = null;
    #dataArray = null;
    #canvas = null;
    #canvasCtx = null;
    #color = '#39e082';
    #fftSize = 1024;
    #animating = false;
    #resizeObserver = null;

    static get observedAttributes() { return ['color', 'fft-size']; }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.shadowRoot.adoptedStyleSheets = [sheet];
        this.shadowRoot.setHTMLUnsafe(html);

        this.#canvas = this.shadowRoot.querySelector('#myCanvas');
        this.#canvasCtx = this.#canvas.getContext('2d');

        // Synchroniser les dimensions internes du canvas avec son affichage CSS
        this.#resizeObserver = new ResizeObserver(() => {
            this.#canvas.width  = this.#canvas.offsetWidth  || 400;
            this.#canvas.height = this.#canvas.offsetHeight || 280;
        });
        this.#resizeObserver.observe(this.#canvas);

        // Auto-init : graphe audio construit depuis le singleton AudioContext
        this.initAudioGraph();

        this.#animating = true;
        requestAnimationFrame(() => this.#visualize());
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal === newVal) return;
        if (name === 'color') {
            this.#color = newVal;
        }
        if (name === 'fft-size') {
            const size = parseInt(newVal, 10);
            if (!isNaN(size) && size >= 32) {
                this.#fftSize = size;
                if (this.#analyser) {
                    this.#analyser.fftSize = this.#fftSize;
                    this.#bufferLength = this.#analyser.frequencyBinCount;
                    this.#dataArray = new Uint8Array(this.#bufferLength);
                }
            }
        }
    }

    buildAudioGraph() {
        this.#analyser = this.audioCtx.createAnalyser();
        this.#analyser.fftSize = this.#fftSize;
        this.#bufferLength = this.#analyser.frequencyBinCount;
        this.#dataArray = new Uint8Array(this.#bufferLength);

        // Connexion par défaut à ctx.destination (passthrough audio)
        this.#analyser.connect(this.audioCtx.destination);
        this._markConnectedToDestination();
    }

    getInputNode()  { return this.#analyser; }
    getOutputNode() { return this.#analyser; }

    disconnectedCallback() {
        this.#animating = false;
        this.#resizeObserver?.disconnect();
        this.#resizeObserver = null;
        try { this.#analyser?.disconnect(); } catch (_) {}
        this.#analyser = null;
        this.#dataArray = null;
        super.disconnectedCallback();
    }

    #visualize() {
        if (!this.#animating) return;

        // Attendre que l'analyseur soit prêt
        if (!this.#analyser) {
            requestAnimationFrame(() => this.#visualize());
            return;
        }

        const w = this.#canvas.width;
        const h = this.#canvas.height;

        this.#canvasCtx.clearRect(0, 0, w, h);
        this.#canvasCtx.fillStyle = '#0c0c16';
        this.#canvasCtx.fillRect(0, 0, w, h);

        this.#analyser.getByteTimeDomainData(this.#dataArray);

        const color = this.#color;
        // Extraire RGB pour la couleur de glow à partir d'une couleur hex ou laisser un défaut
        const glowColor = color.startsWith('#') && color.length === 7
            ? `rgba(${parseInt(color.slice(1,3),16)},${parseInt(color.slice(3,5),16)},${parseInt(color.slice(5,7),16)},0.5)`
            : 'rgba(57, 224, 130, 0.5)';

        this.#canvasCtx.lineWidth = 1.5;
        this.#canvasCtx.strokeStyle = color;
        this.#canvasCtx.shadowBlur = 8;
        this.#canvasCtx.shadowColor = glowColor;

        this.#canvasCtx.beginPath();
        const sliceWidth = w / this.#bufferLength;
        let x = 0;
        for (let i = 0; i < this.#bufferLength; i++) {
            const v = this.#dataArray[i] / 255;
            const y = v * h;
            if (i === 0) this.#canvasCtx.moveTo(x, y);
            else         this.#canvasCtx.lineTo(x, y);
            x += sliceWidth;
        }
        this.#canvasCtx.stroke();
        this.#canvasCtx.shadowBlur = 0;

        requestAnimationFrame(() => this.#visualize());
    }
}

customElements.define('my-waveform', Waveform);
