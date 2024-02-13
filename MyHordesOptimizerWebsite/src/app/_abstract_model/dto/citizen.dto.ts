import { BagDTO } from './bag.dto';
import { CadaverDTO } from './cadaver.dto';
import { HeroicActionsDTO } from './heroic-actions.dto';
import { HomeDTO } from './home.dto';
import { StatusDTO } from './status.dto';

export interface CitizenDTO {
    avatar?: string;
    homeMessage?: string;
    id: number;
    cadaver?: CadaverDTO;
    isGhost?: boolean;
    dead?: boolean;
    jobName?: string;
    jobUid?: string;
    name: string;
    nombreJourHero?: number;
    x?: number;
    y?: number;
    bag?: BagDTO;
    chest?: BagDTO;
    home?: HomeDTO;
    status?: StatusDTO;
    actionsHeroic?: HeroicActionsDTO;
}
