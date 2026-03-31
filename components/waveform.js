import "./libs/webaudiocontrols.js";
import { ConnectableComponent } from "./ConnectableComponent.js";

const style = `
<style>
    * {
      box-sizing: border-box;
    }

    canvas {
        background-color: #f0f0f0;
        border-radius: 6px;
        width: 100%;
        height: 100%;
    }
    #container {
        font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background-color: #ffffff; /* Requested Primary Color */
        padding: 10px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(61, 104, 204, 0.4);
        margin: 0 auto;
        color: white;
        height: 300px;
        width: 400px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
</style>
`;

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
        this.shadowRoot.setHTMLUnsafe(style + html);
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
        this.canvasContext.fillStyle = '#333333';
        this.canvasContext.fillRect(0, 0, this.width, this.height);

        // Get the analyser data
        this.analyser.getByteTimeDomainData(this.dataArray);

        this.canvasContext.lineWidth = 1.1;
        this.canvasContext.strokeStyle = '#9dafd8';

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

        // call again the visualize function at 60 frames/s
        requestAnimationFrame(() => this.visualize());
    }
}


customElements.define('my-waveform', Waveform);