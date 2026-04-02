import "./libs/webaudiocontrols.js";
import { ConnectableComponent } from "./ConnectableComponent.js";

const sheet = new CSSStyleSheet();
sheet.replaceSync(/* css */`
    * { box-sizing: border-box; }

    #container {
        min-width: 420px;
        background: #11111c;
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-top-color: rgba(255, 255, 255, 0.12);
        color: #ede9e0;
        font-family: 'Barlow Condensed', sans-serif;
        padding: 14px;
        border-radius: 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
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

    #playerRow {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 12px;
        height: 220px;
    }

    #coverWrapper {
        width: 158px;
        height: 158px;
        border-radius: 50%;
        flex-shrink: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        background: conic-gradient(#1a1a2a 0%, #1a1a2a 0%);
        cursor: pointer;
        position: relative;
    }

    #coverImage {
        width: 148px;
        height: 148px;
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

    #playerContainer {
        background: rgba(0, 0, 0, 0.25);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        height: 100%;
        flex: 1;
    }

    #trackInfo {
        text-align: center;
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    #trackTitle {
        font-size: 1rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        display: block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    #trackArtist {
        font-family: 'Space Mono', monospace;
        font-size: 0.65rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: rgba(237, 233, 224, 0.38);
        display: block;
    }

    #navControls {
        display: flex;
        gap: 8px;
        align-items: center;
    }

    .nav-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        color: rgba(237, 233, 224, 0.6);
        cursor: pointer;
        padding: 4px 10px;
        font-family: 'Space Mono', monospace;
        font-size: 10px;
        letter-spacing: 0.1em;
        transition: background 0.15s, color 0.15s;
    }

    .nav-btn:hover {
        background: rgba(232, 160, 32, 0.15);
        border-color: rgba(232, 160, 32, 0.4);
        color: #e8a020;
    }

    .controls {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        gap: 15px;
        background: rgba(0, 0, 0, 0.25);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        padding: 14px 10px;
        height: 100%;
        flex-shrink: 0;
    }

    audio { display: none; }

    webaudio-knob { cursor: pointer; position: relative; }

    #knobVolume::after, #knobPan::after, #knobSpeed::after {
        position: absolute;
        bottom: -16px;
        left: 0;
        width: 100%;
        text-align: center;
        font-family: 'Space Mono', monospace;
        font-size: 8px;
        letter-spacing: 0.12em;
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
        padding-top: 8px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        max-height: 160px;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,0.1) transparent;
    }

    .playlist-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 6px 8px;
        border-radius: 7px;
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
        width: 32px;
        height: 32px;
        border-radius: 4px;
        object-fit: cover;
        flex-shrink: 0;
        opacity: 0.85;
    }

    .playlist-item.active .playlist-item-cover {
        opacity: 1;
    }

    .playlist-item-info {
        display: flex;
        flex-direction: column;
        gap: 1px;
        overflow: hidden;
    }

    .playlist-item-title {
        font-size: 0.85rem;
        font-weight: 600;
        letter-spacing: 0.03em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: rgba(237, 233, 224, 0.9);
    }

    .playlist-item.active .playlist-item-title {
        color: #e8a020;
    }

    .playlist-item-artist {
        font-family: 'Space Mono', monospace;
        font-size: 0.6rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: rgba(237, 233, 224, 0.35);
    }

    .playlist-item-index {
        font-family: 'Space Mono', monospace;
        font-size: 0.6rem;
        color: rgba(237, 233, 224, 0.2);
        flex-shrink: 0;
        margin-left: auto;
        min-width: 18px;
        text-align: right;
    }

    .playlist-item.active .playlist-item-index {
        color: #e8a020;
    }
`);

