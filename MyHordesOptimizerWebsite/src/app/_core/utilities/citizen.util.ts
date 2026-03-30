import { Citizen } from '../../_abstract_model/types/citizen.class';

export function getCitizenFromId(citizen_list: Citizen[], citizen_id?: number): Citizen | undefined {
    if (!citizen_id || !citizen_list) return undefined;
    return citizen_list.find((citizen: Citizen) => citizen_id === citizen.id);
}
