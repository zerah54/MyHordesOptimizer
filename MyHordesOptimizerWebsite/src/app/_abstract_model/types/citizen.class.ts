import { CitizenDTO } from '../dto/citizen.dto';
import { ItemCountDTO } from '../dto/item-count.dto';
import { ShortItemCountDTO } from '../dto/short-item-count.dto';
import { JobEnum } from '../enum/job.enum';
import { StatusEnum } from '../enum/status.enum';
import { CommonModel, dtoToModelArray, modelToDtoArray } from './_common.class';
import { Dictionary } from './_types';
import { Bag } from './bag.class';
import { Bath } from './bath.class';
import { Cadaver } from './cadaver.class';
import { ChamanicDetail } from './chamanic-detail.class';
import { HeroicActions, HeroicActionsWithValue } from './heroic-actions.class';
import { Home, HomeWithValue } from './home.class';
import { Status } from './status.class';

export class Citizen extends CommonModel<CitizenDTO> {
    public avatar?: string;
    public home_message?: string;
    public id!: number;
    public is_shunned?: boolean;
    public is_ghost?: boolean;
    public is_dead?: boolean;
    public job?: JobEnum;
    public name!: string;
    public nombre_jour_hero?: number;
    public x?: number;
    public y?: number;
    public bag?: Bag;
    public chest?: Bag;
    public status?: Status;
    public home?: Home;
    public heroic_actions?: HeroicActions;
    public cadaver?: Cadaver;
    public baths: Bath[] = [];
    public chamanic_detail!: ChamanicDetail;

    constructor(dto?: CitizenDTO) {
        super();
        this.dtoToModel(dto);
    }

    public modelToDto(): CitizenDTO {
        return {
            avatar: this.avatar,
            homeMessage: this.home_message,
            id: this.id,
            isShunned: this.is_shunned,
            isGhost: this.is_ghost,
            dead: this.is_dead,
            jobName: '',
            jobUid: this.job?.key,
            nombreJourHero: this.nombre_jour_hero,
            x: this.x,
            y: this.y,
            name: this.name,
            bag: this.bag?.modelToDto(),
            chest: this.chest?.modelToDto(),
            status: this.status?.modelToDto(),
            home: this.home?.modelToDto(),
            actionsHeroic: this.heroic_actions?.modelToDto(),
            baths: this.baths ? modelToDtoArray(this.baths) : [],
            chamanicDetail: this.chamanic_detail.modelToDto()
        };
    }

    public toCitizenBagDto(): { userId: number, objects: ShortItemCountDTO[] } {
        return {
            userId: this.id,
            objects: this.bag?.modelToDto().items.map((item: ItemCountDTO) => {
                return {
                    count: item.count,
                    id: item.item.id,
                    isBroken: item.isBroken
                };
            }) || [],
        };
    }

    public toCitizenStatusDto(): { userId: number, status: string[] } {
        return {
            userId: this.id,
            status: this.status?.icons.map((icon: StatusEnum) => icon?.key) || [],
        };
    }

    public toCitizenHeroicActionsDto(): { userId: number, heroicActions: Dictionary<number | boolean> } {
        return {
            userId: this.id,
            heroicActions: this.heroic_actions?.content.reduce((accumulator: Dictionary<number | boolean>, content: HeroicActionsWithValue) => {
                return { ...accumulator, [content.element?.key]: content.value };
            }, {}) || {}
        };
    }

    public toCitizenHomeDto(): { userId: number, home: Dictionary<number | boolean> } {
        return {
            userId: this.id,
            home: this.home?.content.reduce((accumulator: Dictionary<number | boolean>, content: HomeWithValue) => {
                return { ...accumulator, [content.element?.key]: content.value };
            }, {}) || {}
        };
    }

    public getTag(): string {
        return `@${this.name}:${this.id}`;
    }

    protected dtoToModel(dto?: CitizenDTO): void {
        if (dto) {
            this.avatar = dto.avatar;
            this.home_message = dto.homeMessage;
            this.id = dto.id;
            this.is_ghost = dto.isGhost;
            this.is_shunned = dto.isShunned;
            this.is_dead = dto.dead;
            this.job = dto.jobUid ? <JobEnum>JobEnum.getByKey(dto.jobUid) : undefined;
            this.nombre_jour_hero = dto.nombreJourHero;
            this.x = dto.x;
            this.y = dto.y;
            this.name = dto.name;
            this.bag = new Bag(dto.bag);
            this.chest = new Bag(dto.chest);
            this.status = new Status(dto.status);
            this.home = new Home(dto.home);
            this.heroic_actions = new HeroicActions(dto.actionsHeroic);
            this.baths = dtoToModelArray(Bath, dto.baths);
            this.chamanic_detail = new ChamanicDetail(dto.chamanicDetail);
        }
    }
}
