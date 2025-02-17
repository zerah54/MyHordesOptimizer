import { FirebaseOptions } from '@firebase/app';

export const environment: Environment = {
    production: true,
    api_url: 'https://api.myhordesoptimizer.fr',
    website_url: 'https://myhordes-optimizer.web.app/',
    myhordes_url: 'https://myhordes.eu/',
    myhordes_app_id: 22,
    firebase_config: {
        apiKey: 'AIzaSyCnRCJ-FfBIeeYk4NkQ9SSz9oMOYt_VIqE',
        authDomain: 'myhordes-optimizer.firebaseapp.com',
        projectId: 'myhordes-optimizer',
        storageBucket: 'myhordes-optimizer.appspot.com',
        messagingSenderId: '452593583285',
        appId: '1:452593583285:web:c519bc58c71132429beafc',
        measurementId: 'G-8TJ97WXDZR'
    }
};

interface Environment {
    production: boolean;
    api_url: string;
    website_url: string;
    myhordes_url: string;
    myhordes_app_id: number;
    firebase_config: FirebaseOptions;
}
