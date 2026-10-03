import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import { DOCUMENT } from '@angular/common';
import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    Injector,
    input,
    InputSignal,
    Signal,
    signal,
    untracked,
    viewChild,
    WritableSignal
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { Imports } from '../../../_abstract_model/types/_types';
import { AvatarComponent } from '../../../_shared/avatar/avatar.component';
import { GlobalSearchService } from './global-search.service';
import {
    GLOBAL_SEARCH_DIRECTORY_EXPANDED_LIMIT,
    GLOBAL_SEARCH_DIRECTORY_GROUPS,
    GLOBAL_SEARCH_GROUP_LIMIT,
    GlobalSearchEntry,
    GlobalSearchGroup,
    GlobalSearchGroupId,
    GlossaryDefinition
} from './global-search.util';

const angular_common: Imports = [CdkConnectedOverlay, CdkOverlayOrigin];
const components: Imports = [AvatarComponent];
const material_modules: Imports = [MatButtonModule, MatIconModule];

/**
 * Une ligne de la liste : un résultat, ou la ligne qui déplie son groupe (option à part entière,
 * pour être atteinte au clavier). Son rang dans la liste complète sert à la navigation au clavier.
 */
type GlobalSearchOption =
    | { readonly kind: 'entry'; readonly entry: GlobalSearchEntry; readonly index: number; readonly id: string; readonly key: string }
    | { readonly kind: 'more'; readonly group: GlobalSearchGroupId; readonly count: number; readonly index: number; readonly id: string; readonly key: string };

interface GlobalSearchGroupView {
    readonly id: GlobalSearchGroupId;
    readonly label: string;
    readonly header_id: string;
    readonly total: number;
    /** Résultats affichés, sans la ligne « afficher plus » */
    readonly shown: number;
    /** Le groupe peut encore être déplié */
    readonly expandable: boolean;
    readonly options: readonly GlobalSearchOption[];
}

/** Groupe de l'annuaire déplié, dont l'API n'a renvoyé qu'une partie des résultats. */
interface GlobalSearchTruncatedGroup {
    readonly label: string;
    readonly shown: number;
    readonly total: number;
}

/** Champs où `/` s'écrit : le raccourci n'y est jamais intercepté. */
const NON_TEXT_INPUT_TYPES: ReadonlySet<string> = new Set(['button', 'checkbox', 'color', 'file', 'hidden', 'image', 'radio', 'range', 'reset', 'submit']);

let next_instance_id: number = 0;

/**
 * Recherche globale de l'en-tête : pages, objets, chantiers, bâtiments, en ville citoyens, puis
 * joueurs et villes de l'annuaire. Un sigle du glossaire saisi en entier est développé.
 *
 * Combobox ARIA (motif « liste avec sélection active ») : le focus reste dans le champ, l'option
 * active est annoncée par `aria-activedescendant`. Les résultats s'ouvrent dans un calque CDK :
 * la barre d'en-tête défile horizontalement (`overflow: hidden` vertical) et rognerait un panneau
 * positionné en son sein.
 */
@Component({
    selector: 'mho-global-search',
    templateUrl: './global-search.component.html',
    styleUrls: ['./global-search.component.scss'],
    imports: [...angular_common, ...components, ...material_modules],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class.is-compact]': 'compact()',
        '[class.is-expanded]': 'compact() && expanded()'
    }
})
export class GlobalSearchComponent {
    /** Petit écran : le champ se replie en loupe et s'ouvre par-dessus la barre d'en-tête. */
    public readonly compact: InputSignal<boolean> = input<boolean>(false);

    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;

    private readonly search_service: GlobalSearchService = inject(GlobalSearchService);
    private readonly router: Router = inject(Router);
    private readonly dialog: MatDialog = inject(MatDialog);
    private readonly injector: Injector = inject(Injector);
    private readonly document: Document = inject(DOCUMENT);

