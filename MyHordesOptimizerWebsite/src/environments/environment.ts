import { Environment } from './environment.type';

export const environment: Environment = {
    production: false,
    // api_url: 'https://api.myhordesoptimizer.fr',
    // api_url: 'https://api.myhordesoptimizer.fr/dev',
    api_url: '/api',
    website_url: 'http://localhost:4200/',
    firebase_config: {}
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
