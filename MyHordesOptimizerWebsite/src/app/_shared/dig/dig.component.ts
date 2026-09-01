import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    effect,
    inject,
    input,
    InputSignal,
    output,
    OutputEmitterRef,
    signal,
    WritableSignal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { HORDES_IMG_REPO } from '../../_abstract_model/const';
import { DigsService } from '../../_abstract_model/services/digs.service';
import { Imports } from '../../_abstract_model/types/_types';
import { Citizen } from '../../_abstract_model/types/citizen.class';
import { Dig } from '../../_abstract_model/types/dig.class';
import { getTown } from '../../_core/utilities/localstorage.util';
import { ConfirmDialogComponent, ConfirmDialogData } from '../confirm-dialog/confirm-dialog.component';

const angular_common: Imports = [CommonModule, NgOptimizedImage, FormsModule];
const components: Imports = [];
const pipes: Imports = [];
const material_modules: Imports = [MatButtonModule, MatDividerModule, MatTooltipModule];

@Component({
    selector: 'mho-dig',
    templateUrl: './dig.component.html',
    styleUrls: ['./dig.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class DigComponent {
    private dialog: MatDialog = inject(MatDialog);


    public citizen: InputSignal<Citizen> = input.required();
    public day: InputSignal<number> = input.required();
    public digsMode: InputSignal<'creation' | 'update' | 'registry'> = input.required();
    public dig: InputSignal<Dig | undefined> = input.required();

    public deletedDig: OutputEmitterRef<Dig> = output();
    public updatedDig: OutputEmitterRef<Dig[]> = output();

    // Signaux (pas de simples champs) : mutés depuis le setTimeout ci-dessous et lus par le
    // template sous OnPush — un champ muté depuis un effect()/setTimeout ne marque pas la vue
    // pour vérification.
    protected readonly current_dig: WritableSignal<Dig | undefined> = signal(undefined);
    protected readonly updated_dig: WritableSignal<Dig | undefined> = signal(undefined);

    private readonly digs_api: DigsService = inject(DigsService);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);

    public constructor() {
        // Reproduit l'ancien setter `@Input({required:true}) set dig` : ne réagit qu'à `dig`, et
        // garde le même setTimeout (même délai/timing que l'original, pas juste la même logique).
        effect((): void => {
            const dig: Dig | undefined = this.dig();
            setTimeout(() => {
                if (this.digsMode() === 'registry') {
                    this.updated_dig.set(dig);
                } else {
                    this.updated_dig.set(undefined);
                }

                if (dig) {
                    this.current_dig.set(dig);
                } else {
                    this.current_dig.set(new Dig());
                }
            });
        });
    }

    /** Le dossier dans lequel sont stockées les images */
    protected HORDES_IMG_REPO: string = HORDES_IMG_REPO;

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
        this.updated_dig.set(undefined);
        if (dig) {
            this.updated_dig.set(new Dig(dig.modelToDto()));
        } else {
            this.updated_dig.set(new Dig({
                cellId: undefined,
                day: this.day(),
                diggerId: citizen.id,
                diggerName: citizen.name,
                nbSucces: 0,
                nbTotalDig: 0,
                x: getTown()?.town_x || 0,
                y: getTown()?.town_y || 0
            }));
        }
    }

    protected updateDig(): void {
        const updated_dig: Dig | undefined = this.updated_dig();
        if (updated_dig) {
            this.digs_api.updateDig([updated_dig])
                .pipe(takeUntilDestroyed(this.destroy_ref))
                .subscribe((new_digs: Dig[]) => {
                    this.updatedDig.emit(new_digs);
                    if (this.digsMode() !== 'registry') {
                        this.updated_dig.set(undefined);
                    }
                });
        }
    }

}

