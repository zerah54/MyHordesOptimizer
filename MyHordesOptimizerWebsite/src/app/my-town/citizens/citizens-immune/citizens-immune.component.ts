import { CommonModule } from '@angular/common';
import { Component, HostBinding, inject, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTable, MatTableModule } from '@angular/material/table';
import moment from 'moment';
import { Subject, takeUntil } from 'rxjs';
import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { JobEnum } from '../../../_abstract_model/enum/job.enum';
import { TownService } from '../../../_abstract_model/services/town.service';
import { Imports } from '../../../_abstract_model/types/_types';
import { CitizenInfo } from '../../../_abstract_model/types/citizen-info.class';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { AutoDestroy } from '../../../shared/decorators/autodestroy.decorator';
import { CitizenInfoComponent } from '../../../shared/elements/citizen-info/citizen-info.component';
import { SelectComponent } from '../../../shared/elements/select/select.component';
import { CitizenGroupByImmuneStatePipe } from './citizen-group-by-immune-state.pipe';

const angular_common: Imports = [CommonModule, FormsModule];
const components: Imports = [CitizenInfoComponent, SelectComponent];
const pipes: Imports = [CitizenGroupByImmuneStatePipe];
const material_modules: Imports = [MatCheckboxModule, MatDividerModule, MatFormFieldModule, MatSortModule, MatTableModule];

@Component({
    selector: 'mho-citizens-immune',
    templateUrl: './citizens-immune.component.html',
    styleUrls: ['./citizens-immune.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class CitizensImmuneComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild(MatTable) table!: MatTable<Citizen>;

    /** La liste des citoyens */
    public citizen_info!: CitizenInfo;
    /** La liste filtrée des citoyens */
    public filtered_citizen!: Citizen[];
    /** La liste des métiers des citoyens */
    public all_citizens_job!: JobEnum[];
    /** Le dossier dans lequel sont stockées les images */
    public HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** La locale */
    public readonly locale: string = moment.locale();

    protected filters: CitizenImmuneFilters = {
        jobs: []
    };

    private town_service: TownService = inject(TownService);

    @AutoDestroy private destroy_sub: Subject<void> = new Subject();

    public ngOnInit(): void {
        this.getCitizens();
    }

    public changeFilters(): void {
        this.filtered_citizen = [...this.citizen_info.citizens]
            .filter((citizen: Citizen) => {
                if (this.filters.jobs.length > 0 && !this.filters.jobs.some((job: JobEnum) => job?.key === citizen.job?.key)) return false;
                return true;
            });
    }

    private getCitizens(): void {
        this.town_service
            .getCitizens()
            .pipe(takeUntil(this.destroy_sub))
            .subscribe({
                next: (citizen_info: CitizenInfo) => {
                    this.citizen_info = citizen_info;
                    this.all_citizens_job = (JobEnum.getAllValues<JobEnum>())
                        .filter((job_enum: JobEnum) => this.citizen_info.citizens.some((citizen: Citizen): boolean => citizen.job?.key === job_enum?.key));
                    this.changeFilters();

                }
            });
    }

}

interface CitizenImmuneFilters {
    jobs: JobEnum[];
}
