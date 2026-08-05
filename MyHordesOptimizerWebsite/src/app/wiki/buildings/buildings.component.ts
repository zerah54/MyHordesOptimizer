import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import moment from 'moment';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { HORDES_IMG_REPO } from '../../_abstract_model/const';
import { BuildingAvailabilityStatusDTO } from '../../_abstract_model/dto/building.dto';
import { BlueprintEnum } from '../../_abstract_model/enum/blueprint.enum';
import { StandardColumn } from '../../_abstract_model/interfaces';
import { ApiService } from '../../_abstract_model/services/api.service';
import { Imports, TownTypeId } from '../../_abstract_model/types/_types';
import { Building, BuildingResource } from '../../_abstract_model/types/building.class';
import { TownDetails } from '../../_abstract_model/types/town-details.class';
import { getTown } from '../../_core/utilities/localstorage.util';
import { normalizeString } from '../../_core/utilities/string.utils';
import { CompactStepperComponent } from '../../_shared/compact-stepper/compact-stepper.component';
import { IconApComponent } from '../../_shared/icon-ap/icon-ap.component';
import { HeaderWithStringFilterComponent } from '../../_shared/lists/header-with-string-filter/header-with-string-filter.component';

const angular_common: Imports = [CommonModule, FormsModule];
const components: Imports = [CompactStepperComponent, HeaderWithStringFilterComponent, IconApComponent];
const material_modules: Imports = [MatButtonModule, MatButtonToggleModule, MatCardModule, MatIconModule, MatTableModule, MatTooltipModule];

@Component({
    selector: 'mho-wiki-buildings',
    templateUrl: './buildings.component.html',
    styleUrls: ['./buildings.component.scss'],
    imports: [...angular_common, ...components, ...material_modules]
})
export class BuildingsComponent implements OnInit {

    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    protected readonly locale: string = moment.locale();

    protected town: TownDetails | null = getTown();
    protected hard_mode: boolean = this.town?.town_type === 'PANDE';

    /** Nombre de plans lus par chantier (0-2), pour prévisualiser le coût au palier correspondant. Absent = 0. */
    private readonly plansLus: Map<number, 0 | 1 | 2> = new Map<number, 0 | 1 | 2>();

    /**
     * Icône du plan par défaut : repli quand ni la rareté effective ni la rareté de base n'ont
     * d'icône propre (rareté 0 = constructible sans plan, ou niveau inconnu).
     */
    private static readonly DEFAULT_PLAN_ICON: string = 'item/item_bplan_c.gif';

    /**
     * Uids des chantiers destructibles pendant l'attaque en DEHORS de Pandémonium : le réacteur et
     * les feux d'artifice ont leur propre mécanique de dégâts (jeu source), active dans tous les
     * modes. Partout ailleurs, la dégradation des bâtiments pendant l'attaque n'existe qu'en
     * Pandémonium (`TownSetting::OptModifierBuildingDamage`, réservé à ce mode côté jeu).
     */
    private static readonly ALWAYS_BREAKABLE_UIDS: ReadonlySet<string> = new Set(['small_arma_#00', 'small_fireworks_#00']);

    protected readonly columns: StandardColumn[] = [
        { id: 'label', header: $localize`Nom du chantier`, class: '' },
        { id: 'pa', header: $localize`Points d’action`, class: 'center' },
        { id: 'defence', header: $localize`Défense`, class: 'center' },
        { id: 'max_life', header: $localize`Points de vie`, class: 'center' },
        { id: 'rarity', header: $localize`Plan`, class: 'center' },
        { id: 'flags', header: $localize`Particularités`, class: 'center' },
        { id: 'resources', header: $localize`Ressources`, class: '' }
    ];

    protected get displayed_columns(): string[] {
        return this.columns.map((column: StandardColumn): string => column.id);
    }

    protected datasource: MatTableDataSource<Building> = new MatTableDataSource<Building>();
    protected filters: { label: string } = { label: '' };
    protected filters_change: Subject<void> = new Subject<void>();

    /** L'arbre, racines en tête. */
    private roots: Building[] = [];
    /** Index par identifiant, pour retrouver un parent sans reparcourir l'arbre. */
    private by_id: Map<number, Building> = new Map<number, Building>();
    /**
     * Chantiers repliés, par identifiant.
     *
     * Déplié par défaut : la page est une référence qu'on parcourt, pas un explorateur qu'on
     * ouvre nœud par nœud.
     */
    private readonly collapsed: Set<number> = new Set<number>();

