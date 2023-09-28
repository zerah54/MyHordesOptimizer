import { PLANIF_VALUES, TDG_VALUES } from '../const';
import { EstimationsDTO } from '../dto/estimations.dto';
import { MinMax } from '../interfaces';
import { CommonModel } from './_common.class';
import { Dictionary } from './_types';

export class Estimations extends CommonModel<EstimationsDTO> {
    public estim!: Dictionary<MinMax>;
    public planif!: Dictionary<MinMax>;
    public day!: number;


    constructor(dto?: EstimationsDTO | null | undefined) {
        super();
        this.dtoToModel(dto);
    }

    public override modelToDto(): EstimationsDTO {
        const estimation: EstimationsDTO = {
            day: this.day
        };

        const filtered_estim: Dictionary<MinMax> = {};
        for (const estim_key in this.estim) {
            const estim: MinMax = this.estim[estim_key];
            if ((estim.min !== null && estim.min !== undefined && estim.min.toString() !== '') || (estim.max !== null && estim.max !== undefined && estim.max.toString() !== '')) {
                filtered_estim[estim_key] = {
                    min: estim.min !== null && estim.min !== undefined && estim.min.toString() !== '' ? +estim.min.toString().replace(/\D+/g, '') : undefined,
                    max: estim.max !== null && estim.max !== undefined && estim.max.toString() !== '' ? +estim.max.toString().replace(/\D+/g, '') : undefined,
                };
            }
        }
        if (Object.keys(filtered_estim).length > 0) {
            estimation.estim = filtered_estim;
        }
        const filtered_planif: Dictionary<MinMax> = {};
        for (const planif_key in this.planif) {
            const planif: MinMax = this.planif[planif_key];
            if ((planif.min !== null && planif.min !== undefined && planif.min.toString() !== '') || (planif.max !== null && planif.max !== undefined && planif.max.toString() !== '')) {
                filtered_planif[planif_key] = {
                    min: planif.min !== null && planif.min !== undefined && planif.min.toString() !== '' ? +planif.min.toString().replace(/\D+/g, '') : undefined,
                    max: planif.max !== null && planif.max !== undefined && planif.max.toString() !== '' ? +planif.max.toString().replace(/\D+/g, '') : undefined
                };
            }
        }
        if (Object.keys(filtered_planif).length > 0) {
            estimation.planif = filtered_planif;
        }
        return estimation;
    }

    protected override dtoToModel(dto?: EstimationsDTO | null | undefined): void {
        if (dto) {
            this.estim = dto.estim || this.emptyValuesForEstim;
            for (const estim_key in dto.estim) {
                if (!dto.estim[estim_key]) {
                    dto.estim[estim_key] = { min: undefined, max: undefined };
                }
            }
            this.planif = dto.planif || this.emptyValuesForPlanif;
            for (const planif_key in dto.planif) {
                if (!dto.planif[planif_key]) {
                    dto.planif[planif_key] = { min: undefined, max: undefined };
                }
            }
            this.day = dto.day || 0;
        } else {
            this.estim = this.emptyValuesForEstim;
            this.planif = this.emptyValuesForPlanif;
            this.day = 0;
        }
    }

    private get emptyValuesForEstim(): Dictionary<MinMax> {
        const estim: Dictionary<MinMax> = {};
        TDG_VALUES.forEach((value: number) => (<Dictionary<MinMax>>estim)[value] = { min: undefined, max: undefined });
        return estim;
    }

    private get emptyValuesForPlanif(): Dictionary<MinMax> {
        const planif: Dictionary<MinMax> = {};
        PLANIF_VALUES.forEach((value: number) => (<Dictionary<MinMax>>planif)[value] = { min: undefined, max: undefined });
        return planif;
    }
}
