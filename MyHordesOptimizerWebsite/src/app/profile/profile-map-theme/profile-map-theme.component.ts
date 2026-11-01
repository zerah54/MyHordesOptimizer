import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, OnDestroy, Signal, signal, untracked, WritableSignal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, concatMap, EMPTY, Observable, Subject, tap } from 'rxjs';

import { MapThemeActiveDTO, MapThemeDTO } from '../../_abstract_model/dto/map-theme.dto';
import { Imports } from '../../_abstract_model/types/_types';
import { MAP_THEME_TOKENS, MapThemeColors, MapThemeToken } from '../../_abstract_model/types/map-theme.class';
import { mapThemeVariables } from '../../_core/map-theme/map-theme-variables';
import { MapThemeStateService } from '../../_core/services/map-theme-state.service';
import { SnackbarService } from '../../_core/services/snackbar.service';
import { ThemeService } from '../../_core/services/theme.service';
import { resolveTokenColor } from '../../_core/utilities/css-color.util';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../_shared/confirm-dialog/confirm-dialog.component';
import { MapThemePreviewComponent } from './map-theme-preview/map-theme-preview.component';

const components: Imports = [MapThemePreviewComponent];
const material_modules: Imports = [MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatTooltipModule, ReactiveFormsModule];

/** Délai sans modification avant l'enregistrement automatique. */
const SAVE_DEBOUNCE_MS: number = 500;

interface ThemeRow {
    key: string;
    label: string;
    active: boolean;
    theme: MapThemeDTO | null;
}

interface TokenGroup {
    label: string;
    tokens: { token: MapThemeToken; label: string }[];
}

interface SavePayload {
    id: number;
    name: string;
    colors: MapThemeColors;
    /** Dernier nom accepté par le serveur au moment de l'envoi, utilisé si `name` est refusé. */
    accepted_name: string;
}

/** Couleurs en attente d'enregistrement ; le nom est choisi à l'envoi. */
interface PendingSave {
    id: number;
    colors: MapThemeColors;
}

/** Libellé du thème par défaut. */
const DEFAULT_LABEL: string = $localize`Par défaut`;
const NEW_THEME_LABEL: string = $localize`Nouveau thème`;

/** Gestion des thèmes de couleurs de la carte : liste, activation, création, édition à enregistrement automatique. */
@Component({
    selector: 'mho-profile-map-theme',
    imports: [...components, ...material_modules],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './profile-map-theme.component.html',
    styleUrl: './profile-map-theme.component.scss'
})
export class ProfileMapThemeComponent implements OnDestroy {
    protected readonly groups: readonly TokenGroup[] = [
        {
            label: $localize`Fonds de cases`,
            tokens: [
                { token: 'map-l0', label: $localize`Palier 0` },
                { token: 'map-l1', label: $localize`Palier 1` },
                { token: 'map-l2', label: $localize`Palier 2` },
                { token: 'map-l3', label: $localize`Palier 3` },
                { token: 'map-unknown', label: $localize`Inconnu` }
            ]
        },
        { label: $localize`Zones épuisées`, tokens: [{ token: 'map-hatch', label: $localize`Hachures` }] },
        { label: $localize`Texte`, tokens: [{ token: 'map-fg', label: $localize`Valeurs` }] },
        {
            label: $localize`Bâtiments`,
            tokens: [
                { token: 'map-marker', label: $localize`Bâtiment` },
                { token: 'map-marker-ink', label: $localize`Contour et chiffres` }
            ]
        },
        {
            label: $localize`Repères`,
            tokens: [
                { token: 'map-me', label: $localize`Ma position` },
                { token: 'map-sel', label: $localize`Sélection` },
                { token: 'map-sel-fg', label: $localize`Texte de sélection` }
            ]
        },
        {
            label: $localize`Ancienneté`,
            tokens: [
                { token: 'map-age-green', label: $localize`Vert` },
                { token: 'map-age-yellow', label: $localize`Jaune` },
                { token: 'map-age-orange', label: $localize`Orange` },
                { token: 'map-age-red', label: $localize`Rouge` }
            ]
        }
    ];
    /** Thème personnel en cours d'édition, `null` si l'éditeur est fermé. */
    protected readonly editing_id: WritableSignal<number | null> = signal<number | null>(null);
    protected readonly draft_name: WritableSignal<string> = signal<string>('');
    protected readonly draft: WritableSignal<MapThemeColors> = signal<MapThemeColors>({});
    /** Porte le champ nom : `MatInput` n'évalue l'état d'erreur qu'avec un contrôle. */
    protected readonly name_control: FormControl<string> = new FormControl<string>('', { nonNullable: true });
    protected readonly name_taken: WritableSignal<boolean> = signal<boolean>(false);
    /** Force l'état d'erreur du champ nom, qui n'est lié à aucun formulaire. */
    protected readonly name_matcher: ErrorStateMatcher = { isErrorState: (): boolean => this.name_taken() || this.draft_name().trim().length === 0 };
    /** Couleur affichée par chaque sélecteur : celle du brouillon, sinon la valeur réelle du site. */
    protected readonly displayed: WritableSignal<Partial<Record<MapThemeToken, string>>> = signal<Partial<Record<MapThemeToken, string>>>({});
    private readonly state: MapThemeStateService = inject(MapThemeStateService);
    private readonly snackbar: SnackbarService = inject(SnackbarService);
    private readonly dialog: MatDialog = inject(MatDialog);
    protected readonly rows: Signal<ThemeRow[]> = computed((): ThemeRow[] => {
        const active: MapThemeActiveDTO = this.state.active();
        return [
            { key: 'default', label: DEFAULT_LABEL, active: active.themeId === null, theme: null },
            ...this.state.themes().map((theme: MapThemeDTO): ThemeRow => ({
                key: `t${theme.id}`, label: theme.name, active: active.themeId === theme.id, theme
            }))
        ];
    });
    private readonly theme_service: ThemeService = inject(ThemeService);
    private readonly queue: Subject<SavePayload> = new Subject<SavePayload>();
    private pending: PendingSave | null = null;
    /** Dernier nom accepté par le serveur pour le thème ouvert. */
    private accepted_name: string = '';
    /** Nom refusé (409) : il n'est plus envoyé tant que la saisie n'a pas changé. */
    private refused_name: string | null = null;
    private timer: ReturnType<typeof setTimeout> | null = null;

