import { CitizenExpedition } from '../../_abstract_model/types/citizen-expedition.class';
import { Citizen } from '../../_abstract_model/types/citizen.class';
import { ExpeditionPart } from '../../_abstract_model/types/expedition-part.class';
import { Expedition } from '../../_abstract_model/types/expedition.class';
import { getCitizenFromId } from '../../shared/utilities/citizen.util';

export function getPreRegistered(expeditions: Expedition[], all_citizen: Citizen[]): Citizen[] {
    const pre_registered: Citizen[] = [];
    expeditions?.forEach((expedition: Expedition) => {
        expedition.parts.forEach((part: ExpeditionPart) => {
            part.citizens.forEach((citizen: CitizenExpedition) => {
                if (citizen.preinscrit && getCitizenFromId(all_citizen, citizen.citizen_id)
                    && !pre_registered.some((pre_registered_citizen: Citizen) => pre_registered_citizen.id === citizen.citizen_id)) {
                    pre_registered.push(<Citizen>getCitizenFromId(all_citizen, citizen.citizen_id));
                }
            });
        });
    });
    return pre_registered;
}
