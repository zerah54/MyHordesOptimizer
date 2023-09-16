import { HomeDTO } from '../dto/home.dto';
import { HomeEnum } from '../enum/home.enum';
import { CommonModel } from './_common.class';
import { Dictionary } from './_types';
import { UpdateInfo } from './update-info.class';

export class Home extends CommonModel<HomeDTO> {
    public content!: HomeWithValue[];
    public update_info!: UpdateInfo;

    constructor(dto?: HomeDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): HomeDTO {
        return {
            content: this.content?.reduce((accumulator: Dictionary<number | boolean>, key: HomeWithValue) => {
                return { ...accumulator, [key.element.getLabel()]: key.value };
            }, {}),
            lastUpdateInfo: this.update_info?.modelToDto()
        };
    }

    protected dtoToModel(dto?: HomeDTO): void {
        if (dto) {
            this.content = dto.content ? Object.keys(dto.content)
                .map((key: string) => {
                    const element: HomeEnum = <HomeEnum>HomeEnum.getByKey(key);
                    let value: number | boolean;
                    if (element.value.max_lvl === 1) {
                        value = !!dto.content[key];
                    } else {
                        value = dto.content[key] || 0;
                    }
                    return <HomeWithValue>{
                        element: element,
                        value: value
                    };
                })
                .filter((content: HomeWithValue) => content.element)
                .sort((content_a: HomeWithValue, content_b: HomeWithValue) => {
                    if (content_a.element.value.max_lvl < content_b.element.value.max_lvl) {
                        return -1;
                    } else if (content_a.element.value.max_lvl > content_b.element.value.max_lvl) {
                        return 1;
                    }
                    return 0;
                }) : [];
            this.update_info = new UpdateInfo(dto.lastUpdateInfo);
        }
    }

}

export interface HomeWithValue {
    element: HomeEnum;
    value: number | boolean;
}
