import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    computed,
    ElementRef,
    inject,
    Injector,
    OnDestroy,
    OnInit,
    Signal,
    signal,
    viewChild,
    WritableSignal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChartConfiguration, ChartDataset, ChartEvent, LegendElement, LegendItem } from 'chart.js';
import Chart from 'chart.js/auto';
import { Color } from 'chartjs-plugin-datalabels/types/options';
import moment from 'moment';
import { firstValueFrom, forkJoin, Observable, of } from 'rxjs';

import { HORDES_IMG_REPO, PLANIF_VALUES, TDG_VALUES } from '../../../_abstract_model/const';
import { AttackSettingsDTO, RefinementInputDTO, RefinementParamsDTO, RefinementViewDTO } from '../../../_abstract_model/dto/refinement.dto';
import { MinMax } from '../../../_abstract_model/interfaces';
import { TownStatisticsService } from '../../../_abstract_model/services/town-statistics.service';
import { Dictionary, Imports, TownTypeId } from '../../../_abstract_model/types/_types';
import { Estimations } from '../../../_abstract_model/types/estimations.class';
import { EstimationGraphValues, EstimationsResult } from '../../../_abstract_model/types/estimations-result.class';
import { ChartsThemingService } from '../../../_core/services/charts-theming.service';
import { ClipboardService } from '../../../_core/services/clipboard.service';
import { TownContextService } from '../../../_core/services/town-context.service';
import { getMaxAttack, getMinAttack, getSoulFactor } from '../../../_core/utilities/estimations.util';
import { getTown } from '../../../_core/utilities/localstorage.util';
import { CompactStepperComponent } from '../../../_shared/compact-stepper/compact-stepper.component';
import { RefinerParams } from './refiner/attack-model';
import { AttackRefinerService, RefineResult } from './refiner/attack-refiner.service';

const angular_common: Imports = [CommonModule, FormsModule];
const components: Imports = [CompactStepperComponent];
const pipes: Imports = [];
const material_modules: Imports = [MatButtonModule, MatButtonToggleModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressBarModule, MatProgressSpinnerModule, MatTooltipModule, MatCheckboxModule, MatSlideToggleModule];

/** Le KPI et le graphique portent sur un seul jour attaqué à la fois. */
export type ChartDay = 'today' | 'tomorrow';

/** Famille de paliers portant des âmes : tour de guet du jour ou planificateur. */
export type SoulFamily = 'estim' | 'planif';

/**
 * Plage calculée rapportée aux bornes THÉORIQUES du jour, en pourcentages prêts à poser.
 *
 * L'échelle vient du jeu (`getMinAttack` / `getMaxAttack`), pas de la plus large estimation saisie :
 * cette dernière ne disait rien d'autre que « la tour de guet n'a pas encore convergé ». Rapportée
 * au possible du jour, la plage calculée montre ce qui a réellement été resserré.
 */
/** Attaque la plus probable de la distribution, ou sa moyenne quand aucune valeur ne se détache. */
export interface LikelyAttack {
    value: number;
    /** `true` quand la distribution est plate : la valeur est alors la moyenne de la plage. */
    is_average: boolean;
}

export interface AttackGauge {
    /** Bornes théoriques du jour, qui donnent l'échelle. */
    low: number;
    high: number;
    /** Plage calculée, l'estimation la plus fine dont on dispose. */
    min: number;
    max: number;
    left: number;
    width: number;
    /** Attaque la plus probable (ou la moyenne si toutes les valeurs sont équiprobables). */
    likely: number;
    likely_left: number;
    /** `true` quand la distribution est plate : la valeur montrée est alors la moyenne. */
    likely_is_average: boolean;
    /** Repères de l'attaque affinée, quand un affinage a abouti. */
    refined_min_left: number | null;
    refined_max_left: number | null;
}

@Component({
    selector: 'mho-estimations',
    templateUrl: './estimations.component.html',
    styleUrls: ['./estimations.component.scss'],
    imports: [...angular_common, ...components, ...material_modules, ...pipes],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '(window:resize)': 'onResize()'
    }
})
export class EstimationsComponent implements OnInit, OnDestroy {
    protected readonly tdg_values: number[] = TDG_VALUES;
    protected readonly planif_values: number[] = PLANIF_VALUES;
    protected readonly current_day: number = getTown()?.day || 1;
    /** Mode observateur : masque la sauvegarde et verrouille la saisie (le refiner local reste actif). */
    protected readonly is_readonly: Signal<boolean> = inject(TownContextService).isReadonly;
    protected selected_day: number = this.current_day;
    /** Chargée de façon asynchrone (ngOnInit) et lue par le template sous OnPush : signal. */
    protected readonly estimations: WritableSignal<Estimations | undefined> = signal<Estimations | undefined>(undefined);
    protected today_offset_mode: boolean = false;
    protected tomorrow_offset_mode: boolean = false;
    /** Affichage des compteurs d'âmes et de niveau SPA (les âmes enregistrées s'appliquent toujours aux calculs). */
    protected readonly souls_mode: WritableSignal<boolean> = signal<boolean>(false);
    /** Borne haute des steppers d'âmes. */
    protected readonly max_souls: number = 99;
    /** Borne haute du stepper de niveau SPA (bâtiment item_soul_blue_static, voteLevel 3). */
    protected readonly max_spa_level: number = 3;
    /** Colonne de droite : quel jour attaqué le KPI et le graphique montrent. Remplace l'accordéon,
     *  qui n'ouvrait de toute façon qu'un panneau à la fois (`[expanded]="step === n"`). */
    protected readonly chart_day: WritableSignal<ChartDay> = signal<ChartDay>('today');
    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    protected readonly locale: string = moment.locale();
    protected readonly today_calculated_attack: WritableSignal<EstimationsResult | null> = signal<EstimationsResult | null>(null);
    protected readonly tomorrow_calculated_attack: WritableSignal<EstimationsResult | null> = signal<EstimationsResult | null>(null);
    /**
     * Attaque la plus probable : la valeur qui revient le plus souvent dans la distribution
     * renvoyée par l'API. Celle-ci répète chaque attaque possible d'autant de fois qu'un partage
     * de décalage reproduit exactement la bande observée — le pic n'existe donc que si la tour a
     * convergé des deux côtés. Quand toutes les valeurs pèsent pareil, il n'y a pas de pic : la
     * moyenne est le seul repère honnête.
     */
    protected readonly most_likely_attack: Signal<LikelyAttack | null> = computed((): LikelyAttack | null => {
        const attack: EstimationsResult | null = this.chartAttack();
        const distribution: EstimationGraphValues[] = attack?.min_list ?? [];
        if (!attack?.result || distribution.length === 0) return null;

        const peak: EstimationGraphValues = distribution.reduce(
            (best: EstimationGraphValues, current: EstimationGraphValues): EstimationGraphValues =>
                current.count > best.count ? current : best,
            distribution[0]);
        const flat: boolean = distribution.every((value: EstimationGraphValues): boolean => value.count === peak.count);

        return flat
            ? { value: Math.round((Number(attack.result.min) + Number(attack.result.max)) / 2), is_average: true }
            : { value: peak.value, is_average: false };
    });

