/**
 * Singleton AudioContext — un seul contexte audio par page.
 *
 * Scénario A (CLAUDE.md §3) : module singleton partagé entre composants indépendants.
 * Tous les composants importent getAudioContext() depuis ce module pour garantir
 * qu'un seul AudioContext est créé, même si plusieurs composants sont chargés.
 *
 * Usage :
 *   import { getAudioContext, resumeAudioContext } from './modules/audioContext.js';
 *
 *   // Dans connectedCallback :
 *   this.audioCtx = getAudioContext();
 *
 *   // Sur interaction utilisateur (pour respecter l'autoplay policy) :
 *   const ctx = await resumeAudioContext();
 */

let _ctx = null;

/**
 * Retourne le contexte audio partagé, le créant à la première invocation.
 * Sûr à appeler sans interaction utilisateur — le contexte sera en état
 * 'suspended' jusqu'à ce que resumeAudioContext() soit appelé.
 * @returns {AudioContext}
 */
export function getAudioContext() {
    if (!_ctx) {
        _ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return _ctx;
}

/**
 * Reprend un AudioContext suspendu. Doit être appelé depuis un handler
 * de geste utilisateur (click, keydown…) pour satisfaire l'autoplay policy.
 * @returns {Promise<AudioContext>}
 */
export async function resumeAudioContext() {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();
    return ctx;
}
