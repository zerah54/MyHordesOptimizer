import { CitizenStateStepDTO } from '../dto/citizen-state-step.dto';
import { CommonModel } from './_common.class';

export class CitizenStateStep extends CommonModel<CitizenStateStepDTO> {
    public type: 'item' | 'move' | 'equip_shoes' | 'mount_bike' | 'dismount_bike' | 'pickup_defence_cp_item' | 'become_ghoul' = 'item';
    public item_id?: number;
    public is_near_zone?: boolean;

    public constructor(dto?: CitizenStateStepDTO) {
        super();
        this.dtoToModel(dto);
    }

    /** Étape « consommer un item ». */
    public static item(item_id: number): CitizenStateStep {
        const step: CitizenStateStep = new CitizenStateStep();
        step.type = 'item';
        step.item_id = item_id;
        return step;
    }

    /** Étape « se déplacer ». */
    public static move(is_near_zone: boolean): CitizenStateStep {
        const step: CitizenStateStep = new CitizenStateStep();
        step.type = 'move';
        step.is_near_zone = is_near_zone;
        return step;
    }

    /** Étape « chausser des baskets ». */
    public static equipShoes(): CitizenStateStep {
        const step: CitizenStateStep = new CitizenStateStep();
        step.type = 'equip_shoes';
        return step;
    }

    /** Étape « monter à vélo ». */
    public static mountBike(): CitizenStateStep {
        const step: CitizenStateStep = new CitizenStateStep();
        step.type = 'mount_bike';
        return step;
    }

    /** Étape « descendre du vélo ». */
    public static dismountBike(): CitizenStateStep {
        const step: CitizenStateStep = new CitizenStateStep();
        step.type = 'dismount_bike';
        return step;
    }

    /** Étape « ramasser un objet de défense de zone » (car_door_#00). */
    public static pickupDefenceCpItem(): CitizenStateStep {
        const step: CitizenStateStep = new CitizenStateStep();
        step.type = 'pickup_defence_cp_item';
        return step;
    }

    /** Étape « se transformer en goule » (déterministe, contourne le tirage aléatoire du jeu). */
    public static becomeGhoul(): CitizenStateStep {
        const step: CitizenStateStep = new CitizenStateStep();
        step.type = 'become_ghoul';
        return step;
    }

    public modelToDto(): CitizenStateStepDTO {
        return { type: this.type, itemId: this.item_id, isNearZone: this.is_near_zone };
    }

    protected dtoToModel(dto?: CitizenStateStepDTO): void {
        if (dto) {
            this.type = dto.type;
            this.item_id = dto.itemId;
            this.is_near_zone = dto.isNearZone;
        }
    }
}
