import { HeroicActionsDTO } from '../dto/heroic-actions.dto';
import { HeroicActionEnum } from '../enum/heroic-action.enum';
import { HomeEnum } from '../enum/home.enum';
import { UpdateInfo } from './update-info.class';
import { CommonModel } from './_common.class';

export class HeroicActions extends CommonModel<HeroicActionsDTO> {
    public content!: HeroicActionsWithValue[];
    public update_info!: UpdateInfo;

    constructor(dto?: HeroicActionsDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): HeroicActionsDTO {
        return {
            content: this.content.reduce((accumulator, key: HeroicActionsWithValue) => { return { ...accumulator, [key.element.getLabel()]: key.value } }, {}),
            lastUpdateInfo: this.update_info.modelToDto()
        };
    }

    protected dtoToModel(dto?: HeroicActionsDTO): void {
        if (dto) {
            this.content = Object.keys(dto.content)
                .map((key: string) => {
                    const element: HeroicActionEnum = <HeroicActionEnum>HeroicActionEnum.getByKey(key);
                    return <HeroicActionsWithValue>{
                        element: element,
                        value: dto.content[key]
                    }
                })
                .filter((content: HeroicActionsWithValue) => content.element)
                .sort((content_a: HeroicActionsWithValue, content_b: HeroicActionsWithValue) => {
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

export interface HeroicActionsWithValue {
    element: HomeEnum;
    value: number
}
