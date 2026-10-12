import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, InputSignal, output, OutputEmitterRef, Signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import moment from 'moment';

import { Imports } from '../../../_abstract_model/types/_types';
import { Cell } from '../../../_abstract_model/types/cell.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { Expedition } from '../../../_abstract_model/types/expedition.class';
import { ExpeditionPart } from '../../../_abstract_model/types/expedition-part.class';
import { MapRoute, mapRouteColorVar, MapRoutePoint } from '../../../_abstract_model/types/map-route.class';
import { Ruin } from '../../../_abstract_model/types/ruin.class';
import { Town } from '../../../_abstract_model/types/town.class';
import { getUserId } from '../../../_core/utilities/localstorage.util';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../_shared/confirm-dialog/confirm-dialog.component';
import { cellOrdersOf, OwnedExpeditionOrder } from '../../expeditions/expedition-orders/expedition-orders.util';
import { cellPlaceLabel } from '../../expeditions/expedition-orders/order-labels';
import { buildRoadbook, Roadbook, RoadbookStep } from '../../expeditions/expedition-orders/roadbook.util';
import { DayExpeditionsStore } from '../map-orders/day-expeditions.store';
import { cellsByCoordinates, citizenName, describePlace, linkedPartLabel, MapRouteContext, MapRoutePlace } from '../map-routes/map-route-detail';
import { MAP_ROUTE_LABEL_MAX_LENGTH, MapRouteDraft, MapRouteEditor } from '../map-routes/map-route-editor';
import { MapRouteKey, mapRouteKey } from '../map-routes/map-routes-display';

const material_modules: Imports = [
    MatButtonModule, MatButtonToggleModule, MatFormFieldModule, MatIconModule, MatInputModule, MatMenuModule, MatTooltipModule
];

/** Ligne de la liste des étapes, prête à afficher : départ, cases à consignes, arrivée, cases sorties du tracé. */
interface StepView {
    readonly key: string;
    /** « D », « A », rang de l'étape, « ! » hors du tracé. */
    readonly node: string;
    readonly coordinates: string;
    readonly place: string;
    /** PA au premier passage ; `null` hors du tracé. */
    readonly ap: number | null;
    /** Consignes des expéditions du jour qui suivent le tracé. */
    readonly orders: number;
    readonly off: boolean;
}

interface CitizenOption {
    readonly id: number;
    readonly name: string;
}

/**
 * Saisie d'un tracé, dans le panneau de la carte : nom, longueur, mode de calcul, destinations, partage et
 * enregistrement. Les clics sur la carte passent par `MapRouteEditor`, que ce composant pilote aussi.
 */
