import { lang } from '../config/constants';
import type { I18nLabel } from '../types';

export function getI18N(item: I18nLabel | undefined): string | undefined {
    if (!item) return;
    return item?.[lang] !== 'TODO' ? item?.[lang] : (item?.en === 'TODO' ? item?.fr : item?.en);
}
