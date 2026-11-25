import { JobEnum } from '../../_abstract_model/enum/job.enum';
import { NightwatchCitizenStateDTO, NightwatchWatcherDTO } from './nightwatch.types';

/** Citoyen proposé à l'inscription, avec son métier (nul s'il est inconnu). */
export interface AddableCitizen {
    user_id: number;
    name: string;
    job: JobEnum | null;
}

/**
 * Citoyens pas encore inscrits comme veilleurs, par ordre alphabétique.
 * @param {readonly NightwatchCitizenStateDTO[]} citizens Citoyens de la ville.
 * @param {readonly NightwatchWatcherDTO[]} watchers Veilleurs déjà inscrits.
 * @param {string} locale Langue du tri.
 * @returns {AddableCitizen[]} Citoyens proposables.
 */
export function addableCitizens(citizens: readonly NightwatchCitizenStateDTO[], watchers: readonly NightwatchWatcherDTO[], locale: string): AddableCitizen[] {
    const enrolled: Set<number> = new Set<number>(watchers.map((watcher: NightwatchWatcherDTO): number => watcher.userId));
    return citizens
        .filter((citizen: NightwatchCitizenStateDTO): boolean => !enrolled.has(citizen.userId))
        .map((citizen: NightwatchCitizenStateDTO): AddableCitizen => ({
            user_id: citizen.userId,
            name: citizen.name,
            job: citizen.jobUid === null || citizen.jobUid === undefined ? null : (JobEnum.getByKey<JobEnum>(citizen.jobUid) ?? null)
        }))
        .sort((a: AddableCitizen, b: AddableCitizen): number => a.name.localeCompare(b.name, locale, { sensitivity: 'base' }));
}
