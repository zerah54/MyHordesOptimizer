import { Moment } from 'moment';
import moment from 'moment-timezone';
import { BANK_KEY, EXTERNAL_APP_ID_KEY, ITEMS_KEY, RUINS_KEY, TOKEN_KEY, TOWN_KEY, USER_KEY } from '../../_abstract_model/const';
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
import { LocalStorageService } from '../services/localstorage.service';
import { isValidToken } from './token.util';

export function setUser(user: Me | null, local_storage: LocalStorageService): void {
    local_storage?.setItem(USER_KEY, user ? JSON.stringify(user) : '');
}

export function getUser(local_storage: LocalStorageService): Me {
    const user: string | null = local_storage?.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
}

export function getUserId(local_storage: LocalStorageService): number | null {
    const user_id: number | undefined = getUser(local_storage)?.id;
    return user_id ? +user_id : null;
}

export function getExternalAppId(local_storage: LocalStorageService): string | null {
    return local_storage?.getItem(EXTERNAL_APP_ID_KEY);
}

export function setExternalAppId(id: string | null, local_storage: LocalStorageService): void {
    local_storage?.setItem(EXTERNAL_APP_ID_KEY, id ? id : '');
}

export function getTown(local_storage: LocalStorageService): TownDetails | null {
    const town: string | null = local_storage?.getItem(TOWN_KEY);
    return town ? JSON.parse(town) : null;
}

export function setTown(town: TownDetails | null, local_storage: LocalStorageService): void {
    local_storage?.setItem(TOWN_KEY, town ? JSON.stringify(town) : '');
}

export function getItemsWithExpirationDate(local_storage: LocalStorageService): Item[] {
    const local_storage_item: string | null = local_storage?.getItem(ITEMS_KEY) || '';
    const element_with_expiration: ElementWithExpiration<ItemDTO[]> = local_storage_item ? JSON.parse(local_storage_item) : undefined;
    if (!element_with_expiration || moment(element_with_expiration.expire_at).isBefore(moment())) {
        return [];
    } else {
        return dtoToModelArray(Item, element_with_expiration.element);
    }
}

export function setItemsWithExpirationDate(items: Item[], local_storage: LocalStorageService): void {
    const element_with_expiration: ElementWithExpiration<ItemDTO[] | null> = {
        expire_at: moment().utc().tz('Europe/Paris').endOf('day'),
        element: modelToDtoArray(items)
    };
    local_storage?.setItem(ITEMS_KEY, JSON.stringify(element_with_expiration));
}

export function getBankWithExpirationDate(local_storage: LocalStorageService): BankInfo | undefined {
    const local_storage_item: string | null = local_storage?.getItem(BANK_KEY) || '';
    const element_with_expiration: ElementWithExpiration<BankInfoDTO> = local_storage_item ? JSON.parse(local_storage_item) : undefined;
    if (!element_with_expiration || moment(element_with_expiration.expire_at).isBefore(moment())) {
        return undefined;
    } else {
        return new BankInfo(element_with_expiration.element);
    }
}

export function setBankWithExpirationDate(bank: BankInfo, local_storage: LocalStorageService): void {
    const element_with_expiration: ElementWithExpiration<BankInfoDTO | null> = {
        expire_at: moment().utc().tz('Europe/Paris').endOf('day'),
        element: bank.modelToDto()
    };
    local_storage?.setItem(BANK_KEY, JSON.stringify(element_with_expiration));
}

export function getRuinsWithExpirationDate(local_storage: LocalStorageService): Ruin[] {
    const local_storage_item: string | null = local_storage?.getItem(RUINS_KEY) || '';
    const element_with_expiration: ElementWithExpiration<RuinDTO[]> = local_storage_item ? JSON.parse(local_storage_item) : undefined;
    if (!element_with_expiration || moment(element_with_expiration.expire_at).isBefore(moment())) {
        return [];
    } else {
        return dtoToModelArray(Ruin, element_with_expiration.element);
    }
}

export function setRuinsWithExpirationDate(items: Ruin[], local_storage: LocalStorageService): void {
    const element_with_expiration: ElementWithExpiration<RuinDTO[] | null> = {
        expire_at: moment().utc().tz('Europe/Paris').endOf('day'),
        element: modelToDtoArray(items)
    };
    local_storage?.setItem(RUINS_KEY, JSON.stringify(element_with_expiration));
}


export function getTokenWithMeWithExpirationDate(local_storage: LocalStorageService): TokenWithMe | null {
    const local_storage_item: string | null = local_storage.getItem(TOKEN_KEY) || '';
    const element_with_expiration: ElementWithExpiration<TokenWithMeDTO> = local_storage_item ? JSON.parse(local_storage_item) : undefined;
    if (!element_with_expiration) return null;
    if (!isValidToken(new TokenWithMe(element_with_expiration.element))) {
        return null;
    } else {
        return new TokenWithMe(element_with_expiration.element);
    }
}

export function setTokenWithMeWithExpirationDate(token: TokenWithMe, local_storage: LocalStorageService): void {
    const element_with_expiration: ElementWithExpiration<TokenWithMeDTO | null> = {
        expire_at: moment(token.token.valid_to),
        element: token.modelToDto()
    };
    local_storage?.setItem(TOKEN_KEY, JSON.stringify(element_with_expiration));
}

interface ElementWithExpiration<T> {
    expire_at: Moment;
    element: T;
}
