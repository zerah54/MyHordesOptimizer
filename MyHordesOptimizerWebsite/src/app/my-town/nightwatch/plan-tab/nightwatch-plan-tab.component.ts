import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import moment from 'moment';
import { catchError, Observable, of } from 'rxjs';

import { ApiService } from '../../../_abstract_model/services/api.service';
import { Imports } from '../../../_abstract_model/types/_types';
import { Item } from '../../../_abstract_model/types/item.class';
import { itemLabel } from '../../buildings/planning/planning-labels.util';
import { NightwatchStore } from '../nightwatch.store';
import { NightwatchCitizenStateDTO, NightwatchWatcherDTO } from '../nightwatch.types';
import { defaultPlanName } from '../nightwatch-plan-name';
import { StockLine } from '../nightwatch-stock.util';
import { NightwatchWatcherComponent } from './watcher/nightwatch-watcher.component';

const components: Imports = [NightwatchWatcherComponent];
const material_modules: Imports = [MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule];

/** Objet attribué en quantité supérieure au disponible. */
interface Shortage {
    item_id: number;
    label: string;
    remaining: number;
}

/** Onglet Plan : veilleurs de la proposition affichée, valeurs calculées en direct, totaux et consignes. Lit le store de la page. */
@Component({
    selector: 'mho-nightwatch-plan-tab',
    templateUrl: './nightwatch-plan-tab.component.html',
    styleUrls: ['./nightwatch-plan-tab.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...components, ...material_modules]
})
export class NightwatchPlanTabComponent {

    protected readonly store: NightwatchStore = inject(NightwatchStore);
    /** Objets du référentiel du jeu (libellés et choix des objets attribuables). */
    protected readonly items: Signal<readonly Item[]> = toSignal(inject(ApiService).getItems().pipe(catchError((): Observable<Item[]> => of([]))), { initialValue: [] as Item[] });

    /** Citoyens vivants, non bannis, pas encore inscrits comme veilleurs. */
    protected readonly addable_citizens: Signal<NightwatchCitizenStateDTO[]> = computed((): NightwatchCitizenStateDTO[] => {
        const enrolled: Set<number> = new Set<number>((this.store.draft()?.watchers ?? []).map((watcher: NightwatchWatcherDTO): number => watcher.userId));
        return (this.store.state()?.citizens ?? []).filter((citizen: NightwatchCitizenStateDTO): boolean => !citizen.isShunned && !enrolled.has(citizen.userId));
    });

    /** Objets attribués en quantité supérieure au disponible (reste à trouver > 0). */
    protected readonly shortages: Signal<Shortage[]> = computed((): Shortage[] =>
        this.store.stock_lines()
            .filter((line: StockLine): boolean => line.remaining > 0)
            .map((line: StockLine): Shortage => ({ item_id: line.item_id, label: itemLabel(this.items(), line.item_id, this.locale), remaining: line.remaining })));

    private readonly locale: string = moment.locale();

    /** Crée la première proposition du jour. */
    protected create(): void {
        this.store.createPlan(defaultPlanName());
    }

    /**
     * Inscrit le citoyen choisi comme veilleur et remet la liste à vide.
     * @param {MatSelect} select Liste de choix.
     * @param {number | null} user_id Citoyen choisi.
     */
    protected addWatcher(select: MatSelect, user_id: number | null): void {
        if (user_id !== null && user_id !== undefined) {
            this.store.addWatcher(user_id);
            select.value = null;
        }
    }

    /**
     * Fixe l'attaque estimée imposée ; vide = estimation du site.
     * @param {string} value Saisie.
     */
    protected setAttack(value: string): void {
        this.store.setAttackOverride(value.trim() === '' ? null : Math.max(0, Math.floor(Number(value)) || 0));
    }

    /**
     * Fixe les consignes libres du plan.
     * @param {string} value Saisie ; vide = aucune consigne.
     */
    protected setInstructions(value: string): void {
        this.store.setInstructions(value.trim() === '' ? null : value);
    }
}
