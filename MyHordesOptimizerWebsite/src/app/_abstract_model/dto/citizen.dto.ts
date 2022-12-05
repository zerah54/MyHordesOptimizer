import { ItemCountDTO } from "./item-count.dto";

export interface CitizenDTO {
    avatar: string;
    homeMessage: string;
    id: number;
    isGhost: boolean;
    jobName: string;
    name: string;
    nombreJourHero: number;
    x: number;
    y: number;
    bag: ItemCountDTO[];
};
