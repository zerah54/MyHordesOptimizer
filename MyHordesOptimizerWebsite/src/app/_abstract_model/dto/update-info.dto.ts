import * as moment from 'moment';
import { UpdateInfo } from './../types/update-info.class';

export class UpdateInfoDtoTransform {

    public static dtoToClass(dto: UpdateInfoDTO): UpdateInfo {
        return {
            update_time: moment(dto.updateTime),
            user_id: +dto.userId,
            username: dto.userName
        };
    }
}

export interface UpdateInfoDTO {
    updateTime: string;
    userId: string;
    userName: string;
}
