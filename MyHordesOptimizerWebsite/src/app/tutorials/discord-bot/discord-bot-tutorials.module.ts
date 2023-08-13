import { NgModule } from '@angular/core';
import { Components } from '../../_abstract_model/types/_types';
import { SharedModule } from '../../shared/shared.module';
import { TutoDiscordBotInstallationComponent } from './tuto-discord-bot-installation/tuto-discord-bot-installation.component';


const components: Components = [
    TutoDiscordBotInstallationComponent
];


@NgModule({
    declarations: [...components],
    imports: [SharedModule],
    exports: [...components],
})
export class DiscordBotTutorialsModule {
}