    /** Affinage GPU : jour en cours de scan (null si aucun) et progression 0..100. */
    protected readonly refining_day: WritableSignal<number | null> = signal<number | null>(null);
    protected readonly refine_progress: WritableSignal<number> = signal<number>(0);
    /** Indicateurs « ça tourne » (purement affichage, n'influencent pas le calcul). */
    protected readonly refine_elapsed_label: WritableSignal<string> = signal<string>('');
    protected readonly refine_eta_label: WritableSignal<string> = signal<string>('');
    /**
     * Feux d'artifice explosés par jour attaqué (clé '_<jour>'), chargés depuis la base : l'attaque réelle
     * est réduite de 13 à 16 %, et les paliers planif(D−1) — pré-explosion — contraignent indépendamment
     * de la TDG(D) post-explosion.
     */
    private readonly fireworks_days: WritableSignal<Dictionary<boolean>> = signal<Dictionary<boolean>>({});
    /** Jours attaqués dont les réglages d'attaque ont changé depuis le dernier enregistrement. */
    private readonly dirty_attack_days: Set<number> = new Set<number>();
    private readonly today_estim_canvas: Signal<ElementRef> = viewChild.required<ElementRef>('todayEstimCanvas');
    private readonly today_offset_canvas: Signal<ElementRef> = viewChild.required<ElementRef>('todayOffsetCanvas');
    private readonly tomorrow_estim_canvas: Signal<ElementRef> = viewChild.required<ElementRef>('tomorrowEstimCanvas');
    private readonly tomorrow_offset_canvas: Signal<ElementRef> = viewChild.required<ElementRef>('tomorrowOffsetCanvas');
    private today_estim_chart!: Chart<'line'>;
    private today_offset_chart!: Chart<'bar'>;
    private tomorrow_estim_chart!: Chart<'line'>;
    private tomorrow_offset_chart!: Chart<'bar'>;
    private separators: string[] = [' à ', ' - '];
    private readonly clipboard: ClipboardService = inject(ClipboardService);
    /**
     * Messages de résultat d'affinage par jour attaqué (clé '_<jour>'), conservés en naviguant.
     * Lu par le template via `refineMessageFor()`, muté depuis `refine()` (async) : signal.
     */
    private readonly refine_messages: WritableSignal<Dictionary<string>> = signal<Dictionary<string>>({});
    private refine_started_at: number = 0;
    private refine_fraction: number = 0;
    private refine_timer: ReturnType<typeof setInterval> | null = null;
    /** Affinages partagés par jour attaqué (clé '_<jour>'), lus sur l'API. */
    private readonly refinements: WritableSignal<Dictionary<RefinementViewDTO>> = signal<Dictionary<RefinementViewDTO>>({});
    /** Estimations, âmes et niveaux SPA tels qu'enregistrés, pour repérer une modification non enregistrée. */
    private saved_snapshot: string = '';
    /** Âmes présentes à la lecture de chaque palier, clé `${jour}:${famille}:${palier}`, enregistrées avec les estimations. */
    private readonly row_souls: WritableSignal<Dictionary<number>> = signal<Dictionary<number>>({});
    /** Âmes à l'attaque choisies par jour attaqué (clé '_<jour>') ; absent = valeur par défaut. */
    private readonly attack_souls: WritableSignal<Dictionary<number>> = signal<Dictionary<number>>({});
    /**
     * Niveau du bâtiment SPA (item_soul_blue_static, 0-3) en vigueur à la lecture d'une famille, clé
     * `${jour}:${famille}`. Un seul niveau par lecture (pas par palier) : le bâtiment ne change pas de
     * niveau entre deux paliers d'une même tour. Enregistré avec les estimations.
     */
    private readonly row_spa_level: WritableSignal<Dictionary<number>> = signal<Dictionary<number>>({});
    /** Niveau SPA choisi à l'attaque par jour attaqué (clé '_<jour>') ; absent = niveau de la famille qui a servi à l'estimer. */
    private readonly attack_spa_level: WritableSignal<Dictionary<number>> = signal<Dictionary<number>>({});
    /** Réglages d'attaque lus sur l'API par jour attaqué (clé '_<jour>'), pour leurs défauts résolus côté serveur. */
    private readonly attack_defaults: WritableSignal<Dictionary<AttackSettingsDTO>> = signal<Dictionary<AttackSettingsDTO>>({});
    private town_statistics_service: TownStatisticsService = inject(TownStatisticsService);
    private refiner: AttackRefinerService = inject(AttackRefinerService);
    private readonly injector: Injector = inject(Injector);
    private readonly charts_theming: ChartsThemingService = inject(ChartsThemingService);

