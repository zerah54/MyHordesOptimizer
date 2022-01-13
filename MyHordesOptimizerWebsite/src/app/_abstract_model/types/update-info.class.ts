import { Moment } from "moment";

export interface UpdateInfo {
    update_time: Moment;
    user_id: number;
    username: string;
}
