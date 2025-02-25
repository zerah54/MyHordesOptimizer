import { CommonModule } from '@angular/common';
import { booleanAttribute, Component, HostBinding, Input } from '@angular/core';
import { Imports } from '../../../_abstract_model/types/_types';

const angular_common: Imports = [CommonModule];
const components: Imports = [];
const pipes: Imports = [];
const material_modules: Imports = [];

@Component({
    selector: 'mho-avatar',
    templateUrl: './avatar.component.html',
    styleUrls: ['./avatar.component.scss'],
    imports: [...angular_common, ...components, ...material_modules, ...pipes]
})
export class AvatarComponent {
    @HostBinding('style.display') display: string = 'contents';

    @Input() src: string | undefined;
    @Input({transform: booleanAttribute}) rounded: boolean = false;
    @Input() width: string | undefined;

}
