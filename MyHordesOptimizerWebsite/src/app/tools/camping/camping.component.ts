import { DecimalPipe, DOCUMENT, Location, NgIf, NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { Component, HostBinding, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { Subject, takeUntil } from 'rxjs';
import { HORDES_IMG_REPO, NO_RUIN } from '../../_abstract_model/const';
import { JobEnum } from '../../_abstract_model/enum/job.enum';
import { ApiService } from '../../_abstract_model/services/api.service';
import { CampingService } from '../../_abstract_model/services/camping.service';
import { TownTypeId } from '../../_abstract_model/types/_types';
import { CampingBonus } from '../../_abstract_model/types/camping-bonus.class';
import { CampingParameters } from '../../_abstract_model/types/camping-parameters.class';
import { Ruin } from '../../_abstract_model/types/ruin.class';
import { AutoDestroy } from '../../shared/decorators/autodestroy.decorator';
import { SelectComponent } from '../../shared/elements/select/select.component';
import { FilterRuinsByKmPipe } from '../../shared/pipes/filter-ruins-by-km.pipe';
import { ClipboardService } from '../../shared/services/clipboard.service';

@Component({
    selector: 'mho-camping',
    templateUrl: './camping.component.html',
    styleUrls: ['./camping.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [MatCardModule, MatButtonModule, MatTooltipModule, MatIconModule, NgIf, FormsModule, ReactiveFormsModule, NgTemplateOutlet, MatFormFieldModule, SelectComponent, MatCheckboxModule, NgOptimizedImage, MatInputModule, MatDividerModule, MatButtonToggleModule, DecimalPipe, FilterRuinsByKmPipe]
})
export class CampingComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    public ruins: Ruin[] = [];
    public and_amelio: boolean = true;

    public town_types: TownType[] = [
        { id: 'RNE', label: $localize`Petite carte`, bonus: 0 },
        { id: 'RE', label: $localize`Région éloignée`, bonus: 0 },
        { id: 'PANDE', label: $localize`Pandémonium`, bonus: 0 }
    ];

    public bonus!: CampingBonus;

    public configuration_form!: UntypedFormGroup;
    // public configuration_form!: ModelFormGroup<CampingParameters>;
    public camping_result: CampingResult = {
        label: '',
        chances: 0,
    };
    /** Le dossier dans lequel sont stockées les images */
    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    public readonly locale: string = moment.locale();
    public readonly help_ruins: string = $localize`La liste est impactée par la distance choisie`;
    public readonly help_amelio: string = $localize`Il faut en soustraire 3 après chaque attaque`;

    public readonly camping_results: CampingResult[] = [
        {
            chances: 10,
            strict: false,
            label: $localize`Vous estimez que vos chances de survie ici sont quasi nulles… Autant gober du cyanure tout de suite.`,
        },
        {
            chances: 30,
            strict: false,
            label: $localize`Vous estimez que vos chances de survie ici sont très faibles. Peut-être que vous aimez jouer à pile ou face ?`,
        },
        {
            chances: 50,
            strict: false,
            label: $localize`Vous estimez que vos chances de survie ici sont faibles. Difficile à dire.`,
        },
        {
            chances: 65,
            strict: false,
            label: $localize`Vous estimez que vos chances de survie ici sont limitées, bien que ça puisse se tenter. Mais un accident est vite arrivé...`,
        },
        {
            chances: 80,
            strict: false,
            label: $localize`Vous estimez que vos chances de survie ici sont à peu près satisfaisantes, pour peu qu'aucun imprévu ne vous tombe dessus.`,
        },
        {
            chances: 90,
            strict: false,
            label: $localize`Vous estimez que vos chances de survie ici sont correctes : il ne vous reste plus qu'à croiser les doigts !`,
        },
        {
            chances: 100,
            strict: true,
            label: $localize`Vous estimez que vos chances de survie ici sont élevées : vous devriez pouvoir passer la nuit ici.`,
        },
        {
            chances: 100,
            strict: false,
            label: $localize`Vous estimez que vos chances de survie ici sont optimales : personne ne vous verrait même en vous pointant du doigt.`,
        },
    ];
    public readonly jobs: JobEnum[] = JobEnum.getAllValues();
    public readonly JOB_SCOUT: JobEnum = JobEnum.SCOUT;

    private readonly no_ruin: Ruin = new Ruin(NO_RUIN);

    @AutoDestroy private destroy_sub: Subject<void> = new Subject();


    constructor(private api: ApiService, private fb: UntypedFormBuilder, private route: ActivatedRoute, private clipboard: ClipboardService,
                private router: Router, private activated_route: ActivatedRoute, private location: Location, @Inject(DOCUMENT) private document: Document,
                private camping_service: CampingService) {
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

                                this.no_ruin.camping = this.bonus.desert_bonus;
                                this.ruins = [this.no_ruin].concat([...ruins]);
                                const pande_town: TownType = <TownType>this.town_types.find((town_type: TownType) => town_type.id === 'PANDE');
                                pande_town.bonus = this.bonus.pande;

                                const init_form: Record<string, unknown> | undefined = this.convertEasyReadableToForm(params);

                                this.configuration_form = this.fb.group(init_form ? init_form : {
                                    town: [<TownType>this.town_types.find((town_type: TownType) => town_type.id === 'RNE')],
                                    job: [<JobEnum>this.jobs.find((job: JobEnum) => job.value.id === 'citizen')],
                                    distance: [1],
                                    campings: [0],
                                    pro: [false],
                                    hidden_campers: [0],
                                    objects: [0],
                                    vest: [false],
                                    tomb: [false],
                                    zombies: [0],
                                    night: [false],
                                    devastated: [false],
                                    phare: [false],
                                    improve: [0],
                                    object_improve: [0],
                                    complete_improve: [0],
                                    ruin: [this.no_ruin],
                                    bury_count: [0],
                                });
                                this.calculateCamping();

                                this.configuration_form.valueChanges
                                    .pipe(takeUntil(this.destroy_sub))
                                    .subscribe(() => {
                                        this.calculateCamping();
                                    });

                                const url: string = this.router.createUrlTree([], { relativeTo: this.activated_route }).toString();
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
            return `<small>Bonus : ${ruin.camping}%</small>`;
        }
    }

    public getMoreTownTypeInfo(town_type: string | TownType): string {
        if (typeof town_type === 'string') {
            return town_type;
        } else {
            return `<small>Bonus : ${town_type.bonus}%</small>`;
        }
    }

    public calculateCrowdChance(value: number): number {
        return this.bonus.crowd_chances[Math.min(this.bonus.crowd_chances.length - 1, Math.max(0, value - 1))];
    }

    public calculateDistanceChance(value: number): number {
        return this.bonus.dist_chances[Math.min(this.bonus.dist_chances.length - 1, value)];
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
        const complete_improve: number = this.configuration_form.get('complete_improve')?.value ?? 0;
        for (let i: number = 0; i <= Math.floor(complete_improve); i += this.bonus.improve) {
            const tested_improve_objects: number = (complete_improve - i) / this.bonus.object_improve;
            if (Number.isInteger(tested_improve_objects)) return { improve: tested_improve_objects - i, improve_objects: tested_improve_objects };
        }
        return { improve: complete_improve, improve_objects: 0 };
    }

    private calculateCamping(): void {
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
                total_improve = +this.configuration_form.get('improve')?.value ?? 0;

                /**
                 * Nombre d'objets de défense installés sur la case
                 * @see ActionDataService.php : 'cm_campsite_improve'
                 */
                total_object_improve = +this.configuration_form.get('object_improve')?.value ?? 0;
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
        this.camping_service.calculateCamping(camping_parameters).subscribe((chance: number) => {
            this.camping_result.chances = chance;
            this.camping_result.label = <string>this.camping_results.find((camping_result: CampingResult) => {
                return camping_result.strict
                    ? <number>this.camping_result.chances < camping_result.chances
                    : <number>this.camping_result.chances <= camping_result.chances;
            })?.label;
        });
    }
}

interface TownType {
    id: TownTypeId;
    label: string;
    bonus: number;
}

interface CampingResult {
    label: string;
    strict?: boolean;
    chances: number
}

export type ModelFormGroup<T> = FormGroup<{
    [K in keyof T]: FormControl<T[K]>;
}>;
