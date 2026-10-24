import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, InputSignal, output, OutputEmitterRef, Signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Imports } from '../../../_abstract_model/types/_types';
import { ExpeditionPart, ExpeditionPartRoute } from '../../../_abstract_model/types/expedition-part.class';
import { MapRoute, mapRouteColorVar, MapRouteLinkedPart } from '../../../_abstract_model/types/map-route.class';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../_shared/confirm-dialog/confirm-dialog.component';
import { ruinVisitAp } from '../expedition-orders/expedition-orders.util';
import { partApLabel } from '../expedition-orders/order-labels';

const material_modules: Imports = [MatButtonModule, MatFormFieldModule, MatIconModule, MatSelectModule, MatTooltipModule];

/** Valeur de l'option « Nouveau tracé… » : aucun identifiant de tracé n'est négatif. */
const NEW_ROUTE: number = -1;

interface RouteOption {
    readonly id: number;
    readonly label: string;
    readonly color: string;
    readonly length: number;
    readonly is_private: boolean;
    /** Tracé privé que l'utilisateur ne peut pas rendre public : il ne peut pas le lier. */
    readonly disabled: boolean;
}

/**
 * Tracé d'une partie d'expédition, dans son en-tête : choix parmi les tracés de la ville (ceux qui ne suivent pas
 * déjà une expédition d'un autre jour), « Aucun », ou « Nouveau tracé… » vers la carte ; lien vers le tracé sur la
 * carte. Lier un tracé privé demande confirmation : il devient visible de toute la ville.
 */
@Component({
    selector: 'mho-expedition-part-route',
    templateUrl: './expedition-part-route.component.html',
    styleUrls: ['./expedition-part-route.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterLink, ...material_modules]
})
export class ExpeditionPartRouteComponent {
    public readonly part: InputSignal<ExpeditionPart> = input.required();
    /** Jour de l'expédition : un tracé ne suit qu'un jour (l'import du jour en fait une copie). */
    public readonly day: InputSignal<number> = input.required();
    /** Tracés visibles de la ville. */
    public readonly routes: InputSignal<readonly MapRoute[]> = input<readonly MapRoute[]>([]);
    public readonly editable: InputSignal<boolean> = input<boolean>(false);
    public readonly canCreate: InputSignal<boolean> = input<boolean>(false);

    /** Tracé choisi (`null` : aucun), après confirmation pour un tracé privé. */
    public readonly routeChange: OutputEmitterRef<number | null> = output();

    protected readonly new_route: number = NEW_ROUTE;

    private readonly dialog: MatDialog = inject(MatDialog);
    private readonly router: Router = inject(Router);
    private readonly activated_route: ActivatedRoute = inject(ActivatedRoute);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);

    protected readonly linked: Signal<ExpeditionPartRoute | null> = computed((): ExpeditionPartRoute | null => this.part().map_route);
    protected readonly linked_color: Signal<string | null> = computed((): string | null => {
        const linked: ExpeditionPartRoute | null = this.linked();
        return linked ? mapRouteColorVar(linked.color) : null;
    });
    /** Coût de la partie sur le tracé lié, visites de ruine comprises. */
    protected readonly linked_cost: Signal<string> = computed((): string => {
        const linked: ExpeditionPartRoute | null = this.linked();
        return linked ? partApLabel(linked.length, ruinVisitAp(this.part())) : '';
    });

    protected readonly options: Signal<readonly RouteOption[]> = computed((): readonly RouteOption[] => {
        const day: number = this.day();
        const linked: ExpeditionPartRoute | null = this.linked();
        const options: RouteOption[] = this.routes()
            .filter((route: MapRoute): boolean => route.id === linked?.id || route.linked_parts.every((part: MapRouteLinkedPart): boolean => part.day === null || part.day === day))
            .map((route: MapRoute): RouteOption => ({
                id: route.id,
                label: route.label,
                color: mapRouteColorVar(route.color),
                length: route.length,
                is_private: route.is_private,
                disabled: route.is_private && !route.can_edit
            }));
        // Tracé lié absent de la liste (tracés pas encore chargés) : il reste choisi.
        if (linked && !options.some((option: RouteOption): boolean => option.id === linked.id)) {
            options.unshift({ id: linked.id, label: linked.label, color: mapRouteColorVar(linked.color), length: linked.length, is_private: false, disabled: false });
        }
        return options.sort((a: RouteOption, b: RouteOption): number => a.label.localeCompare(b.label));
    });

    /**
     * La liste revient toujours au tracé lié : elle n'affiche le nouveau qu'une fois la partie enregistrée (le
     * parent renvoie alors une partie à jour), et reste juste si l'enregistrement échoue.
     */
    protected select(change: MatSelectChange): void {
        const value: number | null = change.value;
        change.source.writeValue(this.part().map_route_id);
        if (value === NEW_ROUTE) {
            void this.router.navigate(['../map'], { relativeTo: this.activated_route, queryParams: { route: 'new' } });
            return;
        }
        const option: RouteOption | undefined = this.options().find((candidate: RouteOption): boolean => candidate.id === value);
        if (!option?.is_private) {
            this.routeChange.emit(value);
            return;
        }
        this.dialog
            .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
                data: {
                    title: $localize`Lier un tracé privé`,
                    text: $localize`« ${option.label}:label: » est privé : le lier à cette expédition le rend visible de toute la ville.`
                }
            })
            .afterClosed()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((confirm: boolean | undefined): void => {
                if (confirm) {
                    this.routeChange.emit(value);
                }
            });
    }
}
