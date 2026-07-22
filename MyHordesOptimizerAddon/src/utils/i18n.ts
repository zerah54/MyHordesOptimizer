import { lang } from '../config/constants';

export function getI18N(item) {
    if (!item) return;
    return item?.[lang] !== 'TODO' ? item?.[lang] : (item?.en === 'TODO' ? item?.fr : item?.en);
}
