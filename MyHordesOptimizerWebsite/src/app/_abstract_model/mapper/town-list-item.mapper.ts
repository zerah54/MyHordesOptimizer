import { TownListItemDTO } from '../dto/town-list-item.dto';
import { TownListItem, TownPublicCitizen } from '../types/town-list-item.model';

export class TownListMapper {
    public static dtoToModel(dto: TownListItemDTO): TownListItem {
        return {
            id: dto.id,
            mapId: dto.mapId,
            name: dto.name,
            width: dto.width,
            height: dto.height,
            townType: dto.townType,
            season: dto.season,
            phase: dto.phase,
            language: dto.language,
            score: dto.score,
            isChaos: dto.isChaos,
            isDevasted: dto.isDevasted,
            isFinished: dto.isFinished,
            citizens: (dto.citizens ?? []).map((c): TownPublicCitizen => ({
                id: c.id,
                name: c.name,
                deathTypeId: c.deathTypeId,
            })),
        };
    }
}
