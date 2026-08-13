import { CitizenExpedition } from '../../_abstract_model/types/citizen-expedition.class';
import { ExpeditionPart } from '../../_abstract_model/types/expedition-part.class';
import { ExpeditionsComponent } from './expeditions.component';

describe('ExpeditionsComponent', () => {
    let component: ExpeditionsComponent;
    let realtime_expeditions_service: { updateExpeditionCitizen: jasmine.Spy };

    beforeEach(() => {
        component = Object.create(ExpeditionsComponent.prototype);
        realtime_expeditions_service = { updateExpeditionCitizen: jasmine.createSpy('updateExpeditionCitizen').and.returnValue(Promise.resolve()) };
        (component as any).realtime_expeditions_service = realtime_expeditions_service;
    });

    describe('addNewMemberToPart', () => {
        it('sends a fresh citizen (no id) instead of updating the copied one', async () => {
            const part = new ExpeditionPart();
            const existing_citizen = new CitizenExpedition();
            existing_citizen.id = 123;
            existing_citizen.preinscrit = true;

            await (component as any).addNewMemberToPart(part, existing_citizen);

            const sent_citizen: CitizenExpedition = realtime_expeditions_service.updateExpeditionCitizen.calls.mostRecent().args[1];
            expect(sent_citizen.id).toBeUndefined();
            expect(sent_citizen.preinscrit).toBeTrue();
        });
    });

    describe('addNewMemberToExpedition', () => {
        it('sends a fresh citizen (no id) instead of updating the copied one', () => {
            const part = new ExpeditionPart();
            const expedition = { parts: [part] } as any;
            const existing_citizen = new CitizenExpedition();
            existing_citizen.id = 123;

            (component as any).addNewMemberToExpedition(expedition, existing_citizen);

            const sent_citizen: CitizenExpedition = realtime_expeditions_service.updateExpeditionCitizen.calls.mostRecent().args[1];
            expect(sent_citizen.id).toBeUndefined();
        });
    });
});
