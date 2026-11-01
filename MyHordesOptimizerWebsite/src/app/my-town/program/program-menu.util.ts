import { CitizenExpeditionDTO } from '../../_abstract_model/dto/citizen-expedition.dto';
import { DailyProgramFactsDTO } from '../../_abstract_model/dto/daily-program-facts.dto';
import { Citizen } from '../../_abstract_model/types/citizen.class';
import { CitizenExpedition } from '../../_abstract_model/types/citizen-expedition.class';
import { meetsRequirements } from '../expeditions/expedition-resources.util';

/** « Mon programme » est visible pour un citoyen ayant un plan effectif, placé, ou pouvant prendre une place libre. */
export function isProgramMenuVisible(facts: DailyProgramFactsDTO, day: number, scouts_lair_built: boolean): boolean {
    if (!facts.isCitizen) return false;
    if (facts.hasEffectivePlan || facts.isPlaced) return true;
    if (facts.me === null || facts.me === undefined) return false;
    const me: Citizen = new Citizen(facts.me);
    return facts.openPlaces.some((place: CitizenExpeditionDTO): boolean =>
        meetsRequirements(me, new CitizenExpedition(place), day, day, scouts_lair_built));
}
