import { Component, HostBinding, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { CitizenInfo } from '../../_abstract_model/types/citizen-info.class';
import { AutoDestroy } from '../../shared/decorators/autodestroy.decorator';
import { ApiServices } from '../../_abstract_model/services/api.services';

@Component({
    selector: 'mho-citizens',
    templateUrl: './citizens.component.html',
    styleUrls: ['./citizens.component.scss']
})
export class CitizensComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    public citizen_info!: CitizenInfo;

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
                this.citizen_info = citizen_info;
            });
    }
}


