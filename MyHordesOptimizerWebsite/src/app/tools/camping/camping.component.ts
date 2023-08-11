import { DOCUMENT, Location } from '@angular/common';
import { Component, HostBinding, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { Subject, takeUntil } from 'rxjs';
import { CAMPING_BONUS, CAMPINGS_MAP, DISTANCE_MAP, HIDDEN_CAMPERS_MAP, HORDES_IMG_REPO, NO_RUIN } from '../../_abstract_model/const';
import { Ruin } from '../../_abstract_model/types/ruin.class';
import { Dictionary } from '../../_abstract_model/types/_types';
import { AutoDestroy } from '../../shared/decorators/autodestroy.decorator';
import { dtoToModelArray } from '../../_abstract_model/types/_common.class';
import { JobEnum } from '../../_abstract_model/enum/job.enum';
import { ApiServices } from '../../_abstract_model/services/api.services';
import { ClipboardService } from '../../shared/services/clipboard.service';

@Component({
    selector: 'mho-camping',
    templateUrl: './camping.component.html',
    styleUrls: ['./camping.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class CampingComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    public ruins: Ruin[] = [];
    public and_amelio: boolean = true;

    public town_types: TownType[] = [
        {id: 'rne', label: $localize`Petite carte`, bonus: 0},
        {id: 're', label: $localize`Région éloignée`, bonus: 0},
        {id: 'pande', label: $localize`Pandémonium`, bonus: -14}
    ];

    public bonus: Record<string, number> = CAMPING_BONUS;
    public distance: Dictionary<number> = DISTANCE_MAP;
    public hidden_campers: Dictionary<number> = HIDDEN_CAMPERS_MAP;
    public campings: Dictionary<Dictionary<Dictionary<number>>> = CAMPINGS_MAP;

    public configuration_form!: UntypedFormGroup;
    public camping_result: CampingResult = {
        label: '',
        chances: 0,
        probability: 0
    };
    /** Le dossier dans lequel sont stockées les images */
    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    public readonly locale: string = moment.locale();
    public readonly help_ruins: string = $localize`La liste est impactée par la distance choisie`;
    public readonly help_amelio: string = $localize`Il faut en soustraire 3 après chaque attaque`;

    public readonly camping_results: CampingResult[] = [
        {
            probability: 0.1,
            strict: false,
            label: $localize`Vous estimez que vos chances de survie ici sont quasi nulles… Autant gober du cyanure tout de suite.`,
        },
        {
            probability: 0.3,
            strict: false,
            label: $localize`Vous estimez que vos chances de survie ici sont très faibles. Peut-être que vous aimez jouer à pile ou face ?`,
        },
        {
            probability: 0.5,
            strict: false,
            label: $localize`Vous estimez que vos chances de survie ici sont faibles. Difficile à dire.`,
        },
        {
            probability: 0.65,
            strict: false,
            label: $localize`Vous estimez que vos chances de survie ici sont limitées, bien que ça puisse se tenter. Mais un accident est vite arrivé...`,
        },
        {
            probability: 0.8,
            strict: false,
            label: $localize`Vous estimez que vos chances de survie ici sont à peu près satisfaisantes, pour peu qu'aucun imprévu ne vous tombe dessus.`,
        },
        {
            probability: 0.9,
            strict: false,
            label: $localize`Vous estimez que vos chances de survie ici sont correctes : il ne vous reste plus qu'à croiser les doigts !`,
        },
        {
            probability: 1,
            strict: true,
            label: $localize`Vous estimez que vos chances de survie ici sont élevées : vous devriez pouvoir passer la nuit ici.`,
        },
        {
            probability: 1,
            strict: false,
            label: $localize`Vous estimez que vos chances de survie ici sont optimales : personne ne vous verrait même en vous pointant du doigt.`,
        },
    ];
    public readonly jobs: JobEnum[] = JobEnum.getAllValues();
    public readonly JOB_SCOUT: JobEnum = JobEnum.SCOUT;

    private readonly added_ruins: Ruin[] = dtoToModelArray(Ruin, [NO_RUIN]);

    @AutoDestroy private destroy_sub: Subject<void> = new Subject();


    constructor(private api: ApiServices, private fb: UntypedFormBuilder, private route: ActivatedRoute, private clipboard: ClipboardService, private router: Router,
                private activated_route: ActivatedRoute, private location: Location, @Inject(DOCUMENT) private document: Document) {
    }

    public ngOnInit(): void {
        this.route.queryParams
            .pipe(takeUntil(this.destroy_sub))
            .subscribe((params: Record<string, string>) => {
                this.api.getRuins()
                    .pipe(takeUntil(this.destroy_sub))
                    .subscribe((ruins: Ruin[]) => {
                        ruins = ruins.sort((ruin_a: Ruin, ruin_b: Ruin) => ruin_a.label[this.locale].toLocaleLowerCase().localeCompare(ruin_b.label[this.locale].toLocaleLowerCase()));
                        this.ruins = [...this.added_ruins].concat([...ruins]);

                        const init_form: Record<string, unknown> | undefined = this.convertEasyReadableToForm(params);

                        this.configuration_form = this.fb.group(init_form ? init_form : {
                            town: [<TownType>this.town_types.find((town_type: TownType) => town_type.id === 'rne')],
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
                            ruin: [this.added_ruins[0]]
                        });
                        this.calculateProbabilities();
                        this.configuration_form.valueChanges
                            .pipe(takeUntil(this.destroy_sub))
                            .subscribe(() => this.calculateProbabilities());

                        const url: string = this.router.createUrlTree([], {relativeTo: this.activated_route}).toString();
                        this.location.go(url);
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
            return `<small>Bonus : ${ruin.camping}</small>`;
        }
    }

    public getMoreTownTypeInfo(town_type: string | TownType): string {
        if (typeof town_type === 'string') {
            return town_type;
        } else {
            return `<small>Bonus : ${town_type.bonus}</small>`;
        }
    }

    private calculateProbabilities(): void {
        let chances: number = 0;
        /** Type de ville */
        chances += (<TownType>this.configuration_form.get('town')?.value)?.bonus * 100;
        /** Tombe creusée */
        chances += this.configuration_form.get('tomb')?.value ? this.bonus['tomb'] * 100 : 0;
        /** Mode nuit */
        chances += this.configuration_form.get('night')?.value ? this.bonus['night'] * 100 : 0;
        /** Ville devastée */
        chances += this.configuration_form.get('devastated')?.value ? this.bonus['devastated'] * 100 : 0;
        /** Phare */
        chances += this.configuration_form.get('phare')?.value ? this.bonus['phare'] * 100 : 0;
        /** Zombies dans la zone */
        const zombies_factor: number = this.configuration_form.get('vest')?.value ? this.bonus['zombie_with_vest'] : this.bonus['zombie_without_vest'];
        chances += zombies_factor * 100 * this.configuration_form.get('zombies')?.value;

        /** Nombre de campings */
        const nb_camping_town_type_mapping: Dictionary<Dictionary<number>> = (<TownType>this.configuration_form.get('town')?.value)?.id === 'pande' ? this.campings['pande'] : this.campings['normal'];
        const nb_camping_mapping: Dictionary<number> = this.configuration_form.get('pro')?.value ? nb_camping_town_type_mapping['pro'] : nb_camping_town_type_mapping['nonpro'];
        chances += (this.configuration_form.get('campings')?.value > 9 ? nb_camping_mapping[9] : nb_camping_mapping[this.configuration_form.get('campings')?.value]) * 100;

        /** Distance de la ville */
        chances += (this.configuration_form.get('distance')?.value > 16 ? this.distance[16] : this.distance[this.configuration_form.get('distance')?.value]) * 100;

        /** Nombre de personnes déjà cachées */
        chances += (this.configuration_form.get('hidden_campers')?.value > 7 ? this.hidden_campers[7] : this.hidden_campers[this.configuration_form.get('hidden_campers')?.value]) * 100;

        /** Nombre d'objets de protection dans l'inventaire */
        chances += +this.configuration_form.get('objects')?.value * this.bonus['camping_objects_in_inventory'] * 100;

        if (this.and_amelio) {
            /** Nombre total d'améliorations sur la case */
            chances += +this.configuration_form.get('complete_improve')?.value * 100;

            /**
             * Nombre d'améliorations simples sur la case
             * @see ActionDataService.php : 'improve'
             */
            chances += +this.configuration_form.get('improve')?.value * this.bonus['simple_amelio'] * 100;

            /**
             * Nombre d'objets de défense installés sur la case
             * @see ActionDataService.php ('cm_campsite_improve')
             */
            chances += +this.configuration_form.get('object_improve')?.value * this.bonus['OD_amelio'] * 100;
        } else {
            if (+this.configuration_form.get('complete_improve')?.value > 0) {
                /** Nombre total d'améliorations sur la case */
                chances += +this.configuration_form.get('complete_improve')?.value * 100;
            } else {
                /**
                 * Nombre d'améliorations simples sur la case
                 * @see ActionDataService.php : 'improve'
                 */
                chances += +this.configuration_form.get('improve')?.value * this.bonus['simple_amelio'] * 100;

                /**
                 * Nombre d'objets de défense installés sur la case
                 * @see ActionDataService.php : 'cm_campsite_improve'
                 */
                chances += +this.configuration_form.get('object_improve')?.value * this.bonus['OD_amelio'] * 100;
            }
        }
        /**
         * Bonus liés au bâtiment
         * @see RuinDataService.php
         */
        chances += (<Ruin>this.configuration_form.get('ruin')?.value)?.camping * 100 || 0;

        this.camping_result.chances = chances;
        this.camping_result.probability = Math.min(Math.max((100 - (Math.abs(Math.min(0, chances)) * 5 / 100)) / 100, 0.1), ((<JobEnum>this.configuration_form.get('job')?.value)?.value.camping_factor));
        this.camping_result.label = <string>this.camping_results.find((camping_result: CampingResult) => {
            return camping_result.strict
                ? <number>this.camping_result.probability < camping_result.probability
                : <number>this.camping_result.probability <= camping_result.probability;
        })?.label;
    }

    private convertFormToEasyReadable(): string {
        let url_string: string = '';
        for (const key in this.configuration_form.value) {
            const element: string | number | boolean | TownType | JobEnum = this.configuration_form.value[key];
            if (element !== null && element !== undefined && element !== '') {
                if (typeof element === 'string' || typeof element === 'number' || typeof element === 'boolean') {
                    url_string += `&${key}=${element.toString()}`;
                } else {
                    console.log('element', element);
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
}

interface TownType {
    id: string;
    label: string;
    bonus: number;
}

interface CampingResult {
    label: string;
    probability: number;
    strict?: boolean;
    chances?: number
}
