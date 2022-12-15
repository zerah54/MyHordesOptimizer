import { Dictionary } from "../types/_types";
import { UpdateInfoDTO } from "./update-info.dto";

export interface StatusDTO {
    content: Dictionary<boolean>;
    icons: string[];
    lastUpdateInfo: UpdateInfoDTO;
}
