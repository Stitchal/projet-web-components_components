# CLAUDE.md — Lecteur Audio Web Components 2025-2026

## 1. Contexte & contraintes

### Stack technique
- **Langage** : Vanilla JavaScript (ESM)
- **UI** : Web Components natifs (`extends HTMLElement`, `customElements.define`)
- **Audio** : Web Audio API native du navigateur
- **Style** : CSS natif avec Shadow DOM

### Ce que Claude ne doit JAMAIS faire
- Importer ou suggérer un framework (React, Vue, Angular, Svelte, etc.)
- Utiliser une librairie externe (sauf WAM pour les effets audio)
- Utiliser `innerHTML` — préférer `setHTMLUnsafe()` ou la création de nœuds via DOM API
- Créer plusieurs `AudioContext` — un seul par page (voir section 3)
- Utiliser `getElementBy*()` — préférer `querySelector*()`
- Écrire du CSS global qui brise l'encapsulation Shadow DOM

---

## 2. Architecture & bonnes pratiques

### Composants indépendants et faiblement couplés

Chaque composant doit :
- Fonctionner seul, sans dépendre d'un autre composant spécifique
- Être utilisable via une URI distante sans installation locale
- Exposer son API via des **attributs HTML** et des **propriétés JS**
- Communiquer vers l'extérieur uniquement via **CustomEvents**

```javascript
// ✅ Bon : composant autonome
class AudioPlayer extends HTMLElement {
  static get observedAttributes() { return ['src', 'autoplay']; }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'src') this.#loadTrack(newVal);
  }
}

// ❌ Mauvais : couplage fort avec un autre composant
class AudioPlayer extends HTMLElement {
  connectedCallback() {
    this._playlist = document.querySelector('audio-playlist'); // couplage fort !
  }
}
```

### Paramétrage via attributs HTML

Chaque composant **doit documenter explicitement ses attributs HTML** dans un commentaire JSDoc en tête de fichier :

```javascript
/**
 * @element audio-player
 * @attr {string} src - URL de la piste audio à charger
 * @attr {boolean} autoplay - Lance la lecture automatiquement
 * @attr {number} volume - Volume initial (0.0 à 1.0, défaut : 1.0)
 *
 * @fires track-changed - Quand la piste change ({ detail: { track, index } })
 * @fires playback-state - Quand play/pause change ({ detail: { playing } })
 *
 * @prop {string} src - Équivalent de l'attribut src
 * @prop {AudioNode} outputNode - Nœud de sortie Web Audio pour branchement externe
 */
class AudioPlayer extends HTMLElement {
  static get observedAttributes() { return ['src', 'autoplay', 'volume']; }
}
```

Règles pour les attributs :
- Toujours déclarer dans `observedAttributes` les attributs qui doivent réagir à des changements
- Synchroniser attribut ↔ propriété JS (`get`/`set`) pour les valeurs pilotables depuis JS
- Les valeurs booléennes suivent la convention HTML : présence = `true`, absence = `false`

### Décisions de design : composants imbriquables ou autonomes ?

**Avant de créer un composant**, décider et documenter explicitement s'il est :

| Mode | Description | Quand l'utiliser |
|------|-------------|-----------------|
| **Autonome** | S'importe seul via URI, gère lui-même ses dépendances (AudioContext via singleton) | Composants réutilisables dans n'importe quel projet tiers |
| **Imbriqué** | Conçu pour vivre à l'intérieur d'un composant parent qui lui fournit le contexte audio | Sous-composants fortement liés à un parent (ex: visualiseur interne à un player) |

Documenter la décision dans le fichier du composant et dans `history.md` :

```javascript
/**
 * DÉCISION DE DESIGN : composant AUTONOME
 * Raison : réutilisable dans tout projet tiers via URI, sans dépendance à un parent spécifique.
 * AudioContext : importé depuis le singleton audioContext.js.
 * Alternative écartée : composant imbriqué — trop couplé au projet parent.
 */
```

```javascript
/**
 * DÉCISION DE DESIGN : composant IMBRIQUÉ (enfant de <audio-player>)
 * Raison : ce composant n'a de sens qu'en présence d'un nœud audio fourni par le parent.
 * AudioContext : reçu via la propriété JS `audioContext` injectée par le parent.
 * Alternative écartée : autonome — nécessiterait de dupliquer la logique de source audio.
 */
```

### Utilisation via URI distante (hébergement séparé)

Les composants sont conçus pour être **hébergés séparément** du projet qui les consomme. Un projet tiers doit pouvoir les utiliser sans installation locale, via un simple import :

```html
<!-- Dans n'importe quelle page HTML tierce -->
<script type="module" src="https://cdn.example.com/components/AudioPlayer.js"></script>
<audio-player src="https://example.com/audio/track.mp3"></audio-player>
```

