Projet Web Components 2025_2026

### **Sujet** : un lecteur audio, EQ, playlist, visualiseurs (fréquence, waveform, volumes), effets audio etc. sous forme de purs Web Components (classes qui extends HTMLElement)

#### Travail à faire : 
Développer plusieurs Web Components qui vont cohabiter et se compléter, pour faire un lecteur audio avec des composants additionnels, un peu dans le style de ce que fait le lecteur webamp2 : https://webamp.org/ avec une playlist, un EQ, une playlist évoluée etc.


Vous pourrez également ajouter le support d’effets audio au format WAM (Web Audio Modules), en vous inspirant d’un exemple comme: https://codepen.io/w3devcampus/pen/VYKvMOx?editors=1010 (d’autres effets sont disponibles, voir la WAM gallerie: https://www.webaudiomodules.com/docs/community (cliquez sur wam gellerie, choisissez un des composants effet audio, puis click sur un bouton en dessous pour générer le code. Seul l'URL change d'un composant à l'autre)



#### Contraintes
Apportez une attention particulière à vos composants:
Faible dépendance
Manière dont vous partagez le contexte audio
Paramétrables ? Attributs HTML ?
Je veux que vous documentiez vos décisions de design (composant imbricables ou pas ? Si oui: pourquoi ? Si non : pourquoi ?)
Composants seuls hébergés et projet utilisant les composants séparé. Je dois pouvoir utiliser vos composants dans mon projet (dans ma page html) sans avoir à les installer localement, mais juste en utilisant leurs URIs.
Documentez : je voudrais aussi un post-mortem des outils IA utilisés, comment vous les avez utilisés, quels fichiers de règles / contraintes vous avez créé, à partir de quels prompts etc.


#### Modalités de rendu
**A rendre le 3 Avril** : Marilou préparera un tableau google spreadsheet, avec
une colonne avec les noms des binômes,
une colonne avec le ou les repos github,
_SI LE REPO EST PRIVÉ_ : m’envoyer une invitation (user GitHub = micbuffa)
- Le Repo GitHub contiendra 
  - un README.txt et des fichiers .md ayant servi pour les outils IA. 
  - une colonne avec le lien d’hébergement de vos composants, 
  - une colonne avec le lien d’hébergement de votre projet utilisant les composants, 
  - une colonne avec une vidéo YouTube de démonstration et donnant des détails de conception et/ou d’implémentation (choses dont vous êtes les plus fiers)