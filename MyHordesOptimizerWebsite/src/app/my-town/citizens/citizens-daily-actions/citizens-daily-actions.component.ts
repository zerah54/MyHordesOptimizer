import { CommonModule } from '@angular/common';
import { Component, DestroyRef, effect, inject, OnInit, Signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import moment from 'moment';

import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { DailyActionEnum } from '../../../_abstract_model/enum/daily-action.enum';
import { StandardColumn } from '../../../_abstract_model/interfaces';
import { TownService } from '../../../_abstract_model/services/town.service';
import { Imports } from '../../../_abstract_model/types/_types';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { CitizenInfo } from '../../../_abstract_model/types/citizen-info.class';
import { DailyAction } from '../../../_abstract_model/types/daily-action.class';
import { ColumnIdPipe } from '../../../_core/pipes/column-id.pipe';
import { TownContextService } from '../../../_core/services/town-context.service';
import { getTown } from '../../../_core/utilities/localstorage.util';
import { AvatarComponent } from '../../../_shared/avatar/avatar.component';
import { CompactToggleComponent } from '../../../_shared/compact-toggle/compact-toggle.component';

const angular_common: Imports = [CommonModule, FormsModule];
const components: Imports = [AvatarComponent, CompactToggleComponent];
const pipes: Imports = [ColumnIdPipe];
const material_modules: Imports = [MatCheckboxModule, MatSortModule, MatTableModule];

@Component({
    selector: 'mho-citizens-daily-actions',
    templateUrl: './citizens-daily-actions.component.html',
    styleUrls: ['./citizens-daily-actions.component.scss'],
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class CitizensDailyActionsComponent implements OnInit {

    private readonly sort: Signal<MatSort | undefined> = viewChild(MatSort);
    public readonly table: Signal<MatTable<Citizen> | undefined> = viewChild(MatTable);

    protected citizen_info!: CitizenInfo;
    protected datasource: MatTableDataSource<Citizen> = new MatTableDataSource();
    public readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    public readonly locale: string = moment.locale();
    protected readonly is_readonly: Signal<boolean> = inject(TownContextService).isReadonly;
    protected readonly daily_action_keys: DailyActionEnum[] = DailyActionEnum.getAllValues<DailyActionEnum>();
    protected readonly columns: StandardColumn[] = [
        { id: 'avatar_name', header: $localize`Citoyen`, class: 'center', sticky: true },
        ...Array.from({ length: getTown()?.day || 1 }, (_: unknown, i: number): StandardColumn => {
            return {
                id: (i + 1).toString(10),
                header: $localize`Jour` + ' ' + (i + 1).toString(10),
                class: '',
                sticky: false
            };
        }),
    ];

    private readonly town_service: TownService = inject(TownService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);

    public constructor() {
        // Le tableau (donc MatSort) n'existe qu'une fois citizen_info chargé (@if côté template) :
        // le viewChild ne se résout qu'à ce moment-là, jamais de façon synchrone dans ngOnInit.
        effect((): void => {
            const sort: MatSort | undefined = this.sort();
            if (sort) this.datasource.sort = sort;
        });
    }

    public ngOnInit(): void {
        this.datasource = new MatTableDataSource();
        this.getCitizens();
    }

    /** L'action donnée a-t-elle été faite par ce citoyen le jour donné ? */
    protected isDailyActionDone(citizen: Citizen, actionKey: string, day: number): boolean {
        return citizen.daily_actions.some((action: DailyAction) => action.day === day && action.action_key === actionKey && !!action.update_info);
    }

    /** Prend ou retire une action quotidienne pour un citoyen et un jour donnés. */
    protected saveDailyAction(citizen: Citizen, actionKey: string, checked: boolean, day: number): void {
        if (checked) {
            this.town_service
                .addDailyAction(citizen, actionKey, day)
                .pipe(takeUntilDestroyed(this.destroy_ref))
                .subscribe({
                    next: () => {
                        citizen.daily_actions.push(new DailyAction({
                            day, actionKey,
                            lastUpdateInfo: { updateTime: new Date(), userId: '', userName: '', userKey: '' }
                        }));
                    }
                });
        } else {
            this.town_service
                .removeDailyAction(citizen, actionKey, day)
                .pipe(takeUntilDestroyed(this.destroy_ref))
                .subscribe({
                    next: () => {
                        const index: number = citizen.daily_actions.findIndex((action: DailyAction) => action.day === day && action.action_key === actionKey);
                        if (index > -1) citizen.daily_actions.splice(index, 1);
                    }
                });
        }
    }

    private getCitizens(): void {
        this.town_service
            .getCitizens()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe({
                next: (citizen_info: CitizenInfo) => {
                    this.citizen_info = citizen_info;
                    this.datasource.data = [...citizen_info.citizens];
                }
            });
    }
}
