import "./libs/webaudiocontrols.js";
import { ConnectableComponent } from "./ConnectableComponent.js";

const style = `
<style>
    /* Main Chassis */
    * {
      box-sizing: border-box;
    }
    #container {
        font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background-color: #3D68CC; /* Requested Primary Color */
        padding: 10px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(61, 104, 204, 0.4);
        margin: 0 auto;
        color: white;
        height: 300px;
        width: 400px;
    }

    /* Inner Control Surface */
    .eq-controls {
        background: rgba(0, 0, 0, 0.15); /* Slight darkening for contrast */
        padding: 20px 10px 10px 10px;
        border-radius: 8px;
        display: flex;
        flex-direction: row;
        gap: 5px;
        height: 100%;
        justify-content: center;
        align-items: center;
    }

    /* Individual Knob Column */
    .control-row {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 70px;
        position: relative; /* Needed for the frequency label placement */
    }

    /* Injecting Frequency Labels (Since input-range is hidden) */
    .control-row::before {
        content: '';
        font-size: 11px;
        font-weight: 600;
        opacity: 0.8;
        margin-bottom: 5px;
        text-transform: uppercase;
    }

    /* Assigning specific labels to specific columns */
    .control-row:nth-child(1)::before { content: "60Hz"; }
    .control-row:nth-child(2)::before { content: "170Hz"; }
    .control-row:nth-child(3)::before { content: "350Hz"; }
    .control-row:nth-child(4)::before { content: "1kHz"; }
    .control-row:nth-child(5)::before { content: "3.5kHz"; }
    .control-row:nth-child(6)::before { content: "10kHz"; }

    /* The Knobs */
    .control-row webaudio-knob {
        margin: 5px 0;
        cursor: pointer;
    }

    /* The dB Value Text */
    .knob-value {
        font-size: 11px;
        font-weight: normal;
        background: rgba(0, 0, 0, 0.3);
        padding: 3px 8px;
        border-radius: 4px;
        margin-top: 5px;
        min-width: 40px;
        text-align: center;
    }

    /* Hiding the requested section */
    .input-range,
    div[class="input-range"] {
        display: none !important;
    }
</style>
`;

const html = `
<div id="container">
    <div class="eq-controls">
        <div class="control-row">
            <webaudio-knob 
            id="knobEq0"
            src="./components/images/707.png" 
            width=34
            height=128
            sprites=98
            min=0 max=1 step=0.01 value=0.5 >
        </webaudio-knob>
        <span class="knob-value" id="knobValue0">0 dB</span>
        </div>
        <div class="control-row">
            <webaudio-knob 
            id="knobEq1"
            src="./components/images/707.png" 
            width=34
            height=128
            sprites=98
            min=0 max=1 step=0.01 value=0.5 >
        </webaudio-knob>
        <span class="knob-value" id="knobValue1">0 dB</span>
        </div>
        <div class="control-row">
            <webaudio-knob 
            id="knobEq2"
            src="./components/images/707.png" 
            width=34
            height=128
            sprites=98
            min=0 max=1 step=0.01 value=0.5 >
        </webaudio-knob>
        <span class="knob-value" id="knobValue2">0 dB</span>
        </div>
        <div class="control-row">
            <webaudio-knob 
            id="knobEq3"
            src="./components/images/707.png" 
            width=34
            height=128
            sprites=98
            min=0 max=1 step=0.01 value=0.5 >
        </webaudio-knob>
        <span class="knob-value" id="knobValue3">0 dB</span>
        </div>
        <div class="control-row">
            <webaudio-knob 
            id="knobEq4"
            src="./components/images/707.png" 
            width=34
            height=128
            sprites=98
            min=0 max=1 step=0.01 value=0.5 >
        </webaudio-knob>
        <span class="knob-value" id="knobValue4">0 dB</span>
      </div>
        <div class="control-row">
            <webaudio-knob 
            id="knobEq5"
            src="./components/images/707.png" 
            width=34
            height=128
            sprites=98
            min=0 max=1 step=0.01 value=0.5 >
        </webaudio-knob>
        <span class="knob-value" id="knobValue5">0 dB</span>
        </div>

      <div class="input-range">
        <div class="control-row"><label>60Hz</label><input type="range" class="eq-slider" id="eq0" data-filter="0" value="0" min="-30" max="30"><output>0 dB</output></div>
        <div class="control-row"><label>170Hz</label><input type="range" class="eq-slider" id="eq1" data-filter="1" value="0" min="-30" max="30"><output>0 dB</output></div>
        <div class="control-row"><label>350Hz</label><input type="range" class="eq-slider" id="eq2" data-filter="2" value="0" min="-30" max="30"><output>0 dB</output></div>
        <div class="control-row"><label>1kHz</label><input type="range" class="eq-slider" id="eq3" data-filter="3" value="0" min="-30" max="30"><output>0 dB</output></div>
        <div class="control-row"><label>3.5kHz</label><input type="range" class="eq-slider" id="eq4" data-filter="4" value="0" min="-30" max="30"><output>0 dB</output></div>
        <div class="control-row"><label>10kHz</label><input type="range" class="eq-slider" id="eq5" data-filter="5" value="0" min="-30" max="30"><output>0 dB</output></div>
        </div>
    </div>
</div>
`;

