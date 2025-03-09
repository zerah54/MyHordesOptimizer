// ==UserScript==
// @name         Dove April's Fool
// @version      1.0.1
// @description  Une petite blague ?
// @author       Zerah
//
// @icon         https://cdn.discordapp.com/attachments/1050938086722371666/1224130931493965984/image.png?ex=661c5fc5&is=6609eac5&hm=4165fd42edaa88cf9e4795e5eebbfe04e2c0d292d44c3e64136a14d48c086c95&
//
// @downloadURL  https://github.com/zerah54/MyHordesOptimizer/raw/main/Scripts/Tampermonkey/dove_april_fool.user.js
// @updateURL    https://github.com/zerah54/MyHordesOptimizer/raw/main/Scripts/Tampermonkey/dove_april_fool.user.js
//
// @match        *://myhordes.de/*
// @match        *://myhordes.eu/*
// @match        *://myhord.es/*
//
// ==/UserScript==


/** @return {boolean}    true si la page de l'utilisateur est la page des chantiers */
function pageIsConstructions() {
    return document.URL.endsWith('constructions');
}

(function () {
    'use strict';

    ['mh-navigation-complete'/*, 'tab-switch', '_react', 'x-react-degenerate', 'DOMContentLoaded', 'movement-reset', 'readystatechange'*/].forEach((event_name) => {
        document.addEventListener(event_name, (event) => {
            if (pageIsConstructions) {
                let crow_img = document.querySelector('img[src*=small_crow]');
                if (crow_img) {
                    crow_img.src = 'https://cdn.discordapp.com/attachments/1050938086722371666/1224130931493965984/image.png?ex=661c5fc5&is=6609eac5&hm=4165fd42edaa88cf9e4795e5eebbfe04e2c0d292d44c3e64136a14d48c086c95&';

                    let crow_name = crow_img.nextElementSibling;
                    if (crow_name) {
                        crow_name.innerText = crow_name.innerText
                            .replace('Statue du Corbeau', 'Statue de la Colombe')
                            .replace('Estatua del cuervo', 'Estatua de la paloma')
                            .replace('Crow Statue', 'Dove Statue')
                            .replace('Krähenstatue', 'Taubenstatue')
                    }

                    let crow_row = crow_img.parentElement?.parentElement;
                    if (crow_row) {
                        let requirements = crow_row.querySelector('.build-req-items');
                        if (requirements) {
                            let vh_img = requirements.querySelector('img[src*=item_hmeat]');
                            vh_img.src = "https://myhordes-optimizer.web.app/img/hordes_img/item/item_food_candies.gif";
                        }
                    }
                }
            }
        });
    });
})();