    public onResize(): void {
        if (this.today_estim_chart) {
            this.today_estim_chart.resize();
        }
        if (this.today_offset_chart) {
            this.today_offset_chart.resize();
        }
        if (this.tomorrow_estim_chart) {
            this.tomorrow_estim_chart.resize();
        }
        if (this.tomorrow_offset_chart) {
            this.tomorrow_offset_chart.resize();
        }
    }

    public ngOnInit(): void {
        this.getEstimations();
    }

    public ngOnDestroy(): void {
        this.refiner.cancel();
        this.stopRefineTimer();
    }

    /** Affiche ou masque les compteurs d'âmes. */
    protected setSoulsMode(enabled: boolean): void {
        this.souls_mode.set(enabled);
    }

    /** Âmes présentes à la lecture du palier `percent` du tableau `family` du jour `day` (0 par défaut). */
    protected rowSouls(day: number, family: SoulFamily, percent: number): number {
        return this.row_souls()[`${day}:${family}:${percent}`] ?? 0;
    }

    protected setRowSouls(day: number, family: SoulFamily, percent: number, souls: number): void {
        this.row_souls.update((current: Dictionary<number>): Dictionary<number> => ({ ...current, [`${day}:${family}:${percent}`]: souls }));
    }

    /** Âmes présentes à l'attaque du jour `attack_day` : valeur choisie, sinon celle du palier renseigné le plus haut. */
    protected attackSouls(attack_day: number): number {
        return this.attack_souls()['_' + attack_day] ?? this.defaultAttackSouls(attack_day);
    }

    protected setAttackSouls(attack_day: number, souls: number): void {
        this.attack_souls.update((current: Dictionary<number>): Dictionary<number> => ({ ...current, ['_' + attack_day]: souls }));
        this.dirty_attack_days.add(attack_day);
    }

    /** Niveau SPA (0-3) présent à la lecture du tableau `family` du jour `day` (0 par défaut). */
    protected spaLevel(day: number, family: SoulFamily): number {
        return this.row_spa_level()[`${day}:${family}`] ?? 0;
    }

    protected setSpaLevel(day: number, family: SoulFamily, level: number): void {
        this.row_spa_level.update((current: Dictionary<number>): Dictionary<number> => ({ ...current, [`${day}:${family}`]: level }));
    }

    /** Niveau SPA à l'attaque du jour `attack_day` : valeur choisie, sinon celui de la famille qui l'a estimée (suppose aucun vote). */
    protected attackSpaLevel(attack_day: number): number {
        return this.attack_spa_level()['_' + attack_day] ?? this.defaultAttackSpaLevel(attack_day);
    }

    protected setAttackSpaLevel(attack_day: number, level: number): void {
        this.attack_spa_level.update((current: Dictionary<number>): Dictionary<number> => ({ ...current, ['_' + attack_day]: level }));
        this.dirty_attack_days.add(attack_day);
    }

    /** Enregistre les estimations avec les âmes et niveaux SPA, puis les réglages d'attaque modifiés, et recharge. */
    protected saveEstimations(): void {
        const estimations: Estimations = this.estimations()!;
        estimations.estim_souls = this.rowsSouls(this.selected_day, 'estim', TDG_VALUES);
        estimations.planif_souls = this.rowsSouls(this.selected_day, 'planif', PLANIF_VALUES);
        estimations.estim_spa_level = this.spaLevel(this.selected_day, 'estim');
        estimations.planif_spa_level = this.spaLevel(this.selected_day, 'planif');
        this.town_statistics_service.saveEstimations(estimations).subscribe((): void => {
            const settings_saves: Observable<void>[] = [...this.dirty_attack_days].map((day: number): Observable<void> =>
                this.town_statistics_service.saveAttackSettings(day, {
                    souls: this.attack_souls()['_' + day] ?? null,
                    spaLevel: this.attack_spa_level()['_' + day] ?? null,
                    fireworks: this.isFireworksDay(day)
                }));
            (settings_saves.length > 0 ? forkJoin(settings_saves) : of([])).subscribe((): void => this.getEstimations());
        });
    }

    protected getEstimations(): void {
        this.town_statistics_service
            .getEstimations(this.selected_day)
            .subscribe({
                next: (estimations: Estimations) => {
                    this.dirty_attack_days.clear();
                    this.estimations.set(estimations);
                    this.loadSouls(estimations);
                    this.saved_snapshot = this.formSnapshot();
                    this.loadAttackSettings();
                    this.loadAttackCalculations();
                }
            });
    }

    /** Relance les calculs d'attaque du jour et du lendemain (âmes enregistrées lues par l'API). */
    private loadAttackCalculations(): void {
        this.calculateAttack(this.selected_day, (result: EstimationsResult): void => {
            this.today_calculated_attack.set(result);
            this.defineTodayCanvas();
        });
        this.calculateAttack(this.selected_day + 1, (result: EstimationsResult): void => {
            this.tomorrow_calculated_attack.set(result);
            this.defineTomorrowCanvas();
        });
        this.loadRefinements();
    }

