import { EXTERNAL_APP_ID_KEY, TOWN_ID_KEY, USER_ID_KEY } from '../../_abstract_model/const';

export function getUserId(): number | null {
    let user_id: string | null = localStorage.getItem(USER_ID_KEY);
    return user_id ? +user_id : null;
}

export function setUserId(id: number | null): void {
    localStorage.setItem(USER_ID_KEY, id ? id.toString() : '');
}

export function getExternalAppId(): string | null {
    return localStorage.getItem(EXTERNAL_APP_ID_KEY);
}

export function setExternalAppId(id: string | null): void {
    localStorage.setItem(EXTERNAL_APP_ID_KEY, id ? id : '');
}

export function getTownId(): number | null {
    let town_id: string | null = localStorage.getItem(TOWN_ID_KEY);
    return town_id ? +town_id : null;
}

export function setTownId(id: number | null): void {
    localStorage.setItem(TOWN_ID_KEY, id ? id.toString() : '');
}
