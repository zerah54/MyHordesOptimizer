import { computed, effect, inject, Injectable, Signal, signal, untracked, WritableSignal } from '@angular/core';
import { map, Observable, Subscription, tap } from 'rxjs';

import { MAP_THEME_CACHE_KEY } from '../../_abstract_model/const';
import { MapThemeActiveDTO, MapThemeDTO, MapThemesDTO } from '../../_abstract_model/dto/map-theme.dto';
import { MapThemeService } from '../../_abstract_model/services/map-theme.service';
import { MapThemeColors } from '../../_abstract_model/types/map-theme.class';
import { mapThemeVariables } from '../map-theme/map-theme-variables';
import { getExternalAppId, getTokenWithMeWithExpirationDate, getUserId } from '../utilities/localstorage.util';

interface MapThemeCache {
    user_id: number;
    variables: Record<string, string>;
}

const NO_ACTIVE: MapThemeActiveDTO = { themeId: null };

/** Thèmes de carte de l'utilisateur et application du thème actif en variables CSS sur `<html>`. */
@Injectable({ providedIn: 'root' })
export class MapThemeStateService {
    private readonly api: MapThemeService = inject(MapThemeService);
    private readonly themes_state: WritableSignal<MapThemeDTO[]> = signal([]);
    private readonly active_state: WritableSignal<MapThemeActiveDTO> = signal(NO_ACTIVE);
    private readonly root: HTMLElement = document.documentElement;
    private applied: Set<string> = new Set();
    /** Variables du thème actif (ou de la copie locale tant que le GET n'a pas répondu). */
    private base: Record<string, string> = {};
    private preview: Record<string, string> | null = null;
    private fetching: Subscription | null = null;
    /** Utilisateur auquel appartient la copie appliquée au démarrage ; `null` si aucune. */
    private cache_user_id: number | null = null;
    /** Dernier utilisateur dont les thèmes ont été demandés. */
    private loaded_user_id: number | null = null;
    private active_call: number = 0;

    public readonly themes: Signal<MapThemeDTO[]> = this.themes_state.asReadonly();
    public readonly active: Signal<MapThemeActiveDTO> = this.active_state.asReadonly();

    public constructor() {
        this.applyStoredSession();
        const user_id: Signal<number | null> = computed((): number | null => getUserId());
        effect((): void => {
            const id: number | null = user_id();
            if (id !== null) {
                untracked((): void => this.onUserChange(id));
            }
        });
    }

    /** Change le thème actif : application immédiate, persistance serveur en arrière-plan. */
    public setActive(active: MapThemeActiveDTO): void {
        const previous: MapThemeActiveDTO = this.active_state();
        const previous_base: Record<string, string> = this.base;
        const call: number = ++this.active_call;
        this.active_state.set(active);
        this.refresh();
        this.api.setActive(active).subscribe({
            error: (): void => {
                if (call === this.active_call) {
                    this.active_state.set(previous);
                    this.base = previous_base;
                    this.render();
                    this.persist();
                }
            }
        });
    }

    public createTheme(name: string, colors: MapThemeColors): Observable<MapThemeDTO> {
        return this.api.create(name, colors).pipe(
            tap((theme: MapThemeDTO): void => this.themes_state.update((themes: MapThemeDTO[]): MapThemeDTO[] => [...themes, theme]))
        );
    }

    public saveTheme(id: number, name: string, colors: MapThemeColors): Observable<MapThemeDTO> {
        return this.api.update(id, name, colors).pipe(
            tap((saved: MapThemeDTO): void => {
                this.themes_state.update((themes: MapThemeDTO[]): MapThemeDTO[] => themes.map((t: MapThemeDTO): MapThemeDTO => t.id === id ? saved : t));
                this.refresh();
            })
        );
    }