    /** Relit l'affinage partagé du jour affiché et du lendemain, puis redessine les graphes. */
    private loadRefinements(): void {
        [this.selected_day, this.selected_day + 1].forEach((day: number): void => {
            this.town_statistics_service.getRefinement(day).subscribe({ next: (view: RefinementViewDTO): void => this.setRefinement(day, view) });
        });
    }

    /**
     * Retient l'affinage d'un jour et redessine les graphes déjà créés (ceux créés ensuite le lisent
     * directement : redessiner avant le rendu des canvases lèverait NG0951).
     * @param day Jour attaqué.
     * @param view Affinage partagé.
     */
    private setRefinement(day: number, view: RefinementViewDTO): void {
        this.refinements.update((current: Dictionary<RefinementViewDTO>): Dictionary<RefinementViewDTO> => ({ ...current, ['_' + day]: view }));
        if (this.today_estim_chart) {
            this.defineTodayCanvas();
        }
        if (this.tomorrow_estim_chart) {
            this.defineTomorrowCanvas();
        }
    }

    private calculateAttack(day: number, on_result: (result: EstimationsResult) => void): void {
        this.town_statistics_service.getAttackCalculation(day, false).subscribe({ next: on_result });
    }

    /** Jour attaqué actuellement montré par la colonne de droite. */
    protected chartDay(): number {
        return this.chart_day() === 'today' ? this.selected_day : this.selected_day + 1;
    }

    protected chartAttack(): EstimationsResult | null {
        return this.chart_day() === 'today' ? this.today_calculated_attack() : this.tomorrow_calculated_attack();
    }

    protected selectChartDay(day: ChartDay): void {
        if (this.chart_day() === day) return;
        this.chart_day.set(day);
        // Un graphique masqué par `display: none` mesure zéro : sans ce redimensionnement une fois
        // révélé, il reste écrasé à la hauteur qu'il avait pendant qu'il était caché.
        afterNextRender((): void => this.onResize(), { injector: this.injector });
    }

    protected offsetMode(): boolean {
        return this.chart_day() === 'today' ? this.today_offset_mode : this.tomorrow_offset_mode;
    }

    protected setOffsetMode(value: boolean): void {
        if (this.chart_day() === 'today') {
            this.today_offset_mode = value;
        } else {
            this.tomorrow_offset_mode = value;
        }
    }

    /**
     * Situe la plage calculée dans le possible du jour. Retourne `null` tant que le calcul n'a
     * rien donné.
     */
    protected attackGauge(): AttackGauge | null {
        const attack: EstimationsResult | null = this.chartAttack();
        const likely: LikelyAttack | null = this.most_likely_attack();
        if (!attack?.result || !likely) return null;

        const day: number = this.chartDay();
        const { low, high }: { low: number; high: number } = this.theoreticalBounds(day);
        const min: number = Number(attack.result.min);
        const max: number = Number(attack.result.max);
        if (!(high > low) || !Number.isFinite(min) || !Number.isFinite(max)) return null;

        const span: number = high - low;
        const place: (value: number) => number = (value: number): number => Math.min(100, Math.max(0, (value - low) / span * 100));
        const left: number = place(min);
        const refined: MinMax | null = this.refinedAttackFor(day);

        return {
            low,
            high,
            min,
            max,
            left,
            width: Math.max(1, place(max) - left),
            likely: likely.value,
            likely_left: place(likely.value),
            likely_is_average: likely.is_average,
            refined_min_left: refined ? place(Number(refined.min)) : null,
            refined_max_left: refined ? place(Number(refined.max)) : null
        };
    }

    /** Citoyen (hors mode observateur) dont le navigateur peut scanner. */
    protected canRefine(): boolean {
        return !this.is_readonly() && this.refiner.isSupported();
    }

    /** true si le formulaire contient des modifications non enregistrées (estimations, âmes, SPA, réglages d'attaque). */
    protected hasUnsavedEstimations(): boolean {
        return this.dirty_attack_days.size > 0 || this.formSnapshot() !== this.saved_snapshot;
    }

    /** Libellé de l'état de l'affinage partagé du jour attaqué, ou null s'il n'y a rien à dire. */
    protected refineStatusFor(day: number): string | null {
        const view: RefinementViewDTO | undefined = this.refinements()['_' + day];
        if (!view) {
            return null;
        }
        if (view.status === 'None') {
            return $localize`Pas encore affiné`;
        }
        if (view.status === 'Invalid') {
            return $localize`Saisies modifiées depuis le dernier affinage : relance nécessaire`;
        }
        if (view.noCompatibleConfiguration) {
            return $localize`Aucune configuration compatible trouvée, vérifiez les saisies et les âmes`;
        }
        const author: string = view.lastUpdateInfo
            ? ` · ${view.lastUpdateInfo.userName}, ${moment(view.lastUpdateInfo.updateTime).format('L LT')}`
            : '';
        let label: string = $localize`Attaque affinée` + ` : [${view.attackMin} - ${view.attackMax}]` + author;
        if (view.reductionMin !== null && view.reductionMax !== null) {
            const reduction: string = view.reductionMin === view.reductionMax ? `${view.reductionMin}%` : `${view.reductionMin} - ${view.reductionMax}%`;
            label += '\n' + $localize`Réduction feux d'artifice estimée` + ` : ${reduction}`;
        }
        return label;
    }

    /** true si le jour attaqué D a une explosion de feux d'artifice cochée. */
    protected isFireworksDay(day: number): boolean {
        return this.fireworks_days()['_' + day] === true;
    }

