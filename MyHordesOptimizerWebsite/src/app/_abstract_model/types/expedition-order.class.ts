import { ExpeditionOrderDTO } from '../dto/expedition-order.dto';
import { CommonModel } from './_common.class';
import { ExpeditionOrderKind, ExpeditionOrderType } from './_types';

export const EXPEDITION_ORDER_KINDS: readonly ExpeditionOrderKind[] = ['pick', 'drop', 'use', 'clear', 'explore', 'excavate', 'camp', 'hero', 'wait'];

export function isExpeditionOrderKind(value: unknown): value is ExpeditionOrderKind {
    return typeof value === 'string' && (<readonly string[]>EXPEDITION_ORDER_KINDS).includes(value);
}

export class ExpeditionOrder extends CommonModel<ExpeditionOrderDTO> {
    public id?: number;
    public type!: ExpeditionOrderType;
    public text!: string;
    public is_done!: boolean;
    public position!: number;
    public expeditions_id?: number;
    public expedition_citizen_id?: number;
    public expedition_parts_id?: number;
    /** Case visée, en coordonnées absolues ; `null` (avec `y`) pour une consigne générale. */
    public x: number | null = null;
    public y: number | null = null;
    /** Consigne typée ; `null` pour un texte libre. */
    public kind: ExpeditionOrderKind | null = null;
    public item_id: number | null = null;
    /** Objets à ramasser ou déposer, tas à déblayer. */
    public quantity: number | null = null;
    /** Action héroïque (`HeroicActionEnum.value.action`). */
    public hero_skill: string | null = null;
    /** Citoyen à attendre ; `null` avec « wait » : le groupe. */
    public target_user_id: number | null = null;

    public constructor(dto?: ExpeditionOrderDTO | null) {
        super();
        this.dtoToModel(dto);
    }

    /** La consigne vise-t-elle une case (feuille de route) plutôt que toute l'expédition ? */
    public hasCell(): boolean {
        return this.x !== null && this.y !== null;
    }

    public override modelToDto(): ExpeditionOrderDTO {
        return {
            id: this.id,
            type: this.type,
            text: this.text,
            isDone: this.is_done,
            position: this.position,
            x: this.x,
            y: this.y,
            kind: this.kind,
            itemId: this.item_id,
            quantity: this.quantity,
            heroSkill: this.hero_skill,
            targetUserId: this.target_user_id
        };
    }

    protected override dtoToModel(dto?: ExpeditionOrderDTO | null): void {
        if (dto) {
            this.id = dto.id;
            this.type = dto.type;
            this.text = dto.text;
            this.is_done = dto.isDone;
            this.position = dto.position;
            this.expeditions_id = dto.expeditionsId && dto.expeditionsId.length > 0 ? dto.expeditionsId[0] : undefined;
            this.expedition_citizen_id = dto.expeditionCitizenId;
            this.expedition_parts_id = dto.expeditionPartsId && dto.expeditionPartsId.length > 0 ? dto.expeditionPartsId[0] : undefined;
            const has_cell: boolean = typeof dto.x === 'number' && typeof dto.y === 'number';
            this.x = has_cell ? <number>dto.x : null;
            this.y = has_cell ? <number>dto.y : null;
            this.kind = isExpeditionOrderKind(dto.kind) ? dto.kind : null;
            this.item_id = dto.itemId ?? null;
            this.quantity = dto.quantity ?? null;
            this.hero_skill = dto.heroSkill ?? null;
            this.target_user_id = dto.targetUserId ?? null;
        }
    }

}
