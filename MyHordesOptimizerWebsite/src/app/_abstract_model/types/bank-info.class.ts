import { BankItem } from './bank-item.class';
import { UpdateInfo } from './update-info.class';

export interface BankInfo {
    bank_items: BankItem[];
    update_info: UpdateInfo;
}
