import { I18nLabels } from '../types/_types';

/** Représentation minimale d'un objet dans une relation objet↔objet (ex. boîtes/ouvre-boîtes). */
export interface ItemSummaryDTO {
    uid: string;
    img: string;
    imgBroken: string | null;
    label: I18nLabels;
}
