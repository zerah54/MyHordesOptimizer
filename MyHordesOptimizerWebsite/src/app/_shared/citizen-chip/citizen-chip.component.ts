import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, Injector, input, InputSignal, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import moment from 'moment';
import { take } from 'rxjs';

import { HORDES_IMG_REPO } from '../../_abstract_model/const';
import { DailyActionEnum } from '../../_abstract_model/enum/daily-action.enum';
import { HomeEnum } from '../../_abstract_model/enum/home.enum';
import { HeroSkillNamesService } from '../../_abstract_model/services/hero-skill-names.service';
import { Imports } from '../../_abstract_model/types/_types';
import { Citizen } from '../../_abstract_model/types/citizen.class';
import { DailyAction } from '../../_abstract_model/types/daily-action.class';
import { HERO_SKILL_FAMILIES, HERO_SKILL_LETTERS, HeroSkillFamily, HeroSkillFamilyInfo, heroSkillSummary } from '../../_abstract_model/types/hero-skill-levels';
import { HeroicActionsWithValue } from '../../_abstract_model/types/heroic-actions.class';
import { HomeWithValue } from '../../_abstract_model/types/home.class';
import { getHeroicIcon, getHomeIcon } from '../../_core/utilities/citizen.util';

const angular_common: Imports = [CdkConnectedOverlay, CdkOverlayOrigin];

/** Délai avant fermeture quand le pointeur quitte le pseudo, le temps d'atteindre la fiche. */
const HIDE_DELAY_MS: number = 150;

/** Élément affichable de la fiche : icône et libellé. */
interface CardEntry {
    img: string;
    label: string;
}

