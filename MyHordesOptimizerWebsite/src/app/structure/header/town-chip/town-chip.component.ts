import { ChangeDetectionStrategy, Component, computed, inject, input, InputSignal, Signal } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Imports, TownTypeId } from '../../../_abstract_model/types/_types';
import { TownDetails } from '../../../_abstract_model/types/town-details.class';
import { TownContextService } from '../../../_core/services/town-context.service';
import { town } from '../../../_core/utilities/localstorage.util';

/** Emplacement de la pastille : barre d'en-tête (600 px et plus) ou tête du menu (en dessous). */
export type TownChipPlacement = 'topbar' | 'menu';

const material_modules: Imports = [MatTooltipModule];

/**
 * Pastille de ville : nom, jour, type, et les états qui changent la façon de jouer (chaos, dévastée,
 * observation). Rien hors d'une ville. Chaque emplacement la masque là où l'autre l'affiche (voir les
 * feuilles de style de l'en-tête et du menu) : une seule est visible à la fois.
 */
@Component({
    selector: 'mho-town-chip',
    templateUrl: './town-chip.component.html',
    styleUrls: ['./town-chip.component.scss'],
    imports: [...material_modules],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class.in-menu]': 'placement() === \'menu\''
    }
})
export class TownChipComponent {
    public readonly placement: InputSignal<TownChipPlacement> = input<TownChipPlacement>('topbar');

    private static readonly TOWN_TYPE_LABELS: Record<TownTypeId, string> = {
        RNE: $localize`Petite carte`,
        RE: $localize`Région éloignée`,
        PANDE: $localize`Pandémonium`,
        CUSTOM: $localize`Ville privée`
    };

    private readonly town_context: TownContextService = inject(TownContextService);

    protected readonly current_town: Signal<TownDetails | null> = town;
    protected readonly is_in_town: Signal<boolean> = computed((): boolean => !!this.current_town()?.town_id);
    protected readonly is_readonly: Signal<boolean> = this.town_context.isReadonly;
    protected readonly town_type_label: Signal<string> = computed((): string => {
        const type: TownTypeId | undefined = this.current_town()?.town_type;
        return type ? TownChipComponent.TOWN_TYPE_LABELS[type] : '';
    });
    /**
     * Nom de la ville : celui de la ville observée quand on en observe une, celui de sa propre
     * ville sinon. Il ne s'affiche qu'une fois l'API redéployée — `townName` a été ajouté au
     * contrat en même temps que cet affichage.
     */
    protected readonly town_name: Signal<string | null> = computed((): string | null => {
        return this.town_context.observedTownName() ?? this.current_town()?.town_name ?? null;
    });
    /** Nom et type réunis, en infobulle : dans la barre, le nom peut être tronqué et le type masqué. */
    protected readonly summary: Signal<string> = computed((): string => {
        return [this.town_name(), this.town_type_label()].filter((part: string | null): boolean => !!part).join(' · ');
    });
}
