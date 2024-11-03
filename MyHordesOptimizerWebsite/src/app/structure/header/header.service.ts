import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { getExternalAppId } from '../../shared/utilities/localstorage.util';

@Injectable({providedIn: 'root'})
export class HeaderService {
    /** L'observable à souscrire pour vérifier le token */
    public token_obs: Observable<string | null>;
    /** Le token */
    private token: BehaviorSubject<string | null> = new BehaviorSubject(getExternalAppId());

    constructor() {
        this.token_obs = this.token.asObservable();
    }

    /** Change le token */
    public setToken(token: string): void {
        if (token !== this.token.getValue()) {
            this.token.next(token);
        }
    }
}
