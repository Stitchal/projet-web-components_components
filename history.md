# History

## [2026-04-02] — Contrôle du volume du piano (wam-host)

- **Fichiers modifiés** : `index.html`, `js/script.js`, `css/styles.css`
- **Type** : `feature`
- **Description** : Ajout d'un slider de volume dans la titlebar de la fenêtre SOUNDFONT. Interception de l'assignation `audioContext` sur l'instance `wam-host` via `Object.defineProperty` + `Proxy` pour insérer un `GainNode` entre le plugin et `ctx.destination`, avant que `connectPlugins()` soit appelé.
- **Raison** : Le volume du piano était trop bas. Le wam-host ne fournit pas d'API de volume externe, donc l'interception via Proxy du contexte audio est la seule solution sans modifier le code WAM.
- **Skills appliqués** : `web-audio`
- **Décisions de design** : Approche Proxy plutôt qu'`Object.defineProperty` sur `ctx.destination` (propriété native non configurable). Le slider va de 0 à 200% (valeur par défaut 100%).

---

## [2026-04-02] — Refactoring architecture : composants autonomes, attributs HTML, chemins distants

- **Fichiers modifiés** : `components/ConnectableComponent.js`, `components/audioplayer.js`, `components/equalizer.js`, `components/waveform.js`, `js/script.js`, `index.html`
- **Fichiers créés** : `components/modules/audioContext.js`
- **Type** : `refactor`
- **Description** :
  - Création du singleton `audioContext.js` (Scénario A, CLAUDE.md §3) partagé entre tous les composants via `import { getAudioContext, resumeAudioContext }`
  - Ajout de `initAudioGraph()` dans `ConnectableComponent` : chaque composant construit son graphe audio de façon autonome dans `connectedCallback`, sans orchestrateur externe
  - `connectComponent()` déroute désormais la sortie de `ctx.destination` avant de connecter au nœud cible (reroutage propre)
  - Fix chemins d'assets cassés à distance : `const BASE = new URL('.', import.meta.url).href` pour toutes les images webaudiocontrols ; résolution des chemins `tracks.json` et des URLs audio/cover contre l'URL du JSON lui-même
  - Ajout d'attributs HTML observés sur tous les composants : `src`, `autoplay` (`my-audio-player`) ; `preset` (`my-eq`) ; `color`, `fft-size` (`my-waveform`)
  - `disconnectedCallback` propre sur tous les composants : abort des listeners (AbortController), déconnexion des nœuds audio, arrêt de la boucle rAF (waveform)
  - Tous les champs publics d'implémentation interne renommés en champs privés (`#filters`, `#tracks`, `#analyser`, etc.)
  - `script.js` simplifié : suppression de `new AudioContext()` et des `setAudioContext()` ; il ne sert plus qu'à câbler la chaîne studio et activer les fenêtres draggables
- **Raison** : Exigences du cours — composants utilisables via URI distante, paramétrables par attributs HTML, faiblement couplés, nettoyage mémoire correct.
- **Skills appliqués** : `web-components`, `web-audio`
- **Décisions de design** :
  - **Architecture hybride standalone + chaînable** : par défaut chaque composant est autonome (se connecte à `ctx.destination`). `connectComponent()` permet le chaînage optionnel (`player → eq → waveform → destination`) sans rendre les composants dépendants les uns des autres. Alternative "imbrication pure" rejetée car elle exige un composant parent — incompatible avec l'usage via URI distante. Alternative "standalone pur" rejetée car l'EQ et le Waveform sont inutiles sans source audio.
  - **`import.meta.url` comme seul mécanisme de résolution de chemins** : garantit que les assets (images, JSON) sont résolus relativement au fichier composant, pas à la page HTML. Fonctionne en local, GitHub Pages et CDN sans modification.
  - **Singleton via module ES** : `let _ctx = null` dans un module ES garantit une instance unique par realm — singleton natif sans boilerplate de classe statique.
  - **`setAudioContext()` conservé** : rétrocompatibilité avec les usages Scénario B (parent distribue le contexte). La garde `#audioGraphBuilt` empêche un double appel à `buildAudioGraph()`.

---

## [2026-04-02] — Refonte compacte du layout `<my-audio-player>`

- **Fichiers modifiés** : `components/audioplayer.js`
- **Type** : `style`
- **Description** : Réduction de la largeur à 340px, cover ramenée à 86px, knobs passés en colonne verticale à droite, `#playerContainer` remplacé par `#playerCenter` (pas de fond/bordure superflu). Playlist compacte avec items à 26px de hauteur.
- **Raison** : Le composant était trop large et prenait trop de place à l'écran.
- **Skills appliqués** : `web-components`, `frontend-design`

---



