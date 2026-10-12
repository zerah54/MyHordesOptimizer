import { TestBed } from '@angular/core/testing';

import { MapRouteAccess } from '../../_abstract_model/types/map-routes.class';
import { TownDetails } from '../../_abstract_model/types/town-details.class';
import { getTown } from '../utilities/localstorage.util';
import { TownContextService } from './town-context.service';

function town(map_id: number): TownDetails {
    const details: TownDetails = new TownDetails();
    details.town_id = map_id;
    return details;
}

const FORMER_CITIZEN: MapRouteAccess = { is_citizen: true, is_current_town: false, can_create: true };
const OBSERVER: MapRouteAccess = { is_citizen: false, is_current_town: false, can_create: false };

describe('TownContextService', (): void => {
    let service: TownContextService;

    beforeEach((): void => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(TownContextService);
        service.clear();
    });

    afterEach((): void => {
        service.clear();
    });

    it('own town: writable, citizen, not a former citizen', (): void => {
        expect(service.isReadonly()).toBe(false);
        expect(service.isCitizen()).toBe(true);
        expect(service.canContribute()).toBe(true);
        expect(service.isFormerCitizen()).toBe(false);
    });

    it('observed town without known rights: read only', (): void => {
        service.setObservedTown(town(42), 'Ville');

        expect(getTown()?.town_id).toBe(42);
        expect(service.isReadonly()).toBe(true);
        expect(service.isCitizen()).toBe(false);
        expect(service.canContribute()).toBe(false);
        expect(service.isFormerCitizen()).toBe(false);
    });

    it('observed town of a non-citizen: read only', (): void => {
        service.setObservedTown(town(42));
        service.setObservedAccess(OBSERVER);

        expect(service.isCitizen()).toBe(false);
        expect(service.canContribute()).toBe(false);
    });

    it('former town: expeditions, orders and routes stay writable', (): void => {
        service.setObservedTown(town(42));
        service.setObservedAccess(FORMER_CITIZEN);

        expect(service.isReadonly()).toBe(true);
        expect(service.isCitizen()).toBe(true);
        expect(service.isFormerCitizen()).toBe(true);
        expect(service.canContribute()).toBe(true);
    });

    it('finished former town: citizen but read only', (): void => {
        service.setObservedTown(town(42));
        service.setObservedAccess({ ...FORMER_CITIZEN, can_create: false });

        expect(service.isCitizen()).toBe(true);
        expect(service.canContribute()).toBe(false);
    });

    it('own town observed through its public page: citizen, not a former one', (): void => {
        service.setObservedTown(town(42));
        service.setObservedAccess({ is_citizen: true, is_current_town: true, can_create: true });

        expect(service.isFormerCitizen()).toBe(false);
        expect(service.canContribute()).toBe(true);
    });

    it('clear() forgets the rights with the town', (): void => {
        service.setObservedTown(town(42));
        service.setObservedAccess(FORMER_CITIZEN);

        service.clear();
        service.setObservedTown(town(43));

        expect(service.isCitizen()).toBe(false);
        expect(service.canContribute()).toBe(false);
    });
});
