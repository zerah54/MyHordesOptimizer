import moment, { Moment } from 'moment';

import { BankVersionDTO } from '../dto/bank-version.dto';

export class BankVersion {
    public day: number;
    public last_update_id: number;
    public update_time: Moment;
    public user_name: string | null;

    /** Construit la version depuis le DTO, heure lue en UTC. */
    public constructor(dto: BankVersionDTO) {
        this.day = dto.day;
        this.last_update_id = dto.lastUpdateId;
        this.update_time = moment.utc(dto.updateTime);
        this.user_name = dto.userName;
    }
}