@Component({
    selector: 'mho-map-route-editor',
    templateUrl: './map-route-editor.component.html',
    styleUrls: ['./map-route-editor.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...material_modules]
})
export class MapRouteEditorComponent {
    public readonly map: InputSignal<Town | undefined> = input.required();
    public readonly allRuins: InputSignal<readonly Ruin[] | undefined> = input.required();
    public readonly allCitizens: InputSignal<readonly Citizen[] | undefined> = input.required();

    /** Saisie terminée : clé du tracé enregistré, `null` si elle a été abandonnée. */
    public readonly closed: OutputEmitterRef<MapRouteKey | null> = output();

    protected readonly editor: MapRouteEditor = inject(MapRouteEditor);
    protected readonly label_max_length: number = MAP_ROUTE_LABEL_MAX_LENGTH;
    protected readonly unshare_label: string = $localize`Retirer`;

    private readonly dialog: MatDialog = inject(MatDialog);
    private readonly day_store: DayExpeditionsStore = inject(DayExpeditionsStore);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);
    private readonly me: number | null = getUserId();
    private readonly locale: string = moment.locale();

    private readonly citizens: Signal<readonly Citizen[]> = computed((): readonly Citizen[] => this.allCitizens() ?? []);
    private readonly cells: Signal<Map<string, Cell>> = computed((): Map<string, Cell> => cellsByCoordinates(this.map()));

    protected readonly color_var: Signal<string> = computed((): string => {
        const draft: MapRouteDraft | null = this.editor.draft();
        return draft ? mapRouteColorVar(draft.color) : '';
    });

    /** Consignes par case des expéditions du jour qui suivent le tracé en saisie. */
    private readonly linked_orders: Signal<OwnedExpeditionOrder[]> = computed((): OwnedExpeditionOrder[] => {
        const route_id: number | null = this.editor.draft()?.id ?? null;
        if (route_id === null) return [];
        return this.day_store.expeditions().flatMap((expedition: Expedition): OwnedExpeditionOrder[] => expedition.parts
            .filter((part: ExpeditionPart): boolean => part.map_route_id === route_id)
            .flatMap(cellOrdersOf));
    });

    /**
     * Départ, cases à consignes dans l'ordre du tracé (PA au premier passage), arrivée dès qu'il y a une destination,
     * puis les cases à consignes que le tracé ne traverse plus : les clics intermédiaires n'y figurent pas.
     */
    protected readonly steps: Signal<StepView[]> = computed((): StepView[] => {
        const route: readonly MapRoutePoint[] = this.editor.cells();
        if (route.length === 0) return [];
        const cells: Map<string, Cell> = this.cells();
        const map: Town | undefined = this.map();
        const context: MapRouteContext = { town: map, ruins: this.allRuins() ?? [], citizens: this.citizens(), locale: this.locale };
        const roadbook: Roadbook = buildRoadbook(route, this.linked_orders(), map ? { x: map.town_x, y: map.town_y } : route[0]);
        return roadbook.steps
            // Une seule case : pas encore d'arrivée.
            .filter((step: RoadbookStep): boolean => route.length > 1 || step.node !== 'end')
            .map((step: RoadbookStep): StepView => {
                const place: MapRoutePlace | null = describePlace(step.cell, cells, context);
                return {
                    key: step.key,
                    node: step.label,
                    coordinates: place?.coordinates ?? '',
                    place: cellPlaceLabel(step.cell, place, cells),
                    ap: step.ap,
                    orders: step.orders.length,
                    off: step.node === 'off'
                };
            });
    });

    /** L'utilisateur est-il l'auteur du tracé (toujours vrai pour un nouveau tracé) ? */
    protected readonly is_author: Signal<boolean> = computed((): boolean => {
        const author_id: number | null | undefined = this.editor.draft()?.author_id;
        return author_id === null || author_id === undefined || author_id === this.me;
    });

    protected readonly author_name: Signal<string> = computed((): string => {
        const draft: MapRouteDraft | null = this.editor.draft();
        const author_id: number | null = draft?.author_id ?? this.me;
        return citizenName(this.citizens(), author_id, this.editor.remote_route()?.author_name ?? null);
    });

    protected readonly shared: Signal<CitizenOption[]> = computed((): CitizenOption[] => {
        const citizens: readonly Citizen[] = this.citizens();
        return (this.editor.draft()?.shared_user_ids ?? []).map((user_id: number): CitizenOption => ({ id: user_id, name: citizenName(citizens, user_id) }));
    });

    /** Citoyens qu'on peut encore autoriser : ni déjà autorisés, ni l'auteur. */
    protected readonly shareable: Signal<CitizenOption[]> = computed((): CitizenOption[] => {
        const draft: MapRouteDraft | null = this.editor.draft();
        if (!draft) return [];
        const author_id: number | null = draft.author_id ?? this.me;
        const shared: ReadonlySet<number> = new Set<number>(draft.shared_user_ids);
        return this.citizens()
            .filter((citizen: Citizen): boolean => citizen.id !== author_id && !shared.has(citizen.id))
            .map((citizen: Citizen): CitizenOption => ({ id: citizen.id, name: citizen.name }))
            .sort((citizen_a: CitizenOption, citizen_b: CitizenOption): number => citizen_a.name.localeCompare(citizen_b.name));
    });

    protected readonly linked_parts: Signal<string[]> = computed((): string[] => {
        const remote: MapRoute | null = this.editor.remote_route();
        return remote ? remote.linked_parts.map(linkedPartLabel) : [];
    });

    protected async save(): Promise<void> {
        this.close(await this.editor.save());
    }

    protected async keepMine(): Promise<void> {
        this.close(await this.editor.keepMine());
    }

    /** Quitte la saisie ; avec des changements, après confirmation. */
    protected cancel(): void {
        if (!this.editor.is_dirty()) {
            this.editor.cancel();
            this.closed.emit(null);
            return;
        }
        this.dialog
            .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
                data: { title: $localize`Quitter sans enregistrer`, text: $localize`Les changements apportés au tracé seront perdus.` }
            })
            .afterClosed()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((confirm: boolean | undefined): void => {
                if (confirm) {
                    this.editor.cancel();
                    this.closed.emit(null);
                }
            });
    }

    private close(saved: MapRoute | null): void {
        if (saved) {
            this.closed.emit(mapRouteKey('mho', saved.id));
        }
    }
}