Pour garantir cette portabilité :
- **Aucun chemin relatif** vers des ressources extérieures au composant (images, fonts, etc.) — utiliser des URLs absolues ou des `import.meta.url` relatifs au fichier
- **Aucun import de module** qui suppose une structure de projet spécifique — les modules partagés (ex: `audioContext.js`) doivent être importés via URL absolue configurable ou re-exportés depuis le composant lui-même
- Les **styles** sont encapsulés dans le Shadow DOM — aucune feuille de style globale requise
- Les **assets statiques** référencés (sons, icônes) doivent être accessibles via URL absolue passée en attribut, jamais codés en dur avec un chemin relatif

### Encapsulation via Shadow DOM

```javascript
class MyComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.append(this.#buildTemplate());
    this.#loadStyles();
  }

  #buildTemplate() {
    const tpl = document.createElement('template');
    tpl.setHTMLUnsafe(/* html */`
      <slot></slot>
      <div class="container"></div>
    `);
    return tpl.content.cloneNode(true);
  }

  async #loadStyles() {
    const sheet = new CSSStyleSheet();
    await sheet.replace(/* css */`
      :host { display: block; }
      .container { /* ... */ }
    `);
    this.shadowRoot.adoptedStyleSheets = [sheet];
  }
}
```

### Communication inter-composants

| Direction | Mécanisme |
|-----------|-----------|
| Parent → Enfant | Attributs HTML, propriétés JS |
| Enfant → Parent | `CustomEvent` avec `bubbles: true, composed: true` |
| Composants indépendants | Événements sur `document` ou module de state partagé |

```javascript
// Émettre un événement (enfant → parent ou global)
this.dispatchEvent(new CustomEvent('track-changed', {
  detail: { track, index },
  bubbles: true,
  composed: true  // traverse le Shadow DOM
}));

// Écouter depuis n'importe où
document.addEventListener('track-changed', ({ detail }) => {
  console.log(detail.track);
});
```

### Cycle de vie des composants

```javascript
class MyComponent extends HTMLElement {
  // Appelé quand le composant est inséré dans le DOM
  connectedCallback() {
    this.#init();
    this.#bindEvents();
  }

  // Appelé quand le composant est retiré du DOM — nettoyer !
  disconnectedCallback() {
    this.#cleanup();
    this._abortController?.abort(); // annuler les event listeners
  }

  // Appelé quand un attribut observé change
  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    this[`#on_${name}`]?.(newVal);
  }

  // Appelé quand le composant est déplacé dans un nouveau document
  adoptedCallback() { /* rare, mais à prévoir */ }

  #bindEvents() {
    this._abortController = new AbortController();
    const { signal } = this._abortController;
    this.shadowRoot.querySelector('button')
      ?.addEventListener('click', this.#handleClick, { signal });
  }

  #cleanup() {
    this._abortController?.abort();
  }
}
```

---

## 3. Gestion du AudioContext (Web Audio API)

### Règle absolue : un seul `AudioContext` par page

Créer plusieurs `AudioContext` est coûteux et limité par les navigateurs.

### Scénario A : Module singleton partagé (composants indépendants)

```javascript
// src/modules/audioContext.js
let _ctx = null;

