import "./libs/webaudiocontrols.js";
import { ConnectableComponent } from "./ConnectableComponent.js";

const sheet = new CSSStyleSheet();
sheet.replaceSync(/* css */`
    * { box-sizing: border-box; }

    #container {
        font-family: 'Barlow Condensed', sans-serif;
        background: #11111c;
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-top-color: rgba(255, 255, 255, 0.12);
        padding: 10px;
        border-radius: 14px;
        color: #ede9e0;
        width: 300px;
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

    .eq-controls {
        background: rgba(0, 0, 0, 0.25);
        border: 1px solid rgba(255, 255, 255, 0.05);
        padding: 14px 6px 10px;
        border-radius: 10px;
        display: flex;
        flex-direction: row;
        gap: 2px;
        justify-content: center;
        align-items: center;
    }

    .control-row {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 44px;
        position: relative;
    }

    .control-row::before {
        content: '';
        font-family: 'Space Mono', monospace;
        font-size: 8px;
        font-weight: 400;
        letter-spacing: 0.06em;
        color: rgba(237, 233, 224, 0.3);
        margin-bottom: 6px;
        text-transform: uppercase;
    }

    .control-row:nth-child(1)::before { content: "60Hz"; }
    .control-row:nth-child(2)::before { content: "170Hz"; }
    .control-row:nth-child(3)::before { content: "350Hz"; }
    .control-row:nth-child(4)::before { content: "1kHz"; }
    .control-row:nth-child(5)::before { content: "3.5kHz"; }
    .control-row:nth-child(6)::before { content: "10kHz"; }

    .control-row webaudio-knob {
        margin: 4px 0;
        cursor: pointer;
    }

    .knob-value {
        font-family: 'Space Mono', monospace;
        font-size: 9px;
        color: rgba(237, 233, 224, 0.4);
        background: rgba(0, 0, 0, 0.35);
        border: 1px solid rgba(255, 255, 255, 0.06);
        padding: 3px 6px;
        border-radius: 4px;
        margin-top: 4px;
        min-width: 40px;
        text-align: center;
        letter-spacing: 0.04em;
        transition: color 0.2s;
    }

    .knob-value.active {
        color: #e8a020;
        border-color: rgba(232, 160, 32, 0.3);
    }

    .input-range,
    div[class="input-range"] {
        display: none !important;
    }
`);

const html = `
<div id="container">
    <div class="eq-controls">
        <div class="control-row">
            <webaudio-knob
            id="knobEq0"
            src="./components/images/707.png"
            width=26
            height=80
            sprites=98
            min=0 max=1 step=0.01 value=0.5 >
        </webaudio-knob>
        <span class="knob-value" id="knobValue0">0 dB</span>
        </div>
        <div class="control-row">
            <webaudio-knob
            id="knobEq1"
            src="./components/images/707.png"
            width=26
            height=80
            sprites=98
            min=0 max=1 step=0.01 value=0.5 >
        </webaudio-knob>
        <span class="knob-value" id="knobValue1">0 dB</span>
        </div>
        <div class="control-row">
            <webaudio-knob
            id="knobEq2"
            src="./components/images/707.png"
            width=26
            height=80
            sprites=98
            min=0 max=1 step=0.01 value=0.5 >
        </webaudio-knob>
        <span class="knob-value" id="knobValue2">0 dB</span>
        </div>
        <div class="control-row">
            <webaudio-knob
            id="knobEq3"
            src="./components/images/707.png"
            width=26
            height=80
            sprites=98
            min=0 max=1 step=0.01 value=0.5 >
        </webaudio-knob>
        <span class="knob-value" id="knobValue3">0 dB</span>
        </div>
        <div class="control-row">
            <webaudio-knob
            id="knobEq4"
            src="./components/images/707.png"
            width=26
            height=80
            sprites=98
            min=0 max=1 step=0.01 value=0.5 >
        </webaudio-knob>
        <span class="knob-value" id="knobValue4">0 dB</span>
      </div>
        <div class="control-row">
            <webaudio-knob
            id="knobEq5"
            src="./components/images/707.png"
            width=26
            height=80
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
    this.shadowRoot.adoptedStyleSheets = [sheet];
    this.shadowRoot.setHTMLUnsafe(html);

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
            valueDisplay.classList.toggle('active', value !== 0);
          }
          slider.dispatchEvent(new Event('input')); // Trigger input event to update filter
        });
      }
    });
  }
}

customElements.define('my-eq', Equalizer);