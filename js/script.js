window.onload = () => {
    // appelé une fois que la page est chargée
    console.log("Page loaded");

    let ctx = new AudioContext();
    console.log("AudioContext initialized:", ctx);

    // 1ere phase : on cree les composants et on partage l'AudioContext
    let player = document.querySelector('#player');
    player.setAudioContext(ctx);

    let eq = document.querySelector('#eq');
    eq.setAudioContext(ctx);

    let waveform = document.querySelector('#waveform');
    waveform.setAudioContext(ctx);

    // let butterchurn = document.querySelector('#butterchurn');
    // butterchurn.setAudioContext(ctx);

    // 2eme phase : on cree le graphe des composants
    // player -> eq -> waveform -> butterchurn -> destination
    player.connectComponent(eq);
    eq.connectComponent(waveform);
    // waveform.connectComponent(butterchurn);

    // 3eme phase : on connecte le dernier composant à la destination audio
    // on utilise le connect de la classe AudioNode (Web Audio API)
    waveform.getOutputNode().connect(ctx.destination);
}