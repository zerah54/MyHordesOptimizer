import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, Input, output, OutputEmitterRef, InputSignal, input, inject, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HORDES_IMG_REPO } from '../../../_abstract_model/const';
import { DigsService } from '../../../_abstract_model/services/digs.service';
import { Imports } from '../../../_abstract_model/types/_types';
import { Citizen } from '../../../_abstract_model/types/citizen.class';
import { Dig } from '../../../_abstract_model/types/dig.class';
import { getTown } from '../../utilities/localstorage.util';
import { ConfirmDialogComponent, ConfirmDialogData } from '../confirm-dialog/confirm-dialog.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

const angular_common: Imports = [CommonModule, NgOptimizedImage, FormsModule];
const components: Imports = [];
const pipes: Imports = [];
const material_modules: Imports = [MatButtonModule, MatDividerModule, MatTooltipModule];

@Component({
    selector: 'mho-dig',
    templateUrl: './dig.component.html',
    styleUrls: ['./dig.component.scss'],
    host: {style: 'display: contents'},
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class DigComponent {

    public citizen: InputSignal<Citizen> = input.required();
    public day: InputSignal<number> = input.required();
    public digsMode: InputSignal<'creation' | 'update' | 'registry'> = input.required();

    @Input({required: true}) set dig(dig: Dig | undefined) {
        setTimeout(() => {
            if (this.digsMode() === 'registry') {
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

    public deletedDig: OutputEmitterRef<Dig> = output();
    public updatedDig: OutputEmitterRef<Dig[]> = output();

    protected current_dig!: Dig;
    protected updated_dig?: Dig;

    private readonly digs_api: DigsService = inject(DigsService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);

    /** Le dossier dans lequel sont stockées les images */
    protected HORDES_IMG_REPO: string = HORDES_IMG_REPO;

    constructor(private dialog: MatDialog) {
    }

    protected deleteDig(dig_to_delete: Dig): void {
        this.dialog
            .open<ConfirmDialogComponent, ConfirmDialogData>(ConfirmDialogComponent, {
                data: {
                    title: $localize`Confirmer`,
                    text: $localize`Êtes-vous sûr de vouloir supprimer cette fouille ?`
                }
            })
            .afterClosed()
            .pipe(takeUntilDestroyed(this.destroy_ref))
            .subscribe((confirm: boolean) => {
                if (confirm) {
                    this.digs_api.deleteDig(dig_to_delete)
                        .pipe(takeUntilDestroyed(this.destroy_ref))
                        .subscribe(() => {
                            this.deletedDig.emit(dig_to_delete);
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
                day: this.day(),
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
                .pipe(takeUntilDestroyed(this.destroy_ref))
                .subscribe((new_digs: Dig[]) => {
                    this.updatedDig.emit(new_digs);
                    if (this.digsMode() !== 'registry') {
                        this.updated_dig = undefined;
                    }
                });
        }
    }

}

