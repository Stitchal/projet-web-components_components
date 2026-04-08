const sheet = new CSSStyleSheet();
sheet.replaceSync(/* css */`
    * { box-sizing: border-box; }

    :host { display: block; width: 100%; height: 100%; }

    #container {
        width: 100%;
        height: 100%;
        background: #11111c;
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-top-color: rgba(255, 255, 255, 0.12);
        color: #ede9e0;
        font-family: 'Barlow Condensed', sans-serif;
        padding: 10px;
        border-radius: 0 0 14px 14px;
        display: flex;
        flex-direction: column;
        gap: 2px;
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

    #playlist {
        display: flex;
        flex-direction: column;
        gap: 1px;
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
        cursor: pointer;
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

    .playlist-item-index {
        font-family: 'Space Mono', monospace;
        font-size: 0.56rem;
        color: rgba(237, 233, 224, 0.2);
        flex-shrink: 0;
        min-width: 16px;
        text-align: right;
    }

    .playlist-item.active .playlist-item-index { color: #e8a020; }

    .playlist-item[draggable="true"] { cursor: grab; }

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

    #import-bar {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 6px 6px 2px;
        border-top: 1px solid rgba(255,255,255,0.06);
    }

    #import-btns {
        display: flex;
        gap: 4px;
    }

    .import-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 5px;
        color: rgba(237, 233, 224, 0.6);
        cursor: pointer;
        padding: 3px 10px;
        font-family: 'Space Mono', monospace;
        font-size: 9px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        transition: background 0.15s, color 0.15s;
        flex: 1;
    }

    .import-btn:hover {
        background: rgba(232, 160, 32, 0.15);
        border-color: rgba(232, 160, 32, 0.4);
        color: #e8a020;
    }

    #url-form {
        display: none;
        gap: 4px;
    }

    #url-form.visible { display: flex; }

    #url-input {
        flex: 1;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 5px;
        color: #ede9e0;
        font-family: 'Space Mono', monospace;
        font-size: 9px;
        padding: 3px 6px;
        outline: none;
        min-width: 0;
    }

    #url-input:focus { border-color: rgba(232,160,32,0.5); }
    #url-input::placeholder { color: rgba(237,233,224,0.2); }

    #btn-url-add {
        background: rgba(232,160,32,0.15);
        border: 1px solid rgba(232,160,32,0.35);
        border-radius: 5px;
        color: #e8a020;
        cursor: pointer;
        padding: 3px 8px;
        font-family: 'Space Mono', monospace;
        font-size: 9px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        transition: background 0.15s;
        flex-shrink: 0;
    }

    #btn-url-add:hover { background: rgba(232,160,32,0.28); }

    #btn-clear {
        background: none;
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 5px;
        color: rgba(237,233,224,0.25);
        cursor: pointer;
        padding: 3px 8px;
        font-family: 'Space Mono', monospace;
        font-size: 9px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        transition: background 0.15s, color 0.15s, border-color 0.15s;
        flex-shrink: 0;
    }

    #btn-clear:hover {
        background: rgba(200,50,50,0.15);
        border-color: rgba(200,50,50,0.4);
        color: #e05050;
    }
`);

const html = /* html */`
<div id="container">
    <div id="playlist"></div>
    <div id="playlist-footer"></div>
    <div id="import-bar">
        <div id="import-btns">
            <button class="import-btn" id="btn-import">+ Fichier</button>
            <button class="import-btn" id="btn-url-toggle">+ URL</button>
            <button id="btn-clear">Clear</button>
        </div>
        <div id="url-form">
            <input id="url-input" type="url" placeholder="https://…/track.mp3">
            <button id="btn-url-add">OK</button>
        </div>
        <input id="file-input" type="file" accept="audio/*" multiple style="display:none">
    </div>
</div>
`;

