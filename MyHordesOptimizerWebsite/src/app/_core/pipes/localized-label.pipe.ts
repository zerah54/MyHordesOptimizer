import { Pipe, PipeTransform } from '@angular/core';
import moment from 'moment';

import { I18nLabels } from '../../_abstract_model/types/_types';
import { localizedLabel } from '../utilities/string.utils';

/**
 * Libellé traduit d'un objet du référentiel, sans jamais lever.
 *
 * `{{ x.label[locale] }}` écrit en clair dans un gabarit casse la vue entière dès qu'un
 * enregistrement arrive sans `label` — ce qui se produit : l'import MyHordes peut créer des
 * objets vides (catégorie absente, libellés nuls), et une seule ligne fautive fait disparaître
 * toute la liste. Ce pipe retombe sur la première traduction disponible, puis sur le repli
 * fourni.
 */
@Pipe({
    name: 'localizedLabel'
})
export class LocalizedLabelPipe implements PipeTransform {

    private readonly locale: string = moment.locale();

    public transform(labels: I18nLabels | null | undefined, fallback: string = ''): string {
        return localizedLabel(labels, this.locale) || fallback;
    }
}
