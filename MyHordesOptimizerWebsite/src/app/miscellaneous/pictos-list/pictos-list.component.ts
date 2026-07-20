import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, InputSignal, Signal } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HORDES_IMG_REPO } from '../../_abstract_model/const';
import { Imports } from '../../_abstract_model/types/_types';
import { UserPicto } from '../../_abstract_model/types/user-picto.class';

const angular_common: Imports = [CommonModule];
const material_modules: Imports = [MatTooltipModule];

@Component({
    selector: 'mho-pictos-list',
    imports: [...angular_common, ...material_modules],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './pictos-list.component.html',
    styleUrl: './pictos-list.component.scss'
})
export class PictosListComponent {
    public pictos: InputSignal<UserPicto[]> = input.required<UserPicto[]>();

    /** Affiche le total du joueur à côté du compte de la ville. Sans objet hors contexte ville. */
    public showTotal: InputSignal<boolean> = input<boolean>(false);

    /** Le dossier dans lequel sont stockées les images */
    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;

    protected readonly is_empty: Signal<boolean> = computed(() => this.pictos().length === 0);
}
