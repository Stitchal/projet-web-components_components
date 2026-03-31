import "./libs/webaudiocontrols.js";
import { ConnectableComponent } from "./ConnectableComponent.js";

const sheet = new CSSStyleSheet();
sheet.replaceSync(/* css */`
    * { box-sizing: border-box; }

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
        height: 300px;
        width: 420px;
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

const html = `
    <div id="container">
        <canvas id="myCanvas"></canvas>
    </div>
`;

class Waveform extends ConnectableComponent {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.audioCtx = null;
        this.analyser = null;
        this.bufferLength = null;
        this.dataArray = null;
        this.canvas = null;
        this.width = null;
        this.height = null;
        this.canvasContext = null;
    }

    connectedCallback() {
        this.shadowRoot.adoptedStyleSheets = [sheet];
        this.shadowRoot.setHTMLUnsafe(html);
        this.canvas = this.shadowRoot.querySelector("#myCanvas");
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.canvasContext = this.canvas.getContext('2d');

        // start the visualization
        requestAnimationFrame(() => this.visualize());
    }

    buildAudioGraph() {
        this.analyser = this.audioCtx.createAnalyser();
        // set its properties
        this.analyser.fftSize = 1024;
        // its size is always the fftSize / 2
        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);
    }

    getInputNode() {
        return this.analyser;
    }

    getOutputNode() {
        return this.analyser;   
    }

    visualize() {
        // if analyser isn't ready, just loop and wait
        if (!this.analyser) {
            requestAnimationFrame(() => this.visualize());
            return;
    }
        // clear the canvas
        this.canvasContext.clearRect(0, 0, this.width, this.height);
        this.canvasContext.fillStyle = '#0c0c16';
        this.canvasContext.fillRect(0, 0, this.width, this.height);

        // Get the analyser data
        this.analyser.getByteTimeDomainData(this.dataArray);

        this.canvasContext.lineWidth = 1.5;
        this.canvasContext.strokeStyle = '#39e082';
        this.canvasContext.shadowBlur = 8;
        this.canvasContext.shadowColor = 'rgba(57, 224, 130, 0.5)';

        // We will draw it as a path of connected lines
        // First, clear the previous path that was in the buffer
        this.canvasContext.beginPath();

        // slice width
        const sliceWidth = this.width / this.bufferLength;
        let x = 0;
        for (let i = 0; i < this.bufferLength; i++) {
            const v = this.dataArray[i] / 255;

            const y = v * this.height;
            if (i === 0) {
                this.canvasContext.moveTo(x, y);
            } else {
                this.canvasContext.lineTo(x, y);
            }

            x += sliceWidth;
        }

        // draw the whole waveform (a path)
        this.canvasContext.stroke();
        this.canvasContext.shadowBlur = 0;

        // call again the visualize function at 60 frames/s
        requestAnimationFrame(() => this.visualize());
    }
}


customElements.define('my-waveform', Waveform);