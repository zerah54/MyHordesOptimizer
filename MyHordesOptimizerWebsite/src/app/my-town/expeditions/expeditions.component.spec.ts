import { Signal, signal, WritableSignal } from '@angular/core';
import type { Mock } from 'vitest';

import { CitizenExpedition } from '../../_abstract_model/types/citizen-expedition.class';
import { Expedition } from '../../_abstract_model/types/expedition.class';
import { ExpeditionPart } from '../../_abstract_model/types/expedition-part.class';
import { TownDetails } from '../../_abstract_model/types/town-details.class';
import { setTown } from '../../_core/utilities/localstorage.util';
import { ExpeditionsComponent } from './expeditions.component';

interface RealtimeStub {
    updateExpeditionCitizen: Mock<(part: ExpeditionPart, citizen: CitizenExpedition) => Promise<void>>;
    joinPresence: Mock<() => Promise<void>>;
    leavePresence: Mock<() => Promise<void>>;
}

interface DestroyRefStub {
    destroyed: boolean;
    onDestroy: Mock<(callback: () => void) => () => void>;
}

/** Membres testés du composant, créé sans son constructeur. */
interface ComponentInternals {
    realtime_expeditions_service: RealtimeStub;
    destroy_ref: DestroyRefStub;
    can_contribute: Signal<boolean>;
    editable: WritableSignal<boolean>;
    declarePresence(): void;
    addNewMemberToPart(expedition_part: ExpeditionPart, citizen_to_copy?: CitizenExpedition): Promise<void>;
    addNewMemberToExpedition(expedition: Expedition, citizen_to_copy?: CitizenExpedition): void;
    updateEditableForIndex(tab_index: number): void;
    isDirectionLocked(expedition_part: ExpeditionPart): boolean;
}

describe('ExpeditionsComponent', () => {
    let internals: ComponentInternals;
    let realtime_expeditions_service: RealtimeStub;

    function sentCitizen(): CitizenExpedition {
        const call: [ExpeditionPart, CitizenExpedition] | undefined = realtime_expeditions_service.updateExpeditionCitizen.mock.lastCall;
        expect(call).toBeDefined();
        return (<[ExpeditionPart, CitizenExpedition]>call)[1];
    }

    beforeEach(() => {
        internals = <ComponentInternals><unknown>Object.create(ExpeditionsComponent.prototype);
        realtime_expeditions_service = {
            updateExpeditionCitizen: vi.fn().mockReturnValue(Promise.resolve()),
            joinPresence: vi.fn().mockReturnValue(Promise.resolve()),
            leavePresence: vi.fn().mockReturnValue(Promise.resolve())
        };
        internals.realtime_expeditions_service = realtime_expeditions_service;
    });

    describe('declarePresence', () => {
        let destroy_ref: DestroyRefStub;

        beforeEach(() => {
            destroy_ref = { destroyed: false, onDestroy: vi.fn().mockReturnValue(() => undefined) };
            internals.destroy_ref = destroy_ref;
        });

        it('declares the presence once the page is open', () => {
            internals.declarePresence();

            expect(realtime_expeditions_service.joinPresence).toHaveBeenCalledTimes(1);
            expect(realtime_expeditions_service.leavePresence).not.toHaveBeenCalled();
        });

        it('withdraws the presence when the page is destroyed', () => {
            internals.declarePresence();

            const on_destroy: () => void = destroy_ref.onDestroy.mock.calls[0][0];
            on_destroy();

            expect(realtime_expeditions_service.leavePresence).toHaveBeenCalledTimes(1);
        });

        it('declares nothing when the page was destroyed before reaching it', () => {
            destroy_ref.destroyed = true;

            internals.declarePresence();

            expect(realtime_expeditions_service.joinPresence).not.toHaveBeenCalled();
            expect(destroy_ref.onDestroy).not.toHaveBeenCalled();
        });

        it('still registers the withdrawal when the hub refuses the presence', async () => {
            realtime_expeditions_service.joinPresence.mockRejectedValueOnce(new Error('Forbidden'));
            vi.spyOn(console, 'warn').mockImplementation(() => undefined);

            internals.declarePresence();
            await Promise.resolve();

            expect(destroy_ref.onDestroy).toHaveBeenCalledTimes(1);
        });
    });

    describe('addNewMemberToPart', () => {
        it('sends a fresh citizen (no id) instead of updating the copied one', async () => {
            const part: ExpeditionPart = new ExpeditionPart();
            const existing_citizen: CitizenExpedition = new CitizenExpedition();
            existing_citizen.id = 123;
            existing_citizen.preinscrit = true;

            await internals.addNewMemberToPart(part, existing_citizen);

            expect(sentCitizen().id).toBeUndefined();
            expect(sentCitizen().preinscrit).toBe(true);
        });
    });

    describe('updateEditableForIndex', () => {
        beforeEach(() => {
            const town: TownDetails = new TownDetails();
            town.town_id = 42;
            town.day = 5;
            setTown(town);
            internals.editable = signal(true);
        });

        afterEach(() => {
            setTown(null);
        });

        it('lets a citizen edit the current day, also on a former town', () => {
            internals.can_contribute = signal(true);

            internals.updateEditableForIndex(4);

            expect(internals.editable()).toBe(true);
        });

        it('keeps a past day locked', () => {
            internals.can_contribute = signal(true);

            internals.updateEditableForIndex(3);

            expect(internals.editable()).toBe(false);
        });

        it('keeps the town of someone else read only', () => {
            internals.can_contribute = signal(false);

            internals.updateEditableForIndex(4);

            expect(internals.editable()).toBe(false);
        });
    });

    describe('isDirectionLocked', () => {
        it('locks the compass rose of a part linked to a route', () => {
            const part: ExpeditionPart = Object.assign(new ExpeditionPart(), { map_route_id: 7 });

            expect(internals.isDirectionLocked(part)).toBe(true);
        });

        it('leaves the compass rose of a part without route editable', () => {
            expect(internals.isDirectionLocked(new ExpeditionPart())).toBe(false);
        });
    });

    describe('addNewMemberToExpedition', () => {
        it('sends a fresh citizen (no id) instead of updating the copied one', () => {
            const part: ExpeditionPart = new ExpeditionPart();
            const expedition: Expedition = Object.assign(new Expedition(), { parts: [part] });
            const existing_citizen: CitizenExpedition = new CitizenExpedition();
            existing_citizen.id = 123;

            internals.addNewMemberToExpedition(expedition, existing_citizen);

            expect(sentCitizen().id).toBeUndefined();
        });
    });
});
