import { HeroicActionEnum } from '../../_abstract_model/enum/heroic-action.enum';
import { Citizen } from '../../_abstract_model/types/citizen.class';
import { HeroicActionsWithValue } from '../../_abstract_model/types/heroic-actions.class';
import { HomeWithValue } from '../../_abstract_model/types/home.class';

export function getCitizenFromId(citizen_list: Citizen[], citizen_id?: number): Citizen | undefined {
    if (!citizen_id || !citizen_list) return undefined;
    return citizen_list.find((citizen: Citizen) => citizen_id === citizen.id);
}

/** Icône d'une amélioration de maison ; niveau d'habitation par défaut si aucune icône dédiée. */
export function getHomeIcon(home: HomeWithValue): string {
    const img: string = home.element.value.img;
    if (img && img !== '') return img;
    const level: number = typeof home.value === 'number' && home.value >= 0 ? home.value : 0;
    return 'home/home_lv' + level + '.gif';
}

/** Icône d'une action héroïque ; cas particulier de l'APAG dont l'icône dépend des charges restantes. */
export function getHeroicIcon(action: HeroicActionsWithValue): string {
    if (action.element.key !== HeroicActionEnum.APAG_CHARGE.key) return action.element.value.img;
    const charges: number = typeof action.value === 'number' ? action.value : -1;
    if (charges < 0) return action.element.value.img;
    return charges === 0 ? 'item/item_photo_off.gif' : 'item/item_photo_' + charges + '.gif';
}