    /** (Dé)coche l'explosion des feux d'artifice pour le jour attaqué D (enregistré sur « Enregistrer »). */
    protected setFireworksDay(day: number, exploded: boolean): void {
        this.fireworks_days.update((current: Dictionary<boolean>): Dictionary<boolean> => ({ ...current, ['_' + day]: exploded }));
        this.dirty_attack_days.add(day);
    }

    /**
     * Scanne l'attaque du jour `day` avec les entrées construites par l'API, envoie les seeds trouvés et
     * affiche la plage partagée renvoyée.
     * @param day Jour attaqué.
     */
    protected async refine(day: number): Promise<void> {
        if (this.refining_day() !== null) {
            return;
        }
        this.refining_day.set(day);
        this.refine_progress.set(0);
        this.deleteRefineMessage(day);
        this.refine_started_at = Date.now();
        this.refine_fraction = 0;
        this.updateRefineStats();
        this.refine_timer = setInterval((): void => this.updateRefineStats(), 1000);
        try {
            const input: RefinementInputDTO = await firstValueFrom(this.town_statistics_service.getRefinementInput(day));
            const result: RefineResult = await this.refiner.refine(Int32Array.from(input.observed), this.toRefinerParams(input.params), (fraction: number): void => {
                this.refine_progress.set(Math.round(fraction * 100));
                this.refine_fraction = fraction;
                this.updateRefineStats();
            });
            if (result.cancelled) {
                this.setRefineMessage(day, $localize`Affinage annulé`);
                return;
            }
            if (result.overflow) {
                this.setRefineMessage(day, $localize`Pas assez de données pour obtenir un affinage fiable, saisissez plus de paliers`);
                return;
            }
            this.setRefinement(day, await firstValueFrom(this.town_statistics_service.postRefinement(day, input, result.hits)));
        } catch (error) {
            if (error instanceof HttpErrorResponse && error.status === 409) {
                this.setRefineMessage(day, $localize`Saisies modifiées pendant le scan, relancez l'affinage`);
            } else if (error instanceof HttpErrorResponse && error.status === 429) {
                this.setRefineMessage(day, $localize`Serveur occupé, réessayez dans un instant`);
            } else if (error instanceof HttpErrorResponse && error.status === 400) {
                this.setRefineMessage(day, $localize`Aucune estimation saisie à affiner`);
            } else {
                console.error(`Affinage J${day} :`, error);
                this.setRefineMessage(day, $localize`Erreur pendant l'affinage`);
            }
        } finally {
            this.stopRefineTimer();
            this.refining_day.set(null);
        }
    }

    protected cancelRefine(): void {
        this.refiner.cancel();
    }

    /** Message du dernier affinage du jour attaqué, ou null. */
    protected refineMessageFor(day: number): string | null {
        return this.refine_messages()['_' + day] || null;
    }

    protected pasteFromMH(paste_event: ClipboardEvent, min_max: MinMax, min: boolean): void {
        paste_event.preventDefault();
        const value: string | undefined = paste_event.clipboardData?.getData('Text');
        let split: string[] | undefined;
        this.separators.forEach((separator: string) => {
            const splitted: string[] | undefined = value?.split(separator);
            if (splitted && splitted.length > 1) {
                split = splitted;
            }
        });

        if (split && split.length > 1) {
            min_max.min = +split[0];
            min_max.max = +split[1];
        } else if (split?.length === 1) {
            min_max[min ? 'min' : 'max'] = +split[0];
        } else {
            min_max[min ? 'min' : 'max'] = value ? +value : undefined;
        }
    }

    protected shareEstimsForum(): void {
        const today_attack_title: string = $localize`Attaque du jour`;
        const tomorrow_attack_title: string = $localize`Attaque du lendemain`;
        let text: string = '';

        /** Ajout du titre **/
        text += `[big][b][bad]J${this.selected_day}[/bad][/b][/big]{hr}\n`;

        /** Ajout du titre "Attaque du jour" */
        text += `[i]${today_attack_title} (J${this.selected_day})[/i]\n`;

        /** Ajout des valeurs du jour */
        TDG_VALUES.forEach((value_key: number) => {
            const value: MinMax = this.estimations()!.estim['_' + value_key];
            if (value && (value.min || value.max)) {
                text += `[b][${value_key}%][/b] ${value.min || '?'} - ${value.max || '?'} :zombie:\n`;
            }
        });

        text += '{hr}\n';

        /** Ajout du titre "Attaque du lendemain" */
        text += `[i]${tomorrow_attack_title} (J${this.selected_day + 1})[/i]\n`;

        /** Ajout des valeurs du lendemain */
        PLANIF_VALUES.forEach((value_key: number) => {
            const value: MinMax = this.estimations()!.planif['_' + value_key];
            if (value && (value.min || value.max)) {
                text += `[b][${value_key}%][/b] ${value.min || '?'} - ${value.max || '?'} :zombie:\n`;
            }
        });

        text += '{hr}';


        this.clipboard.copy(text, $localize`La liste a bien été copiée au format forum`);

    }

    /** Âmes du palier renseigné le plus haut du tableau affiché (tour pour l'attaque du jour, planif pour celle du lendemain). */
    private defaultAttackSouls(attack_day: number): number {
        const estimations: Estimations | undefined = this.estimations();
        if (!estimations) {
            return 0;
        }
        const is_today: boolean = attack_day === this.selected_day;
        if (!this.defaultIsOnScreen(attack_day)) {
            return this.attack_defaults()['_' + attack_day]?.defaultSouls ?? 0;
        }
        const latest: number | undefined = this.latestFilledPercent(is_today ? estimations.estim : estimations.planif, is_today ? TDG_VALUES : PLANIF_VALUES);
        return latest === undefined ? 0 : this.rowSouls(this.selected_day, is_today ? 'estim' : 'planif', latest);
    }

