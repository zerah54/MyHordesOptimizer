import * as moment from 'moment';
import { ItemDTO } from 'src/app/_abstract_model/dto/item.dto';
import { RuinDTO } from 'src/app/_abstract_model/dto/ruin.dto';
import { Item } from 'src/app/_abstract_model/types/item.class';
import { Me } from 'src/app/_abstract_model/types/me.class';
import { Ruin } from 'src/app/_abstract_model/types/ruin.class';
import { TownDetails } from 'src/app/_abstract_model/types/town-details.class';
import { EXTERNAL_APP_ID_KEY, ITEMS_KEY, RUINS_KEY, TOWN_KEY, USER_KEY } from '../../_abstract_model/const';
import { dtoToModelArray, modelToDtoArray } from '../../_abstract_model/types/_common.class';

export function setUser(user: Me | null): void {
    localStorage.setItem(USER_KEY, user ? JSON.stringify(user) : '');
}

export function getUser(): Me {
    let user: string | null = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
}

export function getUserId(): number | null {
    let user_id: number | undefined = getUser()?.id;
    return user_id ? +user_id : null;
}

export function getExternalAppId(): string | null {
    return localStorage.getItem(EXTERNAL_APP_ID_KEY);
}

export function setExternalAppId(id: string | null): void {
    localStorage.setItem(EXTERNAL_APP_ID_KEY, id ? id : '');
}

export function getTown(): TownDetails | null {
    let town: string | null = localStorage.getItem(TOWN_KEY);
    return town ? JSON.parse(town) : null;
}

export function setTown(town: TownDetails | null): void {
    localStorage.setItem(TOWN_KEY, town ? JSON.stringify(town) : '');
}

export function getItemsWithExpirationDate(): Item[] {
    const local_storage: string | null = localStorage.getItem(ITEMS_KEY) || '';
    const element_with_expiration: ElementWithExpiration<ItemDTO[]> = local_storage ? JSON.parse(local_storage) : undefined;
    if (!element_with_expiration || moment(element_with_expiration.expire_at).isBefore(moment())) {
        return [];
    } else {
        return dtoToModelArray(Item, element_with_expiration.element);
    }
}

export function setItemsWithExpirationDate(items: Item[]): void {
    let element_with_expiration: ElementWithExpiration<ItemDTO[] | null> = {
        expire_at: moment().endOf('day'),
        element: modelToDtoArray(items)
    }
    localStorage.setItem(ITEMS_KEY, JSON.stringify(element_with_expiration));
}

export function getRuinsWithExpirationDate(): Ruin[] {
    const local_storage: string | null = localStorage.getItem(RUINS_KEY) || '';
    const element_with_expiration: ElementWithExpiration<RuinDTO[]> = local_storage ? JSON.parse(local_storage) : undefined;
    if (!element_with_expiration || moment(element_with_expiration.expire_at).isBefore(moment())) {
        return [];
    } else {
        return dtoToModelArray(Ruin, element_with_expiration.element);
    }
}

export function setRuinsWithExpirationDate(items: Ruin[]): void {
    let element_with_expiration: ElementWithExpiration<RuinDTO[] | null> = {
        expire_at: moment().endOf('day'),
        element: modelToDtoArray(items)
    }
    localStorage.setItem(RUINS_KEY, JSON.stringify(element_with_expiration));
}


interface ElementWithExpiration<T> {
    expire_at: moment.Moment;
    element: T;
}
