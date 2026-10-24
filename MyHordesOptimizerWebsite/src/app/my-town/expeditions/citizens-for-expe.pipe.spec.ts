import { JobEnum } from '../../_abstract_model/enum/job.enum';
import { Citizen } from '../../_abstract_model/types/citizen.class';
import { CitizenExpedition } from '../../_abstract_model/types/citizen-expedition.class';
import { CitizensForExpePipe } from './citizens-for-expe.pipe';

function citizenWith(extra: Partial<Citizen>): Citizen {
    return Object.assign(new Citizen(), { is_dead: false }, extra);
}

function placeWith(extra: Partial<CitizenExpedition>): CitizenExpedition {
    return Object.assign(new CitizenExpedition(), extra);
}

describe('CitizensForExpePipe', (): void => {
    const pipe: CitizensForExpePipe = new CitizensForExpePipe();

    function names(citizens: Citizen[]): string[] {
        return citizens.map((citizen: Citizen): string => citizen.name);
    }

    it('offers the living citizens for a place without requirement, not the dead ones', (): void => {
        const citizens: Citizen[] = [citizenWith({ id: 1, name: 'alive' }), citizenWith({ id: 2, name: 'dead', is_dead: true })];

        expect(names(pipe.transform(citizens, placeWith({}), 5, 5, true))).toEqual(['alive']);
    });

    it('keeps only the citizens with the pre-registered job', (): void => {
        const citizens: Citizen[] = [
            citizenWith({ id: 1, name: 'scout', job: JobEnum.SCOUT }),
            citizenWith({ id: 2, name: 'guardian', job: JobEnum.GUARDIAN })
        ];

        expect(names(pipe.transform(citizens, placeWith({ preinscrit_job: JobEnum.SCOUT.key }), 5, 5, true))).toEqual(['scout']);
    });

    it('keeps only the citizens with equipped shoes when the place requires them', (): void => {
        const citizens: Citizen[] = [
            citizenWith({ id: 1, name: 'shod', shoes_equipped: true }),
            citizenWith({ id: 2, name: 'barefoot', shoes_equipped: false })
        ];

        expect(names(pipe.transform(citizens, placeWith({ requires_shoes: true }), 5, 5, true))).toEqual(['shod']);
    });

    it('keeps only the citizens with enough starting SP when the place requires some', (): void => {
        const citizens: Citizen[] = [
            citizenWith({ id: 1, name: 'scout', job: JobEnum.SCOUT }),
            citizenWith({ id: 2, name: 'plain' })
        ];

        expect(names(pipe.transform(citizens, placeWith({ required_sp: 2 }), 5, 5, true))).toEqual(['scout']);
    });

    it('still offers the citizen already placed, even when he no longer meets the requirements', (): void => {
        const citizens: Citizen[] = [
            citizenWith({ id: 1, name: 'placed', shoes_equipped: false }),
            citizenWith({ id: 2, name: 'barefoot', shoes_equipped: false }),
            citizenWith({ id: 3, name: 'shod', shoes_equipped: true })
        ];

        const place: CitizenExpedition = placeWith({ citizen_id: 1, requires_shoes: true });

        expect(names(pipe.transform(citizens, place, 5, 5, true))).toEqual(['placed', 'shod']);
    });

    it('takes the day of the expedition into account for the mapping SP', (): void => {
        const citizens: Citizen[] = [citizenWith({ id: 1, name: 'plain' })];
        const place: CitizenExpedition = placeWith({ required_sp: 2 });

        expect(names(pipe.transform(citizens, place, 5, 5, true))).toEqual([]);
        expect(names(pipe.transform(citizens, place, 6, 5, true))).toEqual(['plain']);
    });

    it('does not assume the mapping of a future expedition without the Scouts Lair', (): void => {
        const citizens: Citizen[] = [citizenWith({ id: 1, name: 'plain' })];

        expect(names(pipe.transform(citizens, placeWith({ required_sp: 2 }), 6, 5, false))).toEqual([]);
    });
});
