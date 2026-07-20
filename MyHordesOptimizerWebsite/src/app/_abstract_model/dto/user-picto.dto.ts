import { Dictionary } from '../types/_types';

export interface UserPictoDTO {
    id: number;
    img?: string;
    label?: Dictionary<string>;
    description?: Dictionary<string>;
    rare: boolean;
    /** Nombre total obtenu par le joueur, toutes villes confondues. */
    count: number;
    /** Nombre obtenu dans la ville demandée, null si aucune ville n'a été demandée. */
    countInTown?: number | null;
}

export interface UserPictosDTO {
    /** Date du dernier import des pictos du joueur, null s'il n'a jamais été fait. */
    historyImportedAt?: string | null;
    pictos: UserPictoDTO[];
}
