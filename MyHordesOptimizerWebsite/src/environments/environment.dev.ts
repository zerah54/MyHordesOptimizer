import { FirebaseOptions } from '@firebase/app';

export const environment: Environment = {
    production: true,
    api_url: 'https://api.myhordesoptimizer.fr/dev',
    website_url: 'https://myhordes-optimizer-dev.web.app/',
    firebase_config: {
        apiKey: 'AIzaSyB3H--KamQP_FZfFgFgrGXHpaa9msDqp50',
        authDomain: 'myhordes-optimizer-dev.firebaseapp.com',
        projectId: 'myhordes-optimizer-dev',
        storageBucket: 'myhordes-optimizer-dev.appspot.com',
        messagingSenderId: '711281495109',
        appId: '1:711281495109:web:eb6a5d2e2b110a2b12672c'
    }
};

interface Environment {
    production: boolean;
    api_url: string;
    website_url: string;
    firebase_config: FirebaseOptions;
}
