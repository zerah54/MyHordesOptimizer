import { computed, Injectable, Signal, signal, WritableSignal } from '@angular/core';

import { activeCitizenFilterCount, CitizenFilterCriteria, CitizenSortDirection, emptyCitizenFilter } from './citizen-filter-sort.util';

/**
 * Filtres et tri des citoyens d'une page (liste des citoyens, Chantiers…) : fourni par la page qui les utilise, partagé par
 * son panneau de filtres, son menu de tri et ses tableaux.
 */
@Injectable()
export class CitizenFilterSortStore {

    private readonly _criteria: WritableSignal<CitizenFilterCriteria> = signal<CitizenFilterCriteria>(emptyCitizenFilter());
    private readonly _sort_field: WritableSignal<string> = signal<string>('');
    private readonly _sort_direction: WritableSignal<CitizenSortDirection> = signal<CitizenSortDirection>('');

    /** Critères en cours. */
    public readonly criteria: Signal<CitizenFilterCriteria> = this._criteria.asReadonly();
    /** Champ de tri actif, vide sans tri. */
    public readonly sort_field: Signal<string> = this._sort_field.asReadonly();
    /** Sens du tri actif. */
    public readonly sort_direction: Signal<CitizenSortDirection> = this._sort_direction.asReadonly();
    /** Nombre de critères actifs. */
    public readonly active_count: Signal<number> = computed((): number => activeCitizenFilterCount(this._criteria()));

    /**
     * Retient des citoyens par leur identifiant.
     * @param {readonly number[]} ids Citoyens.
     */
    public setNames(ids: readonly number[]): void {
        this._criteria.update((criteria: CitizenFilterCriteria): CitizenFilterCriteria => ({ ...criteria, names: [...ids] }));
    }

    /**
     * Retient des métiers.
     * @param {readonly string[]} keys Clés `JobEnum`.
     */
    public setJobs(keys: readonly string[]): void {
        this._criteria.update((criteria: CitizenFilterCriteria): CitizenFilterCriteria => ({ ...criteria, jobs: [...keys] }));
    }

    /**
     * Exige au moins un de ces objets dans le sac.
     * @param {readonly number[]} ids Objets.
     */
    public setBag(ids: readonly number[]): void {
        this._criteria.update((criteria: CitizenFilterCriteria): CitizenFilterCriteria => ({ ...criteria, bag_ids: [...ids] }));
    }

    /**
     * Exige au moins un de ces états.
     * @param {readonly string[]} keys Clés `StatusEnum`.
     */
    public setStatus(keys: readonly string[]): void {
        this._criteria.update((criteria: CitizenFilterCriteria): CitizenFilterCriteria => ({ ...criteria, status_keys: [...keys] }));
    }

    /**
     * Valeur exigée d'un champ à oui / non.
     * @param {string} id Champ.
     * @returns {boolean | null} Valeur exigée, nulle = tous.
     */
    public boolValue(id: string): boolean | null {
        return this._criteria().bools[id] ?? null;
    }

    /**
     * Fait tourner un champ à oui / non : tous → oui → non → tous.
     * @param {string} id Champ.
     */
    public cycleBool(id: string): void {
        this._criteria.update((criteria: CitizenFilterCriteria): CitizenFilterCriteria => {
            const bools: Record<string, boolean> = { ...criteria.bools };
            const current: boolean | undefined = bools[id];
            if (current === undefined) {
                bools[id] = true;
            } else if (current) {
                bools[id] = false;
            } else {
                delete bools[id];
            }
            return { ...criteria, bools };
        });
    }

    /**
     * Valeurs acceptées d'un champ à niveau.
     * @param {string} id Champ.
     * @returns {readonly number[]} Valeurs, vide = toutes.
     */
    public values(id: string): readonly number[] {
        return this._criteria().values[id] ?? [];
    }

    /**
     * Fixe les valeurs acceptées d'un champ à niveau.
     * @param {string} id Champ.
     * @param {readonly number[] | null} values Valeurs, vide ou nul = toutes.
     */
    public setValues(id: string, values: readonly number[] | null): void {
        this._criteria.update((criteria: CitizenFilterCriteria): CitizenFilterCriteria => {
            const next: Record<string, readonly number[]> = { ...criteria.values };
            if (values === null || values.length === 0) {
                delete next[id];
            } else {
                next[id] = [...values];
            }
            return { ...criteria, values: next };
        });
    }

    /** Retire tous les critères. */
    public reset(): void {
        this._criteria.set(emptyCitizenFilter());
    }

    /**
     * Trie par un champ ; le champ actif tourne : croissant → décroissant → sans tri.
     * @param {string} id Champ.
     */
    public sortBy(id: string): void {
        if (this._sort_field() !== id) {
            this._sort_field.set(id);
            this._sort_direction.set('asc');
            return;
        }
        if (this._sort_direction() === 'asc') {
            this._sort_direction.set('desc');
            return;
        }
        this._sort_field.set('');
        this._sort_direction.set('');
    }
}
