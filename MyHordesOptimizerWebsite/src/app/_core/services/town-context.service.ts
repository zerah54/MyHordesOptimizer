import { computed, Injectable, Signal, signal, WritableSignal } from '@angular/core';

import { MapRouteAccess } from '../../_abstract_model/types/map-routes.class';
import { TownDetails } from '../../_abstract_model/types/town-details.class';
import { setObservedTown } from '../utilities/localstorage.util';

/**
 * Contexte de « ville observée » (mode observateur / readonly).
 *
 * Quand une ville observée est définie, elle devient la ville courante pour tous les
 * consommateurs de getTown() (services API, pipes de coordonnées…) via setObservedTown().
 * Le signal expose la même information de façon réactive aux templates, et isReadonly()
 * indique aux pages de masquer toute UI d'écriture.
 *
 * Exception : un citoyen de la ville observée (un mort, ou un ancien citoyen : le jeton ne porte plus la ville)
 * garde la main sur les expéditions, leurs consignes et les tracés (canContribute()). Le reste de la ville reste
 * en lecture seule.
 *
 * Le contexte est posé/nettoyé exclusivement par le wrapper TownObserverComponent
 * (routes /town/:mapId/**).
 */
@Injectable({ providedIn: 'root' })
export class TownContextService {

    private readonly _observed_town: WritableSignal<TownDetails | null> = signal<TownDetails | null>(null);
    private readonly _observed_town_name: WritableSignal<string | null> = signal<string | null>(null);
    private readonly _observed_access: WritableSignal<MapRouteAccess | null> = signal<MapRouteAccess | null>(null);

    public readonly observedTown: Signal<TownDetails | null> = this._observed_town.asReadonly();

    /** Nom de la ville observée (absent de TownDetails), pour l'affichage dans le menu/bandeau. */
    public readonly observedTownName: Signal<string | null> = this._observed_town_name.asReadonly();

    public readonly isReadonly: Signal<boolean> = computed(() => this._observed_town() !== null);

    /** Citoyen de la ville affichée : la sienne, ou la ville observée dont il est (ou a été) citoyen. */
    public readonly isCitizen: Signal<boolean> = computed((): boolean => !this.isReadonly() || this._observed_access()?.is_citizen === true);

    /** Ville observée dont l'utilisateur a été citoyen (mort, ou ville passée). */
    public readonly isFormerCitizen: Signal<boolean> = computed((): boolean => {
        const access: MapRouteAccess | null = this._observed_access();
        return this.isReadonly() && access !== null && access.is_citizen && !access.is_current_town;
    });

    /**
     * Expéditions, consignes et tracés modifiables : sa ville, ou une ville observée dont on est citoyen et qui
     * n'est pas terminée.
     */
    public readonly canContribute: Signal<boolean> = computed((): boolean => !this.isReadonly() || this._observed_access()?.can_create === true);

    public setObservedTown(town: TownDetails, name: string | null = null): void {
        setObservedTown(town);
        this._observed_town.set(town);
        this._observed_town_name.set(name);
    }

    /** Droits de l'utilisateur sur la ville observée (`GET MapRoutes/{mapId}/access`). */
    public setObservedAccess(access: MapRouteAccess | null): void {
        this._observed_access.set(access);
    }

    public clear(): void {
        setObservedTown(null);
        this._observed_town.set(null);
        this._observed_town_name.set(null);
        this._observed_access.set(null);
    }
}
