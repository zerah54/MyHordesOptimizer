import { computed, Injectable, Signal, signal,WritableSignal } from '@angular/core';

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
 * Le contexte est posé/nettoyé exclusivement par le wrapper TownObserverComponent
 * (routes /town/:mapId/**).
 */
@Injectable({ providedIn: 'root' })
export class TownContextService {

    private readonly _observed_town: WritableSignal<TownDetails | null> = signal<TownDetails | null>(null);
    private readonly _observed_town_name: WritableSignal<string | null> = signal<string | null>(null);

    public readonly observedTown: Signal<TownDetails | null> = this._observed_town.asReadonly();

    /** Nom de la ville observée (absent de TownDetails), pour l'affichage dans le menu/bandeau. */
    public readonly observedTownName: Signal<string | null> = this._observed_town_name.asReadonly();

    public readonly isReadonly: Signal<boolean> = computed(() => this._observed_town() !== null);

    public setObservedTown(town: TownDetails, name: string | null = null): void {
        setObservedTown(town);
        this._observed_town.set(town);
        this._observed_town_name.set(name);
    }

    public clear(): void {
        setObservedTown(null);
        this._observed_town.set(null);
        this._observed_town_name.set(null);
    }
}
