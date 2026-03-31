# History

## [2026-03-31] — Correction : restauration du bloc `.input-range` dans l'equalizer

- **Fichiers modifiés** : `components/equalizer.js`
- **Type** : `fix`
- **Description** : Restauration du bloc HTML `.input-range` (6 `<input type="range" class="eq-slider">`) supprimé lors du nettoyage précédent.
- **Raison** : Ce bloc était masqué visuellement (`display: none`) mais ses éléments `#eq0`–`#eq5` sont référencés par `defineListeners()` pour synchroniser les knobs WebaudioKnob avec les BiquadFilters. Sa suppression cassait silencieusement les contrôles de l'égaliseur.
- **Skills appliqués** : `web-components`

---

## [2026-03-31] — Nettoyage du code (TP1)

- **Fichiers modifiés** : `js/script.js`, `index.html`, `components/ConnectableComponent.js`, `components/audioplayer.js`, `components/equalizer.js`, `components/waveform.js`
- **Type** : `refactor`
- **Description** : Suppression des `console.log` de debug, remplacement de `innerHTML` par `setHTMLUnsafe()`, conversion `.then()` → `async/await` avec ajout du `.catch(()=>{})` sur `.play()`, remplacement des `let` par `const` là où la variable n'est pas réassignée, suppression du code mort (méthodes inutilisées, bloc HTML caché, CSS dupliqué, propriétés non utilisées), ajout de `type="module"` sur la balise `<script>`.
- **Raison** : Mise en conformité avec les conventions CLAUDE.md et suppression des artefacts de développement laissés dans le code.
- **Skills appliqués** : `web-components`, `web-audio`
- **Décisions de design** : Le `console.warn` dans `audioplayer.js` et le `console.error` dans `ConnectableComponent.js` ont été conservés car ils signalent des états invalides légitimes.

---

## [2026-03-30] — Initialisation du projet

- **Fichiers modifiés** : `index.html`, `css/style.css`, `CLAUDE.md`, `history.md`
- **Type** : `docs`
**Description** : Mise en place de la structure de base du projet et des fichiers de configuration pour Claude Code.
- **Raison** : Initialisation du projet lecteur audio Web Components 2025-2026.
- **Skills appliqués** : `web-components`
- **Décisions de design** : —

---
