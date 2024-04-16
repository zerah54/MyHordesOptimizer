import { ExpeditionOrderType } from '../types/_types';

export interface ExpeditionOrderDTO {
    id?: number;
    type: ExpeditionOrderType;
    text: string;
    isDone: boolean;
    position: number;
}
