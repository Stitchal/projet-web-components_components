import "./libs/webaudiocontrols.js";
import { ConnectableComponent } from "./ConnectableComponent.js";
import { resumeAudioContext } from "./modules/audioContext.js";

// Résolution des chemins d'images relative au fichier composant via import.meta.url.
// Garantit le fonctionnement en local, GitHub Pages ou CDN sans modification.
const BASE = new URL('.', import.meta.url).href;

const sheet = new CSSStyleSheet();
sheet.replaceSync(/* css */`
    * { box-sizing: border-box; }

    #container {
        width: 340px;
        background: #11111c;
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-top-color: rgba(255, 255, 255, 0.12);
        color: #ede9e0;
        font-family: 'Barlow Condensed', sans-serif;
        padding: 10px;
        border-radius: 14px;
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

    /* ── Ligne principale : cover + infos/contrôles + knobs ── */

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
        background: conic-gradient(#1a1a2a 0%, #1a1a2a 0%);
        cursor: pointer;
    }

    #coverImage {
        width: 78px;
        height: 78px;
        border-radius: 50%;
        object-fit: cover;
        border: 3px solid #0d0d17;
        position: relative;
        z-index: 1;
    }

    #coverImage.playing {
        animation: rotate 12s linear infinite;
    }

    @keyframes rotate {
        to { transform: rotate(360deg); }
    }

    /* centre : infos + nav */
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
        color: rgba(237, 233, 224, 0.38);
    }

    #navControls {
        display: flex;
        gap: 6px;
        align-items: center;
    }

    .nav-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 5px;
        color: rgba(237, 233, 224, 0.6);
        cursor: pointer;
        padding: 3px 8px;
        font-family: 'Space Mono', monospace;
        font-size: 9px;
        transition: background 0.15s, color 0.15s;
    }

    .nav-btn:hover {
        background: rgba(232, 160, 32, 0.15);
        border-color: rgba(232, 160, 32, 0.4);
        color: #e8a020;
    }

    /* knobs à droite */
    .controls {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 8px;
        flex-shrink: 0;
    }

    audio { display: none; }

    webaudio-knob { cursor: pointer; position: relative; }

    #knobVolume::after, #knobPan::after, #knobSpeed::after {
        position: absolute;
        bottom: -13px;
        left: 0;
        width: 100%;
        text-align: center;
        font-family: 'Space Mono', monospace;
        font-size: 7px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: rgba(237, 233, 224, 0.3);
        pointer-events: none;
    }

    #knobVolume::after { content: "VOL"; }
    #knobPan::after    { content: "PAN"; }
    #knobSpeed::after  { content: "SPD"; }

    /* ── Playlist ─────────────────────────────────────────── */

    #playlist {
        border-top: 1px solid rgba(255, 255, 255, 0.06);
        padding-top: 6px;
        display: flex;
        flex-direction: column;
        gap: 1px;
        max-height: 120px;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,0.1) transparent;
    }

    .playlist-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 6px;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.15s;
        border: 1px solid transparent;
    }

    .playlist-item:hover {
        background: rgba(255, 255, 255, 0.05);
    }

    .playlist-item.active {
        background: rgba(232, 160, 32, 0.08);
        border-color: rgba(232, 160, 32, 0.2);
    }

    .playlist-item-cover {
        width: 26px;
        height: 26px;
        border-radius: 3px;
        object-fit: cover;
        flex-shrink: 0;
        opacity: 0.8;
    }

    .playlist-item.active .playlist-item-cover { opacity: 1; }

    .playlist-item-info {
        display: flex;
        flex-direction: column;
        gap: 1px;
        overflow: hidden;
        flex: 1;
    }

    .playlist-item-title {
        font-size: 0.8rem;
        font-weight: 600;
        letter-spacing: 0.02em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: rgba(237, 233, 224, 0.9);
    }

    .playlist-item.active .playlist-item-title { color: #e8a020; }

    .playlist-item-artist {
        font-family: 'Space Mono', monospace;
        font-size: 0.56rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: rgba(237, 233, 224, 0.32);
    }

    .playlist-item-index {
        font-family: 'Space Mono', monospace;
        font-size: 0.56rem;
        color: rgba(237, 233, 224, 0.2);
        flex-shrink: 0;
        min-width: 16px;
        text-align: right;
    }

    .playlist-item.active .playlist-item-index { color: #e8a020; }

    .playlist-item-duration {
        font-family: 'Space Mono', monospace;
        font-size: 0.56rem;
        color: rgba(237, 233, 224, 0.35);
        flex-shrink: 0;
        min-width: 32px;
        text-align: right;
        letter-spacing: 0.04em;
    }

    .playlist-item.active .playlist-item-duration { color: rgba(232, 160, 32, 0.6); }

    .playlist-item[draggable="true"] { cursor: grab; }
    .playlist-item.active { cursor: pointer; }

    .playlist-item.dragging { opacity: 0.4; }

    .playlist-item.drag-over {
        background: rgba(232, 160, 32, 0.12);
        border-color: rgba(232, 160, 32, 0.35);
    }

    #playlist-footer {
        font-family: 'Space Mono', monospace;
        font-size: 0.56rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: rgba(237, 233, 224, 0.28);
        text-align: right;
        padding: 4px 6px 0;
        border-top: 1px solid rgba(255,255,255,0.04);
    }

    #playlist-footer:empty { display: none; }
`);

