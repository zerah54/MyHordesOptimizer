import { HomeDTO } from '../dto/home.dto';
import { HomeEnum } from '../enum/home.enum';
import { UpdateInfo } from './update-info.class';
import { CommonModel } from './_common.class';

export class Home extends CommonModel<HomeDTO> {
    public content!: HomeWithValue[];
    public update_info!: UpdateInfo;

    constructor(dto?: HomeDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): HomeDTO {
        return {
            content: this.content.reduce((accumulator, key: HomeWithValue) => { return { ...accumulator, [key.element.getLabel()]: key.value } }, {}),
            lastUpdateInfo: this.update_info.modelToDto()
        };
    }

    protected dtoToModel(dto?: HomeDTO): void {
        if (dto) {
            this.content = Object.keys(dto.content)
                .map((key: string) => {
                    const element: HomeEnum = <HomeEnum>HomeEnum.getByKey(key);
                    return <HomeWithValue>{
                        element: element,
                        value: dto.content[key] || 0
                    }
                })
                .filter((content: HomeWithValue) => content.element)
                .sort((content_a: HomeWithValue, content_b: HomeWithValue) => {
                    if (content_a.element.value.max_lvl < content_b.element.value.max_lvl) {
                        return -1;
                    } else if (content_a.element.value.max_lvl > content_b.element.value.max_lvl) {
                        return 1;
                    }
                    return 0;
                });
            this.update_info = new UpdateInfo(dto.lastUpdateInfo);
        }
    };

}

export interface HomeWithValue {
    element: HomeEnum;
    value: number
}
