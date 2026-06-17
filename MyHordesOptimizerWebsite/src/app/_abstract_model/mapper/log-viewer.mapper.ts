import { LogPageResultDTO } from '../dto/log-viewer.dto';
import { LogPageResult } from '../types/log-viewer.model';

export class LogViewerMapper {

    public static dtoToModel(dto: LogPageResultDTO | null): LogPageResult | null {
        return dto;
    }
}
