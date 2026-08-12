import { Dictionary } from '../types/_types';

export interface UserPictoDTO {
    id: number;
    img?: string;
    label?: Dictionary<string>;
    description?: Dictionary<string>;
    rare: boolean;
    /** Nombre total obtenu par le joueur, toutes villes confondues. Null si jamais importé. */
    count: number | null;
    /** Nombre obtenu dans la ville demandée par le citoyen consulté, null si aucune ville n'a été demandée. */
    countInTown?: number | null;
    /** Nombre obtenu dans la ville demandée par l'ensemble de ses citoyens, même règle de nullité que countInTown. */
    townTotalCount?: number | null;
}

export interface UserPictosDTO {
    /** Date du dernier import des pictos du joueur, null s'il n'a jamais été fait. */
    historyImportedAt?: string | null;
    pictos: UserPictoDTO[];
}