    /** Niveau SPA par défaut à l'attaque : celui de la famille qui a servi à l'estimer (suppose qu'aucun vote n'a changé le niveau). */
    private defaultAttackSpaLevel(attack_day: number): number {
        const is_today: boolean = attack_day === this.selected_day;
        if (!this.defaultIsOnScreen(attack_day)) {
            return this.attack_defaults()['_' + attack_day]?.defaultSpaLevel ?? 0;
        }
        return this.spaLevel(this.selected_day, is_today ? 'estim' : 'planif');
    }

    /**
     * true si la famille dont l'API tire les défauts de l'attaque du jour `attack_day` est affichée : tour du jour
     * renseignée pour l'attaque du jour, planificateur du jour pour celle du lendemain (sauf si la tour du lendemain,
     * non affichée, est déjà renseignée). Le défaut suit alors la saisie en direct ; sinon il vient de l'API.
     * @param attack_day Jour attaqué.
     */
    private defaultIsOnScreen(attack_day: number): boolean {
        const server: AttackSettingsDTO | undefined = this.attack_defaults()['_' + attack_day];
        if (server === undefined) {
            return true;
        }
        if (attack_day === this.selected_day) {
            return this.latestFilledPercent(this.estimations()?.estim ?? {}, TDG_VALUES) !== undefined;
        }
        return server.defaultFromTdg !== true;
    }

    /**
     * Palier renseigné le plus haut d'un tableau, ou undefined s'il est vide.
     * @param values Saisies du tableau.
     * @param percents Paliers du tableau.
     */
    private latestFilledPercent(values: Dictionary<MinMax>, percents: number[]): number | undefined {
        return [...percents].reverse()
            .find((percent: number): boolean => Number(values['_' + percent]?.min) > 0 || Number(values['_' + percent]?.max) > 0);
    }

    /** Âmes par palier (clé = %) d'un tableau, âmes nulles omises. */
    private rowsSouls(day: number, family: SoulFamily, percents: number[]): Dictionary<number> {
        const rows: Dictionary<number> = {};
        percents.forEach((percent: number): void => {
            const souls: number = this.rowSouls(day, family, percent);
            if (souls > 0) {
                rows[String(percent)] = souls;
            }
        });
        return rows;
    }

    /**
     * Reprend les âmes par palier et les niveaux SPA enregistrés du jour affiché, et affiche les compteurs
     * dès que la ville en a saisi.
     * @param estimations Estimations chargées du jour affiché.
     */
    private loadSouls(estimations: Estimations): void {
        const rows: Dictionary<number> = {};
        Object.entries(estimations.estim_souls).forEach(([percent, souls]: [string, number]): void => {
            rows[`${this.selected_day}:estim:${percent}`] = souls;
        });
        Object.entries(estimations.planif_souls).forEach(([percent, souls]: [string, number]): void => {
            rows[`${this.selected_day}:planif:${percent}`] = souls;
        });
        this.row_souls.set(rows);
        this.row_spa_level.set({ [`${this.selected_day}:estim`]: estimations.estim_spa_level, [`${this.selected_day}:planif`]: estimations.planif_spa_level });
        if (Object.values(rows).some((souls: number): boolean => souls > 0)) {
            this.souls_mode.set(true);
        }
    }

    /** Charge les réglages d'attaque du jour affiché et du lendemain. */
    private loadAttackSettings(): void {
        [this.selected_day, this.selected_day + 1].forEach((day: number): void => {
            this.town_statistics_service.getAttackSettings(day).subscribe({
                next: (settings: AttackSettingsDTO): void => {
                    this.attack_souls.update((current: Dictionary<number>): Dictionary<number> => this.withOptional(current, day, settings.souls));
                    this.attack_spa_level.update((current: Dictionary<number>): Dictionary<number> => this.withOptional(current, day, settings.spaLevel));
                    this.fireworks_days.update((current: Dictionary<boolean>): Dictionary<boolean> => ({ ...current, ['_' + day]: settings.fireworks }));
                    this.attack_defaults.update((current: Dictionary<AttackSettingsDTO>): Dictionary<AttackSettingsDTO> => ({ ...current, ['_' + day]: settings }));
                    if (settings.souls !== null && settings.souls > 0) {
                        this.souls_mode.set(true);
                    }
                }
            });
        });
    }

    /**
     * Copie de `current` où la clé du jour vaut `value`, ou est absente si `value` est null (valeur par défaut).
     * @param current Valeurs par jour.
     * @param day Jour attaqué.
     * @param value Valeur enregistrée, null = défaut.
     */
    private withOptional(current: Dictionary<number>, day: number, value: number | null): Dictionary<number> {
        const updated: Dictionary<number> = { ...current };
        if (value === null) {
            delete updated['_' + day];
        } else {
            updated['_' + day] = value;
        }
        return updated;
    }

    /** Estimations, âmes (paliers à 0 omis) et niveaux SPA du jour affiché, sérialisés. */
    private formSnapshot(): string {
        return JSON.stringify([
            this.estimations()?.modelToDto(),
            this.rowsSouls(this.selected_day, 'estim', TDG_VALUES),
            this.rowsSouls(this.selected_day, 'planif', PLANIF_VALUES),
            this.spaLevel(this.selected_day, 'estim'),
            this.spaLevel(this.selected_day, 'planif')
        ]);
    }

