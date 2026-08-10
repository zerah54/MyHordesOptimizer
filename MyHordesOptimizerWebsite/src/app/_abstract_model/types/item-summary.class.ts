import { ItemSummaryDTO } from '../dto/item-summary.dto';
import { CommonModel } from './_common.class';
import { I18nLabels } from './_types';

/** Représentation minimale d'un objet dans une relation objet↔objet (ex. boîtes/ouvre-boîtes). */
export class ItemSummary extends CommonModel<ItemSummaryDTO> {
    public uid!: string;
    public img!: string;
    public img_broken: string | null = null;
    public label!: I18nLabels;

    public constructor(dto?: ItemSummaryDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): ItemSummaryDTO {
        return {
            uid: this.uid,
            img: this.img,
            imgBroken: this.img_broken,
            label: this.label
        };
    }

    protected dtoToModel(dto?: ItemSummaryDTO): void {
        if (dto) {
            this.uid = dto.uid;
            this.img = dto.img;
            this.img_broken = dto.imgBroken ?? null;
            this.label = dto.label;
        }
    }
}
