// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { FirebaseOptions } from '@firebase/app';

export const environment: Environment = {
    production: false,
    // api_url: 'https://api.myhordesoptimizer.fr',
    // api_url: 'https://api.myhordesoptimizer.fr/dev',
    api_url: '/api',
    website_url: 'http://localhost:4200/',
    myhordes_url: 'https://myhordes.eu/',
    myhordes_app_id: 22,
    firebase_config: {}
};

interface Environment {
    production: boolean;
    api_url: string;
    website_url: string;
    myhordes_url: string;
    myhordes_app_id: number;
    firebase_config: FirebaseOptions;
}

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
