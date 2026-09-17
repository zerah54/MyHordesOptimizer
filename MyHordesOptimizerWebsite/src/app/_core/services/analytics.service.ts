import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { Analytics } from 'firebase/analytics';
import { FirebaseApp } from 'firebase/app';
import { filter } from 'rxjs';

import { FIREBASE_ANALYTICS_SDK, FirebaseAnalyticsSdk } from './firebase-analytics-sdk';

/**
 * Remplace `@angular/fire/analytics` (ScreenTrackingService/UserTrackingService), sans support
 * Angular 21/22 à ce jour : appelle directement le SDK Firebase modulaire.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
    private readonly sdk: FirebaseAnalyticsSdk = inject(FIREBASE_ANALYTICS_SDK);
    private readonly router: Router = inject(Router);
    private readonly title: Title = inject(Title);
    private readonly destroy_ref: DestroyRef = inject(DestroyRef);

    private analytics: Analytics | null = null;

    /**
     * Initialise Analytics pour l'app Firebase donnée, si le navigateur le supporte, et démarre le suivi de navigation.
     * Ne doit jamais rejeter : appelée depuis un `provideAppInitializer`, une exception ici bloquerait le bootstrap
     * de toute l'application (ex. config Firebase vide en local via `environment.ts`).
     */
    public async init(firebase_app: FirebaseApp): Promise<void> {
        try {
            if (!(await this.sdk.isSupported())) {
                return;
            }
            this.analytics = this.sdk.getAnalytics(firebase_app);
        } catch (error) {
            console.warn('Analytics non initialisé (config Firebase absente ou invalide) :', error);
            return;
        }

        this.router.events
            .pipe(
                filter((event): event is NavigationEnd => event instanceof NavigationEnd),
                takeUntilDestroyed(this.destroy_ref)
            )
            .subscribe((event: NavigationEnd): void => {
                this.logEvent('screen_view', { page_path: event.urlAfterRedirects, page_title: this.title.getTitle() });
            });
    }

    /** Journalise un événement Analytics ; no-op tant que init() n'a pas résolu (ou si non supporté) */
    public logEvent(name: string, params?: Record<string, unknown>): void {
        if (!this.analytics) {
            return;
        }
        this.sdk.logEvent(this.analytics, name, params);
    }
}
