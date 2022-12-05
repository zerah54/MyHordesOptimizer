export interface ToolsToUpdate {
    isBigBrothHordes: 'none' | 'cell' | 'api';
    isFataMorgana: 'none' | 'cell' | 'api';
    isGestHordes: 'none' | 'cell' | 'api';
};

export type I18nLabels = Dictionary<string>;

export interface Dictionary<T> {
    [key: string | number]: T;
}
