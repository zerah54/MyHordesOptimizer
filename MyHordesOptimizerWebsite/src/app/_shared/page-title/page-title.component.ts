import { ChangeDetectionStrategy, Component, computed, input, InputSignal, Signal } from '@angular/core';

import { HORDES_IMG_REPO } from '../../_abstract_model/const';
import { Imports } from '../../_abstract_model/types/_types';
import { SitePage, sitePage, SitePageId } from '../../_core/utilities/site-pages';

const angular_common: Imports = [];
const components: Imports = [];
const pipes: Imports = [];
const material_modules: Imports = [];

/** Titre d'une page (icône puis libellé), tiré du registre des pages du site. */
@Component({
    selector: 'mho-page-title',
    templateUrl: './page-title.component.html',
    styleUrls: ['./page-title.component.scss'],
    imports: [...angular_common, ...components, ...material_modules, ...pipes],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageTitleComponent {

    /** Page dont on affiche le titre. */
    public readonly page: InputSignal<SitePageId> = input.required<SitePageId>();

    /** L'url des images de hordes */
    protected readonly HORDES_IMG_REPO: string = HORDES_IMG_REPO;
    /** Libellé et icône de la page. */
    protected readonly entry: Signal<SitePage> = computed((): SitePage => sitePage(this.page()));
}
