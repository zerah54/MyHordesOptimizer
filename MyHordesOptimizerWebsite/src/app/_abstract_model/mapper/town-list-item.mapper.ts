import { TownListItemDTO, TownPublicCitizenDTO } from '../dto/town-list-item.dto';
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
            citizens: (dto.citizens ?? []).map((citizen_dto: TownPublicCitizenDTO): TownPublicCitizen => ({
                id: citizen_dto.id,
                name: citizen_dto.name,
                deathTypeId: citizen_dto.deathTypeId,
            })),
        };
    }
}
