import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    DestroyRef,
    effect,
    inject,
    OnInit,
    Signal,
    signal,
    viewChild,
    WritableSignal
} from '@angular/core';
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
import { TypedCellDefDirective } from '../../../_core/directives/typed-cell-def.directive';
import { ColumnIdPipe } from '../../../_core/pipes/column-id.pipe';
import { TownContextService } from '../../../_core/services/town-context.service';
import { getTown } from '../../../_core/utilities/localstorage.util';
import { AvatarComponent } from '../../../_shared/avatar/avatar.component';
import { CompactToggleComponent } from '../../../_shared/compact-toggle/compact-toggle.component';

const angular_common: Imports = [CommonModule, FormsModule];
const components: Imports = [AvatarComponent, CompactToggleComponent];
const directives: Imports = [TypedCellDefDirective];
const pipes: Imports = [ColumnIdPipe];
const material_modules: Imports = [MatCheckboxModule, MatSortModule, MatTableModule];

@Component({
    selector: 'mho-citizens-daily-actions',
    templateUrl: './citizens-daily-actions.component.html',
    styleUrls: ['./citizens-daily-actions.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...components, ...directives, ...material_modules, ...pipes]
})
export class CitizensDailyActionsComponent implements OnInit {

    private readonly sort: Signal<MatSort | undefined> = viewChild(MatSort);
    public readonly table: Signal<MatTable<Citizen> | undefined> = viewChild(MatTable);

    /** Signal : réassigné depuis le subscribe de getCitizens() et lu par le template (gate du tableau). */
    protected readonly citizen_info: WritableSignal<CitizenInfo | undefined> = signal(undefined);
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
    private readonly change_detector_ref: ChangeDetectorRef = inject(ChangeDetectorRef);

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
                        // Le citoyen muté reste la même référence dans datasource.data : CdkTable met
                        // en cache ses wrappers de ligne par référence de donnée et les réutilise tels
                        // quels (voir citizens-list.component.ts::refreshCitizenLists pour le détail
                        // vérifié dans @angular/cdk/fesm2022/table.mjs) — réassigner `datasource.data`
                        // avec les mêmes références ne déclenche donc rien. `markForCheck()` sur CE
                        // composant ne marque pas non plus `CdkTable` (un descendant, jamais atteint).
                        // Seul `detectChanges()` force la revérification de la cellule compact-toggle
                        // pour un citoyen qui n'est pas "moi".
                        this.change_detector_ref.detectChanges();
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
                        this.change_detector_ref.detectChanges();
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
                    this.citizen_info.set(citizen_info);
                    this.datasource.data = [...citizen_info.citizens];
                }
            });
    }
}
