import { Pipe, PipeTransform } from '@angular/core';
import { Entry } from '../../../../_abstract_model/interfaces';
import { CitizenInfo } from '../../../../_abstract_model/types/citizen-info.class';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { Item } from '../../../../_abstract_model/types/item.class';
import { groupBy } from '../../../../shared/utilities/array.util';


@Pipe({
    name: 'bankCleanEntries'
})
export class BankCleanEntriesPipe implements PipeTransform {
    transform(entries: Entry[], give_keywords: string[], complete_citizen_list: CitizenInfo, complete_item_list: Item[], strict: boolean): BankEntry[] {

        let clean_entries: BankEntry[] = entries.map((entry: Entry): BankEntry => {
            return {
                hour: entry.hour,
                mode: give_keywords.some((give_keyword: string): boolean => entry.entry?.indexOf(' ' + give_keyword + ' ') > -1 || entry.entry?.indexOf(' ' + give_keyword + ':') > -1) ? 'gifted' : 'taken',
                citizen: complete_citizen_list.citizens.find((citizen: Citizen): boolean => entry.entry?.indexOf(citizen.name) > -1),
                item: complete_item_list.find((item: Item): boolean => {
                    let correspondance: boolean = false;
                    for (const label_key in item.label) {
                        if (entry.entry?.indexOf(' ' + item.label[label_key] + ' ') > -1) {
                            correspondance = true;
                            break;
                        }
                    }
                    return correspondance;
                })
            };
        });

        if (strict) {

            const group_by_item: BankEntry[][] = groupBy(clean_entries, (item: BankEntry) => item.item?.id || '');
            clean_entries = [];
            for (const item of group_by_item) {
                let group_by_taken: BankEntry[][] = groupBy(item, (item: BankEntry) => item.mode);
                if (group_by_taken.length === 2) {
                    if (group_by_taken[0].length === group_by_taken[1].length) {
                        /** Si il y a deux groupes et que les deux sont de même longueur, on peut supprimer l'objet de la liste */
                        group_by_taken = [];
                    } else {
                        /**
                         * Si il y a deux groupes et qu'ils ne sont pas de même longueur, il faut réduire jusqu'à n'avoir plus qu'un groupe
                         * Il faut donc supprimer le plus petit + retirer autant de lignes du plus gros qu'il y en avait dans le plus petit
                         */
                        if (group_by_taken[0].length > group_by_taken[1].length) {
                            const remove_length: number = group_by_taken[1].length;
                            group_by_taken[0].splice(group_by_taken[0].length - remove_length - 1, remove_length);
                            group_by_taken.splice(1, 1);
                        } else {
                            const remove_length: number = group_by_taken[0].length;
                            group_by_taken[1].splice(group_by_taken[1].length - remove_length - 1, remove_length);
                            group_by_taken.splice(0, 1);
                        }
                    }
                }

                if (group_by_taken.length > 0) {
                    const clean_group: BankEntry[] = group_by_taken[0];
                    clean_group.forEach((entry: BankEntry) => {
                        clean_entries.push(entry);
                    });
                }
            }

        }

        return clean_entries;
    }
}

@Pipe({
    name: 'bankDiff'
})
export class BankDiffPipe implements PipeTransform {
    transform(entries: BankEntry[], mode: 'gift' | 'take'): BankEntry[] {
        return mode === 'gift'
            ? entries.filter((entry: BankEntry): boolean => entry.mode === 'gifted')
            : entries.filter((entry: BankEntry): boolean => entry.mode === 'taken');
    }
}

interface BankEntry {
    mode: 'gifted' | 'taken'
    citizen?: Citizen;
    item?: Item;
    hour: string;
}
