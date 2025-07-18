import { CommonModule } from '@angular/common';
import { Component, Input, ViewEncapsulation, InputSignal, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import moment, { Moment } from 'moment';
import { HORDES_IMG_REPO } from '../../../../_abstract_model/const';
import { JobEnum } from '../../../../_abstract_model/enum/job.enum';
import { DisplayPseudoMode, Entry } from '../../../../_abstract_model/interfaces';
import { Imports } from '../../../../_abstract_model/types/_types';
import { CitizenInfo } from '../../../../_abstract_model/types/citizen-info.class';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { Dig } from '../../../../_abstract_model/types/dig.class';
import { DigComponent } from '../../../../shared/elements/dig/dig.component';
import { SelectComponent } from '../../../../shared/elements/select/select.component';
import { getTown } from '../../../../shared/utilities/localstorage.util';
import { CitizenForDigPipe, CitizenNotInDigListPipe } from './citizen-for-dig.pipe';

const angular_common: Imports = [CommonModule, FormsModule];
const components: Imports = [DigComponent, SelectComponent];
const pipes: Imports = [CitizenForDigPipe, CitizenNotInDigListPipe];
const material_modules: Imports = [MatFormFieldModule];

@Component({
    selector: 'mho-registry-digs',
    templateUrl: './digs-registry.component.html',
    styleUrls: ['./digs-registry.component.scss'],
    encapsulation: ViewEncapsulation.None,
    host: {style: 'display: contents'},
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class DigsRegistryComponent {

    public completeCitizenList: InputSignal<CitizenInfo> = input.required();
    public displayPseudo: InputSignal<DisplayPseudoMode> = input.required();

    @Input({required: true}) set registry(registry: Entry[] | undefined) {
        this.current_day = getTown()?.day || 1;

        if (registry) {

            const arrivals: Entry[] = registry
                .filter((entry: Entry) => this.arrival_keywords.some((arrival: string): boolean => entry.entry.indexOf(' ' + arrival) > -1));

            /** On ne garde que les citoyens qui ont au moins un log sur la case */
            const citizen_list: Citizen[] = this.completeCitizenList().citizens.filter((citizen: Citizen) => {
                return registry.some((entry: Entry): boolean => entry.entry.indexOf(citizen.name) > -1);
            });

            const now: Moment = moment();

            this.digs = citizen_list
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
                    dig.day = this.current_day;
                    dig.nb_total_dig = nb_digs;
                    dig.digger_id = citizen.id;
                    dig.digger_name = citizen.name;
                    dig.x = 0;
                    dig.y = 0;
                    dig.nb_success = nb_digs - failed_digs;

                    return dig;
                });
        } else {
            this.digs = [];
            this.entries = [];
        }
    }

    protected entries: Entry[] = [];
    protected digs: Dig[] = [];
    protected current_day!: number;

    /** La locale */
    protected readonly locale: string = moment.locale();

    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;

    protected readonly arrival_keywords: string[] = ['est arrivé depuis', 'angekommen', 'has arrived from the', 'ha llegado desde el'];
    protected readonly failed_digs_keywords: string[] = ['rien trouvé...', 'durch Graben nichts gefunden...', 'found nothing during their last search...', 'no encontró nada...'];

    protected addCitizen(citizen: Citizen): void {
        const new_dig: Dig = new Dig();
        new_dig.day = this.current_day;
        new_dig.nb_total_dig = 1;
        new_dig.digger_id = citizen.id;
        new_dig.digger_name = citizen.name;
        new_dig.x = 0;
        new_dig.y = 0;
        new_dig.nb_success = 0;
        this.digs.push(new_dig);
    }
}
