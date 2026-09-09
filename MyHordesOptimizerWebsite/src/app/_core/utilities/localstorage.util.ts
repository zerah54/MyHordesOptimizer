import { computed, Signal, signal, WritableSignal } from '@angular/core';
import { Moment } from 'moment';
import moment from 'moment-timezone';

import { BANK_KEY, EXTERNAL_APP_ID_KEY, ITEMS_KEY, RUINS_KEY, TOKEN_KEY } from '../../_abstract_model/const';
import { BankInfoDTO } from '../../_abstract_model/dto/bank-info.dto';
import { ItemDTO } from '../../_abstract_model/dto/item.dto';
import { RuinDTO } from '../../_abstract_model/dto/ruin.dto';
import { TokenWithMeDTO } from '../../_abstract_model/dto/token-with-me.dto';
import { dtoToModelArray, modelToDtoArray } from '../../_abstract_model/types/_common.class';
import { BankInfo } from '../../_abstract_model/types/bank-info.class';
import { Item } from '../../_abstract_model/types/item.class';
import { Me } from '../../_abstract_model/types/me.class';
import { Ruin } from '../../_abstract_model/types/ruin.class';
import { TokenWithMe } from '../../_abstract_model/types/token-with-me.class';
import { TownDetails } from '../../_abstract_model/types/town-details.class';
import { isValidToken } from './token.util';

/** État de session en mémoire : dérivé de la dernière réponse de /Authentication/Token, remis à
 * zéro à chaque rechargement de page — jamais persisté, sur le même principe que `observed_town`
 * ci-dessous. Signal (et non simple variable) pour que les consommateurs construits avant la
 * résolution du getMe() initial (ex. HeaderComponent, rendu hors du garde `@if (ready())`) se
 * resynchronisent automatiquement au lieu de rester figés sur leur valeur de construction. */
const current_me: WritableSignal<Me | null> = signal(null);

export function setUser(user: Me | null): void {
    current_me.set(user);
}

export function getUser(): Me | null {
    return current_me();
}

/** Signal en lecture seule pour les composants qui doivent refléter les changements d'utilisateur
 * sans les recopier dans un signal local figé à la construction. */
export const user: Signal<Me | null> = current_me.asReadonly();

export function getUserId(): number | null {
    const user_id: number | undefined = getUser()?.id;
    return user_id ? +user_id : null;
}

export function getExternalAppId(): string | null {
    return localStorage.getItem(EXTERNAL_APP_ID_KEY);
}

export function setExternalAppId(id: string | null): void {
    localStorage.setItem(EXTERNAL_APP_ID_KEY, id ? id : '');
}

/** Ville observée (mode observateur) : quand définie, elle remplace la ville du localStorage pour tous les consommateurs de getTown(). Gérée exclusivement par TownContextService. */
const observed_town: WritableSignal<TownDetails | null> = signal(null);

export function setObservedTown(town: TownDetails | null): void {
    observed_town.set(town);
}

const current_town: WritableSignal<TownDetails | null> = signal(null);

export function getTown(): TownDetails | null {
    return observed_town() ?? current_town();
}

export function setTown(town: TownDetails | null): void {
    current_town.set(town);
}

/** Signal en lecture seule, même principe que {@link user} : reflète `observed_town`/`current_town`
 * sans recopie figée à la construction. */
export const town: Signal<TownDetails | null> = computed(() => observed_town() ?? current_town());

export function getItemsWithExpirationDate(): Item[] {
    const local_storage: string | null = localStorage.getItem(ITEMS_KEY) || '';
    const element_with_expiration: ElementWithExpiration<ItemDTO[]> = local_storage ? JSON.parse(local_storage) : undefined;
    if (!element_with_expiration || moment(element_with_expiration.expire_at).isBefore(moment())) {
        return [];
    } else {
        return dtoToModelArray(Item, element_with_expiration.element);
    }
}

export function setItemsWithExpirationDate(items: Item[]): void {
    const element_with_expiration: ElementWithExpiration<ItemDTO[] | null> = {
        expire_at: moment().utc().tz('Europe/Paris').endOf('day'),
        element: modelToDtoArray(items)
    };
    localStorage.setItem(ITEMS_KEY, JSON.stringify(element_with_expiration));
}

export function getBankWithExpirationDate(): BankInfo | undefined {
    const local_storage: string | null = localStorage.getItem(BANK_KEY) || '';
    const element_with_expiration: ElementWithExpiration<BankInfoDTO> = local_storage ? JSON.parse(local_storage) : undefined;
    if (!element_with_expiration || moment(element_with_expiration.expire_at).isBefore(moment())) {
        return undefined;
    } else {
        return new BankInfo(element_with_expiration.element);
    }
}

export function setBankWithExpirationDate(bank: BankInfo): void {
    const element_with_expiration: ElementWithExpiration<BankInfoDTO | null> = {
        expire_at: moment().utc().tz('Europe/Paris').endOf('day'),
        element: bank.modelToDto()
    };
    localStorage.setItem(BANK_KEY, JSON.stringify(element_with_expiration));
}

export function getRuinsWithExpirationDate(): Ruin[] {
    const local_storage: string | null = localStorage.getItem(RUINS_KEY) || '';
    const element_with_expiration: ElementWithExpiration<RuinDTO[]> = local_storage ? JSON.parse(local_storage) : undefined;
    if (!element_with_expiration || moment(element_with_expiration.expire_at).isBefore(moment())) {
        return [];
    } else {
        return dtoToModelArray(Ruin, element_with_expiration.element);
    }
}

export function setRuinsWithExpirationDate(items: Ruin[]): void {
    const element_with_expiration: ElementWithExpiration<RuinDTO[] | null> = {
        expire_at: moment().utc().tz('Europe/Paris').endOf('day'),
        element: modelToDtoArray(items)
    };
    localStorage.setItem(RUINS_KEY, JSON.stringify(element_with_expiration));
}


export function getTokenWithMeWithExpirationDate(): TokenWithMe | null {
    const local_storage: string | null = localStorage.getItem(TOKEN_KEY) || '';
    const element_with_expiration: ElementWithExpiration<TokenWithMeDTO> = local_storage ? JSON.parse(local_storage) : undefined;
    if (!element_with_expiration) return null;
    if (!isValidToken(new TokenWithMe(element_with_expiration.element))) {
        return null;
    } else {
        return new TokenWithMe(element_with_expiration.element);
    }
}

export function setTokenWithMeWithExpirationDate(token?: TokenWithMe): void {
    if (token) {
        const element_with_expiration: ElementWithExpiration<TokenWithMeDTO | null> = {
            expire_at: moment(token.token.valid_to),
            element: token.modelToDto()
        };
        localStorage.setItem(TOKEN_KEY, JSON.stringify(element_with_expiration));
    } else {
        localStorage.removeItem(TOKEN_KEY);
    }
}

interface ElementWithExpiration<T> {
    expire_at: Moment;
    element: T;
}