/** Pseudo d'un citoyen précédé de son métier ; fiche détaillée au survol, au focus ou au clic. */
@Component({
    selector: 'mho-citizen-chip',
    templateUrl: './citizen-chip.component.html',
    styleUrls: ['./citizen-chip.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common]
})
export class CitizenChipComponent {

    public readonly citizen: InputSignal<Citizen> = input.required<Citizen>();
    /** Jour des actions quotidiennes affichées. */
    public readonly day: InputSignal<number> = input.required<number>();
    /** Actions quotidiennes à montrer (celles que la ville permet). */
    public readonly actions: InputSignal<DailyActionEnum[]> = input<DailyActionEnum[]>(DailyActionEnum.getAllValues<DailyActionEnum>());

    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    protected readonly open: WritableSignal<boolean> = signal(false);
    /** Noms des groupes de compétences, chargés à la première ouverture (lettres en attendant). */
    private readonly skill_names: WritableSignal<Readonly<Record<HeroSkillFamily, string>>> = signal(HERO_SKILL_LETTERS);
    private readonly injector: Injector = inject(Injector);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);
    private names_requested: boolean = false;
    protected readonly positions: ConnectedPosition[] = [
        { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
        { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 }
    ];

    // Contenu de la fiche lu à chaque rendu, pas mis en cache : le citoyen est modifié en place après une coche.

    /**
     * Niveau de maison, libellé officiel.
     * @returns {CardEntry | null} Niveau, nul s'il est inconnu.
     */
    protected house(): CardEntry | null {
        const house: HomeWithValue | undefined = this.homeEntries().find((entry: HomeWithValue): boolean => entry.element.key === HomeEnum.HOUSE_LEVEL.key);
        if (house === undefined || typeof house.value !== 'number') {
            return null;
        }
        return { img: getHomeIcon(house), label: HomeEnum.HOUSE_LEVEL.value.house_options?.[house.value]?.[moment.locale()] ?? `${house.value}` };
    }

    /**
     * Améliorations présentes (niveau non nul).
     * @returns {CardEntry[]} Améliorations.
     */
    protected upgrades(): CardEntry[] {
        return this.homeEntries()
            .filter((entry: HomeWithValue): boolean => entry.element.key !== HomeEnum.HOUSE_LEVEL.key && entry.value !== false && entry.value !== 0)
            .map((entry: HomeWithValue): CardEntry => ({
                img: getHomeIcon(entry),
                label: typeof entry.value === 'number' && entry.element.value.max_lvl > 1 ? `${entry.element.getLabel()} ${$localize`niv.`} ${entry.value}` : entry.element.getLabel()
            }));
    }

    /**
     * Actions héroïques encore disponibles (vrai, ou charges restantes).
     * @returns {CardEntry[]} Actions héroïques.
     */
    protected heroics(): CardEntry[] {
        return (this.citizen().heroic_actions?.content ?? [])
            .filter((entry: HeroicActionsWithValue): boolean => entry.value === true || (typeof entry.value === 'number' && entry.value > 0))
            .map((entry: HeroicActionsWithValue): CardEntry => ({
                img: getHeroicIcon(entry),
                label: typeof entry.value === 'number' && entry.element.value.max_lvl > 1 ? `${entry.element.getLabel()} (${entry.value})` : entry.element.getLabel()
            }));
    }

    /**
     * Compétences héroïques connues : groupe et niveau.
     * @returns {string[]} Résumés (groupes nuls ou inconnus omis).
     */
    protected skills(): string[] {
        return HERO_SKILL_FAMILIES
            .map((family: HeroSkillFamilyInfo): string | null => heroSkillSummary(this.skill_names()[family.key], this.citizen().hero_skills?.[family.key] ?? null))
            .filter((summary: string | null): summary is string => summary !== null);
    }

    /**
     * Actions quotidiennes faites le jour affiché, parmi celles que la ville permet.
     * @returns {CardEntry[]} Actions.
     */
    protected doneActions(): CardEntry[] {
        return this.actions()
            .filter((action: DailyActionEnum): boolean => (this.citizen().daily_actions ?? [])
                .some((done: DailyAction): boolean => done.day === this.day() && done.action_key === action.key))
            .map((action: DailyActionEnum): CardEntry => ({ img: action.value.img, label: action.getLabel() }));
    }

    private pinned: boolean = false;
    private hide_timer: ReturnType<typeof setTimeout> | null = null;

    public constructor() {
        this.destroy_ref.onDestroy((): void => this.cancelHide());
    }

    /** Ouvre la fiche (survol, focus). */
    protected show(): void {
        this.cancelHide();
        this.loadSkillNames();
        this.open.set(true);
    }

    /** Ferme la fiche après un court délai, sauf si elle a été ouverte au clic. */
    protected scheduleHide(): void {
        if (this.pinned) {
            return;
        }
        this.cancelHide();
        this.hide_timer = setTimeout((): void => this.open.set(false), HIDE_DELAY_MS);
    }

    /** Garde la fiche ouverte (pointeur arrivé sur la fiche). */
    protected cancelHide(): void {
        if (this.hide_timer !== null) {
            clearTimeout(this.hide_timer);
            this.hide_timer = null;
        }
    }

    /** Clic : épingle la fiche ouverte, ou la referme. */
    protected toggle(): void {
        this.cancelHide();
        this.loadSkillNames();
        this.pinned = !this.pinned || !this.open();
        this.open.set(this.pinned);
    }

    /** Charge les noms des groupes de compétences à la première ouverture (service obtenu à la demande : la fiche s'affiche sans lui). */
    private loadSkillNames(): void {
        if (this.names_requested) {
            return;
        }
        this.names_requested = true;
        this.injector.get(HeroSkillNamesService).names()
            .pipe(take(1), takeUntilDestroyed(this.destroy_ref))
            .subscribe((names: Readonly<Record<HeroSkillFamily, string>>): void => this.skill_names.set(names));
    }

    /** Ferme la fiche tout de suite (Échap, clic ailleurs). */
    protected hide(): void {
        this.cancelHide();
        this.pinned = false;
        this.open.set(false);
    }

    /**
     * Éléments de la maison du citoyen.
     * @returns {HomeWithValue[]} Éléments connus.
     */
    private homeEntries(): HomeWithValue[] {
        return (this.citizen().home?.content ?? []).filter((entry: HomeWithValue): boolean => entry.element !== undefined);
    }
}
