import { Component, HostBinding, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ApiServices } from '../../_abstract_model/services/api.services';
import { CitizenInfo } from '../../_abstract_model/types/citizen-info.class';
import { Citizen } from '../../_abstract_model/types/citizen.class';
import { AutoDestroy } from '../../shared/decorators/autodestroy.decorator';

@Component({
    selector: 'mho-citizens',
    templateUrl: './citizens.component.html',
    styleUrls: ['./citizens.component.scss']
})
export class CitizensComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    public citizen_info!: CitizenInfo;

    public links: Link[] = [
        {
            label: $localize`Citoyens`,
            link: '/my-town/citizens/list'
        },
        {
            label: $localize`Fouilles`,
            link: '/my-town/citizens/digs'
        }
    ];

    @AutoDestroy private destroy_sub: Subject<void> = new Subject();

    constructor(private api: ApiServices) {

    }

    public ngOnInit(): void {
        this.getCitizens();
    }

    public getCitizens(): void {
        this.api.getCitizens()
            .pipe(takeUntil(this.destroy_sub))
            .subscribe((citizen_info: CitizenInfo) => {
                citizen_info.citizens = citizen_info.citizens.filter((citizen: Citizen) => !citizen.is_ghost);
                this.citizen_info = citizen_info;
            });
    }
}

interface Link {
    label: string;
    link: string;
}