class Equalizer extends ConnectableComponent {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.filters = [];
    this.audioCtx = null;
  }

  connectedCallback() {
    // appelé lorsque le composant est ajouté au DOM
    // On crée l'interface utilisateur
    this.shadowRoot.setHTMLUnsafe(style + html);

    // on n'a pas encore l'AudioContext, on l'obtiendra via setAudioContext()
    // on ne peut pas encore configurer le graphe audio
    this.defineListeners();
  }

  buildAudioGraph() {
    // Build the Equalizer chain
    [60, 170, 350, 1000, 3500, 10000].forEach((freq) => {
      const eq = this.audioCtx.createBiquadFilter();
      eq.frequency.value = freq;
      eq.type = "peaking";
      eq.gain.value = 0;
      this.filters.push(eq);
    });

    // Connect:  Filter0 -> Filter1... -> Destination
    for (let i = 0; i < this.filters.length - 1; i++) {
      this.filters[i].connect(this.filters[i + 1]);
    }
    // Pour le moment, la source et la destination seront connectées depuis l'extérieur
  }

  getInputNode() {
    // retourne le premier noeud de l'égaliseur pour que le player puisse s'y connecter
    return this.filters[0];
  }

  getOutputNode() {
    // retourne le dernier noeud de l'égaliseur pour que le player puisse s'y connecter
    return this.filters[this.filters.length - 1];
  }

  defineListeners() {
    const sliders = this.shadowRoot.querySelectorAll('.eq-slider');

    sliders.forEach(slider => {
      slider.addEventListener('input', (e) => {
        const index = e.target.dataset.filter;
        const value = parseFloat(e.target.value);
        if (this.filters[index]) {
          this.filters[index].gain.value = value;
          e.target.nextElementSibling.value = value + " dB";
        }
      });
    });

    const knobIds = ['knobEq0', 'knobEq1', 'knobEq2', 'knobEq3', 'knobEq4', 'knobEq5'];
    knobIds.forEach((knobId, index) => {
      const knob = this.shadowRoot.querySelector('#' + knobId);
      const slider = this.shadowRoot.querySelector('#eq' + index);
      const valueDisplay = this.shadowRoot.querySelector('#knobValue' + index);
      if (knob && slider) {
        knob.addEventListener('input', (e) => {
          const value = parseFloat(e.target.value) * 60 - 30; // Scale 0-1 to -30 to +30
          slider.value = value;
          if (valueDisplay) {
            valueDisplay.textContent = value.toFixed(1) + " dB";
          }
          slider.dispatchEvent(new Event('input')); // Trigger input event to update filter
        });
      }
    });
  }
}

customElements.define('my-eq', Equalizer);