    private readonly input_ref: Signal<ElementRef<HTMLInputElement> | undefined> = viewChild<ElementRef<HTMLInputElement>>('input');

    private readonly instance_id: number = next_instance_id++;
    protected readonly listbox_id: string = `mho-global-search-${this.instance_id}`;

    private static readonly GROUP_LABELS: Readonly<Record<GlobalSearchGroupId, string>> = {
        pages: $localize`Pages`,
        items: $localize`Objets`,
        buildings: $localize`Chantiers`,
        ruins: $localize`Bâtiments`,
        citizens: $localize`Citoyens`,
        players: $localize`Joueurs`,
        towns: $localize`Villes`
    };

    protected readonly query: WritableSignal<string> = signal('');
    protected readonly focused: WritableSignal<boolean> = signal(false);
    /** Liste refermée par Échap sans quitter le champ : elle rouvre à la frappe ou aux flèches. */
    private readonly dismissed: WritableSignal<boolean> = signal(false);
    /** Petit écran seulement : champ ouvert par-dessus la barre. */
    protected readonly expanded: WritableSignal<boolean> = signal(false);
    private readonly active_index: WritableSignal<number> = signal(0);
    /** Groupes dépliés pour la saisie en cours : ils montrent tous leurs résultats. */
    private readonly expanded_groups: WritableSignal<ReadonlySet<GlobalSearchGroupId>> = signal(new Set<GlobalSearchGroupId>());

    protected readonly loading: Signal<boolean> = this.search_service.loading;
    protected readonly directory_loading: Signal<boolean> = this.search_service.directory_loading;

    /** Définitions du sigle saisi (« GCEM : Gros coffre en métal »), rappelées en tête des résultats. */
    protected readonly glossary_notes: Signal<readonly GlossaryDefinition[]> = computed((): readonly GlossaryDefinition[] =>
        this.search_service.glossaryMatches(this.query()));

    protected readonly groups: Signal<GlobalSearchGroupView[]> = computed((): GlobalSearchGroupView[] => {
        const expanded: ReadonlySet<GlobalSearchGroupId> = this.expanded_groups();
        let offset: number = 0;
        return this.search_service.search(this.query(), expanded).map((group: GlobalSearchGroup): GlobalSearchGroupView => {
            const options: GlobalSearchOption[] = group.entries.map((entry: GlobalSearchEntry, position: number): GlobalSearchOption => ({
                kind: 'entry',
                entry,
                index: offset + position,
                id: `${this.listbox_id}-option-${offset + position}`,
                key: `${group.id}:${entry.key}`
            }));
            const expandable: boolean = !expanded.has(group.id) && group.available > group.entries.length;
            if (expandable) {
                const index: number = offset + options.length;
                options.push({
                    kind: 'more',
                    group: group.id,
                    count: group.available - group.entries.length,
                    index,
                    id: `${this.listbox_id}-option-${index}`,
                    key: `${group.id}:more`
                });
            }
            offset += options.length;
            return {
                id: group.id,
                label: GlobalSearchComponent.GROUP_LABELS[group.id],
                header_id: `${this.listbox_id}-${group.id}`,
                total: group.total,
                shown: group.entries.length,
                expandable,
                options
            };
        });
    });

    /** Groupes de l'annuaire dépliés dont tous les résultats n'ont pas été renvoyés : on invite à préciser. */
    protected readonly truncated_groups: Signal<GlobalSearchTruncatedGroup[]> = computed((): GlobalSearchTruncatedGroup[] => this.groups()
        .filter((group: GlobalSearchGroupView): boolean => !group.expandable && group.total > group.shown && GLOBAL_SEARCH_DIRECTORY_GROUPS.includes(group.id))
        .map((group: GlobalSearchGroupView): GlobalSearchTruncatedGroup => ({ label: group.label, shown: group.shown, total: group.total })));

    private readonly options: Signal<GlobalSearchOption[]> = computed((): GlobalSearchOption[] =>
        this.groups().flatMap((group: GlobalSearchGroupView): GlobalSearchOption[] => [...group.options]));