export function getAudioContext() {
  if (!_ctx) {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return _ctx;
}

export async function resumeAudioContext() {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') await ctx.resume();
  return ctx;
}
```

```javascript
// Dans n'importe quel composant indépendant
import { getAudioContext, resumeAudioContext } from '../modules/audioContext.js';

class Visualizer extends HTMLElement {
  async connectedCallback() {
    this._ctx = await resumeAudioContext();
    this._analyser = this._ctx.createAnalyser();
  }
}
```

### Scénario B : Parent fournit le contexte (composants imbriqués)

```javascript
// Composant parent — crée et distribue le contexte
class AudioPlayer extends HTMLElement {
  connectedCallback() {
    const ctx = getAudioContext();
    // Passer le contexte aux enfants via propriété JS
    this.querySelectorAll('audio-visualizer, audio-eq').forEach(child => {
      child.audioContext = ctx;
    });
    // Ou via un événement custom vers les enfants intéressés
    this.dispatchEvent(new CustomEvent('audio-context-ready', {
      detail: { ctx },
      bubbles: false
    }));
  }
}

// Composant enfant — reçoit le contexte
class AudioEq extends HTMLElement {
  set audioContext(ctx) {
    this._ctx = ctx;
    this.#init();
  }
}
```

### Autoplay policy — toujours gérer la suspension

```javascript
// ✅ Toujours catch sur .play()
audio.play().catch(() => {});

// ✅ Reprendre le contexte sur interaction utilisateur
document.addEventListener('click', () => resumeAudioContext(), { once: true });
```

---

## 4. Conventions

### Structure des dossiers

```
index.html                    # Point d'entrée HTML
main.js                       # Point d'entrée JS (type="module")
src/
  components/                 # Web Components (un fichier JS + un CSS par composant)
    AudioPlayer.js
    AudioPlayer.css
    Playlist.js
    Playlist.css
    Equalizer.js
    Visualizer.js
    VolumeControl.js
  modules/                    # Modules utilitaires réutilisables
    audioContext.js            # Singleton AudioContext
    audioService.js            # Gestion playback, preload, cloneNode
public/                       # Assets statiques (audio, fonts, images)
```

### Nommage

| Élément | Convention | Exemple |
|---------|------------|---------|
| Fichier composant | PascalCase | `AudioPlayer.js` |
| Classe composant | PascalCase | `class AudioPlayer` |
| Tag HTML custom | kebab-case | `<audio-player>` |
| Fichier module | camelCase | `audioContext.js` |
| Méthodes privées | `#camelCase` | `#loadTrack()` |
| Events custom | kebab-case | `track-changed` |

### Style de code

- Méthodes privées avec `#` (champs privés ES2022)
- `const` par défaut, `let` si nécessaire, jamais `var`
- `async/await` plutôt que `.then().catch()`
- Préfixer les templates littéraux : `/* html */`, `/* css */`, `/* svg */`
- Imports nommés plutôt que default : `import { foo } from './bar.js'`

---

## 5. Dossier `.agents/skills/` — Skills à appliquer

Le dossier `.agents/skills/` contient des **skills spécialisés** avec des règles et patterns validés en production. **Toujours consulter le skill pertinent avant de générer du code.**

### Skills disponibles

| Skill | Fichier | Quand l'activer |
|-------|---------|-----------------|
| `web-components` | `.agents/skills/web-components/SKILL.md` | Tout code de composant (structure, DOM, CSS, JS) |
| `web-audio` | `.agents/skills/web-audio/SKILL.md` | Tout code audio (AudioContext, playback, effets, Web Audio API) |
| `frontend-design` | `.agents/skills/frontend-design/SKILL.md` | UI, styles, animations, mise en page |
| `find-skills` | `.agents/skills/find-skills/SKILL.md` | Rechercher un nouveau skill si besoin |

### Règles d'application

1. **Avant toute modification**, identifier quel(s) skill(s) s'appliquent et les lire
2. **Respecter strictement** les contraintes marquées "non-negotiable" dans chaque skill
3. **Suivre les workflows** de structure de fichiers et de nommage définis dans chaque skill
4. **Valider avec les checklists** présentes en fin de chaque skill

---

## 6. Suivi des modifications — history.md

**Après chaque modification**, mettre à jour `history.md` en ajoutant une entrée en haut du fichier.

### Structure attendue de history.md

```markdown
# History

## [YYYY-MM-DD] — <Titre court de la modification>

- **Fichiers modifiés** : `src/components/Foo.js`, `src/modules/bar.js`
- **Type** : `feature` | `fix` | `refactor` | `style` | `docs`
- **Description** : Ce qui a été fait concrètement
- **Raison** : Pourquoi ce changement a été nécessaire
- **Skills appliqués** : `web-components`, `web-audio`
- **Décisions de design** : (optionnel) choix d'architecture, alternatives écartées

---
```

### Exemple

```markdown
## [2026-03-30] — Ajout du composant AudioPlayer

- **Fichiers modifiés** : `src/components/AudioPlayer.js`, `src/components/AudioPlayer.css`
- **Type** : `feature`
- **Description** : Création du composant `<audio-player>` avec contrôles play/pause/seek et gestion du volume.
- **Raison** : Composant central du lecteur, point d'entrée pour les autres composants.
- **Skills appliqués** : `web-components`, `web-audio`
- **Décisions de design** : Composant autonome (pas imbriqué) — importe directement le singleton audioContext.js pour ne pas dépendre d'un parent spécifique.

---
```

---

## Checklist avant chaque commit

- [ ] Aucun `new AudioContext()` en dehors de `src/modules/audioContext.js`
- [ ] Tout `.play()` a un `.catch(() => {})`
- [ ] Aucun framework ou librairie non autorisée importée
- [ ] Les composants sont utilisables via URI distante (pas de chemins relatifs cassés)
- [ ] `disconnectedCallback` nettoie les event listeners et les nœuds audio
- [ ] `history.md` mis à jour
- [ ] Checklists des skills pertinents validées
- [ ] Chaque composant documente ses attributs HTML dans un commentaire JSDoc en tête de fichier
- [ ] La décision autonome/imbriqué est documentée dans le fichier du composant et dans `history.md`
- [ ] Le partage du `AudioContext` est explicite : singleton (autonome) ou injection par le parent (imbriqué)
- [ ] Aucun chemin relatif vers une ressource externe au composant — portabilité via URI garantie
