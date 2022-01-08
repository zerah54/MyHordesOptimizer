import { EXTERNAL_APP_ID_KEY, USER_ID_KEY } from '../../_abstract_model/const';

export function getUserId(): number | null {
    let external_app_id: string | null = localStorage.getItem(USER_ID_KEY);
    return external_app_id ? +external_app_id : null;
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
