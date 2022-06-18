import { CitizenInfoDTO } from '../dto/citizen-info.dto';
import { DictionaryUtils } from './../../shared/utilities/dictionary.util';
import { CitizenDTO } from './../dto/citizen.dto';
import { Citizen } from './citizen.class';
import { UpdateInfo } from './update-info.class';
import { CommonModel, dtoToModelArray, modelArrayToDictionnary } from './_common.class';

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
        }
    };

    protected dtoToModel(dto?: CitizenInfoDTO | null): void {
        if (dto) {
            this.citizens = dtoToModelArray(Citizen, <CitizenDTO[]>DictionaryUtils.getValues(dto.citizens));
            this.update_info = new UpdateInfo(dto.lastUpdateInfo)
        }
    };
}
