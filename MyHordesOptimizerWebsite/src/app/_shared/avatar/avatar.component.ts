import { CommonModule } from '@angular/common';
import {
    booleanAttribute,
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
    InputSignal,
    InputSignalWithTransform,
    Signal,
    signal,
    WritableSignal
} from '@angular/core';

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
    imports: [...angular_common, ...components, ...material_modules, ...pipes],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[style.--mho-avatar-size]': 'size_px()',
        '[class.is-empty]': '!url()'
    }
})
export class AvatarComponent {

    public src: InputSignal<string | undefined> = input();
    public rounded: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });
    /** Côté de l'avatar, en pixels. Sans valeur, l'image garde sa taille naturelle (100 px). */
    public size: InputSignal<number | undefined> = input<number | undefined>();

    /**
     * MyHordes renvoie aujourd'hui un chemin relatif (`/storage/...`), mais d'anciens avatars ont été
     * stockés en URL absolue : les préfixer donnerait `https://...https://...`. `myhordes_url` finit
     * par un `/`, d'où le retrait avant concaténation. `False` est la valeur renvoyée par l'API (le
     * booléen, sérialisé) quand le joueur n'a pas d'avatar.
     */
    private readonly resolved_url: Signal<string | undefined> = computed((): string | undefined => {
        const src: string | undefined = this.src();
        if (!src || src === 'False') {
            return undefined;
        }
        if (src.startsWith('http')) {
            return src;
        }
        return environment.myhordes_url.replace(/\/$/, '') + src;
    });

    /** Dernière URL dont le chargement a échoué (ex. CDN de staging en 401) ; un `src` différent la remplace d'office. */
    private readonly failed_url: WritableSignal<string | undefined> = signal<string | undefined>(undefined);

    /** URL à afficher : celle de `src`, sauf si son chargement vient d'échouer (l'avatar se replie alors comme s'il était absent). */
    protected readonly url: Signal<string | undefined> = computed((): string | undefined => {
        const resolved: string | undefined = this.resolved_url();
        return resolved === this.failed_url() ? undefined : resolved;
    });

    /** `null` plutôt que `'100px'` : la taille par défaut vit dans la feuille de style, en `var()`. */
    protected readonly size_px: Signal<string | null> = computed((): string | null => {
        const size: number | undefined = this.size();
        return size === undefined ? null : `${size}px`;
    });

    /** Mémorise l'URL en échec pour retirer l'`<img>` cassé. */
    protected onError(): void {
        this.failed_url.set(this.resolved_url());
    }
}
