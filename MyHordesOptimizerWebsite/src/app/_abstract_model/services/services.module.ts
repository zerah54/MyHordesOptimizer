import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { Components, Modules } from '../types/_types';
import { ApiService } from './api.service';
import { AuthenticationService } from './authentication.service';
import { CampingService } from './camping.service';
import { DigsService } from './digs.service';
import { WishlistService } from './wishlist.service';

const angular_modules: Modules = [HttpClientModule];
const services: Components = [ApiService, DigsService, WishlistService, AuthenticationService, CampingService];

@NgModule({
    imports: [
        ...angular_modules,
    ],
    exports: [
        ...angular_modules,
    ],
    providers: [
        ...services,
    ]
})

export class ServicesModule {
}
