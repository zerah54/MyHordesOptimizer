/** Membre d'une pré-ville. */
export interface PreTownMember {
    idUser: number;
    name: string;
    isOrganizer: boolean;
}

/** Pré-ville complète, vue par un de ses membres. */
export interface PreTown {
    preTownId: number;
    /** Pseudo-mapId de la ville fantôme. */
    mapId: number;
    alias: string;
    members: PreTownMember[];
    isOrganizer: boolean;
    isLinked: boolean;
    linkedMapId: number | null;
    linkedAt: string | null;
    canUnlink: boolean;
    /** Nombre de citoyens simulés pour chiffrer Chantiers et Veilles. */
    simulatedCitizens: number;
}

/** Ligne de la liste « Mes pré-villes ». */
export interface PreTownSummary {
    preTownId: number;
    mapId: number;
    alias: string;
    isOrganizer: boolean;
    /** `false` tant que l'utilisateur n'a pas ouvert la pré-ville. */
    seen: boolean;
    isLinked: boolean;
    memberCount: number;
}

/** Bilan d'une liaison : lignes ajoutées, lignes déjà présentes (dont les notes). */
export interface PreTownLinkResult {
    added: number;
    skipped: number;
    skippedNotes: number;
}

/** Liaison simulée vers la ville actuelle de l'utilisateur ; rien n'est enregistré. */
export interface PreTownLinkPreview extends PreTownLinkResult {
    mapId: number;
    townName: string | null;
}
