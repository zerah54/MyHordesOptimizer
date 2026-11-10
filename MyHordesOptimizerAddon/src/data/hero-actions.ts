import type { I18nLabel } from '../types';

/** Action héroïque d'une consigne « Action héroïque » : libellé du jeu et image (relative à `repo_img_hordes_url`). */
export interface HeroActionInfo {
    readonly label: I18nLabel;
    readonly img: string;
}

/**
 * Actions héroïques qu'une consigne peut demander, indexées par la valeur enregistrée par le site
 * (`HeroicActionEnum.value.action`, `ExpeditionOrderRules.HeroActions` côté API). Libellés repris du jeu.
 */
export const hero_actions: Readonly<Record<string, HeroActionInfo>> = {
    hero_generic_rescue: {
        label: { fr: 'Sauvetage', en: 'Rescue', de: 'Rettung', es: 'Rescate' },
        img: 'emotes/gate.gif'
    },
    hero_generic_punch: {
        label: { fr: 'Uppercut sauvage', en: 'Vicious Uppercut', de: 'Wildstyle Uppercut', es: 'Puñetazo salvaje' },
        img: 'icons/map/map_icon_splatter.png'
    },
    secondwind: {
        label: { fr: 'Second souffle', en: 'Second wind', de: 'Zweite Lunge', es: 'Segundo aliento' },
        img: 'heroskill/small_pa.gif'
    },
    luckyfind: {
        label: { fr: 'Trouvaille', en: 'Lucky Find', de: 'Schönes Fundstück', es: 'Hallazgo' },
        img: 'heroskill/item_chest_hero.gif'
    },
    cheatdeath: {
        label: { fr: 'Vaincre la mort', en: 'Cheat Death', de: 'Den Tod besiegen', es: 'Vencer a la muerte' },
        img: 'heroskill/small_wrestle.gif'
    },
    hero_generic_return: {
        label: { fr: 'Retour du Héros', en: 'Heroic Return', de: 'Die Rückkehr des Helden', es: 'El retorno del Héroe' },
        img: 'emotes/hero.gif'
    },
    brothers: {
        label: { fr: 'Camaraderie', en: 'Brothers in Arms', de: 'Freundschaft', es: 'Camaradería' },
        img: 'heroskill/r_share.gif'
    }
};
