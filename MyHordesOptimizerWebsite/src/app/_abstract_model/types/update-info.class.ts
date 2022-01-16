import { Moment } from "moment";

export interface UpdateInfo {
    update_time: Moment | null;
    user_id: number | null;
    username: string | null;
}
