import { ConnectableComponent } from "./ConnectableComponent.js";

const sheet = new CSSStyleSheet();
sheet.replaceSync(/* css */`
    * { box-sizing: border-box; }

    :host { display: block; width: 100%; height: 100%; }

    #container {
        font-family: 'Barlow Condensed', sans-serif;
        background: #11111c;
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-top-color: rgba(255, 255, 255, 0.12);
        padding: 10px;
        border-radius: 0 0 14px 14px;
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        justify-content: stretch;
        position: relative;
        overflow: hidden;
        gap: 6px;
    }

    #container::before {
        content: '';
        position: absolute;
        top: 0; left: 20%; right: 20%;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
    }

    #modeBar {
        display: flex;
        gap: 4px;
        flex-shrink: 0;
    }

    .mode-btn {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 5px;
        color: rgba(237,233,224,0.45);
        cursor: pointer;
        padding: 2px 8px;
        font-family: 'Space Mono', monospace;
        font-size: 8px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        transition: background 0.15s, color 0.15s;
    }

    .mode-btn:hover {
        background: rgba(232,160,32,0.12);
        border-color: rgba(232,160,32,0.35);
        color: #e8a020;
    }

    .mode-btn.active {
        background: rgba(232,160,32,0.12);
        border-color: rgba(232,160,32,0.4);
        color: #e8a020;
    }

    #canvasWrap {
        flex: 1;
        min-height: 0;
    }

    canvas {
        display: block;
        width: 100%;
        height: 100%;
        border-radius: 6px;
    }
`);

const html = /* html */`
    <div id="container">
        <div id="modeBar">
            <button class="mode-btn active" data-mode="waveform">WAVE</button>
            <button class="mode-btn" data-mode="spectrum">SPECTRUM</button>
        </div>
        <div id="canvasWrap">
            <canvas id="myCanvas"></canvas>
        </div>
    </div>
`;

/**
 * DÉCISION DE DESIGN : composant AUTONOME
 * AudioContext : singleton audioContext.js
 * Raison : réutilisable via URI sans dépendance à un parent.
 *
 * @element my-waveform
 * @attr {string} color - Couleur du tracé (défaut : #39e082)
 * @attr {number} fft-size - Taille FFT puissance de 2 (défaut : 1024)
 * @attr {"waveform"|"spectrum"} mode - Mode de visualisation (défaut : waveform)
 */
class Waveform extends ConnectableComponent {
    #analyser = null;
    #bufferLength = null;
    #dataArray = null;
    #canvas = null;
    #canvasCtx = null;
    #color = '#39e082';
    #fftSize = 1024;
    #mode = 'waveform';
    #animating = false;
    #resizeObserver = null;
    #abortController = null;

    static get observedAttributes() { return ['color', 'fft-size', 'mode']; }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.shadowRoot.adoptedStyleSheets = [sheet];
        this.shadowRoot.setHTMLUnsafe(html);

        this.#canvas = this.shadowRoot.querySelector('#myCanvas');
        this.#canvasCtx = this.#canvas.getContext('2d');

