import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { ContentScriptModule } from './content-script/content-script.module';
import { environment } from './environments/environment';


if (environment.production) {
    enableProdMode();
}

platformBrowserDynamic().bootstrapModule(ContentScriptModule)
    .catch(err => console.error(err));

