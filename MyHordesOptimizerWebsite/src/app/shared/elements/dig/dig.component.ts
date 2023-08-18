import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { DigsServices } from '../../../_abstract_model/services/digs.service';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { Dig } from '../../../_abstract_model/types/dig.class';
import { AutoDestroy } from '../../decorators/autodestroy.decorator';
import { getTown } from '../../utilities/localstorage.util';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
    selector: 'mho-dig',
    templateUrl: './dig.component.html',
    styleUrls: ['./dig.component.scss']
})
export class DigComponent {
    @HostBinding('style.display') display: string = 'contents';

    @Input({ required: true }) citizen!: Citizen;
    @Input({ required: true }) day!: number;
    @Input({ required: true }) digsMode!: 'creation' | 'update' | 'registry';

    @Input({ required: true }) set dig(dig: Dig | undefined) {
        setTimeout(() => {
            if (this.digsMode === 'registry') {
                this.updated_dig = dig;
            } else {
                this.updated_dig = undefined;
            }

            if (dig) {
                this.current_dig = dig;
            } else {
                this.current_dig = new Dig();
            }
        });

    }

    @Output() deletedDig: EventEmitter<Dig> = new EventEmitter<Dig>();
    @Output() updatedDig: EventEmitter<Dig[]> = new EventEmitter<Dig[]>();

    protected current_dig!: Dig;
    protected updated_dig?: Dig;

    /** Le dossier dans lequel sont stockées les images */
    protected HORDES_IMG_REPO: string = HORDES_IMG_REPO;

    @AutoDestroy private destroy_sub: Subject<void> = new Subject();

    constructor(private digs_api: DigsServices, private dialog: MatDialog) {
    }

    protected deleteDig(dig_to_delete: Dig): void {
        this.dialog
            .open(ConfirmDialogComponent, {
                data: {
                    title: $localize`Confirmer`,
                    text: $localize`Êtes-vous sûr de vouloir supprimer cette fouille ?`
                }
            })
            .afterClosed()
            .pipe(takeUntil(this.destroy_sub))
            .subscribe((confirm: boolean) => {
                if (confirm) {
                    this.digs_api.deleteDig(dig_to_delete)
                        .pipe(takeUntil(this.destroy_sub))
                        .subscribe(() => {
                            this.deletedDig.next(dig_to_delete);
                        });
                }
            });
    }


    protected changeDigToUpdate(citizen: Citizen, dig?: Dig): void {
        this.updated_dig = undefined;
        if (dig) {
            this.updated_dig = new Dig(dig.modelToDto());
        } else {
            this.updated_dig = new Dig({
                cellId: undefined,
                day: this.day,
                diggerId: citizen.id,
                diggerName: citizen.name,
                nbSucces: 0,
                nbTotalDig: 0,
                x: getTown()?.town_x || 0,
                y: getTown()?.town_y || 0
            });
        }
    }

    protected updateDig(): void {
        if (this.updated_dig) {
            this.digs_api.updateDig([this.updated_dig])
                .pipe(takeUntil(this.destroy_sub))
                .subscribe((new_digs: Dig[]) => {
                    this.updatedDig.next(new_digs);
                    if (this.digsMode !== 'registry') {
                        this.updated_dig = undefined;
                    }
                });
        }
    }

}

