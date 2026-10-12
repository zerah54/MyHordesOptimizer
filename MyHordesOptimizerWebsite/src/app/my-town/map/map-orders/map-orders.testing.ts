import { Provider, signal, WritableSignal } from '@angular/core';

import { RealtimeExpeditionsService } from '../../../_abstract_model/realtime-services/realtime-expeditions.service';
import { Expedition } from '../../../_abstract_model/types/expedition.class';
import { DayExpeditionsStore } from './day-expeditions.store';
import { buildCellOrderIndex, CellOrderIndex } from './map-cell-orders';

/** Doublure de DayExpeditionsStore pour les tests : pas de hub ni d'appel HTTP. */
export class DayExpeditionsStoreStub {
    public readonly expeditions: WritableSignal<readonly Expedition[]> = signal([]);
    public readonly cell_orders: WritableSignal<CellOrderIndex> = signal(new Map());

    public set(expeditions: Expedition[]): void {
        this.expeditions.set(expeditions);
        this.cell_orders.set(buildCellOrderIndex(expeditions));
    }
}

/**
 * Pour les tests des composants de la carte qui affichent des consignes : les expéditions du jour sont une
 * doublure, et le service temps réel n'ouvre aucune connexion au hub.
 */
export function provideMapOrdersTesting(store: DayExpeditionsStoreStub = new DayExpeditionsStoreStub()): Provider[] {
    return [
        { provide: DayExpeditionsStore, useValue: store },
        { provide: RealtimeExpeditionsService, useValue: {} }
    ];
}
