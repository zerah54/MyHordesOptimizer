import { Me } from 'src/app/_abstract_model/types/me.class';
import { TownDetails } from 'src/app/_abstract_model/types/town-details.class';
import { EXTERNAL_APP_ID_KEY, TOWN_KEY, USER_ID_KEY, USER_KEY } from '../../_abstract_model/const';


export function setUser(user: Me | null): void {
    localStorage.setItem(USER_KEY, user ? JSON.stringify(user) : '');
}

export function getUser(): Me {
    let user: string | null = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
}

export function getUserId(): number | null {
    let user_id: string | null = localStorage.getItem(USER_ID_KEY);
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
