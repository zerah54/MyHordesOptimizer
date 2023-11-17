import { ComponentType } from '@angular/cdk/portal';
import { ModuleWithProviders, Type } from '@angular/core';

export type Modules = Type<unknown>[] | ModuleWithProviders<unknown>[];
export type Components = ComponentType<unknown>[] | Type<unknown>[];

export interface ToolsToUpdate {
    isBigBrothHordes: 'none' | 'cell' | 'api';
    isFataMorgana: 'none' | 'cell' | 'api';
    isGestHordes: 'none' | 'cell' | 'api';
    isMyHordesOptimizer: 'none' | 'cell' | 'api';
}

export type I18nLabels = Dictionary<string>;

export interface Dictionary<T> {
    [key: string | number]: T;
}

export type TownTypeId = 'RNE' | 'RE' | 'PANDE';
