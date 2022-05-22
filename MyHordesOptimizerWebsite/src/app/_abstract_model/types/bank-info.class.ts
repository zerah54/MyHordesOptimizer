import { BankItem } from './bank-item.class';
import { UpdateInfo } from './update-info.class';
import { Common } from './_common.class';

export interface BankInfo extends Common {
    bank_items: BankItem[];
    update_info: UpdateInfo | null;
}
