// ==UserScript==
// @name         Amélio Gest'Hordes
// @version      1.3
// @description  Ajoute les blocs manquants à la carte alternative de GH ainsi que 0 en nombre de zombies quand la case n'a jamais été visitée. Ajoute des boutons pour choisir une direction de regénération du scrutateur sur laquelle appliquer un ajout de marqueurs pelles. Permet de bouger le bloc des infos de la ville.
// @author       Zerah
//
// @downloadURL  https://github.com/zerah54/MyHordesOptimizer/raw/main/Scripts/Tampermonkey/amelio_gesthordes.user.js
// @updateURL    https://github.com/zerah54/MyHordesOptimizer/raw/main/Scripts/Tampermonkey/amelio_gesthordes.user.js
//
// @match        https://gest-hordes2.eragaming.fr/carte/*
// @match        https://gest-hordes2.eragaming.fr/carte
//
// @grant        GM_xmlhttpRequest
// ==/UserScript==

const api = 'https://api.myhordesoptimizer.fr';

let move_info_ville = false;

/** Récupère l'id de session de l'utilisateur */
async function getPhpSessionId() {
    const gh_maj_case = 'https://gest-hordes2.eragaming.fr/carte/majCase';
    return new Promise((resolve, reject) => {
        let test = GM_xmlhttpRequest({
            method: 'POST',
            url: gh_maj_case,
            onreadystatechange: function(state) {
                if (state.readyState === 2) {
                    let headers = state.responseHeaders;
                    resolve(headers.match(/PHPSESSID=(\w*);/)[1]);
                }
            }
        });
    });
}

/** Permet de déplacer le bloc info villes */
function moveBlockInfoVille() {
    let zoneInfoCarte = document.querySelector('#zoneInfoCarte');
    if (!move_info_ville) {
        zoneInfoCarte.classList.remove('movable');
        zoneInfoCarte.style.width = 'unset';
        zoneInfoCarte.style.height = 'unset';
    } else {
        zoneInfoCarte.classList.add('movable');
        let move_button = zoneInfoCarte.querySelector('#move_info_carte_button');

        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        move_button.onmousedown = (e) => {
            e = e || window.event;
            e.preventDefault();
            // get the mouse cursor position at startup:
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = () => {
                document.onmouseup = null;
                document.onmousemove = null;
            };
            // call a function whenever the cursor moves:
            document.onmousemove = (e) => {
                e = e || window.event;
                e.preventDefault();
                // calculate the new cursor position:
                pos1 = pos3 - e.clientX;
                pos2 = pos4 - e.clientY;
                pos3 = e.clientX;
                pos4 = e.clientY;
                // set the element's new position:
                zoneInfoCarte.style.top = (zoneInfoCarte.offsetTop - pos2) + "px";
                zoneInfoCarte.style.left = (zoneInfoCarte.offsetLeft - pos1) + "px";
            };
        }
    }
}

function placeMoveButton() {
    let zone_info_carte = document.querySelector('#zoneInfoCarte');
    let zone_info_ville_tabs = zone_info_carte.querySelector('ul');
    let pin_button = document.createElement('span');
    pin_button.innerHTML = '&#128204;';
    pin_button.id = 'unpin_info_carte_button'
    zone_info_ville_tabs.appendChild(pin_button);
    pin_button.addEventListener('click', (event) => {
        move_info_ville = !move_info_ville;
        moveBlockInfoVille();
    });

    let move_button = document.createElement('span');
    move_button.innerHTML = '&#10021';
    move_button.id = 'move_info_carte_button';
    move_button.style.display = 'none';
    let first_ul = zone_info_carte.querySelector('ul');
    first_ul.parentElement.insertBefore(move_button, first_ul);

    const block_page = document.querySelector('#bloc_page');
    const background_color = window.getComputedStyle(block_page, null).getPropertyValue('background-color');
    const border_color = window.getComputedStyle(block_page, null).getPropertyValue('border-color');

    const info_ville_style = '#zoneInfoCarte.movable {'
    + 'position: absolute;'
    + 'width: 80%;'
    + 'resize: both;'
    + 'z-index: 50;'
    + 'overflow: auto;'
    + `border: 1px solid ${border_color};`
    + `background-color: ${background_color};`
    + '}';

    const ul_style = '#zoneInfoCarte.movable ul {'
    + 'display: flex;'
    + 'height: 26px;'
    + '}';

    const table_style = '#zoneInfoCarte.movable #table_trace {'
    + 'height: unset;'
    + '}';

    const move_button_style = '#zoneInfoCarte.movable #move_info_carte_button {'
    + 'display: initial !important;'
    + 'float: left;'
    + 'width: 25px;'
    + 'text-align: center;'
    + 'margin: auto;'
    + 'cursor: move;'
    + '}';

    const unpin_info_carte_button_style = '#zoneInfoCarte #unpin_info_carte_button {'
    + 'float: right;'
    + 'cursor: pointer;'
    + 'width: auto;'
    + 'padding: 0 0.5em;'
    + '}'

    let css = info_ville_style + ul_style + table_style + move_button_style + unpin_info_carte_button_style;

    let style = document.createElement('style');

    if (style.styleSheet) {
        style.styleSheet.cssText = css;
    } else {
        style.appendChild(document.createTextNode(css));
    }

    document.getElementsByTagName('head')[0].appendChild(style);
}

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

    placeMoveButton();
})();
