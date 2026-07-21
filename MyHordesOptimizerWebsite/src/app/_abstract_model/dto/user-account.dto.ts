export interface UserAccountPublicDTO {
    id: number;
    userName: string;
    avatar: string | null;
    /** Date du dernier import MyHordes du joueur (pictos + villes). Null = jamais importé. */
    importedAt: string | null;
}
