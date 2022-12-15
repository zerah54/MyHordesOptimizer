import { Dictionary } from "../types/_types";
import { UpdateInfoDTO } from "./update-info.dto";

export interface HomeDTO {
    content: Dictionary<number>;
    lastUpdateInfo: UpdateInfoDTO;
}
