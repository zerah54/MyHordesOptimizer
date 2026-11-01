import { MapThemeColors } from '../types/map-theme.class';

export interface MapThemeDTO {
    id: number;
    name: string;
    colors: MapThemeColors;
    updatedAt: string;
}

export interface MapThemeActiveDTO {
    themeId: number | null;
}

export interface MapThemesDTO {
    themes: MapThemeDTO[];
    active: MapThemeActiveDTO;
}
