import { Dictionary } from '../../_abstract_model/types/_types';

export class DictionaryUtils {
    public static getKeys(dictionary: Dictionary<unknown>): string[] | number[] {
        return Object.keys(dictionary);
    }

    public static getValues(dictionary: Dictionary<unknown>): unknown[] {
        return Object.values(dictionary);
    }
}
