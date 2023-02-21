import * as moment from 'moment';
import { UpdateInfoDTO } from './../dto/update-info.dto';
import { CommonModel } from './_common.class';

export class UpdateInfo extends CommonModel<UpdateInfoDTO> {
    public update_time!: moment.Moment;
    public user_id!: string;
    public username!: string;
    public userkey!: string;

    constructor(dto?: UpdateInfoDTO | null) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): UpdateInfoDTO {
        return {
            updateTime: this.update_time?.toDate(),
            userId: this.user_id,
            userName: this.username,
            userKey: this.userkey
        }

    };

    protected dtoToModel(dto?: UpdateInfoDTO | null): void {
        if (dto) {
            this.update_time = moment.parseZone(dto.updateTime || Date.now()).local();
            this.user_id = dto.userId;
            this.username = dto.userName;
            this.userkey = dto.userKey;
        }
    };

}
