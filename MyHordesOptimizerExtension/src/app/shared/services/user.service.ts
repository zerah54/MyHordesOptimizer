import { Injectable } from '@angular/core';

/**
 * Permet de stocker et récupérer les informations de l'utilisateur.
 */
@Injectable()
export class UserService {

    setExternalAppId(id: string): void {
        localStorage.setItem('mho-external-app-id', id ? id : '');
    }

    getExternalAppId(): string {
        let item = localStorage.getItem('mho-external-app-id')
        return item ? item : '';
    }

}
