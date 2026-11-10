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

/** Attentes entre deux essais de connexion ratés ; la dernière se répète. */
const RETRY_DELAYS_MS: readonly number[] = [1000, 2000, 5000, 10000];

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
                const refreshed: TokenWithMe = await firstValueFrom(this.authentication_service.getToken(true, true));
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
    /** Essais de connexion ratés d'affilée : règle l'attente avant le suivant et n'annonce que le premier. */
    private failed_starts: number = 0;
    /** (Re)connexion en cours, partagée par tous les appelants. */
    private connecting: Promise<void> | null = null;

    protected async defineConnexion(part: string): Promise<void> {

        this.hubConnection = new signalR.HubConnectionBuilder()
            .withAutomaticReconnect()
            .withStatefulReconnect()
            .withUrl(this.HUB_URL + part, this.options)
            .build();

        await this.startConnexion();
    }

    /** Ouvre la connexion ; un seul message d'erreur par série d'échecs, réarmé par une connexion réussie. */
    private async startConnexion(): Promise<void> {
        try {
            await this.hubConnection.start();
            this.failed_starts = 0;
            console.log('Connected to SignalR hub');
        } catch (err: unknown) {
            if (this.failed_starts === 0) {
                this.snackbar.errorSnackbar($localize`Une erreur s'est produite lors de la connexion`);
            }
            this.failed_starts++;
            console.warn($localize`Une erreur s'est produite lors de la connexion`, err);
        }
    }

    /** Attend que la connexion soit établie, en la relançant si elle est fermée ; une seule attente partagée par tous les appelants. */
    protected ensureConnected(): Promise<void> {
        if (this.hubConnection.state === 'Connected') {
            return Promise.resolve();
        }
        this.connecting ??= this.waitConnected().finally((): void => {
            this.connecting = null;
        });
        return this.connecting;
    }

    /** Appelle une méthode du hub, après (re)connexion si besoin, et renvoie son résultat éventuel. */
    protected async invokeHub<T = void>(methodName: string, ...args: unknown[]): Promise<T> {
        await this.ensureConnected();
        return await this.hubConnection.invoke<T>(methodName, ...args);
    }

    /** Relance la connexion jusqu'à ce qu'elle soit établie, en espaçant les essais ratés. */
    private async waitConnected(): Promise<void> {
        while (this.hubConnection.state !== 'Connected') {
            if (this.hubConnection.state === 'Disconnected') {
                await this.startConnexion();
                if (this.hubConnection.state === 'Disconnected') {
                    await this.sleep(RETRY_DELAYS_MS[Math.min(Math.max(this.failed_starts, 1), RETRY_DELAYS_MS.length) - 1]);
                }
            } else {
                // 'Connecting' ou 'Reconnecting' : invoke() lève si on l'appelle hors de l'état 'Connected'.
                await this.sleep(100);
            }
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve: () => void) => setTimeout(resolve, ms));
    }
}
