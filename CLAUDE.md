# CLAUDE.md — Lecteur Audio Web Components 2025-2026

## 1. Contraintes absolues

- **Stack** : Vanilla JS (ESM), Web Components natifs, Web Audio API, CSS + Shadow DOM
- Jamais de framework (React, Vue, Angular…) ni librairie externe (sauf WAM)
- Jamais `innerHTML` → utiliser `setHTMLUnsafe()` ou DOM API
- Jamais plusieurs `AudioContext` → un seul par page via `components/modules/audioContext.js`
- Jamais `getElementBy*()` → utiliser `querySelector*()`
- Jamais de CSS global qui brise l'encapsulation Shadow DOM

---

## 2. Architecture des composants

### Règles fondamentales

- Fonctionne **seul**, sans dépendre d'un autre composant spécifique
- Utilisable via **URI distante** sans installation locale — pas de chemins relatifs vers des ressources externes ; utiliser `import.meta.url` pour les assets internes au composant
- API exposée via **attributs HTML** + **propriétés JS** documentés en JSDoc en tête de fichier
- Communication externe uniquement via **CustomEvents** sur `document`

### Décision autonome / imbriqué (obligatoire à documenter)

| Mode | Quand | AudioContext |
|------|-------|--------------|
| **Autonome** | Réutilisable dans tout projet tiers | Singleton `audioContext.js` |
| **Imbriqué** | Sous-composant lié à un parent spécifique | Injecté par le parent via propriété JS |

```javascript
/** DÉCISION DE DESIGN : AUTONOME — réutilisable via URI, AudioContext : singleton.
 *  DÉCISION DE DESIGN : IMBRIQUÉ (enfant de <x>) — AudioContext : injecté par parent. */
```

### Communication inter-composants

| Direction | Mécanisme |
|-----------|-----------|
| Parent → Enfant | Attributs HTML, propriétés JS |
| Enfant → Parent | `CustomEvent` `bubbles: true, composed: true` |
| Composants indépendants | Événements sur `document` |

### Paramétrage — attributs HTML

Documenter chaque attribut en JSDoc (`@attr`, `@prop`, `@fires`) et déclarer dans `observedAttributes`. Synchroniser attribut ↔ propriété JS via `get`/`set`. Booléens : présence = `true`.

### Cycle de vie — nettoyage obligatoire

`disconnectedCallback` : appeler `this.#abortController?.abort()` et déconnecter tous les nœuds audio.

---

## 3. AudioContext — règle absolue

Un seul `AudioContext` par page via le singleton :

```javascript
import { getAudioContext, resumeAudioContext } from './modules/audioContext.js';
// resumeAudioContext() depuis un handler utilisateur ; tout .play() → .catch(() => {})
```

Chaînage de composants via `ConnectableComponent.connectComponent(target)` — déroute automatiquement depuis `ctx.destination`.

---

## 4. Conventions

| Élément | Convention | Exemple |
|---------|------------|---------|
| Fichier composant | PascalCase | `AudioPlayer.js` |
| Tag HTML custom | kebab-case | `<audio-player>` |
| Fichier module | camelCase | `audioContext.js` |
| Méthodes privées | `#camelCase` | `#loadTrack()` |
| Events custom | kebab-case | `track-changed` |

**Style** : champs privés `#`, `const` par défaut, `async/await`, templates préfixés `/* html */` `/* css */`, imports nommés.

---

## 5. Skills à appliquer avant toute modification

| Skill | Quand |
|-------|-------|
| `web-components` | Tout code de composant (DOM, CSS, structure) |
| `web-audio` | Tout code audio / Web Audio API |
| `frontend-design` | UI, styles, animations |

---

## 6. Fichiers de suivi

**`history.md`** — entrée en haut après chaque modification :
```
## [YYYY-MM-DD] — Titre
- Fichiers modifiés, Type, Description, Raison, Skills appliqués, Décisions de design
```

**`SPECIFICATION.md`** — API publique de chaque composant (tag, attributs, propriétés, méthodes, événements émis/écoutés). **Mettre à jour** si attribut / propriété / méthode / événement change, ou à la création d'un composant.

---

## Checklist avant chaque commit

- [ ] Aucun `new AudioContext()` hors de `components/modules/audioContext.js`
- [ ] Tout `.play()` a un `.catch(() => {})`
- [ ] Aucun framework ou librairie non autorisée
- [ ] Composants utilisables via URI distante (pas de chemins relatifs externes)
- [ ] `disconnectedCallback` nettoie listeners et nœuds audio
- [ ] Décision autonome/imbriqué documentée dans le fichier composant
- [ ] Attributs HTML documentés en JSDoc en tête de fichier
- [ ] `history.md` mis à jour
- [ ] `SPECIFICATION.md` mis à jour si l'API a changé
- [ ] Checklists des skills pertinents validées
