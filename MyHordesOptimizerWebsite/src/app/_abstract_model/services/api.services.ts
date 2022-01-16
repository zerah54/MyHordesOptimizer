import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';
import { getExternalAppId, getUserId, setUserId } from 'src/app/shared/utilities/localstorage-utilities';
import { ItemDTO } from '../dto/item.dto';
import { ToolsToUpdate } from '../types/_types';
import { BankInfoDTO, BankInfoDtoTransform } from './../dto/bank-info.dto';
import { ItemDtoTransform } from './../dto/item.dto';
import { BankInfo } from './../types/bank-info.class';
import { Item } from './../types/item.class';
import { GlobalServices } from './global.services';

const API_URL: string = 'https://myhordesoptimizerapi.azurewebsites.net/';

@Injectable()
export class ApiServices extends GlobalServices {

    constructor(private http: HttpClient) {
        super(http);
    }

    public getItems(): Observable<Item[]> {
        return new Observable((sub: Subscriber<Item[]>) => {
            super.get<ItemDTO[]>(API_URL + 'myhordesfetcher/item?userKey=' + getExternalAppId())
                .subscribe({
                    next: (response: ItemDTO[]) => sub.next(ItemDtoTransform.transformDtoArray(response))
                });
        });
    }

    /** Récupère l'identifiant de citoyen */
    public getMe(): void {
        super.get<{ id: number }>(API_URL + 'myhordesfetcher/me?userKey=' + getExternalAppId())
            .subscribe((response: { id: number } | null) => {
                setUserId(response ? response.id : null);
            })
    }

    /** Récupère les informations de la ville */
    public getTown(): Observable<any> {
        return new Observable((sub: Subscriber<any>) => {
            super.get<any>(API_URL + 'myhordesfetcher/town?userKey=' + getExternalAppId())
                .subscribe({
                    next: (response: any) => sub.next(response)
                });
        });
    }

    /** Récupère les informations de la banque */
    public getBank(): Observable<BankInfo> {
        return new Observable((sub: Subscriber<BankInfo>) => {
            super.get<BankInfoDTO>(API_URL + 'myhordesfetcher/bank?userKey=' + getExternalAppId())
                .subscribe({
                    next: (response: BankInfoDTO) => sub.next(BankInfoDtoTransform.dtoToClass(response))
                });
        });
    }

    /** Met à jour les outils externes */
    public updateExternalTools() {
        let tools_to_update: ToolsToUpdate = {
            isBigBrothHordes: true,
            isFataMorgana: true,
            isGestHordes: true
        };

        super.post<any>(API_URL + 'externaltools/update?userKey=' + getExternalAppId() + '&userId=' + getUserId(), tools_to_update)
            .subscribe({
                next: (response: any) => { }
            });
    }
}

