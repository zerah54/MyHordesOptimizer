import { ToolsToUpdate } from './../types/types';
import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { getExternalAppId, getUserId, setUserId } from 'src/app/shared/utilities/localstorage-utilities';
import { GlobalServices } from './global.services';

const API_URL: string = 'https://myhordesoptimizerapi.azurewebsites.net/';

@Injectable()
export class ApiServices extends GlobalServices {

    constructor(private http: HttpClient) {
        super(http);
    }

    public getItems() {

    }

    /** Récupère l'identifiant de citoyen */
    public getMe(): void {
        super.get<{id: number}>(API_URL + 'myhordesfetcher/me?userKey=' + getExternalAppId())
            .subscribe((response: HttpResponse<{id: number}>) => {
                setUserId(response.body ? response.body.id : null);
            })
    }

    /** Récupère les informations de la ville */
    public getTown() {
        super.get<any>(API_URL + 'myhordesfetcher/town?userKey=' + getExternalAppId())
            .subscribe(
                (response: HttpResponse<any>) => { },
                (error: HttpErrorResponse) => {
                    console.error(`Erreur lors de l'appel`)
                }
            )
    }

    /** Met à jour les outils externes */
    public updateExternalTools() {
        let tools_to_update: ToolsToUpdate = {
            isBigBrothHordes: true,
            isFataMorgana: true,
            isGestHordes: true
        };

        super.post<any>(API_URL + 'externaltools/update?userKey=' + getExternalAppId() + '&userId=' + getUserId(), tools_to_update)
            .subscribe(
                (response: HttpResponse<any>) => { },
                (error: HttpErrorResponse) => {
                    console.error(`Erreur lors de l'appel`)
                }
            )
    }
}

