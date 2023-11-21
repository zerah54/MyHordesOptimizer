import { NgModule } from '@angular/core';
import { Modules } from '../_abstract_model/types/_types';
import { SharedModule } from '../shared/shared.module';
import { DiscordBotTutorialsModule } from './discord-bot/discord-bot-tutorials.module';
import { ScriptTutorialsModule } from './script/script-tutorials.module';
import { SiteTutorialsModule } from './site/script-tutorials.module';


const modules: Modules = [DiscordBotTutorialsModule, ScriptTutorialsModule, SiteTutorialsModule];


@NgModule({
    imports: [SharedModule, ...modules],
    exports: [...modules],
})
export class TutorialsModule {
}