    private readonly api: ApiService = inject(ApiService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);

    public ngOnInit(): void {
        this.filters_change
            .pipe(debounceTime(200), takeUntilDestroyed(this.destroy_ref))
            .subscribe({ next: (): void => this.refresh() });

        this.api.getBuildings()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (buildings: Building[]): void => {
                    this.roots = this.buildTree(buildings);
                    this.refresh();
                }
            });
    }

    protected isCollapsed(building: Building): boolean {
        return this.collapsed.has(building.id);
    }

    protected toggle(building: Building): void {
        if (this.collapsed.has(building.id)) {
            this.collapsed.delete(building.id);
        } else {
            this.collapsed.add(building.id);
        }
        this.refresh();
    }

    /**
     * En-tête d'une colonne, par son identifiant.
     *
     * Par identifiant et NON par indice : une colonne retirée décalerait tous les suivants et
     * les en-têtes se retrouveraient silencieusement sur les mauvaises colonnes.
     */
    protected headerOf(id: string): string {
        return this.columns.find((column: StandardColumn): boolean => column.id === id)?.header ?? '';
    }

    /**
     * Un élément par niveau d'ancêtre, pour dessiner les traits verticaux de rattachement.
     *
     * Le contenu n'a pas d'importance, seule la longueur compte : le gabarit émet un trait par
     * entrée.
     */
    protected depthLevels(building: Building): number[] {
        return Array.from({ length: building.depth }, (_: unknown, index: number): number => index);
    }

    /**
     * Nom du chantier dont celui-ci est une évolution, ou une chaîne vide pour une racine.
     *
     * Rappelé sur la ligne parce que l'indentation seule ne dit pas DE QUOI on est l'évolution
     * dès qu'on est loin du parent dans une liste de 166 lignes.
     */
    protected parentNameOf(building: Building): string {
        if (building.parent_id === null) {
            return '';
        }
        const parent: Building | undefined = this.by_id.get(building.parent_id);
        return parent ? this.nameOf(parent) : '';
    }

    /** Infobulle d'un niveau de plan que le site ne connaît pas encore. */
    protected unknownRarityHint(building: Building): string {
        return $localize`Niveau de plan inconnu : ` + building.rarity;
    }

    /** Nombre de plans lus actuellement sélectionné pour ce chantier (0 par défaut). */
    protected plansLusFor(building: Building): 0 | 1 | 2 {
        return this.plansLus.get(building.id) ?? 0;
    }

    /** Appelé par le stepper « Plans lus » : mémorise le palier choisi pour ce chantier. */
    protected setPlansLus(building: Building, value: number): void {
        this.plansLus.set(building.id, value as 0 | 1 | 2);
    }

    /**
     * Icône du stepper fusionnant les colonnes « Plan »/« Plans lus » en Pandémonium : la rareté
     * effective (chantier nommément overridé dans rules.yml) prime sur la rareté de base, elle-même
     * repliée sur l'icône générique si aucune des deux n'en a une (rareté 0, ou niveau inconnu).
     */
    protected stepperIcon(building: Building): string {
        const effective_rarity: number = building.hard_blueprint_level ?? building.rarity;
        return BlueprintEnum.fromRarity(effective_rarity)?.value.img ?? BuildingsComponent.DEFAULT_PLAN_ICON;
    }

    /**
     * La particularité « peut être endommagé » n'a de sens qu'en Pandémonium, sauf pour le
     * réacteur et les feux d'artifice (mécanique dédiée, indépendante du mode, du caractère
     * temporaire ET du flag `breakable` — voir ALWAYS_BREAKABLE_UIDS). `breakable` (= !impervious
     * côté jeu) ne dit rien de leur cas : le réacteur est marqué impervious (donc breakable=false)
     * mais reste destructible par sa propre mécanique de dégâts à l'amélioration. La mécanique
     * générale, elle, exclut les chantiers temporaires (`getTemp()` côté jeu, NightlyHandler).
     */
    protected showsBreakableFlag(building: Building): boolean {
        if (BuildingsComponent.ALWAYS_BREAKABLE_UIDS.has(building.uid)) return true;
        if (!building.breakable) return false;
        return this.hard_mode && !building.temporary;
    }

    /** Coût d'un chantier au palier demandé. Replie sur le jeu Default hors Pandémonium ou si le chantier n'a pas de jeu Pandémonium. */
    protected costFor(building: Building, tier: 0 | 1 | 2): { ap: number | null; resources: BuildingResource[] } {
        if (!this.hard_mode || !building.has_hard_mode) {
            return { ap: building.pa, resources: building.resources };
        }
        switch (tier) {
            case 0:
                return { ap: building.tier0_ap, resources: building.tier0_resources };
            case 1:
                return { ap: building.tier1_ap, resources: building.tier1_resources };
            case 2:
                return { ap: building.tier2_ap, resources: building.tier1_resources };
        }
    }

    /**
     * Statut de disponibilité à afficher. En Pandémonium (position du toggle), on lit toujours
     * `availability.PANDE` : c'est la définition même de cette position. Hors Pandémonium, on lit
     * le TownType réel de la ville active s'il y en a une — « Normal » ne désigne pas un seul
     * TownType (RNE/RE/CUSTOM peuvent différer), donc sans ville active on ne filtre pas.
     */
    protected availabilityStatus(building: Building): BuildingAvailabilityStatusDTO | null {
        const town_type: TownTypeId | null = this.hard_mode ? 'PANDE' : (this.town?.town_type ?? null);
        if (!town_type) {
            return null;
        }
        return building.availability[town_type] ?? null;
    }

    /**
     * Reconstruit l'arbre depuis la liste plate.
     *
     * Tri par rang d'affichage du jeu PUIS par nom : le rang n'est pas unique — plusieurs
     * chantiers partagent le même au sein d'un groupe — il ne suffit donc pas à ordonner seul.
     * Un parent absent (obsolète, donc exclu du catalogue) laisse son enfant à la racine plutôt
     * que de le faire disparaître de la page.
     */
    private buildTree(buildings: Building[]): Building[] {
        const by_id: Map<number, Building> = new Map(buildings.map((building: Building): [number, Building] => [building.id, building]));
        this.by_id = by_id;
        const roots: Building[] = [];
        buildings.forEach((building: Building): void => {
            building.children = [];
        });
        buildings.forEach((building: Building): void => {
            const parent: Building | undefined = building.parent_id === null ? undefined : by_id.get(building.parent_id);
            if (parent) {
                parent.children.push(building);
            } else {
                roots.push(building);
            }
        });
        const sort = (list: Building[], depth: number): void => {
            list.sort((a: Building, b: Building): number =>
                (a.display_order ?? 0) - (b.display_order ?? 0)
                || this.nameOf(a).localeCompare(this.nameOf(b)));
            list.forEach((building: Building): void => {
                building.depth = depth;
                sort(building.children, depth + 1);
            });
        };
        sort(roots, 0);
        return roots;
    }

    /**
     * Aplatit l'arbre en lignes de tableau, replis et recherche compris.
     *
     * Quand la recherche retient une évolution, toute sa branche ascendante est conservée : sans
     * le chantier dont elle dépend, une évolution isolée ne veut rien dire.
     *
     * Un chantier désactivé dans le mode courant est purement et simplement omis (pas de badge,
     * pas de ligne grisée) : il n'existe pas dans ce mode, ça n'a pas de sens de l'afficher.
     */
    private refresh(): void {
        const needle: string = normalizeString(this.filters.label ?? '').trim();
        const rows: Building[] = [];
        const flatten = (list: Building[]): void => {
            list.forEach((building: Building): void => {
                if (!this.matchesBranch(building, needle)) {
                    return;
                }
                if (this.availabilityStatus(building) !== 'Disabled') {
                    rows.push(building);
                }
                // Une recherche en cours ignore les replis : masquer un résultat trouvé n'aurait
                // aucun sens.
                if (needle.length > 0 || !this.collapsed.has(building.id)) {
                    flatten(building.children);
                }
            });
        };
        flatten(this.roots);
        this.datasource.data = rows;
    }

    /** Le chantier ou l'une de ses évolutions correspond-il à la recherche ? */
    private matchesBranch(building: Building, needle: string): boolean {
        if (needle.length === 0) {
            return true;
        }
        if (normalizeString(this.nameOf(building)).includes(needle)) {
            return true;
        }
        return building.children.some((child: Building): boolean => this.matchesBranch(child, needle));
    }

    private nameOf(building: Building): string {
        return building.label?.[this.locale] ?? building.uid ?? '';
    }
}
