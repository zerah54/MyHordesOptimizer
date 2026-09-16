import { CitizenStateDTO } from '../dto/citizen-state.dto';
import { RankedOrderDTO } from '../dto/ranked-order.dto';
import { RankedOrder } from './ranked-order.class';

function buildCitizenStateDto(overrides: Partial<CitizenStateDTO> = {}): CitizenStateDTO {
    return {
        ap: 0, sp: 0, wounded: false, isEclaireur: false, hasBike: false, hasShoes: false,
        walkingDistance: 0, isDead: false, statuses: [],
        ...overrides
    };
}

function buildDto(overrides: Partial<RankedOrderDTO> = {}): RankedOrderDTO {
    return {
        order: [1, 2], tier: 'thirsty', tierReachedAtDistance: 5,
        totalDistance: 10, totalAp: 6, totalSp: 4,
        finalState: buildCitizenStateDto(),
        ...overrides
    };
}

describe('RankedOrder', (): void => {
    it('reads total_ap and total_sp from the DTO', (): void => {
        const rankedOrder: RankedOrder = new RankedOrder(buildDto({ totalAp: 7, totalSp: 3 }));

        expect(rankedOrder.total_ap).toBe(7);
        expect(rankedOrder.total_sp).toBe(3);
    });

    it('round-trips total_ap and total_sp through modelToDto', (): void => {
        const rankedOrder: RankedOrder = new RankedOrder(buildDto({ totalAp: 2, totalSp: 8 }));

        const dto: RankedOrderDTO = rankedOrder.modelToDto();

        expect(dto.totalAp).toBe(2);
        expect(dto.totalSp).toBe(8);
    });
});
