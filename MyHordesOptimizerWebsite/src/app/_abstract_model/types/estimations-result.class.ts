import { EstimationsResultDTO } from '../dto/estimations-result.dto';
import { MinMax } from '../interfaces';
import { CommonModel } from './_common.class';

export class EstimationsResult extends CommonModel<EstimationsResultDTO> {
    public result!: MinMax;
    public min_list: EstimationGraphValues[] = [];
    public max_list: EstimationGraphValues[] = [];


    constructor(dto?: EstimationsResultDTO | null | undefined) {
        super();
        this.dtoToModel(dto);
    }

    public override modelToDto(): EstimationsResultDTO {
        return {
            result: this.result,
            minList: this.min_list.map((element: EstimationGraphValues) => element.value),
            maxList: this.max_list.map((element: EstimationGraphValues) => element.value)
        }
    }

    protected override dtoToModel(dto?: EstimationsResultDTO | null | undefined): void {
        if (dto) {
            this.result = dto.result;
            this.min_list = this.convertNumberListToGraphList(dto.minList);
            this.max_list = this.convertNumberListToGraphList(dto.maxList);
        }
    }

    private convertNumberListToGraphList(list: number[]): EstimationGraphValues[] {
        const graph_list: EstimationGraphValues[] = [];
        list.forEach((value: number) => {
            const value_in_list: EstimationGraphValues | undefined = graph_list.find((element: EstimationGraphValues) => element.value === value);
            if (value_in_list) {
                value_in_list.count += 1;
            } else {
                graph_list.push({value: value, count: 1})
            }
        });
        graph_list.sort((element_a: EstimationGraphValues, element_b: EstimationGraphValues) => {
            if (element_a.value < element_b.value) return -1;
            if (element_a.value > element_b.value) return 1;
            return 0;
        })
        return graph_list;
    }
}

export interface EstimationGraphValues {
    value: number;
    count: number;
}
