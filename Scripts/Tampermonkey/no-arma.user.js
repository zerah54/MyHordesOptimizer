// ==UserScript==
// @name         No Arma
// @version      1.0.0
// @description  On veut pouvoir lire le forum !
// @author       Zerah
//
// @icon         https://cdn.discordapp.com/attachments/1050938086722371666/1224130931493965984/image.png?ex=661c5fc5&is=6609eac5&hm=4165fd42edaa88cf9e4795e5eebbfe04e2c0d292d44c3e64136a14d48c086c95&
//
// @downloadURL  https://github.com/zerah54/MyHordesOptimizer/raw/main/Scripts/Tampermonkey/no-arma.user.js
// @updateURL    https://github.com/zerah54/MyHordesOptimizer/raw/main/Scripts/Tampermonkey/no-arma.user.js
//
// @match        *://myhordes.de/*
// @match        *://myhordes.eu/*
// @match        *://myhord.es/*
// @match        *://myhordes.fr/*
//
// ==/UserScript==

(function () {
    'use strict';
    document.querySelector("body")?.removeAttribute("data-theme-name")
    document.addEventListener('mh-navigation-complete', (event) => {
        document.querySelector("body")?.removeAttribute("data-theme-name")
    })
})();
