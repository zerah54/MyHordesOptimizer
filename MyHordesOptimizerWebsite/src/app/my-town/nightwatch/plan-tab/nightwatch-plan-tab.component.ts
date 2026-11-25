import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { Params, RouterLink } from '@angular/router';
import moment from 'moment';
import { catchError, Observable, of } from 'rxjs';

import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { JobEnum } from '../../../_abstract_model/enum/job.enum';
import { ApiService } from '../../../_abstract_model/services/api.service';
import { Imports } from '../../../_abstract_model/types/_types';
import { Item } from '../../../_abstract_model/types/item.class';
import { DEEP_LINK_PARAMS } from '../../../_core/utilities/deep-link.util';
import { itemIcon, itemLabel } from '../../buildings/planning/planning-labels.util';
import { defaultPlanName } from '../nightwatch-plan-name';
import { StockLine } from '../nightwatch-stock.util';
import { NightwatchStore } from '../nightwatch.store';
import { NightwatchCitizenStateDTO, NightwatchPlanContentDTO, NightwatchWatcherDTO } from '../nightwatch.types';
import { NightwatchWatcherComponent } from './watcher/nightwatch-watcher.component';

const components: Imports = [NightwatchWatcherComponent];
const angular_common: Imports = [RouterLink];
const material_modules: Imports = [MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule];

/** Objet attribué en quantité supérieure au disponible. */
interface Shortage {
    item_id: number;
    label: string;
    remaining: number;
}

/** Objet global pas encore réparti entre les veilleurs. */
interface UnassignedItem {
    item_id: number;
    label: string;
    icon: string;
    quantity: number;
}

/** Citoyen proposé à l'inscription, avec son métier (nul s'il est inconnu). */
interface AddableCitizen {
    user_id: number;
    name: string;
    job: JobEnum | null;
}

/** Onglet Plan : veilleurs de la proposition affichée, valeurs calculées en direct, totaux et consignes. Lit le store de la page. */
@Component({
    selector: 'mho-nightwatch-plan-tab',
    templateUrl: './nightwatch-plan-tab.component.html',
    styleUrls: ['./nightwatch-plan-tab.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...components, ...material_modules]
})
export class NightwatchPlanTabComponent {

    protected readonly store: NightwatchStore = inject(NightwatchStore);
    /** Objets du référentiel du jeu (libellés et choix des objets attribuables). */
    protected readonly items: Signal<readonly Item[]> = toSignal(inject(ApiService).getItems().pipe(catchError((): Observable<Item[]> => of([]))), { initialValue: [] as Item[] });

    /** Citoyens vivants pas encore inscrits comme veilleurs, par ordre alphabétique. */
    protected readonly addable_citizens: Signal<AddableCitizen[]> = computed((): AddableCitizen[] => {
        const enrolled: Set<number> = new Set<number>((this.store.draft()?.watchers ?? []).map((watcher: NightwatchWatcherDTO): number => watcher.userId));
        return (this.store.state()?.citizens ?? [])
            .filter((citizen: NightwatchCitizenStateDTO): boolean => !enrolled.has(citizen.userId))
            .map((citizen: NightwatchCitizenStateDTO): AddableCitizen => ({
                user_id: citizen.userId,
                name: citizen.name,
                job: citizen.jobUid === null || citizen.jobUid === undefined ? null : (JobEnum.getByKey<JobEnum>(citizen.jobUid) ?? null)
            }))
            .sort((a: AddableCitizen, b: AddableCitizen): number => a.name.localeCompare(b.name, this.locale, { sensitivity: 'base' }));
    });

    /** Lien vers la page Chantiers, sur le jour affiché et la proposition retenue par la veille. */
    protected readonly buildings_link: Signal<Params> = computed((): Params => {
        const plan_id: number | null = this.store.planned_buildings()?.plan_id ?? null;
        return { [DEEP_LINK_PARAMS.day]: this.store.selected_day(), [DEEP_LINK_PARAMS.plan]: plan_id };
    });

    /** Objets attribués en quantité supérieure au disponible (reste à trouver > 0). */
    protected readonly shortages: Signal<Shortage[]> = computed((): Shortage[] =>
        this.store.stock_lines()
            .filter((line: StockLine): boolean => line.remaining > 0)
            .map((line: StockLine): Shortage => ({ item_id: line.item_id, label: itemLabel(this.items(), line.item_id, this.locale), remaining: line.remaining })));

    /** Stuff global d'une proposition de simulation moins les attributions des veilleurs ; vide hors simulation. */
    protected readonly unassigned_items: Signal<UnassignedItem[]> = computed((): UnassignedItem[] => {
        const draft: NightwatchPlanContentDTO | null = this.store.draft();
        const simulation_id: number | null | undefined = this.store.selected_plan()?.simulationId;
        if (draft === null || simulation_id === null || simulation_id === undefined) {
            return [];
        }
        const assigned: Map<number, number> = new Map<number, number>();
        for (const watcher of draft.watchers) {
            for (const [item_id, quantity] of Object.entries(watcher.items)) {
                assigned.set(Number(item_id), (assigned.get(Number(item_id)) ?? 0) + quantity);
            }
        }
        return Object.entries(draft.globalItems ?? {})
            .map(([item_id, quantity]: [string, number]): UnassignedItem => ({
                item_id: Number(item_id), label: itemLabel(this.items(), Number(item_id), this.locale), icon: itemIcon(this.items(), Number(item_id)),
                quantity: quantity - (assigned.get(Number(item_id)) ?? 0)
            }))
            .filter((item: UnassignedItem): boolean => item.quantity > 0);
    });

    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
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
