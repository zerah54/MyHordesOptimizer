import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, effect, EventEmitter, inject, OnInit, Signal, signal, viewChild, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSort, MatSortModule, SortDirection } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import moment from 'moment';

import { CITIZENS_LIST_DISPLAY_MODE_KEY, HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { NoteDTO } from '../../../_abstract_model/dto/note.dto';
import { DailyActionEnum } from '../../../_abstract_model/enum/daily-action.enum';
import { HeroicActionEnum } from '../../../_abstract_model/enum/heroic-action.enum';
import { HomeEnum } from '../../../_abstract_model/enum/home.enum';
import { JobEnum } from '../../../_abstract_model/enum/job.enum';
import { StatusEnum } from '../../../_abstract_model/enum/status.enum';
import { StandardColumn } from '../../../_abstract_model/interfaces';
import { ApiService } from '../../../_abstract_model/services/api.service';
import { NoteService } from '../../../_abstract_model/services/note.service';
import { TownService } from '../../../_abstract_model/services/town.service';
import { Dictionary, Imports, ListForAddRemove } from '../../../_abstract_model/types/_types';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { CitizenInfo } from '../../../_abstract_model/types/citizen-info.class';
import { DailyAction } from '../../../_abstract_model/types/daily-action.class';
import { HeroicActionsWithValue } from '../../../_abstract_model/types/heroic-actions.class';
import { HomeWithValue } from '../../../_abstract_model/types/home.class';
import { Item } from '../../../_abstract_model/types/item.class';
import { Me } from '../../../_abstract_model/types/me.class';
import { isHouseLevelEditable } from '../../../_abstract_model/types/town-details.class';
import { UpdateInfo } from '../../../_abstract_model/types/update-info.class';
import { ColumnIdPipe } from '../../../_core/pipes/column-id.pipe';
import { ClipboardService } from '../../../_core/services/clipboard.service';
import { TownContextService } from '../../../_core/services/town-context.service';
import { getHeroicIcon, getHomeIcon } from '../../../_core/utilities/citizen.util';
import { getTown, getUser } from '../../../_core/utilities/localstorage.util';
import { AvatarComponent } from '../../../_shared/avatar/avatar.component';
import { CitizenInfoComponent } from '../../../_shared/citizen-info/citizen-info.component';
import { CompactStepperComponent } from '../../../_shared/compact-stepper/compact-stepper.component';
import { CompactToggleComponent } from '../../../_shared/compact-toggle/compact-toggle.component';
import { DeferredCellComponent } from '../../../_shared/deferred-cell/deferred-cell.component';
import { LastUpdateComponent } from '../../../_shared/last-update/last-update.component';
import { ListElementAddRemoveComponent } from '../../../_shared/list-elements-add-remove/list-element-add-remove.component';
import { NoteDialogComponent, NoteDialogData } from '../../../_shared/note-dialog/note-dialog.component';
import { NoteIconComponent } from '../../../_shared/note-icon/note-icon.component';
import { SelectComponent } from '../../../_shared/select/select.component';
import { CitizenPictosDialogComponent, CitizenPictosDialogData } from '../citizen-pictos-dialog/citizen-pictos-dialog.component';
import { DailyActionForDayPipe } from '../daily-action-for-day.pipe';
import { TypeRowPipe } from './type-row.pipe';

const angular_common: Imports = [CommonModule, FormsModule];
const components: Imports = [AvatarComponent, CitizenInfoComponent, CompactStepperComponent, CompactToggleComponent, DeferredCellComponent, LastUpdateComponent, ListElementAddRemoveComponent, NoteIconComponent, SelectComponent];
const pipes: Imports = [ColumnIdPipe, TypeRowPipe];
const material_modules: Imports = [MatBadgeModule, MatButtonModule, MatButtonToggleModule, MatCheckboxModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatMenuModule, MatSidenavModule, MatSortModule, MatTableModule, MatTooltipModule];

/** Une source de mise à jour d'un citoyen (libellé + info), pour le détail des dernières MàJ. */
interface CitizenUpdateEntry {
    label: string;
    info: UpdateInfo | undefined;
}


/** Modes d'affichage du tableau des citoyens vivants : « groupé » (bandes) ou « colonnes » (une par champ). */
export type CitizensDisplayMode = 'grouped' | 'columns';

/** Tri des champs par niveau maximum croissant : les booléens (max_lvl 1) d'abord, les champs à niveau ensuite. */
const byMaxLvlAsc = (a: { value: { max_lvl: number } }, b: { value: { max_lvl: number } }): number => a.value.max_lvl - b.value.max_lvl;

/** Poids de l'état « immunisé » dans le tri de la colonne immunité : garantit que l'immunité prime sur le nombre de potions. */
const IMMUNE_SORT_FACTOR: number = 1_000_000;

@Component({
    selector: 'mho-citizens-list',
    templateUrl: './citizens-list.component.html',
    styleUrls: ['./citizens-list.component.scss'],
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class CitizensListComponent implements OnInit {

    /** La liste des citoyens en vie */
    protected alive_citizen_info!: CitizenInfo;
    /** La liste des citoyens morts */
    protected dead_citizen_info!: CitizenInfo;
    /** La datasource pour le tableau */
    protected citizen_list: MatTableDataSource<Citizen> = new MatTableDataSource();
    /** La datasource des citoyens morts */
    protected dead_citizen_list: MatTableDataSource<Citizen> = new MatTableDataSource();
    /** La liste complète des items */
    protected all_items: Item[] = [];
    /** Le dossier dans lequel sont stockées les images */
    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    protected readonly current_day: number = getTown()?.day || 1;
    /** Mode observateur : désactive toute action d'écriture. */
    protected readonly is_readonly: Signal<boolean> = inject(TownContextService).isReadonly;
    /** Les filtres de la liste des citoyens (par nom). */
    protected citizen_filters: Citizen[] = [];
    /** Les filtres de la liste des citoyens (par métier, mode colonnes). */
    protected job_filters: JobEnum[] = [];
    /** Un filtre (nom ou métier) a changé → réappliquer le filtre combiné. */
    protected citizen_filter_change: EventEmitter<void> = new EventEmitter<void>();
    /** Libellé de l'en-tête de la colonne citoyen (partagée aux deux modes). */
    protected readonly citizen_header: string = $localize`Citoyen`;
    /** Libellé de l'en-tête de la colonne métier. */
    protected readonly job_header: string = $localize`Métier`;
    /** Aide (tooltip) des filtres booléens à 3 états. */
    protected readonly bool_filter_hint: string = $localize` — coché : oui · décoché : non · indéterminé : tous`;
    /** Libellé par défaut du bouton de tri (quand aucun tri actif). */
    protected readonly sort_button_label: string = $localize`Trier par`;
    /** Tous les métiers possibles (options du filtre métier). */
    protected readonly all_jobs: JobEnum[] = JobEnum.getAllValues<JobEnum>();
    /** Filtres booléens par colonne (checkbox 3 états : coché `true`=oui / décoché `false`=non / indéterminé `null`=tous). */
    protected readonly bool_filters: Record<string, boolean | null> = {};
    /** Filtres de valeurs (multi-sélection) par colonne stepper (id → valeurs cochées). */
    protected readonly value_filters: Record<string, number[]> = {};
    /** Options de valeurs par colonne stepper (id → valeurs RÉELLEMENT présentes). Construit depuis les données. */
    protected readonly value_options: Record<string, number[]> = {};
    /** Filtre sac : un citoyen passe s'il possède au moins un des objets sélectionnés. */
    protected bag_filter: Item[] = [];
    /** Filtre états : un citoyen passe s'il possède au moins un des états sélectionnés. */
    protected status_filter: StatusEnum[] = [];
    /** Locale courante (libellé I18n des objets du sac). */
    protected readonly locale: string = moment.locale();
    /** Chemin du libellé des objets pour le select (I18n). */
    protected readonly item_bind_label: string = 'label.' + this.locale;
    /** Mode d'affichage courant (persisté en localStorage). */
    protected readonly display_mode: WritableSignal<CitizensDisplayMode> = signal<CitizensDisplayMode>(
        (localStorage.getItem(CITIZENS_LIST_DISPLAY_MODE_KEY) as CitizensDisplayMode | null) ?? 'grouped'
    );
    /** Toutes les actions quotidiennes possibles : pilotent la bande compacte et les colonnes du mode étendu. */
    protected readonly daily_action_keys: DailyActionEnum[] = DailyActionEnum.getAllValues<DailyActionEnum>();
    /** Toutes les actions héroïques possibles, ordonnées (booléens puis niveaux) : pilotent les colonnes du mode étendu. */
    protected readonly heroic_actions_all: HeroicActionEnum[] = [...HeroicActionEnum.getAllValues<HeroicActionEnum>()].sort(byMaxLvlAsc);
    /** Toutes les améliorations possibles, ordonnées : pilotent les colonnes du mode étendu. */
    /**
     * Champs de la maison, le NIVEAU D'HABITATION en tête.
     *
     * C'est lui qui conditionne tous les autres travaux — on ne pose pas une porte blindée dans un
     * lit de camp — et il est désormais renseigné automatiquement depuis MyHordes. Le laisser au
     * milieu des améliorations, où le tri par niveau maximum le plaçait, revenait à noyer la seule
     * information qui donne du sens aux suivantes.
     */
    protected readonly home_all: HomeEnum[] = [
        HomeEnum.HOUSE_LEVEL,
        ...HomeEnum.getAllValues<HomeEnum>()
            .filter((home: HomeEnum): boolean => home.key !== HomeEnum.HOUSE_LEVEL.key)
            .sort(byMaxLvlAsc)
    ];
    /** Citoyen dont le menu de détail des mises à jour est ouvert (menu partagé). */
    protected readonly menu_row: WritableSignal<Citizen | null> = signal<Citizen | null>(null);
    protected readonly citizenNotes: WritableSignal<Dictionary<NoteDTO>> = signal({});
    /** Ouverture de la sidenav de filtres. */
    protected readonly filters_open: WritableSignal<boolean> = signal<boolean>(false);
    /** Colonne de tri active (vide = aucun tri). */
    protected readonly sort_field: WritableSignal<string> = signal<string>('');
    /** Sens du tri actif. */
    protected readonly sort_direction: WritableSignal<SortDirection> = signal<SortDirection>('');
    /** Champs proposés au menu « Trier par » (construit dans ngOnInit). */
    protected sortable_fields: { id: string; label: string }[] = [];
    /** La liste des colonnes pour les citoyens morts */
    protected readonly dead_citizen_list_columns: StandardColumn[] = [
        { id: 'avatar_name', header: $localize`Citoyen`, class: 'center', sticky: true },
        { id: 'cause_of_death', header: $localize`Cause de la mort`, class: '' },
        { id: 'survival', header: $localize`Jours de survie`, class: 'center' },
        { id: 'soul_points', header: $localize`Points d’âme`, class: 'center' },
        { id: 'death_messages', header: $localize`Messages`, class: '' },
        { id: 'pictos', header: $localize`Pictos`, class: 'center' },
        { id: 'note', header: $localize`Note`, class: 'center' },
    ];
    protected readonly all_status: StatusEnum[] = StatusEnum.getAllValues();
    /** La liste des listes disponibles dans le sac */
    protected bag_lists: ListForAddRemove[] = [];
    /** La liste des listes disponibles dans les status */
    protected readonly status_lists: ListForAddRemove[] = [
        { label: $localize`Tous`, list: this.all_status }
    ];
    private sort: Signal<MatSort | undefined> = viewChild(MatSort);
    /** Colonnes affichées en mode « groupé » (regroupées par type ; immunité en colonne dédiée pour le tri). */
    private readonly grouped_columns: string[] = ['avatar_name', 'etats_sac', 'immune', 'daily_actions', 'heroic_actions', 'home', 'last_update'];
    /** Colonnes affichées en mode « colonnes » (une par champ). */
    private readonly per_field_columns: string[] = [
        'job', 'town_roles', 'avatar_name', 'sac', 'etats', 'immune',
        ...this.daily_action_keys.map((action: DailyActionEnum): string => 'daily_' + action.key),
        ...this.heroic_actions_all.map((action: HeroicActionEnum): string => 'heroic_' + action.key),
        ...this.home_all.map((home: HomeEnum): string => 'home_' + home.key),
        'last_update',
    ];
    /** Colonnes effectivement affichées selon le mode. */
    protected readonly displayed_columns: Signal<string[]> = computed((): string[] =>
        this.display_mode() === 'columns' ? this.per_field_columns : this.grouped_columns);
    /** Déclencheur du menu de MàJ en cours de survol + minuterie de fermeture différée. */
    private update_menu_trigger: MatMenuTrigger | null = null;
    private update_menu_close_timer: ReturnType<typeof setTimeout> | null = null;
    private readonly api_service: ApiService = inject(ApiService);
    private readonly town_service: TownService = inject(TownService);
    private readonly me: Me | null = getUser();
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);
    private readonly dialog: MatDialog = inject(MatDialog);
    private readonly clipboard: ClipboardService = inject(ClipboardService);
    private readonly note_service: NoteService = inject(NoteService);
    private readonly router: Router = inject(Router);
    /** Pipe pur réutilisé pour le tri de la colonne bain. */
    private readonly daily_action_pipe: DailyActionForDayPipe = new DailyActionForDayPipe();

    public constructor() {
        // Connexion du MatSort à la datasource dès que la vue est initialisée (viewChild non résolu en ngOnInit).
        effect((): void => {
            const sort: MatSort | undefined = this.sort();
            if (sort) this.citizen_list.sort = sort;
        });
    }

    public ngOnInit(): void {
        this.citizen_list = new MatTableDataSource();
        this.citizen_list.sort = this.sort() as MatSort;

        this.dead_citizen_list = new MatTableDataSource();
        // Pas de tri sur la table des morts : ne pas lier le MatSort (partagé avec la table des vivants),
        // sinon trier les vivants réordonnerait aussi les morts.

        this.citizen_filter_change
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((): void => this.applyCitizenFilters());

        this.town_service.myCitizen$
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (citizen: Citizen | null) => {
                    if (!citizen) return;
                    const index: number = this.citizen_list.data.findIndex((c: Citizen) => c.id === citizen.id);
                    if (index === -1 || this.citizen_list.data[index] === citizen) return;
                    this.citizen_list.data = this.citizen_list.data.map((c: Citizen) => c.id === citizen.id ? citizen : c);
                }
            });

        this.citizen_list.filterPredicate = (data: Citizen, filter: string): boolean => this.customFilter(data, filter);
        this.citizen_list.sortingDataAccessor = (citizen: Citizen, id: string): string | number => this.sortValue(citizen, id);
        this.buildSortableFields();

        this.api_service
            .getItems()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (items: Item[]) => {
                    this.all_items = items;
                    this.bag_lists = [
                        { label: $localize`Tous`, list: this.all_items }
                    ];
                }
            });

        this.getCitizens();

        const town_id: number | undefined = getTown()?.town_id;
        if (town_id) {
            this.note_service.getMyCitizenNotes(town_id)
                .pipe(takeUntilDestroyed(this.destroy_ref))
                .subscribe((notes: Dictionary<NoteDTO>) => this.citizenNotes.set(notes));
        }
    }

    /** Change le mode d'affichage et le persiste. */
    protected changeDisplayMode(mode: CitizensDisplayMode): void {
        if (!mode) return;
        this.display_mode.set(mode);
        localStorage.setItem(CITIZENS_LIST_DISPLAY_MODE_KEY, mode);
    }

    /** Copie les pseudos bruts des citoyens filtrés (un par ligne) dans le presse-papier. */
    protected copyNames(): void {
        const text: string = this.citizen_list.filteredData.map((citizen: Citizen): string => citizen.name).join('\n');
        this.clipboard.copy(text, $localize`Les pseudos ont été copiés`);
    }

    /** Copie les identifiants MyHordes (@pseudo:id) des citoyens filtrés (un par ligne) dans le presse-papier. */
    protected copyTags(): void {
        const text: string = this.citizen_list.filteredData.map((citizen: Citizen): string => citizen.getTag()).join('\n');
        this.clipboard.copy(text, $localize`Les identifiants MyHordes ont été copiés`);
    }

    /** Bascule l'ouverture de la sidenav de filtres. */
    protected toggleFilters(): void {
        this.filters_open.update((open: boolean): boolean => !open);
    }

    /**
     * Trie par un champ (menu « Trier par »). Cliquer le champ actif fait tourner asc → desc → aucun.
     * Pilote le MatSort de la datasource (plus de mat-sort-header dans les en-têtes).
     */
    protected sortBy(id: string): void {
        const sort: MatSort | undefined = this.sort();
        if (!sort) return;
        let field: string = id;
        let direction: SortDirection = 'asc';
        if (this.sort_field() === id) {
            direction = this.sort_direction() === 'asc' ? 'desc' : this.sort_direction() === 'desc' ? '' : 'asc';
            if (direction === '') field = '';
        }
        this.sort_field.set(field);
        this.sort_direction.set(direction);
        sort.active = field;
        sort.direction = direction;
        sort.sortChange.emit({ active: field, direction: direction });
    }

    /** Libellé du champ de tri actif (null si aucun tri) — pour l'afficher sur le bouton « Trier par ». */
    protected activeSortLabel(): string | null {
        const field: string = this.sort_field();
        if (!field) return null;
        return this.sortable_fields.find((sortable: { id: string; label: string }): boolean => sortable.id === field)?.label ?? null;
    }

    /** Nombre de dimensions de filtre actives (badge du bouton Filtres). */
    protected activeFilterCount(): number {
        let count: number = 0;
        if (this.citizen_filters.length > 0) count++;
        if (this.job_filters.length > 0) count++;
        if (this.bag_filter.length > 0) count++;
        if (this.status_filter.length > 0) count++;
        count += Object.values(this.bool_filters).filter((value: boolean | null): boolean => value !== null).length;
        count += Object.values(this.value_filters).filter((values: number[]): boolean => values.length > 0).length;
        return count;
    }

    /** Réinitialise tous les filtres. */
    protected resetFilters(): void {
        this.citizen_filters = [];
        this.job_filters = [];
        this.bag_filter = [];
        this.status_filter = [];
        Object.keys(this.bool_filters).forEach((key: string): void => { delete this.bool_filters[key]; });
        Object.keys(this.value_filters).forEach((key: string): void => { delete this.value_filters[key]; });
        this.applyCitizenFilters();
    }

    /** Ouvre (au survol) le menu de détail des MàJ pour un citoyen. */
    protected openUpdatesMenu(trigger: MatMenuTrigger, citizen: Citizen): void {
        this.cancelUpdatesMenuClose();
        this.menu_row.set(citizen);
        this.update_menu_trigger = trigger;
        trigger.openMenu();
    }

    /** Programme la fermeture différée du menu de MàJ (laisse le temps d'atteindre le menu). */
    protected scheduleUpdatesMenuClose(): void {
        this.update_menu_close_timer = setTimeout((): void => this.update_menu_trigger?.closeMenu(), 200);
    }

    /** Annule la fermeture différée (survol du menu lui-même). */
    protected cancelUpdatesMenuClose(): void {
        if (this.update_menu_close_timer) {
            clearTimeout(this.update_menu_close_timer);
            this.update_menu_close_timer = null;
        }
    }

    /**
     * Identité stable d'une ligne pour les mat-table (vivants et morts).
     * Défensif : évite la recréation des lignes — et donc le repli des cellules `@defer (on viewport)`
     * sur leur placeholder vide — si `data` venait à être réaffecté avec de nouvelles instances.
     */
    protected trackByCitizen(_index: number, citizen: Citizen): number {
        return citizen.id;
    }

    /** Retrouve la valeur d'une action héroïque pour un citoyen (colonnes générées du mode étendu). */
    protected getHeroicAction(citizen: Citizen, action: HeroicActionEnum): HeroicActionsWithValue | undefined {
        return citizen.heroic_actions?.content?.find((content: HeroicActionsWithValue): boolean => content.element?.key === action.key);
    }

    /** Retrouve la valeur d'une amélioration pour un citoyen (colonnes générées du mode étendu). */
    protected getHomeUpgrade(citizen: Citizen, home: HomeEnum): HomeWithValue | undefined {
        return citizen.home?.content?.find((content: HomeWithValue): boolean => content.element?.key === home.key);
    }

    /**
     * Icône d'une amélioration. L'habitation n'a pas d'icône fixe (`img` vide) : son visuel dépend du
     * niveau, d'où l'image `home_lv{niveau}.gif`. Un niveau négatif (-1 = non défini) retombe sur le
     * visuel du niveau 0 pour éviter une image cassée.
     */
    /**
     * Le champ maison donné est-il saisissable ? Tous le sont, sauf le niveau de la maison, que
     * MyHordes fournit et que le back déduit de `baseDef` — voir {@link isHouseLevelEditable}.
     */
    protected isHomeEditable(home: HomeWithValue): boolean {
        return isHouseLevelEditable(getTown()) || home.element?.key !== HomeEnum.HOUSE_LEVEL.key;
    }

    protected getHomeIcon(home: HomeWithValue): string {
        return getHomeIcon(home);
    }

    /** Icône d'une action héroïque ; cas particulier de l'APAG dont l'icône dépend des charges restantes. */
    protected getHeroicIcon(action: HeroicActionsWithValue): string {
        return getHeroicIcon(action);
    }

    /** Toutes les sources de mise à jour d'un citoyen (pour le menu de détail). */
    protected lastUpdates(citizen: Citizen): CitizenUpdateEntry[] {
        return [
            { label: $localize`États`, info: citizen.status?.update_info },
            { label: $localize`Sac`, info: citizen.bag?.update_info },
            { label: $localize`Chamanique`, info: citizen.chamanic_detail?.update_info },
            { label: $localize`Bain`, info: this.daily_action_pipe.transform(citizen.daily_actions, this.current_day, 'home_pool')?.update_info },
            { label: $localize`Actions héroïques`, info: citizen.heroic_actions?.update_info },
            { label: $localize`Améliorations`, info: citizen.home?.update_info },
        ];
    }

    /** Mise à jour la plus récente, tous champs confondus (indicateur unique en fin de ligne). */
    protected latestUpdate(citizen: Citizen): UpdateInfo | undefined {
        let latest: UpdateInfo | undefined;
        for (const entry of this.lastUpdates(citizen)) {
            if (entry.info?.update_time && (!latest || entry.info.update_time.isAfter(latest.update_time))) {
                latest = entry.info;
            }
        }
        return latest;
    }

    /** Ouvre le détail des pictos gagnés par un citoyen dans la ville en cours. */
    protected openPictos(citizen: Citizen): void {
        const town_id: number | undefined = getTown()?.town_id;
        if (!town_id) return;
        const data: CitizenPictosDialogData = {
            userId: citizen.id,
            citizenName: citizen.name,
            townId: town_id
        };
        this.dialog.open(CitizenPictosDialogComponent, { data: data });
    }

    /** Ouvre la page de profil du citoyen. */
    protected goToProfile(userId: number): void {
        this.router.navigate(['/profile', userId]);
    }

    /** Ouvre l'édition de la note privée de l'appelant sur ce citoyen dans la ville en cours. */
    protected openNote(citizen: Citizen): void {
        const town_id: number | undefined = getTown()?.town_id;
        if (!town_id) return;
        const data: NoteDialogData = { initialContent: this.citizenNotes()[citizen.id]?.note ?? null };
        this.dialog.open(NoteDialogComponent, { data })
            .afterClosed()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((content: string | undefined) => {
                if (content === undefined) return;
                this.note_service.saveCitizenNote(citizen.id, town_id, content)
                    .pipe(takeUntilDestroyed(this.destroy_ref))
                    .subscribe(() => this.citizenNotes.update((notes) => ({ ...notes, [citizen.id]: { note: content } })));
            });
    }

    /**
     * Si l'item est déjà dans la liste, on fait +1
     * Sinon on rajoute l'item à la liste
     *
     * @param {number} citizen_id
     * @param {number} item_id
     */
    protected addItem(citizen_id: number, item_id: number): void {
        const citizen: Citizen | undefined = this.citizen_list.data.find((citizen: Citizen) => citizen.id === citizen_id);
        if (citizen && citizen.bag) {
            citizen.bag.items.push(<Item>this.all_items.find((item: Item) => item.id === item_id));

            this.town_service
                .updateBag(citizen)
                .pipe(takeUntilDestroyed(this.destroy_ref))
                .subscribe({
                    next: (update_info: UpdateInfo): void => {
                        if (citizen.bag) {
                            citizen.bag.update_info.username = getUser()?.username;
                            citizen.bag.update_info.update_time = update_info.update_time;
                        }
                        if (citizen.id === this.me?.id) this.town_service.publishMyCitizen(citizen);
                    }
                });
        }
    }

    /**
     * On retire 1 au compteur de l'item
     * Si l'item tombe à 0, on le retire de la liste
     *
     * @param {number} citizen_id
     * @param {number} item_id
     */
    protected removeItem(citizen_id: number, item_id: number): void {
        const citizen: Citizen | undefined = this.citizen_list.data.find((citizen: Citizen) => citizen.id === citizen_id);
        if (citizen && citizen.bag) {
            const item_in_datasource_index: number | undefined = citizen.bag.items.findIndex((item_in_bag: Item) => item_in_bag.id === item_id);
            if (item_in_datasource_index !== undefined && item_in_datasource_index !== null && item_in_datasource_index > -1) {
                citizen.bag.items.splice(item_in_datasource_index, 1);
            }
            this.town_service
                .updateBag(citizen)
                .pipe(takeUntilDestroyed(this.destroy_ref))
                .subscribe({
                    next: (update_info: UpdateInfo) => {
                        if (citizen.bag) {
                            citizen.bag.update_info.username = getUser()?.username;
                            citizen.bag.update_info.update_time = update_info.update_time;
                        }
                        if (citizen.id === this.me?.id) this.town_service.publishMyCitizen(citizen);
                    }
                });
        }
    }

    /**
     * On vide complètement le sac
     *
     * @param {number} citizen_id
     */
    protected emptyBag(citizen_id: number): void {
        const citizen: Citizen | undefined = this.citizen_list.data.find((citizen: Citizen) => citizen.id === citizen_id);
        if (citizen && citizen.bag) {
            citizen.bag.items = [];
            this.town_service
                .updateBag(citizen)
                .pipe(takeUntilDestroyed(this.destroy_ref))
                .subscribe({
                    next: (update_info: UpdateInfo) => {
                        if (citizen.bag) {
                            citizen.bag.update_info.username = getUser()?.username;
                            citizen.bag.update_info.update_time = update_info.update_time;
                        }
                        if (citizen.id === this.me?.id) this.town_service.publishMyCitizen(citizen);
                    }
                });
        }
    }

    /**
     * On ajoute un état
     *
     * @param {number} citizen_id
     * @param {number} status_key
     */
    protected addStatus(citizen_id: number, status_key: string): void {
        const citizen: Citizen | undefined = this.citizen_list.data.find((citizen: Citizen) => citizen.id === citizen_id);
        if (citizen && citizen.status) {
            citizen.status.icons.push(<StatusEnum>this.all_status.find((status: StatusEnum) => status?.key === status_key));

            this.town_service
                .updateStatus(citizen)
                .pipe(takeUntilDestroyed(this.destroy_ref))
                .subscribe({
                    next: (update_info: UpdateInfo) => {
                        if (citizen.status) {
                            citizen.status.update_info.username = getUser()?.username;
                            citizen.status.update_info.update_time = update_info.update_time;
                        }
                        if (citizen.id === this.me?.id) this.town_service.publishMyCitizen(citizen);
                    }
                });
        }
    }

    /**
     * On retire un état
     *
     * @param {number} citizen_id
     * @param {number} status_key
     */
    protected removeStatus(citizen_id: number, status_key: string): void {
        const citizen: Citizen | undefined = this.citizen_list.data.find((citizen: Citizen) => citizen.id === citizen_id);
        if (citizen && citizen.status) {
            const existing_status_index: number | undefined = citizen.status.icons.findIndex((status: StatusEnum) => status?.key === status_key);
            if (existing_status_index !== undefined && existing_status_index !== null && existing_status_index > -1) {
                citizen.status.icons.splice(existing_status_index, 1);
            }
            this.town_service
                .updateStatus(citizen)
                .pipe(takeUntilDestroyed(this.destroy_ref))
                .subscribe({
                    next: (update_info: UpdateInfo) => {
                        if (citizen.status) {
                            citizen.status.update_info.username = getUser()?.username;
                            citizen.status.update_info.update_time = update_info.update_time;
                        }
                        if (citizen.id === this.me?.id) this.town_service.publishMyCitizen(citizen);
                    }
                });
        }
    }

    /**
     * On vide complètement les statuts
     *
     * @param {number} citizen_id
     */
    protected emptyStatus(citizen_id: number): void {
        const citizen: Citizen | undefined = this.citizen_list.data.find((citizen: Citizen) => citizen.id === citizen_id);
        if (citizen && citizen.status) {
            citizen.status.icons = [];
            this.town_service
                .updateStatus(citizen)
                .pipe(takeUntilDestroyed(this.destroy_ref))
                .subscribe({
                    next: (update_info: UpdateInfo) => {
                        if (citizen.status) {
                            citizen.status.update_info.username = getUser()?.username;
                            citizen.status.update_info.update_time = update_info.update_time;
                        }
                        if (citizen.id === this.me?.id) this.town_service.publishMyCitizen(citizen);
                    }
                });
        }
    }

    /**
     * On met à jour la liste des améliorations
     *
     * @param {HomeWithValue} element
     * @param {number | boolean} value nouvelle valeur (toggle booléen ou stepper numérique)
     * @param {number} citizen_id
     */
    protected updateHome(element: HomeWithValue, value: number | boolean, citizen_id: number): void {
        const old_element_value: boolean | number = element.value;
        element.value = value;
        this.buildValueOptions();

        const citizen: Citizen | undefined = this.citizen_list.data.find((citizen: Citizen) => citizen.id === citizen_id);
        if (citizen && citizen.home !== undefined) {
            this.town_service
                .updateHome(citizen)
                .pipe(takeUntilDestroyed(this.destroy_ref))
                .subscribe({
                    next: (update_info: UpdateInfo) => {
                        if (citizen.home) {
                            citizen.home.update_info.username = getUser()?.username;
                            citizen.home.update_info.update_time = update_info.update_time;
                        }
                        if (citizen.id === this.me?.id) this.town_service.publishMyCitizen(citizen);
                    },
                    error: () => {
                        element.value = old_element_value;
                        this.buildValueOptions();
                    }
                });
        }
    }

    /**
     * On met à jour la liste des actions héroiques
     *
     * @param {HeroicActionsWithValue} element
     * @param {number | boolean} value nouvelle valeur (toggle booléen ou stepper numérique)
     * @param {number} citizen_id
     */
    protected updateActions(element: HeroicActionsWithValue, value: number | boolean, citizen_id: number): void {
        const old_element_value: boolean | number = element.value;
        element.value = value;
        this.buildValueOptions();

        const citizen: Citizen | undefined = this.citizen_list.data.find((citizen: Citizen) => citizen.id === citizen_id);
        if (citizen && citizen.heroic_actions) {
            this.town_service
                .updateHeroicActions(citizen)
                .pipe(takeUntilDestroyed(this.destroy_ref))
                .subscribe({
                    next: (update_info: UpdateInfo) => {
                        if (citizen.heroic_actions) {
                            citizen.heroic_actions.update_info.username = getUser()?.username;
                            citizen.heroic_actions.update_info.update_time = update_info.update_time;
                        }
                        if (citizen.id === this.me?.id) this.town_service.publishMyCitizen(citizen);
                    },
                    error: () => {
                        element.value = old_element_value;
                        this.buildValueOptions();
                    }
                });
        }
    }

    /** Résout la valeur courante d'une action pour un citoyen — même forme que getHeroicAction/getHomeUpgrade. */
    protected getDailyAction(citizen: Citizen, action: DailyActionEnum): { element: DailyActionEnum; value: boolean } {
        return {
            element: action,
            value: !!this.daily_action_pipe.transform(citizen.daily_actions, this.current_day, action.key)
        };
    }

    /** Prend ou retire une action quotidienne. citizenId (pas une référence) : cellule différée, cf. updateActions/updateHome. */
    protected saveDailyAction(actionKey: string, checked: boolean, citizenId: number): void {
        const citizen: Citizen | undefined = this.citizen_list.data.find((c: Citizen) => c.id === citizenId);
        if (!citizen) return;

        if (checked) {
            this.town_service
                .addDailyAction(citizen, actionKey)
                .pipe(takeUntilDestroyed(this.destroy_ref))
                .subscribe({
                    next: () => {
                        citizen.daily_actions.push(new DailyAction({
                            day: this.current_day, actionKey,
                            lastUpdateInfo: { updateTime: new Date(), userId: '', userName: '', userKey: '' }
                        }));
                        if (citizen.id === this.me?.id) this.town_service.publishMyCitizen(citizen);
                    }
                });
        } else {
            this.town_service
                .removeDailyAction(citizen, actionKey)
                .pipe(takeUntilDestroyed(this.destroy_ref))
                .subscribe({
                    next: () => {
                        const index: number = citizen.daily_actions.findIndex((action: DailyAction) => action.day === this.current_day && action.action_key === actionKey);
                        if (index > -1) citizen.daily_actions.splice(index, 1);
                        if (citizen.id === this.me?.id) this.town_service.publishMyCitizen(citizen);
                    }
                });
        }
    }

    /** Met à jour le nombre de potions chamaniques bues (stepper). */
    protected changePotions(citizen: Citizen, value: number): void {
        citizen.chamanic_detail.nb_potion_shaman = value;
        this.buildValueOptions();
        this.saveChamanicDetails(citizen);
    }

    /** Met à jour l'immunité à l'âme (toggle). */
    protected changeImmune(citizen: Citizen, immune: boolean): void {
        citizen.chamanic_detail.is_immune_to_soul = immune;
        this.saveChamanicDetails(citizen);
    }

    protected saveChamanicDetails(citizen: Citizen): void {
        this.town_service
            .saveChamanicDetails(citizen)
            .subscribe({
                next: (update_info: UpdateInfo) => {
                    if (citizen.chamanic_detail) {
                        citizen.chamanic_detail.update_info.username = getUser()?.username;
                        citizen.chamanic_detail.update_info.update_time = update_info.update_time;
                    }
                    if (citizen.id === this.me?.id) this.town_service.publishMyCitizen(citizen);
                }
            });
    }

    /** Icône d'en-tête d'une colonne amélioration (habitation → niveau 0 par défaut). */
    protected homeHeaderIcon(home: HomeEnum): string {
        return home.value.img && home.value.img !== '' ? home.value.img : 'home/home_lv0.gif';
    }

    /** État du filtre booléen d'une colonne (null = tous par défaut). */
    protected boolFilter(id: string): boolean | null {
        return this.bool_filters[id] ?? null;
    }

    /** Fait tourner le filtre booléen 3 états : tous (null) → oui (true) → non (false) → tous. */
    protected cycleBoolFilter(id: string): void {
        const current: boolean | null = this.boolFilter(id);
        this.bool_filters[id] = current === null ? true : current === true ? false : null;
        this.applyCitizenFilters();
    }

    /** Valeurs cochées d'une colonne stepper. */
    protected valueFilter(id: string): number[] {
        return this.value_filters[id] ?? [];
    }

    /** Applique un filtre de valeurs (multi-toggle) sur une colonne stepper. */
    protected setValueFilter(id: string, values: number[]): void {
        this.value_filters[id] = values ?? [];
        this.applyCitizenFilters();
    }

    /** Sérialise tous les filtres actifs dans la datasource pour déclencher le filtrage. */
    protected applyCitizenFilters(): void {
        this.citizen_list.filter = JSON.stringify({
            names: this.citizen_filters.map((citizen: Citizen): number => citizen.id),
            jobs: this.job_filters.map((job: JobEnum): string => job.key),
            bools: this.bool_filters,
            values: this.value_filters,
            bagIds: this.bag_filter.map((item: Item): number => item.id),
            statusKeys: this.status_filter.map((status: StatusEnum): string => status.key),
        });
    }

    /**
     * Valeur de tri d'un citoyen selon la colonne.
     * - `avatar_name` : nom (insensible à la casse)
     * - `immune` : immunisé (oui avant non) puis nombre de potions bues (départage)
     * - `daily_<key>` : action quotidienne faite pour le jour courant (oui/non)
     * - `heroic_<key>` / `home_<key>` : valeur du champ (booléen → 1/0, inconnu → -1)
     */
    private sortValue(citizen: Citizen, id: string): string | number {
        if (id === 'avatar_name') return (citizen.name ?? '').toLocaleLowerCase();
        if (id === 'job') return (citizen.job?.value?.label ?? '').toLocaleLowerCase();
        if (id === 'immune') {
            const immune: number = citizen.chamanic_detail?.is_immune_to_soul ? 1 : 0;
            const potions: number = citizen.chamanic_detail?.nb_potion_shaman ?? 0;
            return immune * IMMUNE_SORT_FACTOR + potions;
        }
        if (id.startsWith('daily_')) return this.daily_action_pipe.transform(citizen.daily_actions, this.current_day, id.substring('daily_'.length)) ? 1 : 0;
        if (id.startsWith('heroic_')) return this.fieldSortValue(citizen.heroic_actions?.content, id.substring('heroic_'.length));
        if (id.startsWith('home_')) return this.fieldSortValue(citizen.home?.content, id.substring('home_'.length));
        return '';
    }

    /** Valeur numérique triable d'un champ héroïque/amélioration : booléen → 1/0, inconnu → -1. */
    private fieldSortValue(content: (HeroicActionsWithValue | HomeWithValue)[] | undefined, key: string): number {
        const value: number | boolean | undefined = content?.find(
            (item: HeroicActionsWithValue | HomeWithValue): boolean => item.element?.key === key
        )?.value;
        if (typeof value === 'number') return value;
        if (value === true) return 1;
        if (value === false) return 0;
        return -1;
    }

    /**
     * (Re)construit les options des filtres de valeurs pour chaque colonne stepper, à partir des valeurs
     * RÉELLEMENT présentes chez les citoyens (évite d'afficher 0..13 boutons alors que 2 valeurs existent).
     */
    private buildValueOptions(): void {
        const stepper_ids: string[] = [
            'potions',
            ...this.heroic_actions_all.filter((action: HeroicActionEnum): boolean => action.value.max_lvl > 1).map((action: HeroicActionEnum): string => 'heroic_' + action.key),
            ...this.home_all.filter((home: HomeEnum): boolean => home.value.max_lvl > 1).map((home: HomeEnum): string => 'home_' + home.key),
        ];
        stepper_ids.forEach((id: string): void => {
            const values: Set<number> = new Set<number>();
            this.citizen_list.data.forEach((citizen: Citizen): void => {
                const value: number = this.citizenNumericValue(citizen, id);
                if (value >= 0) values.add(value);
            });
            this.value_options[id] = Array.from(values).sort((a: number, b: number): number => a - b);
        });
    }

    /** Construit la liste des champs triables (menu « Trier par »). */
    private buildSortableFields(): void {
        this.sortable_fields = [
            { id: 'avatar_name', label: $localize`Nom` },
            { id: 'job', label: $localize`Métier` },
            { id: 'immune', label: $localize`Immunité` },
            ...this.daily_action_keys.map((action: DailyActionEnum): { id: string; label: string } => ({ id: 'daily_' + action.key, label: action.getLabel() })),
            ...this.heroic_actions_all.map((action: HeroicActionEnum): { id: string; label: string } => ({ id: 'heroic_' + action.key, label: action.getLabel() })),
            ...this.home_all.map((home: HomeEnum): { id: string; label: string } => ({ id: 'home_' + home.key, label: home.getLabel() })),
        ];
    }

    /** Valeur booléenne d'un citoyen pour une colonne (ou null si inconnue/non applicable). */
    private citizenBoolValue(citizen: Citizen, id: string): boolean | null {
        if (id.startsWith('daily_')) return !!this.daily_action_pipe.transform(citizen.daily_actions, this.current_day, id.substring('daily_'.length));
        if (id === 'immune') return !!citizen.chamanic_detail?.is_immune_to_soul;
        const value: number | boolean | undefined = id.startsWith('heroic_')
            ? citizen.heroic_actions?.content?.find((c: HeroicActionsWithValue): boolean => c.element?.key === id.substring('heroic_'.length))?.value
            : citizen.home?.content?.find((c: HomeWithValue): boolean => c.element?.key === id.substring('home_'.length))?.value;
        return typeof value === 'boolean' ? value : null;
    }

    /** Valeur numérique d'un citoyen pour un champ à valeur (inconnu → -1). */
    private citizenNumericValue(citizen: Citizen, id: string): number {
        if (id === 'potions') return citizen.chamanic_detail?.nb_potion_shaman ?? 0;
        return id.startsWith('heroic_')
            ? this.fieldSortValue(citizen.heroic_actions?.content, id.substring('heroic_'.length))
            : this.fieldSortValue(citizen.home?.content, id.substring('home_'.length));
    }

    /** Prédicat de filtre combiné : nom, métier, booléens, valeurs, sac et états (tous en ET). */
    private customFilter(data: Citizen, filter: string): boolean {
        const active: {
            names: number[]; jobs: string[]; bools: Record<string, boolean | null>;
            values: Record<string, number[]>; bagIds: number[]; statusKeys: string[];
        } = JSON.parse(filter);

        if (active.names?.length > 0 && !active.names.includes(data.id)) return false;
        if (active.jobs?.length > 0 && !active.jobs.includes(data.job?.key ?? '')) return false;

        for (const id of Object.keys(active.bools ?? {})) {
            const want: boolean | null = active.bools[id];
            if (want === null || want === undefined) continue;
            if (this.citizenBoolValue(data, id) !== want) return false;
        }

        for (const id of Object.keys(active.values ?? {})) {
            const wanted: number[] = active.values[id];
            if (!wanted || wanted.length === 0) continue;
            if (!wanted.includes(this.citizenNumericValue(data, id))) return false;
        }

        if (active.bagIds?.length > 0 && !data.bag?.items?.some((item: Item): boolean => active.bagIds.includes(item.id))) return false;
        if (active.statusKeys?.length > 0 && !data.status?.icons?.some((status: StatusEnum): boolean => active.statusKeys.includes(status?.key))) return false;

        return true;
    }

    private getCitizens(): void {
        this.town_service
            .getCitizens()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (citizen_info: CitizenInfo) => {
                    const alive_citizen_info: CitizenInfo = Object.assign({}, citizen_info);
                    alive_citizen_info.citizens = alive_citizen_info.citizens.filter((citizen: Citizen) => !citizen.is_dead);
                    this.alive_citizen_info = alive_citizen_info;
                    this.citizen_list.data = [...alive_citizen_info.citizens];
                    this.buildValueOptions();

                    const my_citizen: Citizen | undefined = alive_citizen_info.citizens.find((citizen: Citizen) => citizen.id === this.me?.id);
                    if (my_citizen) this.town_service.publishMyCitizen(my_citizen);

                    const dead_citizen_info: CitizenInfo = Object.assign({}, citizen_info);
                    // Les morts sont affichés directement depuis les objets Citizen : l'API ne renvoie pas
                    // d'objet `cadaver` distinct (le filtre `&& citizen.cadaver` masquait donc tous les morts).
                    dead_citizen_info.citizens = dead_citizen_info.citizens.filter((citizen: Citizen) => citizen.is_dead);
                    this.dead_citizen_info = dead_citizen_info;
                    this.dead_citizen_list.data = [...dead_citizen_info.citizens];
                }
            });
    }
}