const html = /* html */`
<div id="container">
    <div id="playerRow">
        <div id="playerContainer">
            <div id="coverWrapper">
                <img id="coverImage" src="" alt="Track Cover">
            </div>
            <div id="trackInfo">
                <span id="trackTitle">Titre</span>
                <span id="trackArtist">Artiste</span>
            </div>
            <div id="navControls">
                <button class="nav-btn" id="btnPrev">&#9664;&#9664;</button>
                <webaudio-switch
                    src="./components/images/S_pinkponk-ON-OFF.png"
                    id="sw1" type="toggle" width="60" height="40">
                </webaudio-switch>
                <button class="nav-btn" id="btnNext">&#9654;&#9654;</button>
            </div>
            <audio id="myplayer" controls></audio>
        </div>
        <div class="controls">
            <webaudio-knob
                id="knobVolume" src="./components/images/707.png"
                width=34 height=128 sprites=98 min=0 max=1 step=0.01 value=0.5>
            </webaudio-knob>
            <webaudio-knob
                id="knobPan" src="./components/images/707.png"
                width=34 height=128 sprites=98 min=-1 max=1 step=0.01 value=0>
            </webaudio-knob>
            <webaudio-knob
                id="knobSpeed" src="./components/images/707.png"
                width=34 height=128 sprites=98 min=0.1 max=2 step=0.01 value=1>
            </webaudio-knob>
        </div>
    </div>
    <div id="playlist"></div>
</div>
`;

