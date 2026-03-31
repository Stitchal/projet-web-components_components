import "./libs/webaudiocontrols.js";
import { ConnectableComponent } from "./ConnectableComponent.js";

class MyAudioPlayer extends ConnectableComponent {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        // Initialize tracks array
        this.tracks = [];
        
        // Get initial src if provided
        this.src = this.getAttribute('src');
    }

    connectedCallback() {
        this.render();
        
        // Initialize audio element
        const audioElement = this.shadowRoot.querySelector('#myplayer');
        if(this.src) {
             audioElement.src = this.src;
        }
        audioElement.crossOrigin = "anonymous";

        // Initialize listeners and load tracks
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

        // Connect graph: source -> gain -> panner -> destination
        this.sourceNode.connect(this.gain);
        this.gain.connect(this.panner);
        this.panner.connect(this.outputNode);

    }

    getInputNode() { return this.sourceNode; }
    getOutputNode() { return this.outputNode; }

    // --- Playlist & Visualization Logic ---
    async loadTracks() {
        try {
            const response = await fetch('./assets/tracks.json');
            this.tracks = await response.json();
            this.updateSelect();
        } catch (error) {
            console.error("Error loading tracks:", error);
        }
    }

    updateSelect() {
        const select = this.shadowRoot.querySelector('#trackSelect');
        const audioElement = this.shadowRoot.querySelector('#myplayer');
        const coverImage = this.shadowRoot.querySelector('#coverImage');

        if (!select) return;

        // Populate dropdown
        this.tracks.forEach((track, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = track.title;
            select.appendChild(option);
        });

        // Handle Selection
        select.addEventListener('change', (event) => {
            const trackIndex = event.target.value;
            const selectedTrack = this.tracks[trackIndex];
            
            if (selectedTrack) {
                this.changeTrack(audioElement, coverImage, selectedTrack);
            }
        });

        // Load first track by default if available
        if (this.tracks.length > 0) {
            select.value = 0;
            this.changeTrack(audioElement, coverImage, this.tracks[0]);
        }
    }

    changeTrack(audioElement, coverImage, track) {
        audioElement.src = track.audio;
        this.src = track.audio; // Sync internal property
        
        // Update Cover Image
        if (coverImage && track.cover) {
            coverImage.src = track.cover;
        }

        // Update Info Text (Title & Artist)
        const titleEl = this.shadowRoot.querySelector('#trackTitle');
        const artistEl = this.shadowRoot.querySelector('#trackArtist');
        if (titleEl) titleEl.textContent = track.title || "Titre inconnu";
        if (artistEl) artistEl.textContent = track.artist || "Artiste inconnu";

        // Reset Play Switch and UI State
        const switchEl = this.shadowRoot.querySelector('#sw1');
        if (switchEl) {
            switchEl.removeAttribute('on');
            switchEl.value = 0; 
        }
        
        // Reset Visuals (Rotation and Progress Bar)
        if (coverImage) {
            coverImage.classList.remove('playing');
            coverImage.style.transform = 'rotate(0deg)';
        }
        
        // Reset Progress Ring
        const coverWrapper = this.shadowRoot.querySelector('#coverWrapper');
        if(coverWrapper) {
            coverWrapper.style.background = `conic-gradient(#ccc 0%, #ccc 0%)`; 
        }

        audioElement.pause();
    }

    // --- Event Listeners ---
    defineListeners() {
        const audioElement = this.shadowRoot.querySelector('#myplayer');
        const coverImage = this.shadowRoot.querySelector('#coverImage');
        const coverWrapper = this.shadowRoot.querySelector('#coverWrapper'); // Pour la barre de progression
        const switchEl = this.shadowRoot.querySelector('#sw1');

        // 1. Play/Pause Logic (Switch)
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

        // 2. Audio Event Listeners (Sync UI)
        audioElement.addEventListener('play', () => {
            if(switchEl) switchEl.setAttribute('on', '');
            if(coverImage) coverImage.classList.add('playing');
        });

        audioElement.addEventListener('pause', () => {
            if(switchEl) switchEl.removeAttribute('on');
            if(coverImage) coverImage.classList.remove('playing');
        });

        audioElement.addEventListener('ended', () => {
            if(switchEl) switchEl.removeAttribute('on');
            if(coverImage) coverImage.classList.remove('playing');
        });

        // --- NOUVEAU : Mise à jour de la barre de progression circulaire ---
        audioElement.addEventListener('timeupdate', () => {
            if (audioElement.duration && coverWrapper) {
                const progress = (audioElement.currentTime / audioElement.duration) * 100;
                // Couleur vive pour la progression (#ff5500), couleur sombre pour le reste (#333)
                coverWrapper.style.background = `conic-gradient(#ff5500 ${progress}%, #333 ${progress}%)`;
            }
        });

        // 3. Audio Controls (Knobs)
        const volumeKnob = this.shadowRoot.querySelector('#knobVolume');
        if(volumeKnob) {
            volumeKnob.addEventListener('input', (event) => {
                if(this.gain) this.gain.gain.value = event.target.value;
                else audioElement.volume = event.target.value;
            });
        }

        const panKnob = this.shadowRoot.querySelector('#knobPan');
        if(panKnob) {
            panKnob.addEventListener('input', (event) => {
                if(this.panner) this.panner.pan.value = event.target.value;
            });
        }

        const speedKnob = this.shadowRoot.querySelector('#knobSpeed');
        if(speedKnob) {
            speedKnob.addEventListener('input', (event) => {
                audioElement.playbackRate = event.target.value;
            });
        }
        
        // --- NOUVEAU : Seek functionality on coverWrapper click ---
if (coverWrapper) {
    coverWrapper.addEventListener('click', (event) => {
        if (!audioElement.duration) return;

        // Get the bounding box of the wrapper to find the center
        const rect = coverWrapper.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Calculate the coordinates of the click relative to the center
        const x = event.clientX - centerX;
        const y = event.clientY - centerY;

        // Calculate the angle in radians (Math.atan2 returns -PI to PI)
        const angle = Math.atan2(y, x);

        // Convert to degrees and shift so that 0 degrees is at the top (12 o'clock)
        // By default, atan2(0,1) is 0 radians (3 o'clock)
        let degrees = angle * (180 / Math.PI) + 90;

        // Normalize degrees to be between 0 and 360
        if (degrees < 0) degrees += 360;

        // Calculate the percentage of the circle (0 to 1)
        const percent = degrees / 360;

        // Set the new current time of the audio
        audioElement.currentTime = percent * audioElement.duration;
    });
}
    }

    render() {
        this.shadowRoot.setHTMLUnsafe(`
        <style>
            * {
                box-sizing: border-box;
            }
            #container {
                height: 300px; /* Augmenté légèrement pour accommoder le texte */
                min-width: 400px;
                background-color: #3D68CC;
                color: white;
                font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                padding: 10px;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(61, 104, 204, 0.4);
                display: flex;
                flex-direction: row;
                align-items: center;
                gap: 10px;
                margin: 0 auto;
            }

            /* --- Track Selector Styles --- */
            
            /* Wrapper pour le cercle de progression */
            #coverWrapper {
                width: 160px;
                height: 160px;
                border-radius: 50%;
                display: flex;
                justify-content: center;
                align-items: center;
                background: #333; 
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                cursor: pointer; /* Add this to show it's clickable */
            }

            #coverImage { 
                width: 150px; /* Légèrement plus petit que le wrapper pour voir la bordure */
                height: 150px; 
                border-radius: 50%;
                object-fit: cover;
                border: 2px solid #333; /* Petit bord interne */
                transition: transform 0.5s ease;
                transform: rotate(0deg);
                z-index: 2;
            }

            #coverImage.playing {
                animation: rotate 10s linear infinite;
            }

            @keyframes rotate {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            /* Styles du texte Titre/Artiste */
            #trackInfo {
                text-align: center;
                width: 100%;
            }
            #trackTitle {
                font-size: 1.1em;
                font-weight: bold;
                display: block;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 250px;
            }
            #trackArtist {
                font-size: 0.9em;
                color: rgba(255, 255, 255, 0.8);
                display: block;
            }

            select { 
                border-radius: 4px; 
                width: 100%; 
                max-width: 280px;
            }

            /* --- Controls Section --- */
            .controls {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                align-items: center;
                flex-direction: row;
                gap: 15px;
                background: rgba(0, 0, 0, 0.15);
                padding: 10px;
                border-radius: 8px;
                width: 100%;
                height: 100%;
            }

            audio {
                display: none;
            }

            /* Knobs Styling */
            webaudio-knob {
                position: relative;
                cursor: pointer;
            }

            #knobVolume::after, #knobPan::after, #knobSpeed::after {
                position: absolute;
                bottom: -18px;
                left: 0;
                width: 100%;
                text-align: center;
                color: rgba(255, 255, 255, 0.9);
                pointer-events: none;
                font-size: 11px;
                background: rgba(0, 0, 0, 0.3);
                padding: 3px 0;
                border-radius: 4px;
                margin-top: 4px;
            }

            #knobVolume::after { content: "Vol"; }
            #knobPan::after    { content: "Pan"; }
            #knobSpeed::after  { content: "Speed"; }

            #playerContainer {
                background: rgba(0, 0, 0, 0.15);
                padding: 10px;
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                height: 100%;
            }
        </style>

        <div id="container">
            <div id="playerContainer">
                <div id="coverWrapper">
                    <img id="coverImage" src="" alt="Track Cover">
                </div>

                <div id="trackInfo">
                    
                <select id="trackSelect">
                    <option value="" disabled selected>Select a track...</option>
                </select>
                    <span id="trackArtist">Artiste</span>
                </div>

                <webaudio-switch
                    src="./components/images/S_pinkponk-ON-OFF.png"
                    id="sw1" type="toggle" width="60" height="40">
                </webaudio-switch>
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
        `);
    }
}

customElements.define('my-audio-player', MyAudioPlayer);