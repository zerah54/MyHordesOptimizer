import { Moment } from "moment";
import { Common } from "./_common.class";

export interface UpdateInfo extends Common {
    update_time: Moment | null;
    user_id: number | null;
    username: string | null;
}