    public deleteTheme(id: number): Observable<void> {
        return this.api.remove(id).pipe(
            map((): void => {
                this.themes_state.update((themes: MapThemeDTO[]): MapThemeDTO[] => themes.filter((t: MapThemeDTO): boolean => t.id !== id));
                if (this.active_state().themeId === id) {
                    this.active_state.set(NO_ACTIVE);
                }
                this.refresh();
            })
        );
    }

    /** Remplace temporairement le thème actif par ces variables ; `null` rétablit le thème actif. */
    public previewVariables(variables: Record<string, string> | null): void {
        this.preview = variables;
        this.render();
    }

    /**
     * Au démarrage, `user` n'est pas encore chargé : la copie locale est appliquée tant que l'utilisateur reste
     * connecté (identifiant externe présent, effacé par la déconnexion), même si le jeton a expiré.
     */
    private applyStoredSession(): void {
        let stored_id: number | null = null;
        try {
            const id: number | undefined = getTokenWithMeWithExpirationDate()?.simple_me?.id;
            stored_id = id ? +id : null;
        } catch {
            // session illisible : traitée comme absente
        }
        const cache: MapThemeCache | null = getExternalAppId() ? this.readCache() : null;
        if (cache === null || (stored_id !== null && cache.user_id !== stored_id)) {
            this.safeStorage((): void => localStorage.removeItem(MAP_THEME_CACHE_KEY));
            return;
        }
        this.base = cache.variables;
        this.cache_user_id = cache.user_id;
        this.render();
    }

    private onUserChange(user_id: number): void {
        this.fetching?.unsubscribe();
        this.fetching = null;
        if (this.loaded_user_id !== user_id) {
            this.themes_state.set([]);
            this.active_state.set(NO_ACTIVE);
        }
        this.loaded_user_id = user_id;
        if (this.cache_user_id !== user_id) {
            this.base = {};
            this.safeStorage((): void => localStorage.removeItem(MAP_THEME_CACHE_KEY));
            this.render();
        }
        this.cache_user_id = user_id;
        this.fetching = this.api.getMine().subscribe({
            next: (dto: MapThemesDTO): void => {
                this.themes_state.set(dto.themes);
                this.active_state.set(dto.active);
                this.refresh();
            },
            error: (): void => undefined
        });
    }

    /** Recalcule les variables du thème actif, les applique et met la copie locale à jour. */
    private refresh(): void {
        const active: MapThemeActiveDTO = this.active_state();
        const theme: MapThemeDTO | undefined = this.themes_state().find((t: MapThemeDTO): boolean => t.id === active.themeId);
        this.base = theme !== undefined ? mapThemeVariables(theme.colors) : {};
        this.render();
        this.persist();
    }

    /** Écrit la copie locale des variables du thème actif. */
    private persist(): void {
        const user_id: number | null = getUserId();
        if (user_id !== null) {
            const cache: MapThemeCache = { user_id, variables: this.base };
            this.safeStorage((): void => localStorage.setItem(MAP_THEME_CACHE_KEY, JSON.stringify(cache)));
        }
    }

    /** Pose les variables de l'aperçu ou du thème actif, après avoir retiré celles posées précédemment. */
    private render(): void {
        for (const name of this.applied) {
            this.root.style.removeProperty(name);
        }
        const variables: Record<string, string> = this.preview ?? this.base;
        this.applied = new Set(Object.keys(variables));
        for (const [name, value] of Object.entries(variables)) {
            this.root.style.setProperty(name, value);
        }
    }

    /** Copie locale lisible, sans contrôle d'utilisateur ; `null` si absente ou illisible. */
    private readCache(): MapThemeCache | null {
        try {
            const cache: MapThemeCache | null = JSON.parse(localStorage.getItem(MAP_THEME_CACHE_KEY) ?? 'null');
            if (cache !== null && typeof cache.user_id === 'number' && typeof cache.variables === 'object' && cache.variables !== null) {
                return cache;
            }
        } catch {
            // copie illisible : ignorée
        }
        return null;
    }

    private safeStorage(action: () => void): void {
        try {
            action();
        } catch {
            // stockage indisponible : la copie est facultative
        }
    }
}
