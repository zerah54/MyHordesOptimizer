import { Clipboard } from '@angular/cdk/clipboard';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import * as moment from 'moment';
import { ApiServices } from 'src/app/_abstract_model/services/api.services';
import { dtoToModelArray } from 'src/app/_abstract_model/types/_common.class';
import { HORDES_IMG_REPO } from './../../_abstract_model/const';
import { Ruin } from './../../_abstract_model/types/ruin.class';
import { Dictionary } from './../../_abstract_model/types/_types';

@Component({
    selector: 'mho-camping',
    templateUrl: './camping.component.html',
    styleUrls: ['./camping.component.scss']
})
export class CampingComponent implements OnInit {

    public ruins: Ruin[] = [];

    public town_types: TownType[] = [
        { id: 'rne', label: $localize`Petite carte` },
        { id: 're', label: $localize`Région éloignée` },
        { id: 'pande', label: $localize`Pandémonium` }
    ]

    public configuration_form!: FormGroup;
    public camping_result: CampingResult = {
        label: '',
        probability: 0
    };
    /** Le dossier dans lequel sont stockées les images */
    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    public readonly locale: string = moment.locale();

    public readonly camping_results: any[] = [
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
    public readonly jobs: Job[] = [
        {
            id: 'citizen',
            img: 'basic',
            label: $localize`Habitant`,
            camping_factor: 0.9
        },
        {
            id: 'scavenger',
            img: 'dig',
            label: $localize`Fouineur`,
            camping_factor: 0.9
        },
        {
            id: 'scout',
            img: 'vest',
            label: $localize`Éclaireur`,
            camping_factor: 0.9
        },
        {
            id: 'guardian',
            img: 'shield',
            label: $localize`Gardien`,
            camping_factor: 0.9
        },
        {
            id: 'survivalist',
            img: 'book',
            label: $localize`Ermite`,
            camping_factor: 1
        },
        {
            id: 'tamer',
            img: 'tamer',
            label: $localize`Apprivoiseur`,
            camping_factor: 0.9
        },
        {
            id: 'technician',
            img: 'tech',
            label: $localize`Technicien`,
            camping_factor: 0.9
        },
    ];

    private readonly added_ruins: Ruin[] = dtoToModelArray(Ruin, [
        {
            id: '', camping: 0, label: { en: `None`, fr: 'Aucun', de: `Kein`, es: `TODO` }, chance: 0, description: { en: ``, fr: ``, de: ``, es: `` },
            explorable: false, img: '', minDist: 0, maxDist: 0, drops: []
        },
        {
            id: 'nondig', camping: 8, label: { en: `Buried building`, fr: 'Bâtiment non déterré', de: `Verschüttete Ruine`, es: `Sector inexplotable` },
            chance: 0, description: { en: ``, fr: ``, de: ``, es: `` }, explorable: false, img: '', minDist: 0, maxDist: 0, drops: []
        }
    ]);

    /** @see CitizenHandler > getCampingValues > $distance_map */
    private readonly distance_map: Dictionary<number> = {
        1: -24,
        2: -19,
        3: -14,
        4: -11,
        5: -9,
        6: -9,
        7: -9,
        8: -9,
        9: -9,
        10: -9,
        11: -9,
        12: -8,
        13: -7.6,
        14: -7,
        15: -6,
        16: -5 // 16 et +
    }


    /** @see CitizenHandler > getCampingValues > $campings_map */
    private readonly campings_map: Dictionary<Dictionary<Dictionary<number>>> = {
        normal: {
            nonpro: {
                0: 0,
                1: -4,
                2: -9,
                3: -13,
                4: -16,
                5: -26,
                6: -36,
                7: -50, // Totally arbitrary
                8: -65, // Totally arbitrary
                9: -80 // Totally arbitrary // 9 et +
            },
            pro: {
                0: 0,
                1: -2,
                2: -4,
                3: -8,
                4: -10,
                5: -12,
                6: -16,
                7: -26,
                8: -36,
                9: -60 // Totally arbitrary // 9 et +
            }
        },
        pande: {
            nonpro: {
                0: 0,
                1: -4,
                2: -6,
                3: -8,
                4: -10,
                5: -20,
                6: -36,
                7: -50,
                8: -65,
                9: -80 // 9 et +
            },
            pro: {
                0: 0,
                1: -1,
                2: -2,
                3: -4,
                4: -6,
                5: -8,
                6: -10,
                7: -20,
                8: -36,
                9: -60 // 9 et +
            }
        },
    };

    /** @see CitizenHandler > getCampingValues > $campers_map */
    private readonly hidden_campers_map: Dictionary<number> = {
        0: 0,
        1: 0,
        2: -2,
        3: -6,
        4: -10,
        5: -14,
        6: -20,
        7: -26
    };


    constructor(private api: ApiServices, private fb: FormBuilder, private route: ActivatedRoute, private clipboard: Clipboard, private router: Router) {
    }

    public ngOnInit(): void {
        this.route.queryParams.subscribe((params: Record<string, string>) => {
            const init_form: Record<string, unknown> | undefined = this.convertEasyReadableToForm(params);

            this.api.getRuins().subscribe((ruins: Ruin[]) => {
                this.ruins = [...this.added_ruins].concat([...ruins]);


                this.configuration_form = this.fb.group(init_form ? init_form : {
                    town: [<TownType>this.town_types.find((town_type: TownType) => town_type.id === 'rne')],
                    job: [<Job>this.jobs.find((job: Job) => job.id === 'citizen')],
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
                    ruin: [this.added_ruins[0]]
                });

                this.configuration_form.valueChanges.subscribe(() => this.calculateProbabilities())

                this.router.navigate(
                    [],
                    {
                        relativeTo: this.route,
                        queryParams: {},
                        replaceUrl: true
                    }
                );

            });
        });
    }

    public shareCamping(): void {
        let url: string = window.location.href;
        console.log('sharecamping', url);
        url += '?' + this.convertFormToEasyReadable();
        this.clipboard.copy(url);
    }

    private calculateProbabilities(): void {
        let chances = 0;
        /** Type de ville */
        chances += (<TownType>this.configuration_form.get('town')?.value)?.id === 'pande' ? -14 : 0;
        /** Tombe creusée */
        chances += this.configuration_form.get('tomb')?.value ? 1.6 : 0;
        /** Mode nuit */
        chances += this.configuration_form.get('night')?.value ? 2 : 0;
        /** Ville devastée */
        chances += this.configuration_form.get('devastated')?.value ? -10 : 0;
        /** Phare */
        chances += this.configuration_form.get('phare')?.value ? 5 : 0;
        /** Zombies dans la zone */
        let zombies_factor = this.configuration_form.get('vest') ? 0.6 : 1.4;
        chances += -zombies_factor * this.configuration_form.get('zombies')?.value;

        /** Nombre de campings */
        let nb_camping_town_type_mapping = (<TownType>this.configuration_form.get('town')?.value)?.id === 'pande' ? this.campings_map['pande'] : this.campings_map['normal'];
        let nb_camping_mapping = this.configuration_form.get('pro')?.value ? nb_camping_town_type_mapping['pro'] : nb_camping_town_type_mapping['nonpro'];
        chances += (this.configuration_form.get('campings')?.value > 9 ? nb_camping_mapping[9] : nb_camping_mapping[this.configuration_form.get('campings')?.value]);

        /** Distance de la ville */
        chances += (this.configuration_form.get('distance')?.value > 16 ? this.distance_map[16] : this.distance_map[this.configuration_form.get('distance')?.value]);

        /** Nombre de personnes déjà cachées */
        chances += (this.configuration_form.get('hidden_campers')?.value > 7 ? this.hidden_campers_map[7] : this.hidden_campers_map[this.configuration_form.get('hidden_campers')?.value]);

        /** Nombre d'objets de protection dans l'inventaire */
        chances += +this.configuration_form.get('objects')?.value;

        /**
          * Nombre d'améliorations simples sur la case
          * @see ActionDataService.php : 'improve'
          */
        chances += +this.configuration_form.get('improve')?.value;

        /**
          * Nombre d'objets de défense installés sur la case
          * @see ActionDataService.php : 'cm_campsite_improve'
          */
        chances += +this.configuration_form.get('object_improve')?.value * 1.8;

        /**
          * Bonus liés au bâtiment
          * @see RuinDataService.php
          */
        chances += +(<Ruin>this.configuration_form.get('ruin')?.value)?.camping || 0;

        this.camping_result.probability = Math.min(Math.max((100.0 - (Math.abs(Math.min(0, chances)) * 5)) / 100.0, .1), ((<Job>this.configuration_form.get('job')?.value)?.camping_factor));
        this.camping_result.label = this.camping_results.find((camping_result) => camping_result.strict ? <number>this.camping_result.probability < camping_result.probability : <number>this.camping_result.probability <= camping_result.probability)?.label;
    };

    private convertFormToEasyReadable(): string {
        let url_string: string = '';
        for (const key in this.configuration_form.value) {
            const element = this.configuration_form.value[key];
            if (element) {
                console.log('element', element);
                if (typeof element === 'string' || typeof element === 'number') {
                    url_string += `&${key}=${element.toString()}`;
                } else if (typeof element === 'boolean') {
                    url_string += element ? `&${key}=true` : `&${key}=false`;
                } else {
                    url_string += `&${key}=${element.id}`;
                }
            } else {
                url_string += `&${key}=`;
            }
        }
        console.log('url_string;', url_string);
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
                    case "town":
                        init_form[key] = [this.town_types.find((town_type: TownType) => town_type.id === params[key])];
                        break;
                    case "ruin":
                        init_form[key] = [this.ruins.find((ruin: Ruin) => ruin.id === params[key])];
                        break;
                    case "job":
                        init_form[key] = [this.jobs.find((job: Job) => job.id === params[key])];
                        break;
                    default:
                        if (params[key] === "false") {
                            init_form[key] = [false];
                        } else if (params[key] === "true") {
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
}

interface CampingResult {
    label: string;
    probability: number;
    strict?: boolean;
}

interface Job {
    id: string,
    img: string,
    label: string,
    camping_factor: number
}
