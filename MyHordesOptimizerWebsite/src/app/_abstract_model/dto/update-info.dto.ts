import * as moment from 'moment';
import { UpdateInfo } from './../types/update-info.class';

export class UpdateInfoDtoTransform {

    public static dtoToClass(dto: UpdateInfoDTO | null): UpdateInfo {
        return {
            update_time: dto ? moment(dto.updateTime) : null,
            user_id: dto ? +dto.userId : null,
            username: dto ? dto.userName : null
        };
    }
}

export interface UpdateInfoDTO {
    updateTime: string;
    userId: string;
    userName: string;
}
