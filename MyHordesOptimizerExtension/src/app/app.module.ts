import { ContentScriptModule } from '../content-script/content-script.module';
import { BackgroundModule } from './background/background.module';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ToolboxModule } from './toolbox/toolbox.module';
import { SharedModule } from './shared/shared.module';

let modules: any[] = [
    ToolboxModule, BackgroundModule
];

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        SharedModule,
        AppRoutingModule,
        ContentScriptModule,
        ...modules
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
