import "./libs/webaudiocontrols.js";
import { ConnectableComponent } from "./ConnectableComponent.js";

// Résolution des chemins d'images relative au fichier composant via import.meta.url.
// Permet l'hébergement distant : l'URL est calculée depuis ce fichier JS,
// pas depuis index.html. Fonctionne en local, GitHub Pages ou CDN.
const BASE = new URL('.', import.meta.url).href;

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
        border-radius: 14px;
        color: var(--text, #ede9e0);
        width: 100%;
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
        color: var(--text-dim, rgba(237,233,224,0.4));
        background: rgba(0, 0, 0, 0.35);
        border: 1px solid var(--border, rgba(255,255,255,0.06));
        padding: 3px 6px;
        border-radius: 4px;
        margin-top: 4px;
        min-width: 40px;
        text-align: center;
        letter-spacing: 0.04em;
        transition: color 0.2s;
    }

    .knob-value.active {
        color: var(--accent, #e8a020);
        border-color: rgba(232, 160, 32, 0.3);
    }

    /* ── Préréglages ── */
    #presets {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
        padding-bottom: 6px;
        border-bottom: 1px solid var(--border, rgba(255,255,255,0.05));
        margin-bottom: 4px;
    }

    .preset-btn {
        background: var(--bg-input, rgba(255,255,255,0.04));
        border: 1px solid var(--border, rgba(255,255,255,0.1));
        border-radius: 5px;
        color: var(--text-dim, rgba(237,233,224,0.6));
        cursor: pointer;
        padding: 3px 8px;
        font-family: 'Space Mono', monospace;
        font-size: 8px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        transition: background 0.15s, color 0.15s;
    }

    .preset-btn:hover, .preset-btn.active {
        background: var(--btn-hover-bg, rgba(232,160,32,0.15));
        border-color: var(--btn-hover-border, rgba(232,160,32,0.4));
        color: var(--accent, #e8a020);
    }

    .input-range,
    div[class="input-range"] {
        display: none !important;
    }
`);

// BASE est calculé au niveau module — interpolation correcte même en usage distant.
const html = /* html */`
<div id="container">
    <div id="presets">
        <button class="preset-btn active" data-preset="0,0,0,0,0,0">Flat</button>
        <button class="preset-btn" data-preset="5,4,2,0,-1,-2">Bass</button>
        <button class="preset-btn" data-preset="-2,0,2,4,3,1">Treble</button>
        <button class="preset-btn" data-preset="4,3,0,-2,2,3">Rock</button>
        <button class="preset-btn" data-preset="3,2,0,1,3,4">Pop</button>
        <button class="preset-btn" data-preset="2,0,-1,0,2,4">Jazz</button>
        <button class="preset-btn" data-preset="0,0,0,0,-3,-5">Vocal</button>
    </div>
    <div class="eq-controls">
        <div class="control-row">
            <webaudio-knob id="knobEq0" src="${BASE}images/707.png"
                width=26 height=80 sprites=98 min=0 max=1 step=0.01 value=0.5>
            </webaudio-knob>
            <span class="knob-value" id="knobValue0">0 dB</span>
        </div>
        <div class="control-row">
            <webaudio-knob id="knobEq1" src="${BASE}images/707.png"
                width=26 height=80 sprites=98 min=0 max=1 step=0.01 value=0.5>
            </webaudio-knob>
            <span class="knob-value" id="knobValue1">0 dB</span>
        </div>
        <div class="control-row">
            <webaudio-knob id="knobEq2" src="${BASE}images/707.png"
                width=26 height=80 sprites=98 min=0 max=1 step=0.01 value=0.5>
            </webaudio-knob>
            <span class="knob-value" id="knobValue2">0 dB</span>
        </div>
        <div class="control-row">
            <webaudio-knob id="knobEq3" src="${BASE}images/707.png"
                width=26 height=80 sprites=98 min=0 max=1 step=0.01 value=0.5>
            </webaudio-knob>
            <span class="knob-value" id="knobValue3">0 dB</span>
        </div>
        <div class="control-row">
            <webaudio-knob id="knobEq4" src="${BASE}images/707.png"
                width=26 height=80 sprites=98 min=0 max=1 step=0.01 value=0.5>
            </webaudio-knob>
            <span class="knob-value" id="knobValue4">0 dB</span>
        </div>
        <div class="control-row">
            <webaudio-knob id="knobEq5" src="${BASE}images/707.png"
                width=26 height=80 sprites=98 min=0 max=1 step=0.01 value=0.5>
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

/**
 * Égaliseur paramétrique 6 bandes (BiquadFilter peaking).
 *
 * ## Attributs HTML
 * - `preset` : gains dB séparés par virgule, ex. "-6,0,3,3,0,-3"
 *              (6 valeurs dans l'ordre : 60Hz, 170Hz, 350Hz, 1kHz, 3.5kHz, 10kHz)
 *
 * ## Autonomie
 * Ce composant fonctionne seul : il récupère le singleton AudioContext,
 * construit la chaîne de filtres et connecte la sortie à ctx.destination.
 * Il peut être inséré dans une chaîne via connectComponent().
 *
 * ## Usage standalone
 * <my-eq></my-eq>
 * <my-eq preset="-6,0,3,3,0,-3"></my-eq>
 */
class Equalizer extends ConnectableComponent {
    #filters = [];
    #abortController = null;

    static get observedAttributes() { return ['preset']; }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.shadowRoot.adoptedStyleSheets = [sheet];
        this.shadowRoot.setHTMLUnsafe(html);

        // Auto-init : graphe audio construit depuis le singleton AudioContext
        this.initAudioGraph();

        this.#defineListeners();

        // Appliquer le preset si défini avant l'insertion dans le DOM
        const preset = this.getAttribute('preset');
        if (preset) this.#applyPreset(preset);
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal === newVal) return;
        if (name === 'preset') this.#applyPreset(newVal);
    }

    buildAudioGraph() {
        [60, 170, 350, 1000, 3500, 10000].forEach((freq) => {
            const filter = this.audioCtx.createBiquadFilter();
            filter.frequency.value = freq;
            filter.type = 'peaking';
            filter.gain.value = 0;
            this.#filters.push(filter);
        });

        // Chaîne : Filter0 → Filter1 → … → Filter5
        for (let i = 0; i < this.#filters.length - 1; i++) {
            this.#filters[i].connect(this.#filters[i + 1]);
        }

        // Connexion par défaut à ctx.destination
        this.#filters.at(-1).connect(this.audioCtx.destination);
        this._markConnectedToDestination();
    }

    getInputNode()  { return this.#filters[0]; }
    getOutputNode() { return this.#filters.at(-1); }

    disconnectedCallback() {
        this.#abortController?.abort();
        this.#abortController = null;
        try { this.#filters.forEach(f => f.disconnect()); } catch (_) {}
        this.#filters = [];
        super.disconnectedCallback();
    }

    /**
     * Applique un preset de gains dB.
     * @param {string} value - Valeurs séparées par virgule, ex. "-6,0,3,3,0,-3"
     */
    #applyPreset(value) {
        if (!value || !this.#filters.length) return;
        value.split(',').map(Number).forEach((db, i) => {
            if (this.#filters[i]) {
                this.#filters[i].gain.value = db;
                // Mettre à jour l'affichage
                const knob = this.shadowRoot?.querySelector(`#knobEq${i}`);
                const display = this.shadowRoot?.querySelector(`#knobValue${i}`);
                if (knob) knob.value = (db + 30) / 60; // rescale dB → 0-1
                if (display) {
                    display.textContent = db.toFixed(1) + ' dB';
                    display.classList.toggle('active', db !== 0);
                }
            }
        });
    }

    #defineListeners() {
        this.#abortController = new AbortController();
        const { signal } = this.#abortController;

        // Knobs → filtres directement (sans passer par les input[range] cachés)
        for (let i = 0; i < 6; i++) {
            const knob = this.shadowRoot.querySelector(`#knobEq${i}`);
            const display = this.shadowRoot.querySelector(`#knobValue${i}`);
            if (!knob) continue;

            knob.addEventListener('input', (e) => {
                const db = parseFloat(e.target.value) * 60 - 30; // 0-1 → -30..+30 dB
                if (this.#filters[i]) this.#filters[i].gain.value = db;
                if (display) {
                    display.textContent = db.toFixed(1) + ' dB';
                    display.classList.toggle('active', db !== 0);
                }
            }, { signal });
        }

        // Presets
        this.shadowRoot.querySelector('#presets')?.addEventListener('click', (e) => {
            const btn = e.target.closest('.preset-btn');
            if (!btn) return;
            this.#applyPreset(btn.dataset.preset);
            this.shadowRoot.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }, { signal });
    }
}

customElements.define('my-eq', Equalizer);
