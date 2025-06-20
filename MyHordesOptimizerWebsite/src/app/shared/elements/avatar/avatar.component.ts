import { CommonModule } from '@angular/common';
import { booleanAttribute, Component, input, InputSignal, InputSignalWithTransform } from '@angular/core';
import { Imports } from '../../../_abstract_model/types/_types';

const angular_common: Imports = [CommonModule];
const components: Imports = [];
const pipes: Imports = [];
const material_modules: Imports = [];

@Component({
    selector: 'mho-avatar',
    templateUrl: './avatar.component.html',
    styleUrls: ['./avatar.component.scss'],
    host: {style: 'display: contents'},
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class AvatarComponent {

    public src: InputSignal<string | undefined> = input();
    public rounded: InputSignalWithTransform<boolean, unknown> = input(false, {transform: booleanAttribute});
}
