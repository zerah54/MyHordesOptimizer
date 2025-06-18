import { CommonModule, DecimalPipe, formatNumber, Location, NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { Component, HostBinding, inject, Inject, OnInit, ViewEncapsulation, DOCUMENT } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import moment from 'moment';
import { Subject, takeUntil } from 'rxjs';
import { HORDES_IMG_REPO, NO_RUIN } from '../../_abstract_model/const';
import { JobEnum } from '../../_abstract_model/enum/job.enum';
import { ApiService } from '../../_abstract_model/services/api.service';
import { CampingService } from '../../_abstract_model/services/camping.service';
import { TownService } from '../../_abstract_model/services/town.service';
import { Imports, TownTypeId } from '../../_abstract_model/types/_types';
import { CampingBonus } from '../../_abstract_model/types/camping-bonus.class';
import { CampingOdds } from '../../_abstract_model/types/camping-odds.class';
import { CampingParameters } from '../../_abstract_model/types/camping-parameters.class';
import { Ruin } from '../../_abstract_model/types/ruin.class';
import { TownDetails } from '../../_abstract_model/types/town-details.class';
import { AutoDestroy } from '../../shared/decorators/autodestroy.decorator';
import { SelectComponent } from '../../shared/elements/select/select.component';
import { FilterRuinsByKmPipe } from '../../shared/pipes/filter-ruins-by-km.pipe';
import { ClipboardService } from '../../shared/services/clipboard.service';
import { getTown } from '../../shared/utilities/localstorage.util';
import { CampingDisplayBonusPipe } from './camping-display-bonus.pipe';

const angular_common: Imports = [CommonModule, FormsModule, NgOptimizedImage, NgTemplateOutlet, ReactiveFormsModule];
const components: Imports = [SelectComponent];
const pipes: Imports = [CampingDisplayBonusPipe, DecimalPipe, FilterRuinsByKmPipe];
const material_modules: Imports = [MatButtonModule, MatButtonToggleModule, MatCardModule, MatCheckboxModule, MatDividerModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSlideToggleModule, MatTooltipModule];

@Component({
    selector: 'mho-camping',
    templateUrl: './camping.component.html',
    styleUrls: ['./camping.component.scss'],
    encapsulation: ViewEncapsulation.None,
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class CampingComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    public ruins: Ruin[] = [];
    public town_ruins: Ruin[] = [];
    public town: TownDetails | null = getTown();
    public and_amelio: boolean = true;
    public display_bonus_ap: boolean = false;

    public town_types: TownType[] = [
        {id: 'RNE', label: $localize`Petite carte`, bonus: 0},
        {id: 'RE', label: $localize`Région éloignée`, bonus: 0},
        {id: 'PANDE', label: $localize`Pandémonium`, bonus: 0}
    ];

    public bonus!: CampingBonus;

    public configuration_form!: UntypedFormGroup;
    // public configuration_form!: ModelFormGroup<CampingParameters>;
    public camping_result!: CampingOdds;
    /** Le dossier dans lequel sont stockées les images */
    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    public readonly locale: string = moment.locale();
    public readonly help_ruins: string = $localize`La liste est impactée par la distance choisie`;
    public readonly help_amelio: string = $localize`Il faut en soustraire 3 après chaque attaque`;
    // eslint-disable-next-line no-irregular-whitespace
    public readonly bonus_string: string = $localize`Bonus : `;
    // eslint-disable-next-line no-irregular-whitespace
    public readonly capacity_string: string = $localize`Capacité : `;

    public readonly jobs: JobEnum[] = JobEnum.getAllValues();
    public readonly JOB_SCOUT: JobEnum = JobEnum.SCOUT;

    public getMoreRuinInfoFn: (ruin: string | Ruin) => string = this.getMoreRuinInfo.bind(this);
    public getMoreTownTypeInfoFn: (ruin: string | TownType) => string = this.getMoreTownTypeInfo.bind(this);

    public in_town_camping: boolean = !!this.town;

    private camping_service: CampingService = inject(CampingService);
    private api: ApiService = inject(ApiService);
    private readonly no_ruin: Ruin = new Ruin(NO_RUIN);

    private town_service: TownService = inject(TownService);

    @AutoDestroy private destroy_sub: Subject<void> = new Subject();


    constructor(private fb: UntypedFormBuilder, private route: ActivatedRoute, private clipboard: ClipboardService,
                private router: Router, private activated_route: ActivatedRoute, private location: Location,
                @Inject(DOCUMENT) private document: Document) {
    }

    public ngOnInit(): void {

        this.route.queryParams
            .pipe(takeUntil(this.destroy_sub))
            .subscribe((params: Record<string, string>) => {
                this.api.getRuins()
                    .pipe(takeUntil(this.destroy_sub))
                    .subscribe((ruins: Ruin[]) => {
                        ruins = ruins.sort((ruin_a: Ruin, ruin_b: Ruin) => ruin_a.label[this.locale].toLocaleLowerCase().localeCompare(ruin_b.label[this.locale].toLocaleLowerCase()));

                        this.camping_service.getBonus()
                            .pipe(takeUntil(this.destroy_sub))
                            .subscribe((bonus: CampingBonus) => {
                                this.bonus = bonus;

                                if (this.town) {
                                    this.town_service
                                        .getTownRuins()
                                        .pipe(takeUntil(this.destroy_sub))
                                        .subscribe((town_ruins: Ruin[]) => {
                                            this.town_ruins = [this.no_ruin].concat([...town_ruins]);
                                        });
                                }

                                this.no_ruin.camping = this.bonus.desert_bonus;
                                this.ruins = [this.no_ruin].concat([...ruins]);

                                const pande_town: TownType = <TownType>this.town_types.find((town_type: TownType) => town_type.id === 'PANDE');
                                pande_town.bonus = this.bonus.pande;

                                const init_form: Record<string, unknown> | undefined = this.convertEasyReadableToForm(params);

                                this.configuration_form = this.fb.group(init_form ? init_form : {
                                    town: [{
                                        value: <TownType>this.town_types.find((town_type: TownType) => this.town && this.in_town_camping ? town_type.id === (<TownDetails>this.town).town_type : town_type.id === 'RNE'),
                                        disabled: false
                                    }],
                                    job: [{value: <JobEnum>this.jobs.find((job: JobEnum) => job.value.id === 'citizen'), disabled: false}],
                                    distance: [{value: 1, disabled: false}],
                                    campings: [{value: 0, disabled: false}],
                                    pro: [{value: false, disabled: false}],
                                    hidden_campers: [{value: 0, disabled: false}],
                                    objects: [{value: 0, disabled: false}],
                                    vest: [{value: false, disabled: false}],
                                    tomb: [{value: false, disabled: false}],
                                    zombies: [{value: 0, disabled: false}],
                                    night: [{value: false, disabled: false}],
                                    devastated: [{
                                        value: this.town && this.in_town_camping ? this.town.is_devaste : false,
                                        disabled: this.town && this.in_town_camping
                                    }],
                                    phare: [{value: false, disabled: false}],
                                    improve: [{value: 0, disabled: false}],
                                    object_improve: [{value: 0, disabled: false}],
                                    complete_improve: [{value: 0, disabled: false}],
                                    ruin: [{value: this.no_ruin, disabled: false}],
                                    bury_count: [{value: 0, disabled: false}],
                                });
                                this.calculateCamping();

                                this.configuration_form.valueChanges
                                    .pipe(takeUntil(this.destroy_sub))
                                    .subscribe(() => {
                                        this.calculateCamping();
                                    });

                                const url: string = this.router.createUrlTree([], {relativeTo: this.activated_route}).toString();
                                this.location.go(url);
                            });
                    });
            });
    }

    public shareCamping(): void {
        let url: string = this.document.location.href;
        url += '?' + this.convertFormToEasyReadable();
        this.clipboard.copy(url, $localize`Le lien a bien été copié`);
    }

    public getMoreRuinInfo(ruin: string | Ruin): string {
        if (typeof ruin === 'string') {
            return ruin;
        } else {
            let capacity: string;
            if (ruin.id === -1000) {
                capacity = '';
            } else if (ruin.id === -1) {
                capacity = formatNumber(Math.max(0, Math.min(3, Math.floor((+this.configuration_form.get('bury_count')?.value || 0) / 3))), this.locale, '1.0-0');
            } else {
                capacity = formatNumber(ruin.capacity || 0, this.locale, '1.0-0');
            }

            let capacity_html: string = '';
            if (ruin.id !== -1000) {
                capacity_html = `<small>${this.capacity_string}&nbsp;:&nbsp;${capacity}</small>&nbsp;/&nbsp;`;
            }

            const bonus: string = formatNumber(this.display_bonus_ap ? (ruin.camping / 5) : (ruin.camping), this.locale, '1.0-2') + (this.display_bonus_ap ? '' : '%');
            const bonus_html: string = `<small>${this.bonus_string}${bonus}</small>`;

            return capacity_html + bonus_html;
        }
    }

    public getMoreTownTypeInfo(town_type: string | TownType): string {
        if (typeof town_type === 'string') {
            return town_type;
        } else {
            return `<small>${this.bonus_string}${formatNumber(this.display_bonus_ap ? (town_type.bonus / 5) : (town_type.bonus), this.locale, '1.0-2')}${this.display_bonus_ap ? '' : '%'}</small>`;
        }
    }

    public calculateCrowdChance(value: number): number {
        return this.bonus.crowd_chances[Math.min(this.bonus.crowd_chances.length - 1, value)];
    }

    public calculateDistanceChance(value: number): number {
        return this.bonus.dist_chances[Math.min(this.bonus.dist_chances.length - 1, value)];
    }

    public changeBonusMode(display_bonus_ap: boolean): void {
        if (display_bonus_ap) {
            this.configuration_form.get('complete_improve')?.setValue(+this.configuration_form.get('complete_improve')?.value / 5);
        } else {
            this.configuration_form.get('complete_improve')?.setValue(+this.configuration_form.get('complete_improve')?.value * 5);
        }
    }

    public calculateNbCampingsChance(value: number, pro_camper: boolean, pande: boolean): number {

        let chance: number[];
        if (pande) {
            if (pro_camper) {
                chance = this.bonus.panda_pro_camper_by_already_camped;
            } else {
                chance = this.bonus.panda_no_pro_camper_by_already_camped;
            }
        } else {
            if (pro_camper) {
                chance = this.bonus.normal_pro_camper_by_already_camped;
            } else {
                chance = this.bonus.normal_no_pro_camper_by_already_camped;
            }
        }

        return chance[Math.min(value, chance.length - 1)];
    }

    public changeInTownMode(): void {
        const town_type_control: FormControl<TownType> = <FormControl>this.configuration_form.get('town');
        const devastated_control: FormControl<boolean> = <FormControl>this.configuration_form.get('devastated');
        if (this.in_town_camping && this.town) {

            const current_town: TownDetails = this.town;

            town_type_control.setValue(<TownType>this.town_types.find((town_type: TownType): boolean => town_type.id === current_town.town_type));
            town_type_control.disable();

            devastated_control.setValue(current_town.is_devaste);
            devastated_control.disable();
        } else {
            town_type_control.enable();
            devastated_control.enable();
        }
    }

    protected calculateCamping(): void {
        let total_improve: number;
        let total_object_improve: number;

        if (this.and_amelio) {
            /**
             * Nombre d'améliorations simples sur la case
             * @see ActionDataService.php : 'improve'
             */
            total_improve = this.calculateObjectsFromTotal().improve + this.configuration_form.get('improve')?.value;

            /**
             * Nombre d'objets de défense installés sur la case
             * @see ActionDataService.php ('cm_campsite_improve')
             */
            total_object_improve = this.calculateObjectsFromTotal().improve_objects + this.configuration_form.get('object_improve')?.value;
        } else {
            if (+this.configuration_form.get('complete_improve')?.value > 0) {
                /**
                 * Nombre d'améliorations simples sur la case
                 * @see ActionDataService.php : 'improve'
                 */
                total_improve = this.calculateObjectsFromTotal().improve ?? 0;

                /**
                 * Nombre d'objets de défense installés sur la case
                 * @see ActionDataService.php : 'cm_campsite_improve'
                 */
                total_object_improve = this.calculateObjectsFromTotal().improve_objects ?? 0;
            } else {
                /**
                 * Nombre d'améliorations simples sur la case
                 * @see ActionDataService.php : 'improve'
                 */
                total_improve = +this.configuration_form.get('improve')?.value;

                /**
                 * Nombre d'objets de défense installés sur la case
                 * @see ActionDataService.php : 'cm_campsite_improve'
                 */
                total_object_improve = +this.configuration_form.get('object_improve')?.value;
            }
        }

        const camping_parameters: CampingParameters = new CampingParameters({
            townType: this.configuration_form.get('town')?.value.id,
            job: (<JobEnum>this.configuration_form.get('job')?.value).value.id,
            distance: this.configuration_form.get('distance')?.value ?? 0,
            campings: this.configuration_form.get('campings')?.value ?? 0,
            proCamper: this.configuration_form.get('pro')?.value,
            hiddenCampers: this.configuration_form.get('hidden_campers')?.value,
            objects: this.configuration_form.get('objects')?.value ?? 0,
            vest: this.configuration_form.get('vest')?.value ?? 0,
            tomb: this.configuration_form.get('tomb')?.value ?? 0,
            zombies: this.configuration_form.get('zombies')?.value ?? 0,
            night: this.configuration_form.get('night')?.value,
            devastated: this.configuration_form.get('devastated')?.value,
            phare: this.configuration_form.get('phare')?.value,
            improve: total_improve ?? 0,
            objectImprove: total_object_improve ?? 0,
            ruinBonus: (<Ruin>this.configuration_form.get('ruin')?.value).camping ?? 0,
            ruinCapacity: this.configuration_form.get('ruin')?.value.capacity ?? 100,
            ruinBuryCount: (<Ruin>this.configuration_form.get('ruin')?.value).id === -1 ? this.configuration_form.get('bury_count')?.value : 0,
        });
        this.camping_service.calculateCamping(camping_parameters).subscribe((camping_result: CampingOdds) => {
            this.camping_result = camping_result;
        });
    }

    private convertFormToEasyReadable(): string {
        let url_string: string = '';
        for (const key in this.configuration_form.value) {
            const element: string | number | boolean | TownType | JobEnum = this.configuration_form.value[key];
            if (element !== null && element !== undefined && element !== '') {
                if (typeof element === 'string' || typeof element === 'number' || typeof element === 'boolean') {
                    url_string += `&${key}=${element.toString()}`;
                } else {
                    url_string += `&${key}=${(<{ [key: string]: unknown }><unknown>element)['id']
                        ? (<{ [key: string]: unknown }><unknown>element)['id']
                        : (<{ [key: string]: unknown }><unknown>(<{ [key: string]: unknown }><unknown>element)['value'])['id']}`;
                }
            } else {
                url_string += `&${key}=`;
            }
        }
        return url_string;
    }

    private convertEasyReadableToForm(params: Record<string, string>): Record<string, [unknown]> | undefined {
        let init_form: Record<string, [unknown]> | undefined = undefined;
        let index: number = 0;
        for (const key in params) {
            if (index === 0) {
                init_form = {};
            }
            if (init_form) {
                switch (key) {
                    case 'town':
                        init_form[key] = [this.town_types.find((town_type: TownType) => town_type.id.toString() === params[key].toString())];
                        break;
                    case 'ruin':
                        init_form[key] = [this.ruins.find((ruin: Ruin) => ruin.id.toString() === params[key].toString())];
                        break;
                    case 'job':
                        init_form[key] = [this.jobs.find((job: JobEnum) => job.value.id.toString() === params[key].toString())];
                        break;
                    default:
                        if (params[key] === 'false') {
                            init_form[key] = [false];
                        } else if (params[key] === 'true') {
                            init_form[key] = [true];
                        } else {
                            init_form[key] = [params[key]];
                        }
                }
            }
            index++;
        }
        return init_form;
    }

    private calculateObjectsFromTotal(): { improve: number, improve_objects: number } {
        const complete_improve: number = this.configuration_form.get('complete_improve')?.value;
        for (let i: number = 0; i <= Math.floor(complete_improve); i += (this.display_bonus_ap ? 1 : this.bonus.improve)) {
            const tested_improve_objects: number = (complete_improve * 100 - i * 100) / 100 / (this.display_bonus_ap ? (this.bonus.object_improve / this.bonus.improve) : this.bonus.object_improve);
            if (Number.isInteger(tested_improve_objects)) {
                const improve: number = complete_improve - (tested_improve_objects * (this.display_bonus_ap ? (this.bonus.object_improve / this.bonus.improve) : this.bonus.object_improve));
                return {improve: improve / (this.display_bonus_ap ? 1 : this.bonus.improve), improve_objects: tested_improve_objects};
            }
        }
        return {improve: Math.round(complete_improve / (this.display_bonus_ap ? 1 : this.bonus.improve)), improve_objects: 0};
    }
}

interface TownType {
    id: TownTypeId;
    label: string;
    bonus: number;
}

export type ModelFormGroup<T> = FormGroup<{
    [K in keyof T]: FormControl<T[K]>;
}>;
