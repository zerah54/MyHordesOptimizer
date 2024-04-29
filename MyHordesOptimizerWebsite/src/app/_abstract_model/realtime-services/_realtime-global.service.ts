import { inject, Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { IHttpConnectionOptions } from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { getTokenWithMeWithExpirationDate } from '../../shared/utilities/localstorage.util';
import { isValidToken } from '../../shared/utilities/token.util';
import { TokenWithMe } from '../types/token-with-me.class';

@Injectable({
    providedIn: 'root'
})
export abstract class RealtimeGlobalService {
    protected readonly HUB_URL: string = environment.api_url + '/hub/';
    protected hubConnection!: signalR.HubConnection;

    protected options: IHttpConnectionOptions = {
        accessTokenFactory: () => {
            const token: TokenWithMe | null = getTokenWithMeWithExpirationDate();
            if (isValidToken(token)) {
                return token?.token.access_token ?? '';
            }
            // TODO recharger le token si il n'est pas valide
            return token?.token.access_token ?? '';
        },
        headers: {
            'Mho-Origin': 'website'
        }
        // skipNegotiation: true,
        // transport: HttpTransportType.WebSockets,
    };
    protected snackbar: SnackbarService = inject(SnackbarService);

    protected async defineConnexion(part: string): Promise<void> {

        this.hubConnection = new signalR.HubConnectionBuilder()
            .withAutomaticReconnect()
            .withStatefulReconnect()
            .withUrl(this.HUB_URL + part, this.options)
            .build();

        await this.startConnexion();
    }

    protected async startConnexion(): Promise<void> {
        await this.hubConnection
            .start()
            .then(() => console.log('Connected to SignalR hub'))
            .catch((err: Error) => {
                this.snackbar.errorSnackbar($localize`Une erreur s'est produite lors de la connexion`);
                console.warn($localize`Une erreur s'est produite lors de la connexion`, err);
            });
    }

    protected async invokeHub(methodName: string, ...args: unknown[]): Promise<void> {
        if (this.hubConnection.state === 'Disconnected') {
            this.startConnexion().then(async () => {
                await this.hubConnection.invoke(methodName, ...args);
            });
        } else {
            await this.hubConnection.invoke(methodName, ...args);
        }
    }
}
