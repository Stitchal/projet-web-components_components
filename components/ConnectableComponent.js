/**
 * Classe abstraite représentant un composant audio qui peut être connecté à d'autres composants
 * Tous les composants audio Web (lecteur, égaliseur, visualiseur) doivent hériter de cette classe
 */
export class ConnectableComponent extends HTMLElement {
    constructor() {
        super();
    }

    /**
     * Définit le contexte audio utilisé par ce composant
     * @param {AudioContext} audioCtx - Le contexte audio Web Audio API
     */
    setAudioContext(audioCtx) {
        this.audioCtx = audioCtx;
        this.buildAudioGraph();
    }

    /**
     * Construit le graphe audio du composant
     * Cette méthode doit être implémentée par chaque sous-classe
     * @abstract
     */
    buildAudioGraph() {
        throw new Error('buildAudioGraph() must be implemented in subclass');
    }

    /**
     * Retourne le nœud d'entrée audio du composant
     * @abstract
     * @returns {AudioNode} Le nœud d'entrée audio
     */
    getInputNode() {
        throw new Error('getInputNode() must be implemented in subclass');
    }

    /**
     * Retourne le nœud de sortie audio du composant
     * @abstract
     * @returns {AudioNode} Le nœud de sortie audio
     */
    getOutputNode() {
        throw new Error('getOutputNode() must be implemented in subclass');
    }

    /**
     * Connecte la sortie de ce composant à l'entrée d'un autre composant
     * @param {ConnectableComponent} component - Le composant à connecter
     */
    connectComponent(component) {
        // on vérifie que le component a bien un getInputNode()
        if (typeof component.getInputNode !== 'function') {
            console.error(`${this.constructor.name}: connectComponent: component does not have getInputNode()`);
            return;
        }
        const inputNode = component.getInputNode();
        this.getOutputNode().connect(inputNode);
    }
}
