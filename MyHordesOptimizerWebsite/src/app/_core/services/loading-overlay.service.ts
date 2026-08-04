import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { createDelayedLoadingController, DelayedLoadingController } from '../utilities/delayed-loading.util';

@Injectable({ providedIn: 'root' })
export class LoadingOverlayService {
    /** L'observable à souscrire pour vérifier l'état */
    public is_loading_obs: Observable<boolean>;
    /** L'information de chargement */
    private is_loading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    /** Le nombre d'éléments ayant demandé un loading */
    private loading_counter: number = 0;
    /**
     * Un aller-retour rapide (sous ~200ms, perçu comme instantané) ne doit jamais afficher le loader :
     * on ne bascule l'observable qu'après ce délai, et seulement si le compteur est toujours > 0.
     */
    private readonly loading_controller: DelayedLoadingController = createDelayedLoadingController(
        (loading: boolean) => this.is_loading.next(loading)
    );

    public constructor() {
        this.is_loading_obs = this.is_loading.asObservable();
    }

    /** Change l'état de chargement */
    public setLoading(is_loading: boolean): void {
        const previous_counter: number = +this.loading_counter;
        if (is_loading) {
            this.loading_counter++;
        } else {
            this.loading_counter = Math.max(this.loading_counter - 1, 0);
        }
        if ((previous_counter > 0) !== (this.loading_counter > 0)) {
            if (this.loading_counter > 0) {
                this.loading_controller.start();
            } else {
                this.loading_controller.stop();
            }
        }
    }
}
