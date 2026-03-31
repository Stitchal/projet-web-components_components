import "./libs/webaudiocontrols.js";
import { ConnectableComponent } from "./ConnectableComponent.js";
import { createVisualizer } from 'butterchurn';
import { getPresets } from 'butterchurn-presets';

const style = `
<style>
    canvas {
        border: 1px solid black;
        background-color: #f0f0f0;
    }
    #container {
    font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background-color: #3D68CC; /* Requested Primary Color */
    padding: 20px;
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
        <canvas id="myCanvas" width=300 height=100></canvas>
    </div>
`;

class Butterchurn extends ConnectableComponent {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.audioplayerSelector = this.getAttribute('audioplayer');
        this.audioCtx = null;
        this.canvas = null;
        this.width = null;
        this.height = null;
        this.canvasContext = null;
        this.gainNode = null;
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = style + html;
        this.canvas = this.shadowRoot.querySelector("#myCanvas");
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }

buildAudioGraph() {
    this.gainNode = this.audioCtx.createGain();

    // ERROR FIX: We now use the imported function directly
    if (typeof createVisualizer !== 'function') {
        console.error("createVisualizer is not a function.");
        return;
    }

    this.visualizer = createVisualizer(this.audioCtx, this.canvas, {
        width: 800,
        height: 600
    });

    this.visualizer.connectAudio(this.gainNode);

    // ERROR FIX: Use the imported getPresets function directly
    const actualPresets = getPresets();
    const presetNames = Object.keys(actualPresets);
    
    if (presetNames.length > 0) {
        this.visualizer.loadPreset(actualPresets[presetNames[0]], 0.0);
    }

    this.renderFrame();
}

    // TODO
    getInputNode() {
        return this.gainNode;
    }

    // TODO
    getOutputNode() {
        return this.gainNode;
    }

    visualize() {
        // load a preset
        const presets = butterchurnPresets.getPresets();
        const preset = presets['Flexi, martin + geiss - dedicated to the sherwin maxawow'];

        this.visualizer.loadPreset(preset, 0.0); // 2nd argument is the number of seconds to blend presets

        // resize visualizer

        this.visualizer.setRendererSize(1600, 1200);
        // render a frame

        this.visualizer.render();
    }
}


customElements.define('my-butterchurn', Butterchurn);