class MyAudioPlayer extends ConnectableComponent {
    #currentIndex = 0;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.tracks = [];
        this.src = this.getAttribute('src');
    }

    connectedCallback() {
        this.render();

        const audioElement = this.shadowRoot.querySelector('#myplayer');
        if (this.src) audioElement.src = this.src;
        audioElement.crossOrigin = "anonymous";

        this.defineListeners();
        this.loadTracks();
    }

    // --- Audio Graph Logic ---
    buildAudioGraph() {
        if (!this.audioCtx) {
            console.warn("AudioPlayer: buildAudioGraph called without audioCtx");
            return;
        }

        const audioElement = this.shadowRoot.querySelector('#myplayer');
        this.sourceNode = this.audioCtx.createMediaElementSource(audioElement);
        this.gain = this.audioCtx.createGain();
        this.panner = this.audioCtx.createStereoPanner();
        this.outputNode = this.audioCtx.createGain();

        this.sourceNode.connect(this.gain);
        this.gain.connect(this.panner);
        this.panner.connect(this.outputNode);
    }

    getInputNode() { return this.sourceNode; }
    getOutputNode() { return this.outputNode; }

    // --- Playlist ---
    async loadTracks() {
        try {
            const response = await fetch('./assets/tracks.json');
            this.tracks = await response.json();
            this.#buildPlaylist();
        } catch (error) {
            console.error("Error loading tracks:", error);
        }
    }

    #buildPlaylist() {
        const playlist = this.shadowRoot.querySelector('#playlist');
        const audioElement = this.shadowRoot.querySelector('#myplayer');
        const coverImage = this.shadowRoot.querySelector('#coverImage');

        if (!playlist) return;

        this.tracks.forEach((track, index) => {
            const item = document.createElement('div');
            item.className = 'playlist-item';
            item.dataset.index = index;

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

            const idx = document.createElement('span');
            idx.className = 'playlist-item-index';
            idx.textContent = String(index + 1).padStart(2, '0');

            info.append(title, artist);
            item.append(cover, info, idx);
            playlist.append(item);
        });

        // Event delegation on the playlist
        playlist.addEventListener('click', (event) => {
            const item = event.target.closest('.playlist-item');
            if (!item) return;
            const index = parseInt(item.dataset.index, 10);
            this.#selectTrack(index, audioElement, coverImage);
        });

        // Load first track
        if (this.tracks.length > 0) {
            this.#selectTrack(0, audioElement, coverImage);
        }
    }

    #selectTrack(index, audioElement, coverImage) {
        if (index < 0 || index >= this.tracks.length) return;
        this.#currentIndex = index;

        const track = this.tracks[index];
        this.changeTrack(audioElement, coverImage, track);

        // Update active state in playlist
        const playlist = this.shadowRoot.querySelector('#playlist');
        if (playlist) {
            playlist.querySelectorAll('.playlist-item').forEach((item, i) => {
                item.classList.toggle('active', i === index);
            });
            // Scroll active item into view
            const activeItem = playlist.querySelector('.playlist-item.active');
            activeItem?.scrollIntoView({ block: 'nearest' });
        }
    }

    changeTrack(audioElement, coverImage, track) {
        audioElement.src = track.audio;
        this.src = track.audio;

        if (coverImage && track.cover) coverImage.src = track.cover;

        const titleEl = this.shadowRoot.querySelector('#trackTitle');
        const artistEl = this.shadowRoot.querySelector('#trackArtist');
        if (titleEl) titleEl.textContent = track.title || "Titre inconnu";
        if (artistEl) artistEl.textContent = track.artist || "Artiste inconnu";

        const switchEl = this.shadowRoot.querySelector('#sw1');
        if (switchEl) {
            switchEl.removeAttribute('on');
            switchEl.value = 0;
        }

        if (coverImage) {
            coverImage.classList.remove('playing');
            coverImage.style.transform = 'rotate(0deg)';
        }

        const coverWrapper = this.shadowRoot.querySelector('#coverWrapper');
        if (coverWrapper) {
            coverWrapper.style.background = `conic-gradient(#1a1a2a 0%, #1a1a2a 0%)`;
        }

        audioElement.pause();
    }

    // --- Event Listeners ---
    defineListeners() {
        const audioElement = this.shadowRoot.querySelector('#myplayer');
        const coverImage = this.shadowRoot.querySelector('#coverImage');
        const coverWrapper = this.shadowRoot.querySelector('#coverWrapper');
        const switchEl = this.shadowRoot.querySelector('#sw1');

        // Play/Pause
        if (switchEl) {
            switchEl.addEventListener('click', async () => {
                if (audioElement.paused) {
                    if (this.audioCtx && this.audioCtx.state === 'suspended') {
                        await this.audioCtx.resume();
                    }
                    audioElement.play().catch(() => {});
                } else {
                    audioElement.pause();
                }
            });
        }

        audioElement.addEventListener('play', () => {
            if (switchEl) switchEl.setAttribute('on', '');
            if (coverImage) coverImage.classList.add('playing');
        });

        audioElement.addEventListener('pause', () => {
            if (switchEl) switchEl.removeAttribute('on');
            if (coverImage) coverImage.classList.remove('playing');
        });

        // Auto-next on track end
        audioElement.addEventListener('ended', () => {
            if (switchEl) switchEl.removeAttribute('on');
            if (coverImage) coverImage.classList.remove('playing');
            if (this.#currentIndex < this.tracks.length - 1) {
                this.#selectTrack(this.#currentIndex + 1, audioElement, coverImage);
                audioElement.play().catch(() => {});
            }
        });

        // Progress ring
        audioElement.addEventListener('timeupdate', () => {
            if (audioElement.duration && coverWrapper) {
                const progress = (audioElement.currentTime / audioElement.duration) * 100;
                coverWrapper.style.background = `conic-gradient(#e8a020 ${progress}%, #1a1a2a ${progress}%)`;
            }
        });

        // Prev / Next buttons
        this.shadowRoot.querySelector('#btnPrev')?.addEventListener('click', () => {
            this.#selectTrack(this.#currentIndex - 1, audioElement, coverImage);
        });

        this.shadowRoot.querySelector('#btnNext')?.addEventListener('click', () => {
            this.#selectTrack(this.#currentIndex + 1, audioElement, coverImage);
        });

        // Knobs
        const volumeKnob = this.shadowRoot.querySelector('#knobVolume');
        if (volumeKnob) {
            volumeKnob.addEventListener('input', (event) => {
                if (this.gain) this.gain.gain.value = event.target.value;
                else audioElement.volume = event.target.value;
            });
        }

        const panKnob = this.shadowRoot.querySelector('#knobPan');
        if (panKnob) {
            panKnob.addEventListener('input', (event) => {
                if (this.panner) this.panner.pan.value = event.target.value;
            });
        }

        const speedKnob = this.shadowRoot.querySelector('#knobSpeed');
        if (speedKnob) {
            speedKnob.addEventListener('input', (event) => {
                audioElement.playbackRate = event.target.value;
            });
        }

        // Seek on coverWrapper click
        if (coverWrapper) {
            coverWrapper.addEventListener('click', (event) => {
                if (!audioElement.duration) return;

                const rect = coverWrapper.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const x = event.clientX - centerX;
                const y = event.clientY - centerY;
                const angle = Math.atan2(y, x);
                let degrees = angle * (180 / Math.PI) + 90;
                if (degrees < 0) degrees += 360;
                audioElement.currentTime = (degrees / 360) * audioElement.duration;
            });
        }
    }

    render() {
        this.shadowRoot.adoptedStyleSheets = [sheet];
        this.shadowRoot.setHTMLUnsafe(html);
    }
}

customElements.define('my-audio-player', MyAudioPlayer);