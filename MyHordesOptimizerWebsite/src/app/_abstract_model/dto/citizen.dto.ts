import { BagDTO } from "./bag.dto";

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
    bag: BagDTO;
};
