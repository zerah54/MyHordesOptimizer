import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, input, InputSignal, signal, untracked, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import moment, { Moment } from 'moment';

import { HORDES_IMG_REPO } from '../../../../_abstract_model/const';
import { JobEnum } from '../../../../_abstract_model/enum/job.enum';
import { DisplayPseudoMode, Entry } from '../../../../_abstract_model/interfaces';
import { Imports } from '../../../../_abstract_model/types/_types';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { CitizenInfo } from '../../../../_abstract_model/types/citizen-info.class';
import { Dig } from '../../../../_abstract_model/types/dig.class';
import { getTown } from '../../../../_core/utilities/localstorage.util';
import { DigComponent } from '../../../../_shared/dig/dig.component';
import { SelectComponent } from '../../../../_shared/select/select.component';
import { CitizenForDigPipe, CitizenNotInDigListPipe } from './citizen-for-dig.pipe';

const angular_common: Imports = [CommonModule, FormsModule];
const components: Imports = [DigComponent, SelectComponent];
const pipes: Imports = [CitizenForDigPipe, CitizenNotInDigListPipe];
const material_modules: Imports = [MatFormFieldModule];

@Component({
    selector: 'mho-registry-digs',
    templateUrl: './digs-registry.component.html',
    styleUrls: ['./digs-registry.component.scss'],
    imports: [...angular_common, ...components, ...material_modules, ...pipes],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DigsRegistryComponent {

    public completeCitizenList: InputSignal<CitizenInfo> = input.required();
    public displayPseudo: InputSignal<DisplayPseudoMode> = input.required();
    public registry: InputSignal<Entry[] | undefined> = input.required();

    public entries: Entry[] = [];
    protected readonly digs: WritableSignal<Dig[]> = signal([]);
    protected readonly current_day: WritableSignal<number> = signal(1);

    /** La locale */
    public readonly locale: string = moment.locale();

    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;

    private readonly arrival_keywords: string[] = ['est arrivé depuis', 'angekommen', 'has arrived from the', 'ha llegado desde el'];
    private readonly failed_digs_keywords: string[] = ['rien trouvé...', 'durch Graben nichts gefunden...', 'found nothing during their last search...', 'no encontró nada...'];

    public constructor() {
        // Reproduit l'ancien setter `@Input({required:true}) set registry` : ne réagit
        // qu'à `registry`. Le corps lit `completeCitizenList()` de façon synchrone —
        // `untracked()` empêche cette lecture de devenir une dépendance de l'effect (l'ancien
        // setter ne réagissait qu'à `registry`, même remède que plays-registry/Task 7).
        effect((): void => {
            const registry: Entry[] | undefined = this.registry();
            untracked((): void => {
                this.current_day.set(getTown()?.day || 1);

                if (registry) {

                    const arrivals: Entry[] = registry
                        .filter((entry: Entry) => this.arrival_keywords.some((arrival: string): boolean => entry.entry.indexOf(' ' + arrival) > -1));

                    /** On ne garde que les citoyens qui ont au moins un log sur la case */
                    const citizen_list: Citizen[] = this.completeCitizenList().citizens.filter((citizen: Citizen) => {
                        return registry.some((entry: Entry): boolean => entry.entry.indexOf(citizen.name) > -1);
                    });

                    const now: Moment = moment();

                    this.digs.set(citizen_list
                        .map((citizen: Citizen): Dig => {
                            const nb_minutes_for_dig: 90 | 120 = citizen.job?.key === JobEnum.SCAVENGER.key ? 90 : 120;
                            /** Les heures d'arrivée du citoyen sur la case */
                            const citizen_arrivals: Entry[] = arrivals.filter((arrival: Entry): boolean => arrival.entry.indexOf(citizen.name) > -1);
                            const citizen_last_arrival: string = citizen_arrivals[0]?.hour;

                            const failed_digs: number = registry
                                .filter((entry: Entry): boolean => this.failed_digs_keywords.some((failed_digs_keyword: string) => entry.entry.indexOf(failed_digs_keyword) > -1))
                                .filter((entry: Entry): boolean => entry.entry.indexOf(citizen.name) > -1)
                                .length;

                            let start_date: Moment;

                            if (citizen_last_arrival) {
                                /** Si le citoyen a une heure d'arrivée alors on se base sur cette heure comme heure de début de fouilles */
                                start_date = moment(citizen_last_arrival, 'H:mm');
                            } else {
                                /** Sinon, on retire arbitrairement 1h */
                                start_date = moment().subtract(1, 'hour');
                            }

                            let nb_digs: number;

                            if (start_date) {
                                const now_minutes: number = (now.hour() * 60) + now.minutes();
                                const start_date_minutes: number = (start_date.hour() * 60) + start_date.minutes();

                                /** Le nombre total de minutes passées à fouiller */
                                const nb_minutes_digging: number = now_minutes - start_date_minutes;
                                nb_digs = Math.floor(nb_minutes_digging / nb_minutes_for_dig) + 1;

                            } else {
                                nb_digs = 1;
                            }

                            const dig: Dig = new Dig();
                            dig.day = this.current_day();
                            dig.nb_total_dig = nb_digs;
                            dig.digger_id = citizen.id;
                            dig.digger_name = citizen.name;
                            dig.x = 0;
                            dig.y = 0;
                            dig.nb_success = nb_digs - failed_digs;

                            return dig;
                        }));
                } else {
                    this.digs.set([]);
                    this.entries = [];
                }
            });
        });
    }

    protected addCitizen(citizen: Citizen): void {
        const new_dig: Dig = new Dig();
        new_dig.day = this.current_day();
        new_dig.nb_total_dig = 1;
        new_dig.digger_id = citizen.id;
        new_dig.digger_name = citizen.name;
        new_dig.x = 0;
        new_dig.y = 0;
        new_dig.nb_success = 0;
        // Réassignation immuable (leçon 6) : `digs` est un signal, `.push()` en place ne
        // notifierait pas le template. Delta connu : `citizenNotInDigList` (pure pipe) était
        // mémoïsée sur la référence du tableau — l'ancien `.push()` la gardait identique (le
        // citoyen ajouté restait visible dans le select), la nouvelle référence force
        // désormais son recalcul (le citoyen ajouté disparaît immédiatement du select). Voir
        // Doutes du rapport de tâche.
        this.digs.set([...this.digs(), new_dig]);
    }
}
