import { DOCUMENT } from '@angular/common';
import { computed, effect, inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';

import { ChartsThemingService } from './charts-theming.service';

/** Famille réellement appliquée sur `<html>`. */
export type ThemeFamily = 'brown' | 'pink' | 'noel' | 'halloween';
/** Ce que l'utilisateur a choisi. `auto` (l'ancienne valeur `''`) suit les thèmes saisonniers. */
export type ThemePreference = 'auto' | ThemeFamily;
export type ThemeMode = 'light' | 'dark' | 'auto';

const THEME_FAMILIES: readonly ThemeFamily[] = ['brown', 'pink', 'noel', 'halloween'];
const THEME_PREFERENCES: readonly ThemePreference[] = ['auto', ...THEME_FAMILIES];
const THEME_MODES: readonly ThemeMode[] = ['light', 'dark', 'auto'];

/** Thèmes saisonniers mono-mode (`color-scheme` forcé côté SCSS) : Noël est clair, Halloween sombre. */
const FORCED_SCHEMES: ReadonlyMap<ThemeFamily, 'light' | 'dark'> = new Map<ThemeFamily, 'light' | 'dark'>([
    ['noel', 'light'],
    ['halloween', 'dark'],
]);

/** Fenêtre saisonnière, bornes incluses : [mois (1-12), jour] de début et de fin. */
interface Season {
    family: ThemeFamily;
    from: [number, number];
    to: [number, number];
}

const SEASONS: readonly Season[] = [
    { family: 'noel', from: [12, 1], to: [12, 25] },
    { family: 'halloween', from: [10, 15], to: [11, 1] },
];

/**
 * Source unique du thème : famille (`theme-*`) et mode (`mode-*`) posés sur <html>.
 * Plus de rechargement de page : les couleurs basculent via `color-scheme` / `light-dark()`.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
    private static readonly PREFERENCE_STORAGE_KEY: string = 'theme';
    private static readonly MODE_STORAGE_KEY: string = 'theme-mode';

    private readonly document: Document = inject(DOCUMENT);
    private readonly charts_theming_service: ChartsThemingService = inject(ChartsThemingService);
    /** `matchMedia` peut manquer (jsdom, rendu serveur) : le mode « auto » retombe alors sur sombre. */
    private readonly dark_query: MediaQueryList | undefined = this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)');

    private readonly preference_state: WritableSignal<ThemePreference> = signal(ThemeService.readPreference());
    private readonly mode_state: WritableSignal<ThemeMode> = signal(ThemeService.readMode(ThemeService.readPreference()));
    private readonly system_is_dark: WritableSignal<boolean> = signal(this.dark_query?.matches ?? true);
    /** Recalculé à chaque changement de préférence : une session ouverte à cheval sur le 1er
     *  décembre bascule au prochain choix de thème, pas besoin d'une minuterie pour si peu. */
    private readonly season_state: WritableSignal<ThemeFamily | null> = signal(ThemeService.currentSeason());

    /** Ce que l'utilisateur a choisi, `auto` compris : c'est lui que coche le menu. */
    public readonly preference: Signal<ThemePreference> = this.preference_state.asReadonly();
    /** Famille effectivement appliquée : `auto` est résolu en thème saisonnier, sinon en brun. */
    public readonly family: Signal<ThemeFamily> = computed((): ThemeFamily => {
        const preference: ThemePreference = this.preference_state();
        return preference === 'auto' ? (this.season_state() ?? 'brown') : preference;
    });
    /** Saison en cours, pour n'offrir les thèmes saisonniers que le temps de l'événement. */
    public readonly season: Signal<ThemeFamily | null> = this.season_state.asReadonly();
    public readonly mode: Signal<ThemeMode> = this.mode_state.asReadonly();
    /** Mode réellement affiché : résout « auto » et les familles mono-mode. */
    public readonly is_dark: Signal<boolean> = computed((): boolean => {
        const forced_scheme: 'light' | 'dark' | undefined = FORCED_SCHEMES.get(this.family());
        if (forced_scheme) {
            return forced_scheme === 'dark';
        }
        const mode: ThemeMode = this.mode_state();
        return mode === 'auto' ? this.system_is_dark() : mode === 'dark';
    });

    public constructor() {
        this.dark_query?.addEventListener('change', (event: MediaQueryListEvent): void => this.system_is_dark.set(event.matches));

        effect((): void => {
            const family: ThemeFamily = this.family();
            const mode: ThemeMode = this.mode_state();
            const is_dark: boolean = this.is_dark();
            this.applyToDocument(family, mode, is_dark);
            // Après application des classes : les couleurs lues par Chart.js sont celles du nouveau thème.
            this.charts_theming_service.defineColorsWithTheme();
        });
    }

    public setPreference(preference: ThemePreference): void {
        this.season_state.set(ThemeService.currentSeason());
        this.preference_state.set(preference);
        localStorage.setItem(ThemeService.PREFERENCE_STORAGE_KEY, preference);
    }

    public setMode(mode: ThemeMode): void {
        this.mode_state.set(mode);
        localStorage.setItem(ThemeService.MODE_STORAGE_KEY, mode);
    }

    /** Thème saisonnier du jour, `null` hors événement. */
    public static currentSeason(reference: Date = new Date()): ThemeFamily | null {
        const month: number = reference.getMonth() + 1;
        const day: number = reference.getDate();
        const season: Season | undefined = SEASONS.find((value: Season): boolean => {
            const [from_month, from_day]: [number, number] = value.from;
            const [to_month, to_day]: [number, number] = value.to;
            const after_start: boolean = month > from_month || (month === from_month && day >= from_day);
            const before_end: boolean = month < to_month || (month === to_month && day <= to_day);
            return after_start && before_end;
        });
        return season?.family ?? null;
    }

    private static readPreference(): ThemePreference {
        const stored: string | null = localStorage.getItem(ThemeService.PREFERENCE_STORAGE_KEY);
        // '' était « Par défaut » : suivre les thèmes saisonniers. Les anciennes valeurs 'noel' et
        // 'halloween' écrites automatiquement par le menu retombent aussi sur 'auto' : c'est le
        // service qui décide désormais, et hors saison elles laisseraient l'utilisateur bloqué.
        if (stored === null || stored === '') {
            return 'auto';
        }
        if (stored === 'noel' || stored === 'halloween') {
            return 'auto';
        }
        return THEME_PREFERENCES.find((value: ThemePreference): boolean => value === stored) ?? 'auto';
    }

    private static readMode(preference: ThemePreference): ThemeMode {
        const stored: string | null = localStorage.getItem(ThemeService.MODE_STORAGE_KEY);
        const mode: ThemeMode | undefined = THEME_MODES.find((value: ThemeMode): boolean => value === stored);
        // Premier passage après la refonte : on conserve l'apparence historique de chaque famille.
        return mode ?? (preference === 'pink' ? 'light' : 'dark');
    }

    private applyToDocument(family: ThemeFamily, mode: ThemeMode, is_dark: boolean): void {
        const root: HTMLElement = this.document.documentElement;
        root.classList.remove(...THEME_FAMILIES.map((value: ThemeFamily): string => `theme-${value}`), 'mode-light', 'mode-dark');
        root.classList.add(`theme-${family}`);
        if (mode !== 'auto') {
            root.classList.add(`mode-${mode}`);
        }
        // Accroche CSS pour ce que light-dark() ne couvre pas (filtres, ombres composées…).
        root.dataset['scheme'] = is_dark ? 'dark' : 'light';
    }
}
