import { getAudioContext } from './modules/audioContext.js';

/**
 * Classe abstraite pour tous les composants audio Web.
 *
 * ## Décision de design : architecture hybride standalone + chaînable
 *
 * Chaque composant est AUTONOME par défaut :
 *   - Il récupère le singleton AudioContext via getAudioContext()
 *   - Il construit son graphe audio dans connectedCallback (via initAudioGraph())
 *   - Il connecte sa sortie à ctx.destination par défaut
 *
 * Il peut optionnellement être CHAÎNÉ avec d'autres composants :
 *   - player.connectComponent(eq) déroute player.outputNode de ctx.destination
 *     vers eq.getInputNode(), assemblant la chaîne player → eq → destination
 *
 * ## Partage du contexte audio
 *
 * Tous les composants importent getAudioContext() depuis ./modules/audioContext.js,
 * garantissant un unique AudioContext par page sans coordination externe.
 * setAudioContext() est conservé pour rétrocompatibilité (Scénario B, CLAUDE.md §3).
 */
export class ConnectableComponent extends HTMLElement {
    /** @type {boolean} Empêche buildAudioGraph() d'être appelé plus d'une fois */
    #audioGraphBuilt = false;
    /** @type {boolean} Indique si la sortie est connectée à ctx.destination */
    #connectedToDestination = false;

    constructor() {
        super();
    }

    /**
     * Initialise le graphe audio en utilisant le singleton AudioContext.
     * Appelé dans connectedCallback() de chaque sous-classe pour garantir
     * l'autonomie — aucun orchestrateur externe n'est requis.
     */
    initAudioGraph() {
        if (this.#audioGraphBuilt) return;
        if (!this.audioCtx) this.audioCtx = getAudioContext();
        this.buildAudioGraph();
        this.#audioGraphBuilt = true;
    }

    /**
     * Définit le contexte audio depuis l'extérieur (rétrocompatibilité).
     * Si le graphe n'a pas encore été construit, le construit immédiatement.
     * @param {AudioContext} audioCtx
     */
    setAudioContext(audioCtx) {
        this.audioCtx = audioCtx;
        if (!this.#audioGraphBuilt) {
            this.buildAudioGraph();
            this.#audioGraphBuilt = true;
        }
    }

    /**
     * Construit le graphe audio du composant.
     * Doit être implémenté par chaque sous-classe.
     * @abstract
     */
    buildAudioGraph() {
        throw new Error('buildAudioGraph() must be implemented in subclass');
    }

    /**
     * Retourne le nœud d'entrée audio du composant.
     * @abstract
     * @returns {AudioNode}
     */
    getInputNode() {
        throw new Error('getInputNode() must be implemented in subclass');
    }

    /**
     * Retourne le nœud de sortie audio du composant.
     * @abstract
     * @returns {AudioNode}
     */
    getOutputNode() {
        throw new Error('getOutputNode() must be implemented in subclass');
    }

    /**
     * Marque la sortie comme connectée à ctx.destination.
     * Appelé par les sous-classes dans buildAudioGraph() après avoir connecté
     * leur nœud de sortie à ctx.destination.
     * @protected
     */
    _markConnectedToDestination() {
        this.#connectedToDestination = true;
    }

    /**
     * Connecte la sortie de ce composant à l'entrée d'un autre composant.
     * Si ce composant était connecté à ctx.destination par défaut, cette
     * connexion est d'abord supprimée (reroutage).
     *
     * @param {ConnectableComponent} component - Le composant cible
     */
    connectComponent(component) {
        if (typeof component.getInputNode !== 'function') {
            console.error(`${this.constructor.name}: connectComponent() — la cible n'a pas de getInputNode()`);
            return;
        }
        // Dérouter depuis ctx.destination si nécessaire
        if (this.#connectedToDestination) {
            try {
                this.getOutputNode().disconnect(getAudioContext().destination);
            } catch (_) { /* déjà déconnecté */ }
            this.#connectedToDestination = false;
        }
        this.getOutputNode().connect(component.getInputNode());
    }

    /**
     * Appelé quand le composant est retiré du DOM.
     * Les sous-classes doivent surcharger cette méthode pour nettoyer
     * leurs propres ressources, puis appeler super.disconnectedCallback().
     */
    disconnectedCallback() {
        // Les sous-classes gèrent leurs propres nœuds audio et listeners
    }
}
