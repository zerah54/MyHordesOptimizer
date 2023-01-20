// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
    production: false,
    // api_url: 'https://api.myhordesoptimizer.fr',
    api_url: 'https://myhordesoptimizerapi.azurewebsites.net',
    firebase_config: {
        apiKey: "AIzaSyB3H--KamQP_FZfFgFgrGXHpaa9msDqp50",
        authDomain: "myhordes-optimizer-dev.firebaseapp.com",
        projectId: "myhordes-optimizer-dev",
        storageBucket: "myhordes-optimizer-dev.appspot.com",
        messagingSenderId: "711281495109",
        appId: "1:711281495109:web:eb6a5d2e2b110a2b12672c"
    }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
