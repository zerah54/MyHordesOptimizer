import { CommonModule } from '@angular/common';
import { booleanAttribute, Component, computed, input,InputSignal, InputSignalWithTransform, Signal } from '@angular/core';

import { environment } from '../../../environments/environment';
import { Imports } from '../../_abstract_model/types/_types';

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

    public src: InputSignal<string | undefined> = input();
    public rounded: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * MyHordes renvoie aujourd'hui un chemin relatif (`/storage/...`), mais d'anciens avatars ont été
     * stockés en URL absolue : les préfixer donnerait `https://...https://...`. `myhordes_url` finit
     * par un `/`, d'où le retrait avant concaténation. `False` est la valeur renvoyée par l'API (le
     * booléen, sérialisé) quand le joueur n'a pas d'avatar.
     */
    protected readonly url: Signal<string | undefined> = computed(() => {
        const src: string | undefined = this.src();
        if (!src || src === 'False') {
            return undefined;
        }
        if (src.startsWith('http')) {
            return src;
        }
        return environment.myhordes_url.replace(/\/$/, '') + src;
    });
}
