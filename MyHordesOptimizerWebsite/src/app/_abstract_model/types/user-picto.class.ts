import moment from 'moment';

import { UserPictoDTO } from '../dto/user-picto.dto';
import { CommonModel } from './_common.class';
import { Dictionary } from './_types';

export class UserPicto extends CommonModel<UserPictoDTO> {
    public id!: number;
    public img?: string;
    private label?: Dictionary<string>;
    private description?: Dictionary<string>;
    public rare!: boolean;
    public count!: number;
    public count_in_town?: number | null;

    public constructor(dto?: UserPictoDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): UserPictoDTO {
        return {
            id: this.id,
            img: this.img,
            label: this.label,
            description: this.description,
            rare: this.rare,
            count: this.count,
            countInTown: this.count_in_town,
        };
    }

    /** Nom localisé du picto. */
    public getLabel(): string {
        return this.getLocalized(this.label);
    }

    /** Description localisée du picto. */
    public getDescription(): string {
        return this.getLocalized(this.description);
    }

    protected dtoToModel(dto?: UserPictoDTO): void {
        if (dto) {
            this.id = dto.id;
            this.img = dto.img;
            this.label = dto.label;
            this.description = dto.description;
            this.rare = dto.rare;
            this.count = dto.count;
            this.count_in_town = dto.countInTown;
        }
    }

    private getLocalized(source?: Dictionary<string>): string {
        const locale: string = moment.locale();
        return source?.[locale] ?? source?.['fr'] ?? '';
    }
}
