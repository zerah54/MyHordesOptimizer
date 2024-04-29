import { ComponentType } from '@angular/cdk/overlay';
import { ModuleWithProviders, Type } from '@angular/core';
import { StatusEnum } from '../enum/status.enum';
import { Item } from './item.class';

export type Modules = Type<unknown>[] | ModuleWithProviders<unknown>[];
export type Components = ComponentType<unknown>[] | Type<unknown>[];
export type Imports = (readonly unknown[] | Type<unknown>)[];

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

export type ExpeditionOrderType = 'checkbox' | 'text';

export interface ListForAddRemove {
    label: string;
    list: (Item | StatusEnum)[];
}