        this.#resizeObserver = new ResizeObserver(() => {
            this.#canvas.width  = this.#canvas.offsetWidth  || 400;
            this.#canvas.height = this.#canvas.offsetHeight || 280;
        });
        this.#resizeObserver.observe(this.#canvas);

        this.initAudioGraph();

        this.#abortController = new AbortController();
        const { signal } = this.#abortController;

        this.shadowRoot.querySelector('#modeBar')?.addEventListener('click', (e) => {
            const btn = e.target.closest('.mode-btn');
            if (!btn) return;
            this.#mode = btn.dataset.mode;
            this.shadowRoot.querySelectorAll('.mode-btn').forEach(b =>
                b.classList.toggle('active', b.dataset.mode === this.#mode)
            );
        }, { signal });

        this.#animating = true;
        requestAnimationFrame(() => this.#visualize());
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal === newVal) return;
        if (name === 'color') {
            this.#color = newVal;
        } else if (name === 'fft-size') {
            const size = parseInt(newVal, 10);
            if (!isNaN(size) && size >= 32) {
                this.#fftSize = size;
                if (this.#analyser) {
                    this.#analyser.fftSize = this.#fftSize;
                    this.#bufferLength = this.#analyser.frequencyBinCount;
                    this.#dataArray = new Uint8Array(this.#bufferLength);
                }
            }
        } else if (name === 'mode') {
            if (newVal === 'waveform' || newVal === 'spectrum') {
                this.#mode = newVal;
                this.shadowRoot?.querySelectorAll('.mode-btn').forEach(b =>
                    b.classList.toggle('active', b.dataset.mode === this.#mode)
                );
            }
        }
    }

    buildAudioGraph() {
        this.#analyser = this.audioCtx.createAnalyser();
        this.#analyser.fftSize = this.#fftSize;
        this.#bufferLength = this.#analyser.frequencyBinCount;
        this.#dataArray = new Uint8Array(this.#bufferLength);

        this.#analyser.connect(this.audioCtx.destination);
        this._markConnectedToDestination();
    }

    getInputNode()  { return this.#analyser; }
    getOutputNode() { return this.#analyser; }

    disconnectedCallback() {
        this.#animating = false;
        this.#abortController?.abort();
        this.#abortController = null;
        this.#resizeObserver?.disconnect();
        this.#resizeObserver = null;
        try { this.#analyser?.disconnect(); } catch (_) {}
        this.#analyser = null;
        this.#dataArray = null;
        super.disconnectedCallback();
    }

    #visualize() {
        if (!this.#animating) return;

        if (!this.#analyser) {
            requestAnimationFrame(() => this.#visualize());
            return;
        }

        if (this.#mode === 'spectrum') {
            this.#drawSpectrum();
        } else {
            this.#drawWaveform();
        }

        requestAnimationFrame(() => this.#visualize());
    }

    #drawWaveform() {
        const w = this.#canvas.width;
        const h = this.#canvas.height;
        const ctx = this.#canvasCtx;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#0c0c16';
        ctx.fillRect(0, 0, w, h);

        this.#analyser.getByteTimeDomainData(this.#dataArray);

        const color = this.#color;
        const glowColor = color.startsWith('#') && color.length === 7
            ? `rgba(${parseInt(color.slice(1,3),16)},${parseInt(color.slice(3,5),16)},${parseInt(color.slice(5,7),16)},0.5)`
            : 'rgba(57, 224, 130, 0.5)';

        ctx.lineWidth = 1.5;
        ctx.strokeStyle = color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = glowColor;

        ctx.beginPath();
        const sliceWidth = w / this.#bufferLength;
        let x = 0;
        for (let i = 0; i < this.#bufferLength; i++) {
            const v = this.#dataArray[i] / 255;
            const y = v * h;
            if (i === 0) ctx.moveTo(x, y);
            else         ctx.lineTo(x, y);
            x += sliceWidth;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    #drawSpectrum() {
        const w = this.#canvas.width;
        const h = this.#canvas.height;
        const ctx = this.#canvasCtx;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#0c0c16';
        ctx.fillRect(0, 0, w, h);

        this.#analyser.getByteFrequencyData(this.#dataArray);

        const barCount = this.#bufferLength;
        const barWidth = w / barCount;
        const color = this.#color;

        // Extraire RGB pour le dégradé
        const r = color.startsWith('#') && color.length === 7 ? parseInt(color.slice(1,3),16) : 57;
        const g = color.startsWith('#') && color.length === 7 ? parseInt(color.slice(3,5),16) : 224;
        const b = color.startsWith('#') && color.length === 7 ? parseInt(color.slice(5,7),16) : 130;

        for (let i = 0; i < barCount; i++) {
            const val = this.#dataArray[i] / 255;
            const barH = val * h;
            const x = i * barWidth;

            // Dégradé vertical : couleur accent en bas, blanc en haut
            const grad = ctx.createLinearGradient(0, h - barH, 0, h);
            grad.addColorStop(0, `rgba(255,255,255,0.9)`);
            grad.addColorStop(0.4, `rgba(${r},${g},${b},0.9)`);
            grad.addColorStop(1,   `rgba(${r},${g},${b},0.3)`);

            ctx.fillStyle = grad;
            ctx.fillRect(x, h - barH, Math.max(1, barWidth - 1), barH);
        }
    }
}

customElements.define('my-waveform', Waveform);
