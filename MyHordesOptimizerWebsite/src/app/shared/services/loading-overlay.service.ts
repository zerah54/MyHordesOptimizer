import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

@Injectable()
export class LoadingOverlayService {
    /** L'observable à souscrire pour vérifier l'état */
    public is_loading_obs: Observable<boolean>;
    /** L'information de chargement */
    private is_loading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    constructor() {
        this.is_loading_obs = this.is_loading.asObservable();
    }

    /** Change l'état de chargement */
    public setLoading(is_loading: boolean): void {
        this.is_loading.next(is_loading);
    }
}
