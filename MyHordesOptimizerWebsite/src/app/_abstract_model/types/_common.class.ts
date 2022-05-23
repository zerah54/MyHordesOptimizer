import { Dictionary } from './_types';
export abstract class CommonModel<DTO> {
    public abstract modelToDto(): DTO;
    protected abstract dtoToModel(dto?: DTO): void;

}

export type ICommonModel<DTO, MODEL> = {
    new(dto?: DTO, ...params: unknown[]): MODEL;
}

export function dtoToModelArray<DTO, MODEL>(model_class: ICommonModel<DTO, MODEL>, dto_array: DTO[] | null, ...params: unknown[]): MODEL[] | [] {
    return dto_array ? dto_array.map((dto: DTO) => new model_class(dto, ...params)) : [];
}


export function modelToDtoArray<DTO, MODEL extends CommonModel<DTO>>(models: MODEL[] | undefined): DTO[] | [] {
    return models ? models.map((model: MODEL) => model.modelToDto()) : [];
}

export function modelArrayToDictionnary<DTO, MODEL extends CommonModel<DTO>>(models: MODEL[], key: string): Dictionary<DTO> {
    let items: Dictionary<DTO> = <Dictionary<DTO>><unknown>[];
    models.forEach((model_item: MODEL) => {
        let key_parts: string[] = key.split('.');
        let item_key: any = model_item; 
        key_parts.forEach((key_part: string) => {
            item_key = item_key[<any>key_part];
        })
        items[<any>item_key] = model_item.modelToDto();
    })
    return items;
}