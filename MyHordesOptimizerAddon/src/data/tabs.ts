import {repo_img_hordes_url} from '../config/constants';

import type {TabsList} from '../types';

export let tabs_list: TabsList = {
    wiki: [
        {
            ordering: 0,
            id: `items`,
            label: {
                en: `Items`,
                fr: `Objets`,
                de: `Gegenstände`,
                es: `Objetos`
            },
            icon: repo_img_hordes_url + `emotes/bag.gif`
        },
        {
            ordering: 1,
            id: `recipes`,
            label: {
                en: `Recipes`,
                fr: `Recettes`,
                de: `Rezepte`,
                es: `Transformaciones`
            },
            icon: repo_img_hordes_url + `building/small_refine.gif`
        },
        {
            ordering: 2,
            id: `ruins`,
            label: {
                en: `Ruins`,
                fr: `Bâtiments`,
                de: `Ruinen`,
                es: `Ruinas`
            },
            icon: repo_img_hordes_url + `icons/home.gif`,
        }
    ],
    tools: [
        {
            ordering: 0,
            id: `bank`,
            label: {
                en: `Bank`,
                fr: `Banque`,
                de: `Bank`,
                es: `Almacén`
            },
            icon: repo_img_hordes_url + `icons/home.gif`,
            needs_town: true,
        },
        // {
        //     ordering: 2,
        //     id: `citizens`,
        //     label: {
        //         en: `Citizens`,
        //         fr: `Citoyens`,
        //         de: `Bürger`,
        //         es: `Habitantes`
        //     },
        //     icon: repo_img_hordes_url + `icons/small_human.gif`,
        //     needs_town: true,
        // },
        {
            ordering: 2,
            id: `camping`,
            label: {
                en: `Camping`,
                fr: `Camping`,
                de: `Camping`,
                es: `Camping`
            },
            icon: repo_img_hordes_url + `status/status_camper.gif`,
            needs_town: false,
        }
    ]
};


//////////////////////////////////////////////
// La liste des paramètres de l'application //
//////////////////////////////////////////////