- **Fichiers modifiés** : `components/audioplayer.js`
- **Type** : `feature`
- **Description** : Remplacement du `<select>` de sélection de piste par une playlist visuelle avec miniatures, titre, artiste et numéro. Ajout des boutons Prev/Next, auto-passage à la piste suivante en fin de lecture, et mise en surbrillance de la piste active.
- **Raison** : Amélioration de l'UX — la liste déroulante n'affichait pas les covers et ne permettait pas la navigation rapide.
- **Skills appliqués** : `web-components`, `frontend-design`
- **Décisions de design** : Event delegation sur `#playlist` pour la sélection ; `#currentIndex` en champ privé ; `scrollIntoView` pour garder la piste active visible.

---

## [2026-03-31] — Intégration du plugin WAM Soundfont via `<wam-host>`

- **Fichiers modifiés** : `index.html`, `css/styles.css`, `js/script.js`
- **Type** : `feature`
- **Description** : Intégration déclarative du plugin WAM Soundfont via les web components `<wam-host>` et `<wam-plugin>` (chargés depuis `mainline.i3s.unice.fr`). Ajout d'une quatrième fenêtre draggable `#win-wam` positionnée en bas à droite du layout 2×2 initial. La fenêtre respecte le même système de magnétisme que les autres.
- **Raison** : Approche déclarative plus propre que le chargement manuel JS — le `<wam-host>` gère lui-même le contexte audio et le rendu du plugin.
- **Skills appliqués** : `web-audio`, `web-components`

---

## [2026-03-31] — Fenêtres draggables avec magnétisme (style WebAmp)

- **Fichiers modifiés** : `index.html`, `css/styles.css`, `js/script.js`
- **Fichiers créés** : `js/dragManager.js`
- **Type** : `feature`
- **Description** : Les trois composants sont désormais des fenêtres déplaçables à la souris via une titlebar. Un système de magnétisme (seuil 20px) colle les bords entre eux et sur les bords de l'arène. Chaque fenêtre monte au premier plan (z-index) au clic. Positions initiales centrées calculées dynamiquement depuis `window.innerWidth/Height`.
- **Raison** : Expérience utilisateur inspirée de WebAmp — organisation libre des fenêtres audio.
- **Skills appliqués** : `web-components`, `frontend-design`
- **Décisions de design** : Module `dragManager.js` isolé (aucune dépendance aux composants). Les composants eux-mêmes ne sont pas modifiés. Le snap est indépendant sur les axes X et Y : le meilleur candidat par axe l'emporte.

---

## [2026-03-31] — Migration CSS vers `adoptedStyleSheets`

- **Fichiers modifiés** : `index.html`, `components/audioplayer.js`, `components/equalizer.js`, `components/waveform.js`
- **Type** : `refactor`
- **Description** : Remplacement des balises `<style>` injectées via `setHTMLUnsafe` par des `CSSStyleSheet` construits au niveau module et assignés via `shadowRoot.adoptedStyleSheets`. Google Fonts déplacées dans `index.html` (via `<link preconnect>`) car `@import` n'est pas supporté dans les constructed stylesheets. Le `const html` du player extrait de `render()` au niveau module.
- **Raison** : Pratique moderne recommandée — la feuille CSS est partagée entre toutes les instances du composant (un seul objet en mémoire), séparation claire HTML / CSS dans le code.
- **Skills appliqués** : `web-components`
- **Décisions de design** : Fonts chargées une seule fois dans `index.html` ; elles héritent naturellement à travers le Shadow DOM via `font-family`.

---

## [2026-03-31] — Redesign visuel "Obsidian Studio"

- **Fichiers modifiés** : `css/styles.css`, `index.html`, `components/audioplayer.js`, `components/equalizer.js`, `components/waveform.js`
- **Type** : `style`
- **Description** : Refonte complète de l'interface vers un thème "dark studio" : fond near-black (#08080f) avec halos ambiants, panneaux sombres (#11111c) avec bordures fines d'un pixel, accent ambre (#e8a020) pour la barre de progression du player, waveform verte électrique (#39e082) avec glow sur canvas, typographie `Space Mono` (valeurs numériques) + `Barlow Condensed` (labels). Ajout d'un header avec indicateur lumineux animé. Les valeurs dB de l'EQ s'allument en ambre dès qu'elles diffèrent de 0.
- **Raison** : Modernisation de l'interface — sortir du bleu uniforme générique vers une esthétique rack hardware haut de gamme.
- **Skills appliqués** : `frontend-design`, `web-components`
- **Décisions de design** : Google Fonts chargées via `@import` CSS dans chaque Shadow DOM (pas de librairie JS). `shadowBlur` réinitialisé à 0 après chaque stroke canvas pour éviter les artefacts.

---

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
