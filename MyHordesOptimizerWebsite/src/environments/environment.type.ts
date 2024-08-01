import { FirebaseOptions } from '@firebase/app';

export interface Environment {
    production: boolean;
    api_url: string;
    website_url: string;
    firebase_config: FirebaseOptions;
}