    /**
     * Paramètres du moteur de scan à partir des entrées de l'API (soul_attack n'intervient pas dans le scan).
     * @param params Paramètres du jour reçus de l'API.
     */
    private toRefinerParams(params: RefinementParamsDTO): RefinerParams {
        return {
            base_lo_rand: params.baseLoRand, base_hi_rand: params.baseHiRand, off_sum: params.offSum, protect: params.protect, blocks: params.blocks,
            soul_tdg: params.soulTdg, soul_planif: params.soulPlanif, soul_attack: 1, shift_span: params.shiftSpan, shift_steps: params.shiftSteps,
            min_global: params.minGlobal, max_global: params.maxGlobal, rebound_possible: params.reboundPossible, fireworks: params.fireworks
        };
    }

    /** Bornes théoriques de l'attaque du jour, multipliées par le facteur d'âmes de l'attaque. */
    private theoreticalBounds(day: number): { low: number; high: number } {
        const town_type: TownTypeId = getTown()?.town_type ?? 'RE';
        const factor: number = getSoulFactor(this.attackSouls(day), town_type, this.attackSpaLevel(day));
        return { low: Math.round(getMinAttack(day, town_type) * factor), high: Math.round(getMaxAttack(day, town_type) * factor) };
    }

    /** Plage affinée partagée du jour attaqué, ou null si aucun affinage valide n'existe. */
    private refinedAttackFor(day: number): MinMax | null {
        const view: RefinementViewDTO | undefined = this.refinements()['_' + day];
        return view?.status === 'Valid' && view.attackMin !== null && view.attackMax !== null ? { min: view.attackMin, max: view.attackMax } : null;
    }

    private setRefineMessage(day: number, message: string): void {
        this.refine_messages.update((messages: Dictionary<string>): Dictionary<string> => ({ ...messages, ['_' + day]: message }));
    }

    /** `delete` sur l'objet tenu par le signal ne notifierait pas : reconstruit une copie sans la clé. */
    private deleteRefineMessage(day: number): void {
        this.refine_messages.update((messages: Dictionary<string>): Dictionary<string> => {
            const updated: Dictionary<string> = { ...messages };
            delete updated['_' + day];
            return updated;
        });
    }

    private stopRefineTimer(): void {
        if (this.refine_timer !== null) {
            clearInterval(this.refine_timer);
            this.refine_timer = null;
        }
    }

    /** Recalcule les libellés temps écoulé / ETA / seeds scannés (affichage seul). Durées via moment. */
    private updateRefineStats(): void {
        const elapsed_s: number = (Date.now() - this.refine_started_at) / 1000;
        this.refine_elapsed_label.set(moment.duration(elapsed_s, 'seconds').humanize());
        if (this.refine_fraction > 0.005) {
            const eta_s: number = Math.max(0, elapsed_s / this.refine_fraction - elapsed_s);
            this.refine_eta_label.set($localize`~${moment.duration(eta_s, 'seconds').humanize()} restant(es)`);
        } else {
            this.refine_eta_label.set($localize`estimation du temps...`);
        }
    }

    private defineTodayCanvas(): void {
        const today_estim_canvas: ElementRef = this.today_estim_canvas();
        if (today_estim_canvas) {
            if (this.today_estim_chart) {
                this.today_estim_chart.destroy();
            }
            const today_estim_ctx: CanvasRenderingContext2D = today_estim_canvas.nativeElement.getContext('2d');
            this.today_estim_chart = new Chart<'line'>(today_estim_ctx, this.getEstimConfig(this.selected_day, TDG_VALUES, this.estimations()!.estim, this.today_calculated_attack()?.result, this.refinedAttackFor(this.selected_day)));
        }

        const today_offset_canvas: ElementRef = this.today_offset_canvas();
        if (today_offset_canvas) {
            if (this.today_offset_chart) {
                this.today_offset_chart.destroy();
            }
            const today_offset_ctx: CanvasRenderingContext2D = today_offset_canvas.nativeElement.getContext('2d');
            this.today_offset_chart = new Chart<'bar'>(today_offset_ctx, this.getOffsetConfig(this.selected_day, this.today_calculated_attack()?.min_list, this.today_calculated_attack()?.max_list));
        }
    }

    private defineTomorrowCanvas(): void {
        const tomorrow_estim_canvas: ElementRef = this.tomorrow_estim_canvas();
        if (tomorrow_estim_canvas) {
            if (this.tomorrow_estim_chart) {
                this.tomorrow_estim_chart.destroy();
            }
            const tomorrow_estim_ctx: CanvasRenderingContext2D = tomorrow_estim_canvas.nativeElement.getContext('2d');
            this.tomorrow_estim_chart = new Chart<'line'>(tomorrow_estim_ctx, this.getEstimConfig(this.selected_day + 1, PLANIF_VALUES, this.estimations()!.planif, this.tomorrow_calculated_attack()?.result, this.refinedAttackFor(this.selected_day + 1)));
        }

        const tomorrow_offset_canvas: ElementRef = this.tomorrow_offset_canvas();
        if (tomorrow_offset_canvas) {
            if (this.tomorrow_offset_chart) {
                this.tomorrow_offset_chart.destroy();
            }
            const tomorrow_offset_ctx: CanvasRenderingContext2D = tomorrow_offset_canvas.nativeElement.getContext('2d');
            this.tomorrow_offset_chart = new Chart<'bar'>(tomorrow_offset_ctx, this.getOffsetConfig(this.selected_day + 1, this.tomorrow_calculated_attack()?.min_list, this.tomorrow_calculated_attack()?.max_list));
        }
    }

    private clickOnLegendItem(_event: ChartEvent, legendItem: LegendItem, legend: LegendElement<'line'>): void {
        const hidden: boolean = !legend.chart.getDatasetMeta(<number>legendItem.datasetIndex).hidden;
        const dataSetIndex: number[] = legendItem.datasetIndex === 1 ? [0, 1]
            : (legendItem.datasetIndex === 3 ? [2, 3]
                : (legendItem.datasetIndex === 5 ? [4, 5] : [6, 7]));
        dataSetIndex.forEach((i: number) => legend.chart.getDatasetMeta(i).hidden = hidden);
        legend.chart.update();
    }

