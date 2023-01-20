import { Component, HostBinding, OnInit } from '@angular/core';
import { ApiServices } from 'src/app/_abstract_model/services/api.services';
import { CitizenInfo } from 'src/app/_abstract_model/types/citizen-info.class';

@Component({
    selector: 'mho-citizens',
    templateUrl: './citizens.component.html',
    styleUrls: ['./citizens.component.scss']
})
export class CitizensComponent implements OnInit {
    @HostBinding('style.display') display: string = 'contents';

    public citizen_info!: CitizenInfo;

    constructor(private api: ApiServices) {

    }

    public ngOnInit(): void {
        this.getCitizens();
    }

    public getCitizens(): void {
        this.api.getCitizens().subscribe((citizen_info: CitizenInfo) => {
            this.citizen_info = citizen_info;
        });
    }
}


