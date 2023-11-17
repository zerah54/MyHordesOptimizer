﻿import { BagDTO } from './bag.dto';
import { CitizenDTO } from './citizen.dto';

export interface CitizenExpeditionDTO {
    citizen?: CitizenDTO;
    bag?: BagDTO;
    consigne: string;
    preinscrit: boolean;
    preinscrit_job?: string;
    pdc: number;
    soif: boolean;
}
