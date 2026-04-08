# Lecteur Audio Web Components — 2025/2026

Projet universitaire : un lecteur audio complet sous forme de **purs Web Components** natifs (vanilla JS, ESM, Web Audio API, Shadow DOM). Inspiré de [WebAmp](https://webamp.org/), il propose un lecteur, une playlist avancée, un égaliseur graphique, des visualiseurs audio et un support de plugins WAM.

**Demo** : [https://stitchal.github.io/projet-web-components_demo/](https://stitchal.github.io/projet-web-components_demo/)

---

## Fonctionnalités

- Lecteur audio complet (play/pause, prev/next, volume, balance, vitesse)
- Playlist avec covers, durées, drag & drop, import fichier/URL
- Égaliseur graphique 6 bandes avec préréglages
- Visualiseur de forme d'onde (waveform)
- Visualiseur Milkdrop (Butterchurn)
- Support de plugins WAM (Web Audio Modules)
- Fenêtres draggables avec magnétisme (dans le projet de demo) (style WebAmp)
- Fond ambiant dynamique (dans le projet de demo) (cover floutée)
- Thème "dark studio" entièrement personnalisable via CSS custom properties

---

## Architecture

### Stack

- Vanilla JS (ESM) — zéro framework, zéro dépendance externe (sauf WAM optionnel)
- Web Components natifs (`extends HTMLElement`)
- Web Audio API
- Shadow DOM + `adoptedStyleSheets`

### Structure du dépôt

```
components/               # Composants hébergés (dépôt indépendant)
  ConnectableComponent.js # Classe de base pour les composants audio
  audioplayer.js          # <my-audio-player>
  Playlist.js             # <my-playlist>
  equalizer.js            # <my-eq>
  waveform.js             # <my-waveform>
  butterchurn.js          # <my-butterchurn>
  modules/
    audioContext.js       # Singleton AudioContext partagé
  libs/                   # Librairies tierces (webaudiocontrols)
  images/                 # Assets internes aux composants
index.html                # Page de démonstration intégrant tous les composants
```

Le projet de démonstration (page hôte) est hébergé séparément :
[https://github.com/Stitchal/projet-web-components_demo](https://github.com/Stitchal/projet-web-components_demo)

---

## Utilisation via URI distante

Les composants sont conçus pour être utilisés **sans installation locale**, en important directement leur URL :

```html
<!-- Import des composants depuis GitHub Pages -->
<script type="module" src="https://stitchal.github.io/projet-web-components_components/components/audioplayer.js"></script>
<script type="module" src="https://stitchal.github.io/projet-web-components_components/components/Playlist.js"></script>
<script type="module" src="https://stitchal.github.io/projet-web-components_components/components/equalizer.js"></script>
<script type="module" src="https://stitchal.github.io/projet-web-components_components/components/waveform.js"></script>

<!-- Utilisation déclarative -->
<my-audio-player src="https://example.com/tracks.json"></my-audio-player>
<my-playlist></my-playlist>
<my-eq preset="0,0,0,0,0,0"></my-eq>
<my-waveform color="#39e082"></my-waveform>
```

Les chemins internes (assets, modules) sont résolus via `import.meta.url`, ce qui garantit leur résolution correcte quelle que soit l'origine de la page hôte.

---

## Format de la playlist JSON

```json
[
  {
    "id": 1,
    "title": "Titre de la piste",
    "artist": "Nom de l'artiste",
    "audio": "https://example.com/track.mp3",
    "cover": "https://example.com/cover.png"
  }
]
```

---

## Composants

### `<my-audio-player>` — [doc complète](SPECIFICATION.md#4-my-audio-player)

Lecteur audio principal. Gère le graphe audio, les contrôles de lecture, la couverture, le volume, la balance et la vitesse.

| Attribut | Type | Défaut | Description |
|----------|------|--------|-------------|
| `src` | URL | — | URL du fichier JSON de playlist (obligatoire) |
| `autoplay` | booléen | absent | Lance la lecture automatiquement |

**Événements émis** : `track-changed` sur `document`  
**Événements écoutés** : `track-select`, `track-import`, `playlist-clear` sur `document`

---

### `<my-playlist>` — [doc complète](SPECIFICATION.md#5-my-playlist)

Interface de playlist. Affiche les pistes, gère le drag & drop, l'import et la synchronisation avec le lecteur.

Aucun attribut. Entièrement piloté par les événements `document`.

**Événements émis** : `track-select`, `track-import`, `playlist-clear` sur `document`  
**Événements écoutés** : `track-changed` sur `document`

---

### `<my-eq>` — [doc complète](SPECIFICATION.md#6-my-eq)

Égaliseur graphique 6 bandes (60Hz, 170Hz, 350Hz, 1kHz, 3.5kHz, 10kHz).

| Attribut | Type | Défaut | Description |
|----------|------|--------|-------------|
| `preset` | string | `"0,0,0,0,0,0"` | Gains dB séparés par virgule (−30 à +30) |

**Préréglages intégrés** : Flat, Bass, Treble, Rock, Pop, Jazz, Vocal

---

### `<my-waveform>` — [doc complète](SPECIFICATION.md#7-my-waveform)

Visualiseur de forme d'onde (passthrough audio transparent).

| Attribut | Type | Défaut | Description |
|----------|------|--------|-------------|
| `color` | couleur CSS | `#39e082` | Couleur du tracé |
| `fft-size` | number | `1024` | Taille FFT (puissance de 2) |

---

### `<my-butterchurn>` — [doc complète](SPECIFICATION.md#8-my-butterchurn)

Visualiseur Milkdrop (Butterchurn). Passthrough audio. Réagit aux événements `audio-play` et `audio-pause` émis par `<my-audio-player>`.

---

## Chaînage audio

Les composants audio héritent de `ConnectableComponent` et peuvent être assemblés en chaîne de traitement :

```javascript
await Promise.all([
  customElements.whenDefined('my-audio-player'),
  customElements.whenDefined('my-eq'),
  customElements.whenDefined('my-waveform'),
]);

const player   = document.querySelector('my-audio-player');
const eq       = document.querySelector('my-eq');
const waveform = document.querySelector('my-waveform');

// Chaîne : player → eq → waveform → ctx.destination
player.connectComponent(eq);
eq.connectComponent(waveform);
```

Sans appel à `connectComponent()`, chaque composant se connecte directement à `ctx.destination` — ils fonctionnent tous de façon autonome.

---

## Partage du contexte audio

Un unique `AudioContext` est partagé entre tous les composants via le singleton `components/modules/audioContext.js` :

```javascript
import { getAudioContext, resumeAudioContext } from './modules/audioContext.js';
```

`resumeAudioContext()` doit être appelé depuis un handler de geste utilisateur (click, keydown) pour respecter la politique d'autoplay des navigateurs.

---

## Décisions de design

### Autonomie vs imbrication

Chaque composant est **autonome par défaut** : il récupère le singleton `AudioContext` et se connecte à `ctx.destination` sans orchestrateur externe. Le chaînage via `connectComponent()` est **optionnel** — c'est la page hôte qui orchestre, pas les composants entre eux.

Ce choix permet :
- L'utilisation via URI distante sans contexte de démo
- L'intégration dans n'importe quelle page sans couplage fort
- Des tests isolés de chaque composant

### Communication inter-composants

Tous les échanges entre composants indépendants transitent via des `CustomEvent` dispatchés sur `document`. Cela évite tout couplage DOM direct (pas de `querySelector` d'un composant vers un autre).

| Direction | Mécanisme |
|-----------|-----------|
| Player → Playlist | `track-changed` sur `document` |
| Playlist → Player | `track-select`, `track-import`, `playlist-clear` sur `document` |
| Player → Visualiseurs | `audio-play`, `audio-pause` sur `document` |
| Page hôte → Composant | Attributs HTML, propriétés JS |

### Résolution des chemins (`import.meta.url`)

Les assets internes aux composants (images webaudiocontrols, JSON par défaut) sont résolus via `import.meta.url`. Cela garantit la résolution correcte quel que soit l'hôte, en local comme sur CDN.

### Singleton AudioContext via module ES

`let _ctx = null` dans un module ES suffit — le système de modules ES garantit une instance unique par realm, sans boilerplate de classe statique.

---

## Support WAM (Web Audio Modules)

Le projet intègre le format [WAM](https://www.webaudiomodules.com/) via les web components `<wam-host>` et `<wam-plugin>` (hébergés sur `mainline.i3s.unice.fr`). Exemple avec le plugin Soundfont Piano.

Le volume du plugin est contrôlé via un `GainNode` inséré par Proxy sur le `AudioContext` avant l'initialisation du plugin — la seule approche possible sans modifier le code WAM.

---

## Post-mortem — Outils IA utilisés

### Claude Code (Anthropic)

**Outil principal** utilisé tout au long du projet via le CLI `claude-code`.

#### Fichiers de règles créés

- **`CLAUDE.md`** — Contraintes absolues du projet (stack, conventions, architecture, règles AudioContext, cycle de vie). Ce fichier est chargé automatiquement par Claude Code à chaque session et oriente toutes les décisions de génération de code.
- **`history.md`** — Journal chronologique de chaque modification, maintenu par Claude Code à chaque intervention (fichiers modifiés, type de changement, décisions de design, skills appliqués).
- **`SPECIFICATION.md`** — API publique de chaque composant (tag, attributs, propriétés, méthodes, événements). Mis à jour automatiquement à chaque changement d'interface.

#### Skills configurés

Des skills spécialisés ont été configurés pour guider les générations selon le contexte :
- `web-components` — Conventions DOM/CSS, Shadow DOM, `adoptedStyleSheets`, `setHTMLUnsafe()`
- `web-audio` — Patterns AudioContext, gestion des nœuds, règle singleton
- `frontend-design` — UI, animations, thème

#### Prompts types utilisés

- _"Refactorise `audioplayer.js` pour que le composant soit autonome via URI distante — tous les chemins d'assets doivent utiliser `import.meta.url`"_
- _"Sépare `my-audio-player` en deux composants : un lecteur audio pur et une playlist UI, communicant via CustomEvents sur `document`"_
- _"Ajoute un singleton `audioContext.js` partagé entre tous les composants selon les règles CLAUDE.md §3"_
- _"Corrige le graphe audio — butterchurn réécrasait la chaîne player → eq → waveform en appelant `connectComponent()` dans son `connectedCallback`"_

#### Ce qui a bien fonctionné

- La configuration de `CLAUDE.md` avec des règles précises a drastiquement réduit les hallucinations (pas de `innerHTML`, pas de `new AudioContext()` hors singleton, etc.)
- Les skills ont permis d'orienter les générations vers les patterns modernes (ex : `adoptedStyleSheets` plutôt que `<style>` inline)
- Le fichier `history.md` maintenu automatiquement a servi de documentation de décisions en temps réel

#### Ce qui a nécessité des corrections manuelles

- Le couplage DOM entre composants (butterchurn faisait `document.querySelector('my-audio-player')` dans sa boucle de rendu) — corrigé après diagnostic dans `history.md`
- La résolution des chemins distants (fallback `../assets/tracks.json` cassé sur CDN) — nécessitait une bonne connaissance des contraintes d'hébergement

---

## Lancer en local

```bash
npm install
npm run dev
# → http://localhost:8080
```

---

## Auteurs

Projet universitaire 2025/2026 — Stitchal