function formatDuration(seconds) {
    if (!isFinite(seconds)) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

// BASE est calculé au niveau module — toutes les URLs d'images sont absolues.
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
                <button class="nav-btn" id="btnNext">&#9654;&#9654;</button>
            </div>
        </div>
        <div class="controls">
            <webaudio-knob
                id="knobVolume" src="${BASE}images/707.png"
                width=26 height=72 sprites=98 min=0 max=1 step=0.01 value=0.5>
            </webaudio-knob>
            <webaudio-knob
                id="knobPan" src="${BASE}images/707.png"
                width=26 height=72 sprites=98 min=-1 max=1 step=0.01 value=0>
            </webaudio-knob>
            <webaudio-knob
                id="knobSpeed" src="${BASE}images/707.png"
                width=26 height=72 sprites=98 min=0.1 max=2 step=0.01 value=1>
            </webaudio-knob>
        </div>
    </div>
    <div id="playlist"></div>
    <div id="playlist-footer"></div>
    <audio id="myplayer"></audio>
</div>
`;

/**
 * Lecteur audio avec playlist, contrôles de volume/pan/vitesse.
 *
 * ## Attributs HTML
 * - `src`      : URL du fichier JSON de playlist
 *                (défaut : assets/tracks.json relatif au composant)
 * - `autoplay` : présence de l'attribut → lecture automatique au chargement
 *
 * ## Autonomie
 * Ce composant fonctionne seul : il récupère le singleton AudioContext,
 * construit son graphe (MediaElementSource → Gain → StereoPanner → GainOutput)
 * et connecte la sortie à ctx.destination.
 * Il peut être chaîné via connectComponent() depuis l'extérieur.
 *
 * ## Événements émis
 * - `track-changed` : { detail: { track, index } } — à chaque changement de piste
 *
 * ## Usage standalone
 * <my-audio-player></my-audio-player>
 * <my-audio-player src="https://host.com/tracks.json"></my-audio-player>
 */
class MyAudioPlayer extends ConnectableComponent {
    #currentIndex = 0;
    #tracks = [];
    #abortController = null;
    #dragSrcIndex = null;
    #loadGeneration = 0;

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

        // Auto-init : graphe audio construit depuis le singleton AudioContext
        this.initAudioGraph();

        this.#defineListeners();
        this.#loadTracks(this.getAttribute('src'));
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal === newVal) return;
        // Ignorer les changements avant connectedCallback (shadowRoot pas encore peuplé)
        if (!this.shadowRoot.querySelector('#playlist')) return;
        if (name === 'src') this.#loadTracks(newVal);
    }

    // --- Graphe audio ---

    buildAudioGraph() {
        const audioElement = this.shadowRoot.querySelector('#myplayer');
        this.sourceNode = this.audioCtx.createMediaElementSource(audioElement);
        this.gain       = this.audioCtx.createGain();
        this.panner     = this.audioCtx.createStereoPanner();
        this.outputNode = this.audioCtx.createGain();

        this.sourceNode.connect(this.gain);
        this.gain.connect(this.panner);
        this.panner.connect(this.outputNode);

        // Connexion par défaut à ctx.destination
        this.outputNode.connect(this.audioCtx.destination);
        this._markConnectedToDestination();
    }

    getInputNode()  { return this.sourceNode; }
    getOutputNode() { return this.outputNode; }

    disconnectedCallback() {
        this.#abortController?.abort();
        this.#abortController = null;
        this.shadowRoot?.querySelector('#myplayer')?.pause();
        try {
            this.sourceNode?.disconnect();
            this.gain?.disconnect();
            this.panner?.disconnect();
            this.outputNode?.disconnect();
        } catch (_) {}
        this.sourceNode = null;
        this.gain       = null;
        this.panner     = null;
        this.outputNode = null;
        super.disconnectedCallback();
    }

    // --- Playlist ---

    /**
     * Charge le JSON de playlist depuis srcAttr (attribut `src`) ou depuis
     * le chemin par défaut relatif à ce fichier composant.
     * Les chemins relatifs audio/cover du JSON sont résolus contre l'URL du JSON,
     * garantissant un fonctionnement correct en hébergement distant.
     */
    async #loadTracks(srcAttr) {
        const tracksUrl = srcAttr
            ? new URL(srcAttr, document.baseURI).href
            : new URL('../assets/tracks.json', import.meta.url).href;

        try {
            const response = await fetch(tracksUrl);
            const rawTracks = await response.json();
            // Les chemins dans tracks.json sont relatifs à la racine du projet
            // (ex. "./assets/tracks/..."), donc on les résout contre document.baseURI.
            this.#tracks = rawTracks.map(t => ({
                ...t,
                audio: new URL(t.audio, document.baseURI).href,
                cover: t.cover ? new URL(t.cover, document.baseURI).href : null,
            }));
            this.#buildPlaylist();
        } catch (err) {
            console.error('AudioPlayer: impossible de charger les pistes depuis', tracksUrl, err);
        }
    }

    #buildPlaylist() {
        const playlist   = this.shadowRoot.querySelector('#playlist');
        const audioEl    = this.shadowRoot.querySelector('#myplayer');
        const coverImage = this.shadowRoot.querySelector('#coverImage');
        if (!playlist) return;

        playlist.replaceChildren();
        const gen = ++this.#loadGeneration;

        this.#tracks.forEach((track, index) => {
            playlist.append(this.#createPlaylistItem(track, index));
        });

        // Délégation d'événements sur la playlist
        playlist.addEventListener('click', (event) => {
            const item = event.target.closest('.playlist-item');
            if (!item) return;
            this.#selectTrack(parseInt(item.dataset.index, 10), audioEl, coverImage);
        });

        if (this.#tracks.length > 0) {
            this.#selectTrack(0, audioEl, coverImage);
        }

        this.#loadDurations(gen);
    }

    #createPlaylistItem(track, index) {
        const item = document.createElement('div');
        item.className = 'playlist-item';
        item.dataset.index = index;
        item.draggable = true;

        const cover = document.createElement('img');
        cover.className = 'playlist-item-cover';
        cover.src = track.cover || '';
        cover.alt = track.title;

        const info = document.createElement('div');
        info.className = 'playlist-item-info';

        const title = document.createElement('span');
        title.className = 'playlist-item-title';
        title.textContent = track.title;

        const artist = document.createElement('span');
        artist.className = 'playlist-item-artist';
        artist.textContent = track.artist;

        const duration = document.createElement('span');
        duration.className = 'playlist-item-duration';
        duration.textContent = formatDuration(track.duration);

        const idx = document.createElement('span');
        idx.className = 'playlist-item-index';
        idx.textContent = String(index + 1).padStart(2, '0');

        info.append(title, artist);
        item.append(cover, info, duration, idx);
        return item;
    }

    async #loadDurations(gen) {
        const promises = this.#tracks.map(track => new Promise(resolve => {
            const a = new Audio();
            a.addEventListener('loadedmetadata', () => resolve(a.duration), { once: true });
            a.addEventListener('error', () => resolve(NaN), { once: true });
            a.src = track.audio;
        }));

        const durations = await Promise.all(promises);

        // Abandon si une nouvelle génération a été lancée (src changé entre-temps)
        if (gen !== this.#loadGeneration) return;

        durations.forEach((d, i) => { this.#tracks[i].duration = d; });
        this.#renderDurations();
        this.#renderTotalDuration();
    }

    #renderDurations() {
        this.shadowRoot.querySelector('#playlist')
            ?.querySelectorAll('.playlist-item-duration')
            .forEach((span, i) => { span.textContent = formatDuration(this.#tracks[i]?.duration); });
    }

    #renderTotalDuration() {
        const total = this.#tracks.reduce((s, t) => s + (isFinite(t.duration) ? t.duration : 0), 0);
        const footer = this.shadowRoot.querySelector('#playlist-footer');
        if (footer) footer.textContent = 'TOTAL — ' + formatDuration(total);
    }

    #reorderTracks(from, to) {
        if (from === to || from == null || to == null) return;
        const [moved] = this.#tracks.splice(from, 1);
        this.#tracks.splice(to, 0, moved);
        const cur = this.#currentIndex;
        if      (cur === from)              this.#currentIndex = to;
        else if (from < cur && to >= cur)   this.#currentIndex--;
        else if (from > cur && to <= cur)   this.#currentIndex++;
        this.#rebuildPlaylistDOM();
    }

    #rebuildPlaylistDOM() {
        const playlist = this.shadowRoot.querySelector('#playlist');
        if (!playlist) return;
        playlist.replaceChildren();
        this.#tracks.forEach((track, index) => {
            const item = this.#createPlaylistItem(track, index);
            if (index === this.#currentIndex) item.classList.add('active');
            playlist.append(item);
        });
        playlist.querySelector('.playlist-item.active')?.scrollIntoView({ block: 'nearest' });
        this.#renderTotalDuration();
    }

    #selectTrack(index, audioEl, coverImage) {
        if (index < 0 || index >= this.#tracks.length) return;
        this.#currentIndex = index;

        const track = this.#tracks[index];

        audioEl.src = track.audio;
        if (coverImage && track.cover) coverImage.src = track.cover;

        const titleEl  = this.shadowRoot.querySelector('#trackTitle');
        const artistEl = this.shadowRoot.querySelector('#trackArtist');
        if (titleEl)  titleEl.textContent  = track.title  || 'Titre inconnu';
        if (artistEl) artistEl.textContent = track.artist || 'Artiste inconnu';

        const switchEl = this.shadowRoot.querySelector('#sw1');
        if (switchEl) { switchEl.removeAttribute('on'); switchEl.value = 0; }
        if (coverImage) { coverImage.classList.remove('playing'); coverImage.style.transform = 'rotate(0deg)'; }

        const coverWrapper = this.shadowRoot.querySelector('#coverWrapper');
        if (coverWrapper) coverWrapper.style.background = 'conic-gradient(#1a1a2a 0%, #1a1a2a 0%)';

        audioEl.pause();

        // Informer l'extérieur du changement de piste
        this.dispatchEvent(new CustomEvent('track-changed', {
            detail: { track, index },
            bubbles: true,
            composed: true,
        }));

        // Mise à jour de l'état actif dans la playlist
        const playlist = this.shadowRoot.querySelector('#playlist');
        if (playlist) {
            playlist.querySelectorAll('.playlist-item').forEach((item, i) => {
                item.classList.toggle('active', i === index);
            });
            playlist.querySelector('.playlist-item.active')?.scrollIntoView({ block: 'nearest' });
        }
    }

    // --- Listeners ---

    #defineListeners() {
        this.#abortController = new AbortController();
        const { signal } = this.#abortController;

        const audioEl     = this.shadowRoot.querySelector('#myplayer');
        const coverImage  = this.shadowRoot.querySelector('#coverImage');
        const coverWrapper = this.shadowRoot.querySelector('#coverWrapper');
        const switchEl    = this.shadowRoot.querySelector('#sw1');

        // Play/Pause — webaudio-switch propage 'click' sur son canvas interne
        switchEl?.addEventListener('click', async () => {
            if (audioEl.paused) {
                await resumeAudioContext();
                audioEl.play().catch(() => {});
            } else {
                audioEl.pause();
            }
        }, { signal });

        audioEl.addEventListener('play', () => {
            switchEl?.setAttribute('on', '');
            coverImage?.classList.add('playing');
        }, { signal });

        audioEl.addEventListener('pause', () => {
            switchEl?.removeAttribute('on');
            coverImage?.classList.remove('playing');
        }, { signal });

        // Avance automatique à la fin de la piste
        audioEl.addEventListener('ended', () => {
            switchEl?.removeAttribute('on');
            coverImage?.classList.remove('playing');
            if (this.#currentIndex < this.#tracks.length - 1) {
                this.#selectTrack(this.#currentIndex + 1, audioEl, coverImage);
                audioEl.play().catch(() => {});
            }
        }, { signal });

        // Anneau de progression sur la cover
        audioEl.addEventListener('timeupdate', () => {
            if (audioEl.duration && coverWrapper) {
                const progress = (audioEl.currentTime / audioEl.duration) * 100;
                coverWrapper.style.background = `conic-gradient(#e8a020 ${progress}%, #1a1a2a ${progress}%)`;
            }
        }, { signal });

        // Boutons Précédent / Suivant
        this.shadowRoot.querySelector('#btnPrev')?.addEventListener('click', () => {
            this.#selectTrack(this.#currentIndex - 1, audioEl, coverImage);
        }, { signal });

        this.shadowRoot.querySelector('#btnNext')?.addEventListener('click', () => {
            this.#selectTrack(this.#currentIndex + 1, audioEl, coverImage);
        }, { signal });

        // Knob volume
        this.shadowRoot.querySelector('#knobVolume')?.addEventListener('input', (e) => {
            if (this.gain) this.gain.gain.value = e.target.value;
            else audioEl.volume = e.target.value;
        }, { signal });

        // Knob pan
        this.shadowRoot.querySelector('#knobPan')?.addEventListener('input', (e) => {
            if (this.panner) this.panner.pan.value = e.target.value;
        }, { signal });

        // Knob vitesse
        this.shadowRoot.querySelector('#knobSpeed')?.addEventListener('input', (e) => {
            audioEl.playbackRate = e.target.value;
        }, { signal });

        // Seek par clic sur la cover (angle polaire → position)
        coverWrapper?.addEventListener('click', (event) => {
            if (!audioEl.duration) return;
            const rect = coverWrapper.getBoundingClientRect();
            const x = event.clientX - (rect.left + rect.width  / 2);
            const y = event.clientY - (rect.top  + rect.height / 2);
            let degrees = Math.atan2(y, x) * (180 / Math.PI) + 90;
            if (degrees < 0) degrees += 360;
            audioEl.currentTime = (degrees / 360) * audioEl.duration;
        }, { signal });

        // Drag & drop — réorganisation de la playlist
        const playlistEl = this.shadowRoot.querySelector('#playlist');

        playlistEl?.addEventListener('dragstart', (e) => {
            const item = e.target.closest('.playlist-item');
            if (!item) return;
            this.#dragSrcIndex = parseInt(item.dataset.index, 10);
            e.dataTransfer.effectAllowed = 'move';
            item.classList.add('dragging');
        }, { signal });

        playlistEl?.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const target = e.target.closest('.playlist-item');
            if (!target || target.classList.contains('dragging')) return;
            playlistEl.querySelectorAll('.playlist-item.drag-over')
                .forEach(el => el.classList.remove('drag-over'));
            target.classList.add('drag-over');
        }, { signal });

        playlistEl?.addEventListener('dragleave', (e) => {
            e.target.closest('.playlist-item')?.classList.remove('drag-over');
        }, { signal });

        playlistEl?.addEventListener('drop', (e) => {
            e.preventDefault();
            const target = e.target.closest('.playlist-item');
            if (!target) return;
            const destIndex = parseInt(target.dataset.index, 10);
            this.#reorderTracks(this.#dragSrcIndex, destIndex);
        }, { signal });

        playlistEl?.addEventListener('dragend', () => {
            playlistEl.querySelectorAll('.dragging, .drag-over')
                .forEach(el => el.classList.remove('dragging', 'drag-over'));
            this.#dragSrcIndex = null;
        }, { signal });
    }
}

customElements.define('my-audio-player', MyAudioPlayer);
