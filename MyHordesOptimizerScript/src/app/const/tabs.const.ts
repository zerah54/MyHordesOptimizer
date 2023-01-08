
import { repo_img_hordes_url } from "./const";

//////////////////////////////////
// La liste des onglets du wiki //
//////////////////////////////////

export const tabs_list = {
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
      id: `skills`,
      label: {
        en: `Hero Skills`,
        fr: `Pouvoirs`,
        de: `Heldentaten`,
        es: `Poderes`
      },
      icon: repo_img_hordes_url + `/professions/hero.gif`
    },
    {
      ordering: 3,
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
    {
      ordering: 1,
      id: `wishlist`,
      label: {
        en: `Wishlist`,
        fr: `Liste de courses`,
        de: `Wunschzettel`,
        es: `Lista de deseos`
      },
      icon: repo_img_hordes_url + `item/item_cart.gif`,
      needs_town: true,
    },
    {
      ordering: 2,
      id: `citizens`,
      label: {
        en: `Citizens`,
        fr: `Citoyens`,
        de: `Bürger`,
        es: `Habitantes`
      },
      icon: repo_img_hordes_url + `icons/small_human.gif`,
      needs_town: true,
    },
    // {
    //     ordering: 3,
    //     id: `estimations`,
    //     label: {
    //         en: `Estimations`,
    //         fr: `Estimations`,
    //         de: `Schätzen`,
    //         es: `Estimación`
    //     },
    //     icon: repo_img_hordes_url + `item/item_scope.gif`,
    //     needs_town: true,
    // }
    {
      ordering: 4,
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