    public constructor() {
        // Abonnement volontairement hors `takeUntilDestroyed` : `ngOnDestroy` complète la file, qui termine les PUT en cours.
        this.queue.pipe(
            concatMap((payload: SavePayload): Observable<unknown> => this.save(payload))
        ).subscribe();
        effect((): void => {
            this.theme_service.is_dark();
            this.theme_service.family();
            untracked((): void => this.refreshDisplayed());
        });
    }

    /** Envoie l'état en attente, laisse finir les PUT en cours et rétablit le thème actif. */
    public ngOnDestroy(): void {
        this.flush();
        this.queue.complete();
        this.state.previewVariables(null);
    }

    /** Rend la ligne choisie active. */
    protected activate(row: ThemeRow): void {
        this.state.setActive({ themeId: row.theme?.id ?? null });
    }

    /** Crée un thème vide, donc avec toutes les valeurs du site, et ouvre l'éditeur dessus. */
    protected create(): void {
        this.state.createTheme(this.uniqueName(), {}).subscribe({
            next: (created: MapThemeDTO): void => this.openEditor(created),
            error: (): void => undefined
        });
    }

    /** Ouvre l'éditeur sur ce thème personnel, après avoir envoyé l'état en attente de l'éventuel thème précédent. */
    protected openEditor(theme: MapThemeDTO): void {
        this.flush();
        this.editing_id.set(theme.id);
        this.draft_name.set(theme.name);
        this.name_control.setValue(theme.name, { emitEvent: false });
        this.accepted_name = theme.name;
        this.refused_name = null;
        this.name_taken.set(false);
        this.draft.set({ ...theme.colors });
        this.previewDraft();
    }

    /** Ferme l'éditeur et rétablit le thème actif sur `<html>`. */
    protected closeEditor(): void {
        this.flush();
        this.editing_id.set(null);
        this.state.previewVariables(null);
    }

    /** Supprime le thème, en fermant l'éditeur s'il y était ouvert. */
    protected remove(theme: MapThemeDTO): void {
        this.dialog
            .open<ConfirmDialogComponent, ConfirmDialogData>(ConfirmDialogComponent, {
                data: {
                    title: $localize`Confirmer`,
                    text: $localize`Êtes-vous sûr de vouloir supprimer ce thème ?`
                }
            })
            .afterClosed()
            .subscribe((confirm: boolean | undefined): void => {
                if (!confirm) return;
                if (this.editing_id() === theme.id) {
                    this.cancelPending();
                    this.editing_id.set(null);
                    this.state.previewVariables(null);
                }
                this.state.deleteTheme(theme.id).subscribe({ error: (): void => undefined });
            });
    }

    /** Met à jour le nom du brouillon. */
    protected onName(event: Event): void {
        this.draft_name.set((event.target as HTMLInputElement).value);
        this.refused_name = null;
        this.name_taken.set(false);
        this.schedule();
    }

