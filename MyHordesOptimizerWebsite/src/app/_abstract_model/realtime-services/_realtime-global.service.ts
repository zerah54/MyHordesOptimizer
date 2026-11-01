import { inject, Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { IHttpConnectionOptions } from '@microsoft/signalr';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SnackbarService } from '../../_core/services/snackbar.service';
import { getTokenWithMeWithExpirationDate } from '../../_core/utilities/localstorage.util';
import { isValidToken } from '../../_core/utilities/token.util';
import { AuthenticationService } from '../services/authentication.service';
import { TokenWithMe } from '../types/token-with-me.class';

@Injectable({
    providedIn: 'root'
})
export abstract class RealtimeGlobalService {
    protected hubConnection!: signalR.HubConnection;

    private readonly HUB_URL: string = environment.api_url + '/hub/';

    private authentication_service: AuthenticationService = inject(AuthenticationService);

    private options: IHttpConnectionOptions = {
        accessTokenFactory: async (): Promise<string> => {
            const token: TokenWithMe | null = getTokenWithMeWithExpirationDate();
            if (isValidToken(token)) {
                return token?.token.access_token ?? '';
            }
            /** Jeton expiré alors que la page reste ouverte : le rafraîchir ici, sinon la reconnexion
             * automatique boucle indéfiniment avec le même jeton périmé. */
            try {
                const refreshed: TokenWithMe = await firstValueFrom(this.authentication_service.getToken(true));
                return refreshed.token.access_token ?? '';
            } catch {
                return '';
            }
        },
        headers: {
            'Mho-Origin': 'website'
        }
        // skipNegotiation: true,
        // transport: HttpTransportType.WebSockets,
    };
    private snackbar: SnackbarService = inject(SnackbarService);

    protected async defineConnexion(part: string): Promise<void> {

        this.hubConnection = new signalR.HubConnectionBuilder()
            .withAutomaticReconnect()
            .withStatefulReconnect()
            .withUrl(this.HUB_URL + part, this.options)
            .build();

        await this.startConnexion();
    }

    private async startConnexion(): Promise<void> {
        await this.hubConnection
            .start()
            .then(() => console.log('Connected to SignalR hub'))
            .catch((err: Error) => {
                this.snackbar.errorSnackbar($localize`Une erreur s'est produite lors de la connexion`);
                console.warn($localize`Une erreur s'est produite lors de la connexion`, err);
            });
    }

    /** Appelle une méthode du hub, après (re)connexion si besoin, et renvoie son résultat éventuel. */
    protected async invokeHub<T = void>(methodName: string, ...args: unknown[]): Promise<T> {
        while (this.hubConnection.state !== 'Connected') {
            if (this.hubConnection.state === 'Disconnected') {
                await this.startConnexion();
            } else {
                // 'Connecting' ou 'Reconnecting' : invoke() lève si on l'appelle hors de l'état 'Connected'.
                await this.sleep(100);
            }
        }
        return await this.hubConnection.invoke<T>(methodName, ...args);
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve: () => void) => setTimeout(resolve, ms));
    }
}
