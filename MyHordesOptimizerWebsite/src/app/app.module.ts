import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FooterModule } from './footer/footer.module';
import { NavbarModule } from './navbar/navbar.module';
import { ScriptModule } from './script/script.module';
import { LoadingInterceptor } from './shared/services/loading-interceptor.service';
import { SharedModule } from './shared/shared.module';
import { ToolsModule } from './tools/tools.module';
import { WikiModule } from './wiki/wiki.module';


let app_modules: any[] = [ScriptModule, NavbarModule, FooterModule, WikiModule, ToolsModule];
@NgModule({
    declarations: [AppComponent],
    imports: [
        SharedModule,
        AppRoutingModule,
        ...app_modules
    ],
    providers: [
        { provide: HTTP_INTERCEPTORS, useClass: LoadingInterceptor, multi: true }
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