    /** Met à jour la couleur du jeton dans le brouillon. */
    protected onColor(token: MapThemeToken, event: Event): void {
        this.draft.update((colors: MapThemeColors): MapThemeColors => ({ ...colors, [token]: (event.target as HTMLInputElement).value }));
        this.previewDraft();
        this.schedule();
    }

    /** Retire la couleur du brouillon : le jeton reprend la valeur du site. */
    protected resetColor(token: MapThemeToken): void {
        this.draft.update((colors: MapThemeColors): MapThemeColors => {
            const rest: MapThemeColors = { ...colors };
            delete rest[token];
            return rest;
        });
        this.previewDraft();
        this.schedule();
    }

    /** Indique si le brouillon définit ce jeton. */
    protected isDefined(token: MapThemeToken): boolean {
        return this.draft()[token] !== undefined;
    }

    /** Nom de nouveau thème absent des thèmes existants, sans tenir compte de la casse. */
    private uniqueName(): string {
        const taken: Set<string> = new Set(this.state.themes().map((t: MapThemeDTO): string => t.name.toLowerCase()));
        let name: string = NEW_THEME_LABEL;
        for (let i: number = 2; taken.has(name.toLowerCase()); i++) {
            name = `${NEW_THEME_LABEL} ${i}`;
        }
        return name;
    }

    /** Remplace le thème actif sur `<html>` par le brouillon, puis relit les couleurs réelles. */
    private previewDraft(): void {
        this.state.previewVariables(mapThemeVariables(this.draft()));
        this.refreshDisplayed();
    }

    /** Relit la couleur réelle de chaque jeton pour les sélecteurs. */
    private refreshDisplayed(): void {
        if (this.editing_id() === null) {
            return;
        }
        const draft: MapThemeColors = this.draft();
        const displayed: Partial<Record<MapThemeToken, string>> = {};
        for (const token of MAP_THEME_TOKENS) {
            displayed[token] = draft[token] ?? resolveTokenColor(token) ?? '#000000';
        }
        this.displayed.set(displayed);
    }

    /** Mémorise les couleurs courantes et relance l'anti-rebond. */
    private schedule(): void {
        const id: number | null = this.editing_id();
        if (id === null) {
            return;
        }
        this.pending = { id, colors: this.draft() };
        if (this.timer !== null) {
            clearTimeout(this.timer);
        }
        this.timer = setTimeout((): void => this.flush(), SAVE_DEBOUNCE_MS);
    }

    /** Nom saisi s'il est non vide et pas déjà refusé, sinon dernier nom accepté. */
    private effectiveName(): string {
        const typed: string = this.draft_name().trim();
        return typed.length > 0 && typed !== this.refused_name ? typed : this.accepted_name;
    }

    /** Un PUT ; sur un 409, renvoie les couleurs de la charge sous le dernier nom accepté. */
    private save(payload: SavePayload): Observable<unknown> {
        return this.send(payload.id, payload.name, payload.colors).pipe(
            catchError((error: unknown): Observable<unknown> => {
                if (!(error instanceof HttpErrorResponse && error.status === 409 && payload.name !== payload.accepted_name)) {
                    this.reportError(error);
                    return EMPTY;
                }
                if (this.editing_id() === payload.id && payload.name === this.draft_name().trim()) {
                    this.refused_name = payload.name;
                    this.name_taken.set(true);
                }
                return this.send(payload.id, payload.accepted_name, payload.colors).pipe(
                    catchError((retry_error: unknown): Observable<never> => {
                        this.reportError(retry_error);
                        return EMPTY;
                    })
                );
            })
        );
    }

    /** Enregistre le thème et mémorise le nom accepté s'il est toujours ouvert. */
    private send(id: number, name: string, colors: MapThemeColors): Observable<MapThemeDTO> {
        return this.state.saveTheme(id, name, colors).pipe(
            tap((): void => {
                if (this.editing_id() === id) {
                    this.accepted_name = name;
                }
            })
        );
    }

    /** Affiche l'erreur comme l'intercepteur global, sauf 401. */
    private reportError(error: unknown): void {
        const status: number = error instanceof HttpErrorResponse ? error.status : 0;
        if (status !== 401) {
            this.snackbar.errorSnackbar($localize`Une erreur s'est produite lors de l'appel (Erreur ${status}:status:)`);
        }
    }

    /** Envoie immédiatement l'état en attente, s'il y en a un. */
    private flush(): void {
        if (this.timer !== null) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        if (this.pending !== null) {
            const pending: PendingSave = this.pending;
            this.pending = null;
            this.queue.next({ id: pending.id, name: this.effectiveName(), colors: pending.colors, accepted_name: this.accepted_name });
        }
    }

    /** Abandonne l'état en attente sans l'envoyer. */
    private cancelPending(): void {
        if (this.timer !== null) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.pending = null;
    }
}
