import { Item } from "./item.class";
import { Common } from "./_common.class";

export interface RuinItem extends Common {
    probability: number;
    weight: number;
    item: Item;
}
