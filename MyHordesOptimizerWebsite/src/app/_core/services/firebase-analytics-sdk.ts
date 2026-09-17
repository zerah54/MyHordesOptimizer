import { InjectionToken } from '@angular/core';
import { Analytics, getAnalytics, isSupported, logEvent } from 'firebase/analytics';
import { FirebaseApp } from 'firebase/app';

/** Sous-ensemble du SDK Firebase Analytics modulaire utilisé par AnalyticsService, isolé derrière un token pour être substituable en test */
export interface FirebaseAnalyticsSdk {
    getAnalytics(app: FirebaseApp): Analytics;
    isSupported(): Promise<boolean>;
    logEvent(analytics: Analytics, eventName: string, eventParams?: Record<string, unknown>): void;
}

/** Fournit le SDK Firebase Analytics réel par défaut ; substitué par un mock dans les tests */
export const FIREBASE_ANALYTICS_SDK = new InjectionToken<FirebaseAnalyticsSdk>('FIREBASE_ANALYTICS_SDK', {
    providedIn: 'root',
    factory: (): FirebaseAnalyticsSdk => ({ getAnalytics, isSupported, logEvent })
});
