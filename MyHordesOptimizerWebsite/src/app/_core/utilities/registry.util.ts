import { Entry } from '../../_abstract_model/interfaces';

export function entryHasKeyword(entry: Entry, keyword: string): boolean {
    return entry.entry?.indexOf(' ' + keyword + ' ') > -1 || entry.entry?.indexOf(' ' + keyword + '.') > -1;
}