function formatDuration(seconds) {
    if (!isFinite(seconds)) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

/**
 * Playlist affichant les pistes du lecteur audio.
 *
 * ## Fonctionnement
 * Ce composant n'a pas de graphe audio. Il écoute l'événement `track-changed`
 * émis par `<my-audio-player>` sur le document pour construire et mettre à jour
 * la liste. Lorsque l'utilisateur clique sur une piste, il émet `track-select`
 * sur le document pour que le player charge la piste.
 *
 * ## Événements écoutés (sur document)
 * - `track-changed` : { track, index, tracks? } — mise à jour de l'état actif ;
 *   si `tracks` est présent, reconstruction complète de la liste.
 *
 * ## Événements émis (sur document)
 * - `track-select` : { index } — demande de sélection d'une piste
 *
 * ## Usage
 * <my-playlist></my-playlist>
 */
class MyPlaylist extends HTMLElement {
    #tracks = [];
    #currentIndex = 0;
    #abortController = null;
    #dragSrcIndex = null;
    #loadGeneration = 0;
    #importing = false;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.shadowRoot.adoptedStyleSheets = [sheet];
        this.shadowRoot.setHTMLUnsafe(html);
        this.#defineListeners();
        document.dispatchEvent(new CustomEvent('playlist-ready'));
    }

    disconnectedCallback() {
        this.#abortController?.abort();
        this.#abortController = null;
    }

    // --- Construction de la liste ---

    #buildPlaylist() {
        const playlistEl = this.shadowRoot.querySelector('#playlist');
        if (!playlistEl) return;
        playlistEl.replaceChildren();
        this.#tracks.forEach((track, index) => {
            playlistEl.append(this.#createPlaylistItem(track, index));
        });
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

    // --- Durées ---

    async #loadDurations(gen) {
        const promises = this.#tracks.map(track => new Promise(resolve => {
            const a = new Audio();
            a.addEventListener('loadedmetadata', () => resolve(a.duration), { once: true });
            a.addEventListener('error', () => resolve(NaN), { once: true });
            a.src = track.audio;
        }));

        const durations = await Promise.all(promises);

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

    // --- État actif ---

    #updateActiveItem(index) {
        this.shadowRoot.querySelector('#playlist')
            ?.querySelectorAll('.playlist-item')
            .forEach((item, i) => item.classList.toggle('active', i === index));
        this.shadowRoot.querySelector('.playlist-item.active')
            ?.scrollIntoView({ block: 'nearest' });
    }

    // --- Réordonnancement ---

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
        const playlistEl = this.shadowRoot.querySelector('#playlist');
        if (!playlistEl) return;
        playlistEl.replaceChildren();
        this.#tracks.forEach((track, index) => {
            const item = this.#createPlaylistItem(track, index);
            if (index === this.#currentIndex) item.classList.add('active');
            playlistEl.append(item);
        });
        this.shadowRoot.querySelector('.playlist-item.active')
            ?.scrollIntoView({ block: 'nearest' });
        this.#renderTotalDuration();
    }

    // --- Import fichiers locaux ---

    async #importFiles(files) {
        this.#importing = true;
        for (const file of files) {
            const url = URL.createObjectURL(file);
            const duration = await new Promise(resolve => {
                const a = new Audio();
                a.addEventListener('loadedmetadata', () => resolve(a.duration), { once: true });
                a.addEventListener('error', () => resolve(NaN), { once: true });
                a.src = url;
            });
            const title = file.name.replace(/\.[^.]+$/, '');
            const track = { id: Date.now() + Math.random(), title, artist: '', audio: url, cover: null, duration };
            this.#tracks.push(track);
            document.dispatchEvent(new CustomEvent('track-import', { detail: { track } }));
        }
        this.#importing = false;
        this.#rebuildPlaylistDOM();
        this.#renderTotalDuration();
    }

    async #importUrl(url) {
        if (!url) return;
        const urlForm  = this.shadowRoot.querySelector('#url-form');
        const urlInput = this.shadowRoot.querySelector('#url-input');
        this.#importing = true;
        const duration = await new Promise(resolve => {
            const a = new Audio();
            a.addEventListener('loadedmetadata', () => resolve(a.duration), { once: true });
            a.addEventListener('error', () => resolve(NaN), { once: true });
            a.src = url;
        });
        // Titre = dernière partie du chemin, sans extension
        const title = url.split('/').pop().replace(/\?.*$/, '').replace(/\.[^.]+$/, '') || url;
        const track = { id: Date.now() + Math.random(), title, artist: '', audio: url, cover: null, duration };
        this.#tracks.push(track);
        document.dispatchEvent(new CustomEvent('track-import', { detail: { track } }));
        this.#importing = false;
        this.#rebuildPlaylistDOM();
        this.#renderTotalDuration();
        urlInput.value = '';
        urlForm.classList.remove('visible');
    }

    // --- Listeners ---

    #defineListeners() {
        this.#abortController = new AbortController();
        const { signal } = this.#abortController;

        // Réception des changements de piste depuis le player
        document.addEventListener('track-changed', (e) => {
            const { tracks, index } = e.detail;
            if (tracks && !this.#importing) {
                this.#tracks = [...tracks];
                this.#buildPlaylist();
                const gen = ++this.#loadGeneration;
                this.#loadDurations(gen);
            }
            this.#currentIndex = index;
            this.#updateActiveItem(index);
        }, { signal });

        const playlistEl = this.shadowRoot.querySelector('#playlist');

        // Clic → sélection
        playlistEl?.addEventListener('click', (e) => {
            const item = e.target.closest('.playlist-item');
            if (!item) return;
            document.dispatchEvent(new CustomEvent('track-select', {
                detail: { index: parseInt(item.dataset.index, 10) },
            }));
        }, { signal });

        // Drag & drop — réorganisation
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

        // Import — fichier local
        const fileInput = this.shadowRoot.querySelector('#file-input');
        this.shadowRoot.querySelector('#btn-import')?.addEventListener('click', () => {
            fileInput.value = '';
            fileInput.click();
        }, { signal });

        fileInput?.addEventListener('change', () => {
            if (fileInput.files?.length) this.#importFiles(fileInput.files);
        }, { signal });

        // Import — URL
        const urlForm    = this.shadowRoot.querySelector('#url-form');
        const urlInput   = this.shadowRoot.querySelector('#url-input');
        const btnToggle  = this.shadowRoot.querySelector('#btn-url-toggle');

        btnToggle?.addEventListener('click', () => {
            urlForm.classList.toggle('visible');
            if (urlForm.classList.contains('visible')) urlInput.focus();
        }, { signal });

        this.shadowRoot.querySelector('#btn-url-add')?.addEventListener('click', () => {
            this.#importUrl(urlInput.value.trim());
        }, { signal });

        urlInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.#importUrl(urlInput.value.trim());
            if (e.key === 'Escape') urlForm.classList.remove('visible');
        }, { signal });

        // Clear playlist
        this.shadowRoot.querySelector('#btn-clear')?.addEventListener('click', () => {
            this.#tracks = [];
            this.#currentIndex = 0;
            this.shadowRoot.querySelector('#playlist').replaceChildren();
            const footer = this.shadowRoot.querySelector('#playlist-footer');
            if (footer) footer.textContent = '';
            document.dispatchEvent(new CustomEvent('playlist-clear'));
        }, { signal });

        // Drag & drop de fichiers depuis l'OS sur le container
        this.shadowRoot.querySelector('#container')?.addEventListener('dragover', (e) => {
            if ([...e.dataTransfer.items].some(i => i.kind === 'file')) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
            }
        }, { signal });

        this.shadowRoot.querySelector('#container')?.addEventListener('drop', (e) => {
            const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('audio/'));
            if (!files.length) return;
            e.preventDefault();
            this.#importFiles(files);
        }, { signal });
    }
}

customElements.define('my-playlist', MyPlaylist);
