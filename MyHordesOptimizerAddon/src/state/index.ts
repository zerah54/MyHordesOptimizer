import type { MhoState } from '../types';

//////////////////////////////////////
// Les éléments récupérés via l'API //
//////////////////////////////////////

export const state: MhoState = {
    website: '',
    api_url: '',
    mho_parameters: undefined,
    mh_user: undefined,
    external_app_id: undefined,
    token: undefined,
    items: undefined,
    ruins: undefined,
    recipes: undefined,
    citizens: undefined,
    hero_skills: undefined,
    wishlist: undefined,
    parameters: undefined,
    map: undefined,
    current_cell: undefined,
    my_expeditions: undefined,
    tooltips_observer: undefined,
    loading_area_observer: undefined,
    bank_observer: undefined,
    anti_abuse_controller: undefined,

    ///////////////////
    // Les variables //
    ///////////////////

    is_refresh_wishlist: undefined,
    /** true quand le changelog est nouveau et qu'il faut afficher une pastille sur le menu */
    has_new_changelog: false,
    /** True quand une erreur vient d'être affichée. Repasse à false au bout d'une seconde, pour éviter le spam d'erreurs */
    is_error: false,
    /** La liste des notifications récupérées depuis le dernier chargement de l'application */
    mh_notifications: [],
    /** Le mutation observer pour les tooltips */
    advanced_tooltips_observer: undefined,
};