    private generateLegendLabels(chart: Chart<'line'>): LegendItem[] {
        return chart.data.datasets
            .map((ds: ChartDataset<'line'>, i: number): LegendItem => ({
                text: ds.label?.substring(0, ds.label.indexOf('-')) || '',
                datasetIndex: i,
                fontColor: <Color>Chart.defaults.color,
                fillStyle: <Color>chart.data.datasets[i].backgroundColor,
                strokeStyle: <Color>chart.data.datasets[i].borderColor,
                lineDash: <number[]>chart.data.datasets[i].borderDash,
                lineWidth: 3,
                hidden: chart.getDatasetMeta(i).hidden
            }))
            .filter((_ds: LegendItem, i: number) => i % 2);
    }

    private getEstimConfig(day: number, PERCENTS: number[], values: Dictionary<MinMax>, calculated_attack: MinMax | undefined, refined_attack: MinMax | null)
        : ChartConfiguration<'line'> {
        // Quatre séries, quatre emplacements de la palette du thème, dans l'ordre : elle est
        // validée pour rester distinguable en daltonisme, et cet ordre en est le mécanisme.
        const series: string[] = [0, 1, 2, 3].map((slot: number): string => this.charts_theming.series(slot));
        const fills: string[] = [0, 1, 2, 3].map((slot: number): string => this.charts_theming.seriesFill(slot, 0.35));
        return {
            type: 'line',
            data: {
                labels: PERCENTS.map((value: number): string => value + '%'),
                datasets: [
                    {
                        label: $localize`Attaque théorique - Min`,
                        data: Array(PERCENTS.length).fill(this.theoreticalBounds(day).low),
                        spanGaps: true,
                        borderColor: series[0],
                        backgroundColor: fills[0],
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        borderDash: [3, 3]
                    },
                    {
                        label: $localize`Attaque théorique - Max`,
                        data: Array(PERCENTS.length).fill(this.theoreticalBounds(day).high),
                        spanGaps: true,
                        borderColor: series[0],
                        backgroundColor: fills[0],
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        borderDash: [3, 3]
                    },
                    {
                        label: $localize`Attaque J${day} calculée - Min`,
                        data: Array(PERCENTS.length).fill(calculated_attack?.min),
                        spanGaps: true,
                        borderColor: series[1],
                        backgroundColor: fills[1],
                        pointRadius: 0,
                        pointHoverRadius: 0
                    },
                    {
                        label: $localize`Attaque J${day} calculée - Max`,
                        data: Array(PERCENTS.length).fill(calculated_attack?.max),
                        spanGaps: true,
                        borderColor: series[1],
                        backgroundColor: fills[1],
                        pointRadius: 0,
                        pointHoverRadius: 0
                    },
                    {
                        label: $localize`Estimation enregistrée - Min`,
                        data: PERCENTS.map((value: number) => +(values['_' + value].min || 'NaN')),
                        spanGaps: true,
                        borderColor: series[2],
                        backgroundColor: fills[2]
                    },
                    {
                        label: $localize`Estimation enregistrée - Max`,
                        data: PERCENTS.map((value: number) => +(values['_' + value].max || 'NaN')),
                        spanGaps: true,
                        borderColor: series[2],
                        backgroundColor: fills[2]
                    },
                    {
                        label: $localize`Attaque J${day} affinée - Min`,
                        data: Array(PERCENTS.length).fill(refined_attack ? refined_attack.min : null),
                        spanGaps: true,
                        borderColor: series[3],
                        backgroundColor: fills[3],
                        pointRadius: 0,
                        pointHoverRadius: 0
                    },
                    {
                        label: $localize`Attaque J${day} affinée - Max`,
                        data: Array(PERCENTS.length).fill(refined_attack ? refined_attack.max : null),
                        spanGaps: true,
                        borderColor: series[3],
                        backgroundColor: fills[3],
                        pointRadius: 0,
                        pointHoverRadius: 0
                    },
                ]
            },
            options: {
                plugins: {
                    legend: {
                        labels: {
                            generateLabels: this.generateLegendLabels
                        },
                        onClick: this.clickOnLegendItem
                    }
                },
                interaction: {
                    intersect: false
                },
                responsive: true,
                maintainAspectRatio: false,
            }
        };
    }

    private getOffsetConfig(day: number, values_min: EstimationGraphValues[] | undefined, values_max: EstimationGraphValues[] | undefined)
        : ChartConfiguration<'bar'> {
        return {
            type: 'bar',
            data: {
                labels: (values_min ?? []).map((value: EstimationGraphValues) => value.value),
                datasets: [
                    {
                        label: $localize`Répartition des valeurs possibles J${day} - Min`,
                        data: (values_min ?? []).map((value: EstimationGraphValues) => value.count),
                        backgroundColor: this.charts_theming.seriesFill(0, 0.8),
                        borderColor: this.charts_theming.series(0)
                    },
                    {
                        label: $localize`Répartition des valeurs possibles J${day} - Max`,
                        data: (values_max ?? []).map((value: EstimationGraphValues) => value.count),
                        backgroundColor: this.charts_theming.seriesFill(1, 0.8),
                        borderColor: this.charts_theming.series(1)
                    }
                ]
            },
            options: {
                interaction: {
                    intersect: false
                },
                responsive: true,
                maintainAspectRatio: false,
            }
        };
    }
}
