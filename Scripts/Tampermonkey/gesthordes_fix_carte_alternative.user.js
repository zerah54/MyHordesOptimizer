// ==UserScript==
// @name         Fix Gest'Hordes - Carte Alternative + Zombies
// @version      1.1
// @description  Ajoute les blocs manquants à la carte alternative de GH ainsi que 0 en nombre de zombies quand la case n'a jamais été visitée
// @author       Zerah
//
// @downloadURL  https://github.com/zerah54/MyHordesOptimizer/raw/main/Scripts/Tampermonkey/gesthordes_fix_carte_alternative.user.js
// @updateURL    https://github.com/zerah54/MyHordesOptimizer/raw/main/Scripts/Tampermonkey/gesthordes_fix_carte_alternative.user.js
//
// @match        https://gest-hordes2.eragaming.fr/carte/*
// @match        https://gest-hordes2.eragaming.fr/carte
//
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const display_no_object = true;

    /** La checkbox d'option d'affichage de la carte alternative */
    let carte_alter_checkbox = document.querySelector('#param_carte_carteAlter');
    /** La checkbox d'option d'affichage de la carte alternative */
    let carte_zombie_checkbox = document.querySelector('#param_carte_zombie');

    /** On récupère la liste des cases de la carte */
    let cases_carte = Array.from(document.querySelectorAll('.caseCarte'));

    /** Pour chaque élément de cette liste */
    cases_carte
    /** On ne conserve que les cartes qui N'ONT PAS la partie "carteAlter" */
        .filter((case_carte) => !case_carte.querySelector('.carteAlter'))
    /** Pour chacune de ces cases, on va vouloir ajouter partie manquante */
        .forEach((case_carte) => {
        /** On crée une div dans laquelle on va injecter le contenu */
        let carte_alter_div = document.createElement('div');
        /** On ajoute les bonnes classes à la liste des classes de la nouvelle div, en fonction de la taille de la carte et de la visibilité de l'option */
        carte_alter_div.classList.add('carteAlter', (case_carte.classList.contains('ptCarte') ? 'ptCarte' : 'gdCarte'), (carte_alter_checkbox.checked ? 'optionCarteVisible' : 'optionCarteNonVisible'));
        /** On ajoute le contenu de la case (on le fait via du innerHTML car ce contenu est simple, si il était complexe on ferait un nouveau 'createElement' puis un ajout à la div via 'appendChild') */
        carte_alter_div.innerHTML = `<div class="divCarteAlter"><span class="itemDechargeable">${display_no_object ? '0' : ''}</span></div>`;
        /** On ajoute l'attribut indiquant qu'il n'y a pas d'objet, histoire d'être raccords avec les autres cases mais en réalité il n'y en a pas besoin */
        carte_alter_div.setAttribute('data-nbrdecharge', display_no_object ? '0' : '');

        /** On ajoute la div nouvellement créée à la case déjà existante */
        case_carte.appendChild(carte_alter_div);
    });

    if (cases_carte.some((case_carte) => case_carte.querySelector('.zombie'))) {
        /** Pour chaque élément de cette liste */
        cases_carte
        /** On ne conserve que les cartes qui N'ONT PAS la partie "zombie" */
            .filter((case_carte) => !case_carte.querySelector('.zombie'))
        /** Pour chacune de ces cases, on va vouloir ajouter partie manquante */
            .forEach((case_carte) => {
            /** On crée un bloc de SVG dans laquelle on va injecter le contenu */
            let carte_zombie_div = document.createElement('svg');
            carte_zombie_div.classList.add('zombReel', 'zombie', (case_carte.classList.contains('ptCarte') ? 'ptCarte' : 'gdCarte'), (carte_zombie_checkbox.checked ? 'optionCarteVisible' : 'optionCarteNonVisible'));
            carte_zombie_div.innerHTML = display_no_object ? `<use xlink:href="../images/sprite_divers.svg#0z"><symbol viewBox="0 0 42 42" overflow="visible" id="0z" style="display: inline-block; padding-top: 14px; padding-left: 2px" xmlns="http://www.w3.org/2000/svg"><text style="fill:currentColor; transform:translate(8.348, 40.194); font-family:'MyriadPro-Regular'; font-size: 15px">0</text></symbol></use>` : ``;

            /** On ajoute le bloc nouvellement créé à la case déjà existante */
            case_carte.appendChild(carte_zombie_div);
        });
    }
    
})();
