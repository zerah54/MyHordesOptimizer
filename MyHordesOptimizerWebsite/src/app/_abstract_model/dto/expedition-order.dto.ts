import { ExpeditionOrderType } from '../types/_types';

export interface ExpeditionOrderDTO {
    id?: number;
    expeditionCitizenId?: number;
    expeditionPartsId?: number[];
    expeditionsId?: number[];
    type: ExpeditionOrderType;
    text: string;
    isDone: boolean;
    position: number;
}
