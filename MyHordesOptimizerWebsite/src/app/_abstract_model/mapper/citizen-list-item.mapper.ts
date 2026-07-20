import { CitizenListItemDTO } from '../dto/citizen-list-page.dto';
import { CitizenListItem } from '../types/citizen-list-item.model';

export class CitizenListMapper {
    public static dtoToModel(dto: CitizenListItemDTO): CitizenListItem {
        return {
            id: dto.id,
            name: dto.name,
            avatar: dto.avatar,
            nbTownsPlayed: dto.nbTownsPlayed,
            bestSurvival: dto.bestSurvival,
            lastTownId: dto.lastTownId,
            lastTownName: dto.lastTownName,
            lastTownSeason: dto.lastTownSeason,
        };
    }
}
