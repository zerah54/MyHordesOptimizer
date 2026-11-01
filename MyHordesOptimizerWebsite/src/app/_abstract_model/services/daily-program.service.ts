import { HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { DailyProgramFactsDTO } from '../dto/daily-program-facts.dto';
import { GlobalService } from './_global.service';

@Injectable({ providedIn: 'root' })
export class DailyProgramService extends GlobalService {

    /** Récupère les faits du programme du jour pour la ville et le jour donnés. */
    public getFacts(map_id: number, day: number): Observable<DailyProgramFactsDTO> {
        return super.get<DailyProgramFactsDTO>(this.API_URL + `/dailyProgram/${map_id}/${day}`, true, undefined, true)
            .pipe(map((response: HttpResponse<DailyProgramFactsDTO>): DailyProgramFactsDTO => <DailyProgramFactsDTO>response.body));
    }
}
