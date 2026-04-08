# SPECIFICATION — API des composants Web Audio

> **Règle** : ce fichier doit être mis à jour à chaque modification d'un composant
> (ajout/suppression d'attribut, de méthode, d'événement ou changement de comportement).
> Voir CLAUDE.md §7 pour les règles de maintenance.

---

## Table des matières

1. [Architecture générale](#1-architecture-générale)
2. [Partage du contexte audio](#2-partage-du-contexte-audio)
3. [ConnectableComponent — classe de base](#3-connectablecomponent--classe-de-base)
4. [`<my-audio-player>`](#4-my-audio-player)
5. [`<my-playlist>`](#5-my-playlist)
6. [`<my-eq>`](#6-my-eq)
7. [`<my-waveform>`](#7-my-waveform)
8. [`<my-butterchurn>`](#8-my-butterchurn)
9. [Tableau des événements inter-composants](#9-tableau-des-événements-inter-composants)
10. [Exemples d'intégration](#10-exemples-dintégration)

---

## 1. Architecture générale

```
┌──────────────────────────────────────────────────────────────────┐
│                          Page hôte                               │
│                                                                  │
│  ┌─────────────────┐   track-changed   ┌──────────────────┐     │
│  │ my-audio-player │ ────────────────► │   my-playlist    │     │
│  │                 │ ◄──────────────── │                  │     │
│  └────────┬────────┘   track-select    └──────────────────┘     │
│           │                                                      │
│     Audio │ (Web Audio API)                                      │
│           ▼                                                      │
│  ┌────────────────┐  connectComponent  ┌──────────────────┐     │
│  │    my-eq       │ ─────────────────► │   my-waveform    │     │
│  └────────────────┘                    └──────────────────┘     │
│                                                                  │
│  Tous les composants partagent un unique AudioContext            │
│  via le singleton components/modules/audioContext.js             │
└──────────────────────────────────────────────────────────────────┘
```

Les composants audio (`my-audio-player`, `my-eq`, `my-waveform`) héritent de
`ConnectableComponent` et peuvent être assemblés en chaîne de traitement.
`my-playlist` est un composant UI pur — il n'a pas de graphe audio.

### Décision de design : autonome par défaut, chaînable optionnellement

Chaque composant audio est **autonome** :
- Il récupère le singleton `AudioContext` à sa connexion dans le DOM
- Il connecte sa sortie à `ctx.destination` par défaut
- Il fonctionne sans aucun orchestrateur externe

Il peut être **chaîné** via `connectComponent()` (voir §3). L'orchestration
est optionnelle et réalisée dans `js/script.js`, qui n'est pas requis pour
que les composants fonctionnent individuellement.

---

## 2. Partage du contexte audio

**Fichier :** `components/modules/audioContext.js`

Tous les composants audio partagent un unique `AudioContext` via ce module singleton.
Aucune coordination externe n'est nécessaire.

### Fonctions exportées

| Fonction | Signature | Description |
|----------|-----------|-------------|
| `getAudioContext` | `() → AudioContext` | Retourne (ou crée) le contexte partagé. Sûr à appeler sans geste utilisateur — le contexte sera `suspended`. |
| `resumeAudioContext` | `() → Promise<AudioContext>` | Reprend un contexte suspendu. À appeler depuis un handler de geste utilisateur (click, keydown…). |

### Usage dans un composant autonome

```javascript
import { getAudioContext, resumeAudioContext } from './modules/audioContext.js';

class MyComponent extends ConnectableComponent {
    buildAudioGraph() {
        // this.audioCtx est déjà initialisé par initAudioGraph()
        const node = this.audioCtx.createGain();
        node.connect(this.audioCtx.destination);
        this._markConnectedToDestination();
    }
}
```

### Usage dans une page hôte (usage distant)

```html
<!-- Le singleton est partagé entre tous les composants chargés depuis la même origine -->
<script type="module" src="https://cdn.example.com/components/AudioPlayer.js"></script>
<script type="module" src="https://cdn.example.com/components/equalizer.js"></script>
```

---

## 3. ConnectableComponent — classe de base

**Fichier :** `components/ConnectableComponent.js`  
**Étend :** `HTMLElement`  
**Étendu par :** `my-audio-player`, `my-eq`, `my-waveform`

Classe abstraite qui fournit l'infrastructure de graphe audio partagée.
Ne s'utilise pas directement — c'est la base des composants audio.

### Méthodes publiques

| Méthode | Signature | Description |
|---------|-----------|-------------|
| `connectComponent` | `(target: ConnectableComponent) → void` | Connecte la sortie de ce composant à l'entrée de `target`. Déroute automatiquement depuis `ctx.destination` si nécessaire. |
| `setAudioContext` | `(ctx: AudioContext) → void` | Injecte un `AudioContext` depuis l'extérieur (rétrocompatibilité). Déclenche `buildAudioGraph()` si pas encore fait. |
| `getInputNode` | `() → AudioNode` | *Abstraite* — retourne le nœud d'entrée. Implémentée par chaque sous-classe. |
| `getOutputNode` | `() → AudioNode` | *Abstraite* — retourne le nœud de sortie. Implémentée par chaque sous-classe. |

### Méthodes à implémenter dans les sous-classes

| Méthode | Signature | Description |
|---------|-----------|-------------|
| `buildAudioGraph` | `() → void` | Construit le graphe audio. Appelé une seule fois par `initAudioGraph()`. |
| `getInputNode` | `() → AudioNode` | Retourne le nœud d'entrée du composant. |
| `getOutputNode` | `() → AudioNode` | Retourne le nœud de sortie du composant. |

### Propriétés

| Propriété | Type | Description |
|-----------|------|-------------|
| `audioCtx` | `AudioContext` | Contexte audio partagé. Disponible après `initAudioGraph()`. |

### Chaînage de composants

```javascript
// Après que les composants sont définis et insérés dans le DOM :
const player   = document.querySelector('my-audio-player');
const eq       = document.querySelector('my-eq');
const waveform = document.querySelector('my-waveform');

// Chaîne : player → eq → waveform → ctx.destination
player.connectComponent(eq);
eq.connectComponent(waveform);
```

Le graphe audio résultant :

```
[sourceNode] → [gain] → [panner] → [analyser] → [outputNode]
                                                      │
                                                 connectComponent(eq)
                                                      │
                                                  [filter0] → … → [filter5]
                                                                       │
                                                               connectComponent(waveform)
                                                                       │
                                                                   [analyser] → ctx.destination
```

---

## 4. `<my-audio-player>`

**Fichier :** `components/audioplayer.js`  
**Tag :** `my-audio-player`  
**Étend :** `ConnectableComponent`  
**Décision de design :** Composant **autonome**. Charge lui-même la playlist depuis un JSON, gère le graphe audio complet. Peut être chaîné avec `my-eq` ou `my-waveform` via `connectComponent()`.

### Attributs HTML

| Attribut | Type | Défaut | Description |
|----------|------|--------|-------------|
| `src` | `string` (URL) | `assets/tracks.json` relatif au composant | URL du fichier JSON de playlist. Réactif : changer l'attribut recharge la playlist. |
| `autoplay` | `boolean` (présence) | absent | Lance la lecture automatiquement au chargement. |

### Format du JSON de playlist

```json
[
  {
    "id": 1,
    "title": "Titre de la piste",
    "artist": "Nom de l'artiste",
    "audio": "./chemin/vers/track.mp3",
    "cover": "./chemin/vers/cover.png"
  }
]
```

Les chemins `audio` et `cover` sont résolus via `document.baseURI`. Ils peuvent
être absolus ou relatifs à la page hôte.

### Propriétés JS exposées

| Propriété | Type | Accès | Description |
|-----------|------|-------|-------------|
| `currentTrack` | `object \| null` | lecture seule | La piste actuellement chargée `{ id, title, artist, audio, cover }`, ou `null`. |
| `outputNode` | `GainNode` | lecture seule | Nœud de sortie Web Audio — utilisé par `connectComponent()`. |
| `audioCtx` | `AudioContext` | lecture seule | Contexte audio partagé (hérité de `ConnectableComponent`). |

### Méthodes publiques

| Méthode | Signature | Description |
|---------|-----------|-------------|
| `connectComponent` | `(target: ConnectableComponent) → void` | Héritée. Chaîne la sortie vers un autre composant. |
| `getInputNode` | `() → MediaElementAudioSourceNode` | Retourne la source audio (nœud d'entrée de la chaîne interne). |
| `getOutputNode` | `() → GainNode` | Retourne le nœud de sortie — point de connexion vers le composant suivant. |

### Graphe audio interne

```
<audio> → MediaElementSourceNode → GainNode (volume) → StereoPannerNode → AnalyserNode (VU-mètre) → outputNode (GainNode) → ctx.destination
```

### Événements émis

| Événement | Émis sur | `detail` | Description |
|-----------|----------|----------|-------------|
| `track-changed` | `document` (bubbles + composed) | `{ track: object, index: number, tracks: object[] }` | Émis à chaque changement de piste (chargement initial, prev/next, sélection depuis la playlist). `tracks` contient toute la liste courante. |

### Événements écoutés

| Événement | Écouté sur | `detail` | Description |
|-----------|------------|----------|-------------|
| `track-select` | `document` | `{ index: number }` | Sélectionne et lance la piste à l'index donné. Émis par `my-playlist`. |
| `track-import` | `document` | `{ track: object }` | Ajoute une piste importée depuis `my-playlist` à la liste interne. |
| `playlist-clear` | `document` | — | Vide la liste de pistes et arrête la lecture. |

### Usage

```html
<!-- Minimal -->
<my-audio-player></my-audio-player>

<!-- Avec playlist distante -->
<my-audio-player src="https://example.com/tracks.json"></my-audio-player>

<!-- Via script.js (orchestration optionnelle) -->
<script type="module">
  import 'https://cdn.example.com/components/audioplayer.js';
  const player = document.querySelector('my-audio-player');
  // Chaîner avec un égaliseur
  player.connectComponent(document.querySelector('my-eq'));
</script>
```

---

## 5. `<my-playlist>`

**Fichier :** `components/Playlist.js`  
**Tag :** `my-playlist`  
**Étend :** `HTMLElement` (pas de graphe audio)  
**Décision de design :** Composant **autonome** de type UI pur. Il ne gère aucun audio. Il se synchronise avec `my-audio-player` uniquement via événements `document` — les deux composants peuvent fonctionner indépendamment.

### Attributs HTML

Aucun attribut observé. Le composant est entièrement piloté par les événements.

### Propriétés JS exposées

Aucune propriété publique. L'état interne (liste des pistes, index courant) est privé.

### Méthodes publiques

Aucune méthode publique. Le composant est piloté exclusivement par événements.

### Fonctionnalités intégrées

- Affichage de la liste des pistes avec cover, titre, artiste, durée, index
- Mise en surbrillance de la piste active
- Durées calculées automatiquement au chargement (chargement lazy via `Audio`)
- Durée totale affichée en pied de liste
- Réorganisation par drag & drop
- Import de fichiers audio locaux (bouton "+ Fichier" ou drag & drop sur le composant)
- Import par URL (bouton "+ URL")
- Vidage de la liste (bouton "Clear")
- Défilement automatique vers la piste active

### Événements émis

| Événement | Émis sur | `detail` | Description |
|-----------|----------|----------|-------------|
| `track-select` | `document` | `{ index: number }` | Émis quand l'utilisateur clique sur une piste. `my-audio-player` écoute cet événement pour charger la piste. |
| `track-import` | `document` | `{ track: object }` | Émis pour chaque piste importée (fichier ou URL). `my-audio-player` écoute cet événement pour ajouter la piste à sa liste interne. |
| `playlist-clear` | `document` | — | Émis quand l'utilisateur vide la playlist. `my-audio-player` écoute cet événement pour arrêter la lecture. |

### Événements écoutés

| Événement | Écouté sur | `detail` | Description |
|-----------|------------|----------|-------------|
| `track-changed` | `document` | `{ track, index, tracks? }` | Met à jour la liste complète si `tracks` est présent ; met à jour l'item actif dans tous les cas. |

### Usage

```html
<!-- Standalone — fonctionne sans my-audio-player, mais sans pistes visibles -->
<my-playlist></my-playlist>

<!-- Usage typique avec my-audio-player -->
<my-audio-player src="./tracks.json"></my-audio-player>
<my-playlist></my-playlist>
<!-- Les deux se synchronisent via les événements track-changed / track-select sur document -->
```

---

## 6. `<my-eq>`

**Fichier :** `components/equalizer.js`  
**Tag :** `my-eq`  
**Étend :** `ConnectableComponent`  
**Décision de design :** Composant **autonome** et **chaînable**. Fonctionne seul (connecté à `ctx.destination`), ou inséré dans une chaîne audio via `connectComponent()`.

### Attributs HTML

| Attribut | Type | Défaut | Description |
|----------|------|--------|-------------|
| `preset` | `string` | `"0,0,0,0,0,0"` | Gains dB des 6 bandes séparés par virgule. Ordre : 60Hz, 170Hz, 350Hz, 1kHz, 3.5kHz, 10kHz. Plage : −30 à +30 dB. Réactif : changer l'attribut met à jour les filtres et l'UI immédiatement. |

### Préréglages intégrés

| Nom | Valeur |
|-----|--------|
| Flat | `0,0,0,0,0,0` |
| Bass | `5,4,2,0,-1,-2` |
| Treble | `-2,0,2,4,3,1` |
| Rock | `4,3,0,-2,2,3` |
| Pop | `3,2,0,1,3,4` |
| Jazz | `2,0,-1,0,2,4` |
| Vocal | `0,0,0,0,-3,-5` |

### Propriétés JS exposées

| Propriété | Type | Accès | Description |
|-----------|------|-------|-------------|
| `audioCtx` | `AudioContext` | lecture seule | Contexte audio partagé (hérité). |

### Méthodes publiques

| Méthode | Signature | Description |
|---------|-----------|-------------|
| `connectComponent` | `(target: ConnectableComponent) → void` | Héritée. Chaîne la sortie du dernier filtre vers un autre composant. |
| `getInputNode` | `() → BiquadFilterNode` | Retourne le premier filtre (60Hz) — point d'entrée de la chaîne de filtres. |
| `getOutputNode` | `() → BiquadFilterNode` | Retourne le dernier filtre (10kHz) — point de sortie. |

### Graphe audio interne

```
→ BiquadFilter (60Hz) → BiquadFilter (170Hz) → BiquadFilter (350Hz)
  → BiquadFilter (1kHz) → BiquadFilter (3.5kHz) → BiquadFilter (10kHz) → ctx.destination
```

Tous les filtres sont de type `peaking`. Plage de gain : −30 à +30 dB.

### Événements émis

Aucun.

### Événements écoutés

Aucun.

### Usage

```html
<!-- Standalone -->
<my-eq></my-eq>
<my-eq preset="-6,0,3,3,0,-3"></my-eq>

<!-- Contrôle via JS -->
<script type="module">
  const eq = document.querySelector('my-eq');
  // Appliquer un preset via attribut
  eq.setAttribute('preset', '5,4,2,0,-1,-2');
</script>
```

---

## 7. `<my-waveform>`

**Fichier :** `components/waveform.js`  
**Tag :** `my-waveform`  
**Étend :** `ConnectableComponent`  
**Décision de design :** Composant **autonome** et **chaînable**. Passthrough audio pur — il lit le signal sur son `AnalyserNode` pour le visualiser, sans le modifier. En usage chaîné, il est placé en fin de chaîne avant `ctx.destination`.

### Attributs HTML

| Attribut | Type | Défaut | Description |
|----------|------|--------|-------------|
| `color` | `string` (couleur CSS hex) | `#39e082` | Couleur du tracé de la forme d'onde. Réactif. |
| `fft-size` | `number` (puissance de 2) | `1024` | Taille FFT de l'`AnalyserNode`. Plage recommandée : 32 à 32768 (puissances de 2). Réactif. |

### Propriétés JS exposées

| Propriété | Type | Accès | Description |
|-----------|------|-------|-------------|
| `audioCtx` | `AudioContext` | lecture seule | Contexte audio partagé (hérité). |

### Méthodes publiques

| Méthode | Signature | Description |
|---------|-----------|-------------|
| `connectComponent` | `(target: ConnectableComponent) → void` | Héritée. Rarement utilisé — ce composant est en général le dernier de la chaîne. |
| `getInputNode` | `() → AnalyserNode` | Retourne l'analyseur — nœud d'entrée ET de sortie (passthrough). |
| `getOutputNode` | `() → AnalyserNode` | Retourne le même `AnalyserNode`. |

### Graphe audio interne

```
→ AnalyserNode → ctx.destination
    └─ getByteTimeDomainData() → canvas (animation requestAnimationFrame)
```

L'`AnalyserNode` est transparent pour le signal audio (passthrough).

### Événements émis

Aucun.

### Événements écoutés

Aucun.

### Usage

```html
<!-- Standalone — visualise le signal global de ctx.destination -->
<my-waveform></my-waveform>

<!-- Avec options -->
<my-waveform color="#e8a020" fft-size="2048"></my-waveform>

<!-- Contrôle via JS -->
<script type="module">
  const waveform = document.querySelector('my-waveform');
  waveform.setAttribute('color', '#ff6040');
  waveform.setAttribute('fft-size', '512');
</script>
```

---

## 8. `<my-butterchurn>`

**Fichier :** `components/butterchurn.js`  
**Tag :** `my-butterchurn`  
**Étend :** `ConnectableComponent`  
**Décision de design :** Composant **autonome** et **chaînable**. Passthrough audio pur — il lit le signal via un `AnalyserNode` interne pour alimenter le visualiseur Milkdrop (butterchurn), sans modifier le signal. Il réagit aux événements `audio-play` et `audio-pause` pour activer/suspendre le rendu canvas. Le câblage audio est délégué à la page hôte via `connectComponent()`.

### Attributs HTML

| Attribut | Type | Défaut | Description |
|----------|------|--------|-------------|
| `blend` | `number` | `2.0` | Durée de transition en secondes entre les presets Milkdrop. Réactif. |

### Propriétés JS exposées

| Propriété | Type | Accès | Description |
|-----------|------|-------|-------------|
| `audioCtx` | `AudioContext` | lecture seule | Contexte audio partagé (hérité). |

### Méthodes publiques

| Méthode | Signature | Description |
|---------|-----------|-------------|
| `connectComponent` | `(target: ConnectableComponent) → void` | Héritée. Rarement utilisé — ce composant est généralement le dernier de la chaîne. |
| `getInputNode` | `() → GainNode` | Retourne le nœud d'entrée (GainNode). |
| `getOutputNode` | `() → AnalyserNode` | Retourne le nœud de sortie (AnalyserNode, après le gain). |

### Graphe audio interne

```
→ GainNode → AnalyserNode → ctx.destination
    └─ butterchurn.connectAudio(gainNode) → rendu canvas (requestAnimationFrame)
```

Le rendu canvas n'est actif que si `audio-play` a été reçu. Il se suspend sur `audio-pause`.

### Événements émis

Aucun.

### Événements écoutés

| Événement | Écouté sur | `detail` | Description |
|-----------|------------|----------|-------------|
| `audio-play` | `document` | — | Active le rendu canvas Milkdrop. |
| `audio-pause` | `document` | — | Suspend le rendu canvas (la boucle `requestAnimationFrame` continue mais ne rend pas). |

### Usage

```html
<!-- Standalone -->
<my-butterchurn></my-butterchurn>

<!-- Avec transition de preset plus lente -->
<my-butterchurn blend="4"></my-butterchurn>

<!-- En fin de chaîne audio -->
<script type="module">
  await Promise.all([
    customElements.whenDefined('my-audio-player'),
    customElements.whenDefined('my-butterchurn'),
  ]);
  const player      = document.querySelector('my-audio-player');
  const butterchurn = document.querySelector('my-butterchurn');
  // Chaîne : player → butterchurn → ctx.destination
  player.connectComponent(butterchurn);
</script>
```

---

## 9. Tableau des événements inter-composants

| Événement | Émetteur | Récepteur(s) | Transport | `detail` |
|-----------|----------|--------------|-----------|----------|
| `track-changed` | `my-audio-player` | `my-playlist`, page hôte | `document` (bubbles + composed) | `{ track, index, tracks[] }` |
| `track-select` | `my-playlist` | `my-audio-player` | `document` | `{ index }` |
| `track-import` | `my-playlist` | `my-audio-player` | `document` | `{ track }` |
| `playlist-clear` | `my-playlist` | `my-audio-player` | `document` | — |
| `audio-play` | `my-audio-player` | `my-butterchurn`, page hôte | `document` | — |
| `audio-pause` | `my-audio-player` | `my-butterchurn`, page hôte | `document` | — |

Tous ces événements transitent via `document` (non bubbling natif, dispatchés directement sur `document`) ce qui permet aux composants de communiquer sans être imbriqués ni se connaître mutuellement.

---

## 10. Exemples d'intégration

### Lecteur minimal (sans playlist, sans effets)

```html
<script type="module" src="https://host.com/components/audioplayer.js"></script>
<my-audio-player src="https://host.com/tracks.json"></my-audio-player>
```

### Lecteur + playlist synchronisée

```html
<script type="module" src="https://host.com/components/audioplayer.js"></script>
<script type="module" src="https://host.com/components/Playlist.js"></script>

<my-audio-player src="https://host.com/tracks.json"></my-audio-player>
<my-playlist></my-playlist>
<!-- Synchronisation automatique via track-changed / track-select sur document -->
```

### Chaîne complète avec égaliseur et visualiseur

```html
<script type="module" src="https://host.com/components/audioplayer.js"></script>
<script type="module" src="https://host.com/components/equalizer.js"></script>
<script type="module" src="https://host.com/components/waveform.js"></script>

<my-audio-player id="player" src="./tracks.json"></my-audio-player>
<my-eq id="eq" preset="0,0,0,0,0,0"></my-eq>
<my-waveform id="waveform" color="#39e082"></my-waveform>

<script type="module">
  await Promise.all([
    customElements.whenDefined('my-audio-player'),
    customElements.whenDefined('my-eq'),
    customElements.whenDefined('my-waveform'),
  ]);
  // Chaîne audio : player → eq → waveform → ctx.destination
  document.querySelector('#player').connectComponent(document.querySelector('#eq'));
  document.querySelector('#eq').connectComponent(document.querySelector('#waveform'));
</script>
```

### Écouter les changements de piste depuis la page hôte

```javascript
document.addEventListener('track-changed', ({ detail }) => {
  const { track, index, tracks } = detail;
  console.log(`Piste ${index + 1}/${tracks.length} : ${track.title} — ${track.artist}`);
  document.title = `♪ ${track.title}`;
});
```

### Lire la piste courante directement

```javascript
await customElements.whenDefined('my-audio-player');
const player = document.querySelector('my-audio-player');
console.log(player.currentTrack); // { id, title, artist, audio, cover }
```
