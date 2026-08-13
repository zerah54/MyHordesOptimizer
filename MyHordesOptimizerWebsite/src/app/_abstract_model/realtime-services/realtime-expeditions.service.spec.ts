import { CitizenExpeditionBag } from '../types/citizen-expedition-bag.class';
import { RealtimeExpeditionsService } from './realtime-expeditions.service';

describe('RealtimeExpeditionsService', () => {
    let service: RealtimeExpeditionsService;

    beforeEach(() => {
        service = Object.create(RealtimeExpeditionsService.prototype);
        spyOn<any>(service, 'invokeHub').and.returnValue(Promise.resolve());
    });

    describe('deleteExpeditionBag', () => {
        it('invokes the DeleteExpeditionBag hub method with the bag id', async () => {
            const bag: CitizenExpeditionBag = new CitizenExpeditionBag();
            bag.bag_id = 42;

            await service.deleteExpeditionBag(bag);

            expect((service as any).invokeHub).toHaveBeenCalledWith('DeleteExpeditionBag', 42);
        });
    });
});
