export interface CitizenStateDTO {
    ap: number;
    sp: number;
    wounded: boolean;
    isEclaireur: boolean;
    hasBike: boolean;
    hasShoes: boolean;
    walkingDistance: number;
    isDead: boolean;
    statuses: string[];
    hasShield?: boolean;
    hasDefenceCpItem?: boolean;
    isGuide?: boolean;
    zoneCitizenCount?: number;
    hasCleanPdcPerk?: boolean;
    hasHydratedPdcPerk?: boolean;
    hasSoberPdcPerk?: boolean;
    hasBaseZoneControlPerk?: boolean;
    isRoleGhoul?: boolean;
    /** Calculé côté serveur — toujours présent en sortie, ignoré si fourni en entrée. */
    pdc?: number;
}
