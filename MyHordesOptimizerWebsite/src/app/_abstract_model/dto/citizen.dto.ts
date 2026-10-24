import { BagDTO } from './bag.dto';
import { CadaverDTO } from './cadaver.dto';
import { ChamanicDetailDTO } from './chamanic-detail.dto';
import { DailyActionDTO } from './daily-action.dto';
import { HeroicActionsDTO } from './heroic-actions.dto';
import { HomeDTO } from './home.dto';
import { StatusDTO } from './status.dto';

/** Niveaux des compétences héroïques saisis à la main : 0 aucun, 1 à 4 ; null : inconnu. */
export interface HeroSkillLevelsDTO {
    s?: number | null;
    u?: number | null;
    p?: number | null;
    e?: number | null;
    r?: number | null;
}

export interface CitizenDTO {
    avatar?: string;
    homeMessage?: string;
    id: number;
    isShunned?: boolean;
    dead?: boolean;
    jobName?: string;
    jobUid?: string;
    /** Rôles de ville portés par ce citoyen, parmi `shaman`, `guide` et `cata`. */
    townRoles?: string[];
    name: string;
    nombreJourHero?: number;
    x?: number;
    y?: number;
    /** Défense apportée par la maison seule (`baseDef` MyHordes), hors job/objets/actions héroïques. */
    houseDefense?: number;
    bag?: BagDTO;
    chest?: BagDTO;
    home?: HomeDTO;
    status?: StatusDTO;
    actionsHeroic?: HeroicActionsDTO;
    dailyActions: DailyActionDTO[];
    chamanicDetail: ChamanicDetailDTO;
    cadaver?: CadaverDTO;
    /** Campings déjà effectués dans la ville, saisis à la main ; 0 si rien n'est saisi. */
    campingCount?: number;
    /** Chaussures équipées, déclarées par le citoyen dans la liste des citoyens ou envoyées par le script ; `false` si rien n'est déclaré. */
    shoesEquipped?: boolean;
    heroSkills?: HeroSkillLevelsDTO | null;
}
