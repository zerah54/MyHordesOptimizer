import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Injectable({providedIn: 'root'})
export class InDevModeGuard {
    private router = inject(Router);


    /**
     * Si l'utilisateur essaie d'accéder à une page qui nécessite d'être en ville, alors il sera redirigé
     *
     * @return {boolean}
     */
    public canActivate(): boolean {
        const in_dev_mode: boolean = !environment.production;
        if (!in_dev_mode) {
            this.router.navigate(['/wiki/items']);
        }
        return in_dev_mode;
    }
}