    protected readonly options_count: Signal<number> = computed((): number => this.options().length);

    protected readonly panel_open: Signal<boolean> = computed((): boolean => this.focused() && !this.dismissed() && this.query().trim() !== '');

    /** Vrai quand le panneau montre une liste de résultats (et non un message « aucun résultat »). */
    protected readonly listbox_open: Signal<boolean> = computed((): boolean => this.panel_open() && this.options_count() > 0);

    /** Option active, bornée : le nombre de résultats change à chaque frappe. */
    protected readonly active: Signal<GlobalSearchOption | null> = computed((): GlobalSearchOption | null => {
        const options: GlobalSearchOption[] = this.options();
        return options.length === 0 ? null : options[Math.min(this.active_index(), options.length - 1)];
    });

    protected readonly active_id: Signal<string | null> = computed((): string | null => this.listbox_open() ? (this.active()?.id ?? null) : null);

    protected readonly positions: ConnectedPosition[] = [
        { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
        { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 6 }
    ];

    public constructor() {
        // Écouteur natif et non `host: { '(document:keydown)' }` : l'application est zéro-zone, et
        // un écouteur de gabarit marquerait la vue à vérifier à CHAQUE touche frappée dans la page.
        const listener: (event: KeyboardEvent) => void = (event: KeyboardEvent): void => this.onDocumentKeydown(event);
        this.document.addEventListener('keydown', listener);
        inject(DestroyRef).onDestroy((): void => this.document.removeEventListener('keydown', listener));

        // L'annuaire suit la saisie ; un de ses groupes déplié demande davantage de résultats.
        effect((): void => {
            const query: string = this.query();
            const expanded: ReadonlySet<GlobalSearchGroupId> = this.expanded_groups();
            const limit: number = GLOBAL_SEARCH_DIRECTORY_GROUPS.some((group: GlobalSearchGroupId): boolean => expanded.has(group))
                ? GLOBAL_SEARCH_DIRECTORY_EXPANDED_LIMIT
                : GLOBAL_SEARCH_GROUP_LIMIT;
            untracked((): void => this.search_service.requestDirectory(query, limit));
        });
    }

    /** Premier focus : c'est lui, et non le démarrage de l'application, qui charge l'index. */
    protected onFocus(): void {
        this.focused.set(true);
        this.dismissed.set(false);
        this.search_service.ensureLoaded();
    }

    protected onBlur(): void {
        this.focused.set(false);
        if (this.compact()) {
            this.expanded.set(false);
        }
    }

    protected onInput(event: Event): void {
        this.query.set((event.target as HTMLInputElement).value);
        this.dismissed.set(false);
        this.active_index.set(0);
        this.expanded_groups.set(new Set<GlobalSearchGroupId>());
    }

    protected onKeydown(event: KeyboardEvent): void {
        switch (event.key) {
            case 'ArrowDown':
            case 'ArrowUp':
                event.preventDefault();
                if (this.dismissed()) {
                    this.dismissed.set(false);
                    return;
                }
                this.moveActive(event.key === 'ArrowDown' ? 1 : -1);
                return;
            case 'Enter': {
                const active: GlobalSearchOption | null = this.listbox_open() ? this.active() : null;
                if (active) {
                    event.preventDefault();
                    this.choose(active);
                }
                return;
            }
            case 'Escape':
                // Échap défait une chose à la fois : la liste, puis la saisie, puis le focus.
                event.preventDefault();
                event.stopPropagation();
                if (this.panel_open()) {
                    this.dismissed.set(true);
                } else if (this.query() !== '') {
                    this.query.set('');
                    this.expanded_groups.set(new Set<GlobalSearchGroupId>());
                } else {
                    this.input_ref()?.nativeElement.blur();
                }
                return;
        }
    }

    protected activate(index: number): void {
        this.active_index.set(index);
    }

    protected clear(): void {
        this.query.set('');
        this.active_index.set(0);
        this.expanded_groups.set(new Set<GlobalSearchGroupId>());
        this.input_ref()?.nativeElement.focus();
    }

    /** Clic ou Entrée sur une ligne : ouvre le résultat, ou déplie son groupe. */
    protected choose(option: GlobalSearchOption): void {
        if (option.kind === 'more') {
            this.expand(option.group);
        } else {
            this.select(option.entry);
        }
    }

    /**
     * Déplie un groupe. L'option active reste au même rang : c'était la ligne « afficher plus »,
     * c'est désormais le premier des résultats révélés.
     */
    protected expand(group: GlobalSearchGroupId): void {
        this.expanded_groups.update((expanded: ReadonlySet<GlobalSearchGroupId>): ReadonlySet<GlobalSearchGroupId> => new Set<GlobalSearchGroupId>([...expanded, group]));
    }

    protected openCompact(): void {
        this.expanded.set(true);
        this.focusInput();
    }

    /** Ouvre la page du résultat, sur l'élément (lien profond), puis rend la main à la page. */
    protected select(entry: GlobalSearchEntry): void {
        void this.router.navigate(['/' + entry.link.path], { queryParams: entry.link.query_params ?? undefined });
        this.query.set('');
        this.active_index.set(0);
        this.expanded_groups.set(new Set<GlobalSearchGroupId>());
        this.input_ref()?.nativeElement.blur();
    }

    private moveActive(delta: 1 | -1): void {
        const count: number = this.options_count();
        if (count === 0) {
            return;
        }
        const current: number = this.active()?.index ?? 0;
        this.active_index.set((current + delta + count) % count);
        // Après rendu : l'option à montrer doit porter sa nouvelle classe avant qu'on la cherche.
        afterNextRender({
            read: (): void => {
                const id: string | null = this.active_id();
                const option: HTMLElement | null = id ? this.document.getElementById(id) : null;
                option?.scrollIntoView?.({ block: 'nearest' });
            }
        }, { injector: this.injector });
    }

    /** `/` ou Ctrl+K (⌘K) : amène le focus dans le champ, sauf depuis un champ de saisie ou sous une boîte de dialogue. */
    private onDocumentKeydown(event: KeyboardEvent): void {
        if (event.defaultPrevented || event.isComposing || !GlobalSearchComponent.isShortcut(event)) {
            return;
        }
        if (GlobalSearchComponent.isEditable(event.target) || this.dialog.openDialogs.length > 0) {
            return;
        }
        event.preventDefault();
        if (this.compact() && !this.expanded()) {
            this.openCompact();
        } else {
            this.focusInput();
        }
    }

    private focusInput(): void {
        const input_element: HTMLInputElement | undefined = this.input_ref()?.nativeElement;
        if (input_element) {
            input_element.focus();
            input_element.select();
            return;
        }
        // Petit écran : le champ n'existe qu'une fois la barre ouverte.
        afterNextRender({
            write: (): void => {
                const rendered: HTMLInputElement | undefined = this.input_ref()?.nativeElement;
                rendered?.focus();
                rendered?.select();
            }
        }, { injector: this.injector });
    }

    private static isShortcut(event: KeyboardEvent): boolean {
        if (event.altKey) {
            return false;
        }
        if (event.key === '/') {
            // Maj autorisée : sur un clavier AZERTY, « / » s'obtient avec Maj.
            return !event.ctrlKey && !event.metaKey;
        }
        return (event.key === 'k' || event.key === 'K') && (event.ctrlKey || event.metaKey) && !event.shiftKey;
    }

    private static isEditable(target: EventTarget | null): boolean {
        if (!(target instanceof HTMLElement)) {
            return false;
        }
        if (target.isContentEditable || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
            return true;
        }
        return target instanceof HTMLInputElement && !NON_TEXT_INPUT_TYPES.has(target.type);
    }
}
