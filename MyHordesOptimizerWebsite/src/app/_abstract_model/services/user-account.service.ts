import { HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { UserAccountPublicDTO } from '../dto/user-account.dto';
import { GlobalService } from './_global.service';

@Injectable({ providedIn: 'root' })
export class UserAccountService extends GlobalService {

    public getPublicProfile(userId: number): Observable<UserAccountPublicDTO> {
        return this.get<UserAccountPublicDTO>(`${this.API_URL}/UserAccount/${userId}`).pipe(
            map((response: HttpResponse<UserAccountPublicDTO>) => response.body!)
        );
    }
}
