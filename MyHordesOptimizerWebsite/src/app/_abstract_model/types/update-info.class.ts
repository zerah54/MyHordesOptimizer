import { UpdateInfoDTO } from './../dto/update-info.dto';
import { Moment } from "moment";
import { CommonModel } from "./_common.class";
import * as moment from 'moment';

export class UpdateInfo extends CommonModel<UpdateInfoDTO> {
    public update_time!: Moment;
    public user_id!: string;
    public username!: string;

    constructor(dto?: UpdateInfoDTO | null) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): UpdateInfoDTO {
        return {
            updateTime: this.update_time.toDate().toDateString(),
            userId: this.user_id,
            userName!: this.username
        }

    };

    protected dtoToModel(dto?: UpdateInfoDTO | null): void {
        if (dto) {
            this.update_time = moment(dto.updateTime);
            this.user_id = dto.userId;
            this.username = dto.userName;
        }
    };

}
