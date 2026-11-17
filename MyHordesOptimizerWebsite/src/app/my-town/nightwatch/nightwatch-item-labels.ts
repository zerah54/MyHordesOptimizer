import { inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import moment from 'moment';
import { catchError, Observable, of } from 'rxjs';

import { ApiService } from '../../_abstract_model/services/api.service';
import { Item } from '../../_abstract_model/types/item.class';
import { itemLabel } from '../buildings/planning/planning-labels.util';

/**
 * Fonction de libellé des objets du jeu, dans la langue courante ; à appeler en contexte d'injection.
 * @returns {(item_id: number) => string} Libellé d'un objet (`#id` si inconnu) ; lit un signal, donc réactif.
 */
export function injectItemLabeler(): (item_id: number) => string {
    const items: () => readonly Item[] = toSignal(inject(ApiService).getItems().pipe(catchError((): Observable<Item[]> => of([]))), { initialValue: [] as Item[] });
    const locale: string = moment.locale();
    return (item_id: number): string => itemLabel(items(), item_id, locale);
}
