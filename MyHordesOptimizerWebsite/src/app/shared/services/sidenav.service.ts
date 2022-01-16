import { BehaviorSubject, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class SidenavService {
    /** L'observable à souscrire pour changer l'état */
    public toggle_sidenav_obs: Observable<void>;
    /** L'information de chargement */
    private toggle: BehaviorSubject<void> = new BehaviorSubject<void>(undefined);


    constructor() {
        this.toggle_sidenav_obs = this.toggle.asObservable();
    }

    public changeSidenavStatus(): void {
        console.log('changeSidenavStatus');
        this.toggle.next();
    }
}
