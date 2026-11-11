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

export type TownTypeId = 'RNE' | 'PANDE' | 'RE' | 'CUSTOM';
export type TownState = 'NORMAL' | 'CHAOS' | 'DEVASTED' | 'FINISHED';
export type TownPhase = 'ALPHA' | 'BETA' | 'IMPORT' | 'NATIVE';

export type ExpeditionOrderType = 'checkbox' | 'text';

/** Comparaison de l'exigence de PE d'une place : au moins, au plus ou exactement. */
export type SpRequirementOperator = 'min' | 'max' | 'exact';

/** Consigne typée (`ExpeditionOrderKinds` côté API) ; une consigne sans type est un texte libre. */
export type ExpeditionOrderKind = 'pick' | 'drop' | 'use' | 'clear' | 'explore' | 'excavate' | 'camp' | 'hero' | 'wait';

/** Ce que la copie d'une expédition reprend, en plus de ses places. */
export interface ExpeditionDuplicateChoices {
    keepRoute: boolean;
    keepGeneralOrders: boolean;
    keepRouteOrders: boolean;
}

export interface ListForAddRemove {
    label: string;
    list: (Item | StatusEnum)[];
    /** Quantité de chaque objet de la liste, par id (sur la carte, en banque…) : affichée à côté de son icône
     *  dans le menu d'ajout, qui propose alors un tri par quantité. */
    counts?: ReadonlyMap<number, number>;
}

/** Groupe proposé par le segment « Groupes » du menu d'ajout. */
export interface AddMenuGroup {
    /** `game:<clé>` ou `user:<id>` */
    key: string;
    label: string;
    /** Rubrique : `game` (groupes du jeu) ou `user` (mes groupes) */
    section: string;
    items: Item[];
    /** Objets du groupe déjà présents dans la zone d'ajout */
    placed_item_ids: ReadonlySet<number>;
    /** Modifiable et supprimable (⋮) */
    manageable: boolean;
}

export type LogLevel = 'Verbose' | 'Debug' | 'Information' | 'Warning' | 'Error' | 'Fatal';
