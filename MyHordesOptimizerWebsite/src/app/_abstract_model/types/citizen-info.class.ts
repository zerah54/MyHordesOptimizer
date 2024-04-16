import { DictionaryUtils } from '../../shared/utilities/dictionary.util';
import { CitizenInfoDTO } from '../dto/citizen-info.dto';
import { CitizenDTO } from '../dto/citizen.dto';
import { CommonModel, dtoToModelArray, modelArrayToDictionnary } from './_common.class';
import { Citizen } from './citizen.class';
import { UpdateInfo } from './update-info.class';

export class CitizenInfo extends CommonModel<CitizenInfoDTO> {
    citizens: Citizen[] = [];
    update_info!: UpdateInfo;

    constructor(dto?: CitizenInfoDTO | null) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): CitizenInfoDTO {
        return {
            citizens: modelArrayToDictionnary(this.citizens, 'item.xml_name'),
            lastUpdateInfo: this.update_info.modelToDto()
        };
    }

    protected dtoToModel(dto?: CitizenInfoDTO | null): void {
        if (dto) {
            this.citizens = dtoToModelArray(Citizen, <CitizenDTO[]>DictionaryUtils.getValues(dto.citizens));
            this.citizens.sort((citizen_a: Citizen, citizen_b: Citizen) => {
                if (citizen_a.name.localeCompare(citizen_b.name) > 0) return 1;
                if (citizen_a.name.localeCompare(citizen_b.name) < 0) return -1;
                return 0;
            });
            this.update_info = new UpdateInfo(dto.lastUpdateInfo);
        }
    }
}
