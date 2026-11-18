import { saveCitizenChest, saveCitizenHome } from '../api/foreign-home';
import { lang, mh_optimizer_icon, mho_foreign_home_update_id } from '../config/constants';
import { texts } from '../i18n/texts';
import { state } from '../state';
import type { CitizenHomeValues } from '../utils/foreign-home';
import { readForeignChestItems, readForeignHomeUserId, readForeignHomeValues } from '../utils/foreign-home';
import { getI18N } from '../utils/i18n';
import { countInventoryObjects, resolveInventoryObjects } from '../utils/item-lookup';
import { pageIsForeignHome } from '../utils/page';

/** Une partie de la maison envoyée à MHO, et son résultat. */
interface ForeignHomePart {
    readonly label: string;
    readonly sent: Promise<void>;
}

/**
 * Bouton de mise à jour, dans MHO, des travaux et du coffre de la maison d'un autre citoyen,
 * selon les options « maison » et « coffre » de la mise à jour de MHO.
 */
export function createForeignHomeUpdateButton(): void {
    const parameters: Record<string, boolean | undefined> = state.mho_parameters ?? {};
    const send_home: boolean = !!(parameters.update_mho && parameters.update_mho_house);
    const send_chest: boolean = !!(parameters.update_mho && parameters.update_mho_chest);
    const anchor: Element | null = document.querySelector('.citizen-chest');
    if (!pageIsForeignHome() || (!send_home && !send_chest) || !anchor || readForeignHomeUserId() === undefined
        || document.getElementById(mho_foreign_home_update_id)) {
        return;
    }

    const block: HTMLElement = document.createElement('div');
    block.style.marginTop = '1em';
    block.style.padding = '0.25em';
    block.style.border = '1px solid #ddab76';

    const button: HTMLButtonElement = document.createElement('button');
    button.id = mho_foreign_home_update_id;
    button.innerHTML = `<img src="${mh_optimizer_icon}" height="16" width="16"> ${getI18N(texts.foreign_home_update_btn)}`;
    block.appendChild(button);

    const result: HTMLElement = document.createElement('div');
    block.appendChild(result);

    button.addEventListener('click', (): void => {
        button.disabled = true;
        result.innerText = getI18N(texts.update_external_tools_pending_btn_label) ?? '';
        const parts: ForeignHomePart[] = sendForeignHome(send_home, send_chest);
        Promise.all(parts.map((part: ForeignHomePart): Promise<string> => part.sent.then(
            (): string => `✔ ${part.label}`,
            (): string => `✖ ${part.label}`
        ))).then((lines: string[]): void => {
            result.innerText = lines.join('\n');
            button.disabled = false;
        });
    });

    anchor.appendChild(block);
}

/**
 * Relève puis envoie chaque partie demandée. Un coffre illisible (rideau) n'est pas une erreur :
 * il est simplement omis.
 * @param send_home Envoyer l'habitation et les travaux.
 * @param send_chest Envoyer le coffre.
 */
function sendForeignHome(send_home: boolean, send_chest: boolean): ForeignHomePart[] {
    const user_id: number | undefined = readForeignHomeUserId();
    const parts: ForeignHomePart[] = [];
    if (user_id === undefined) {
        return parts;
    }
    if (send_home) {
        const home: CitizenHomeValues | undefined = readForeignHomeValues(lang);
        parts.push({
            label: getI18N(texts.foreign_home_upgrades) ?? '',
            sent: home ? saveCitizenHome(user_id, home) : Promise.reject(new Error('Travaux de maison illisibles'))
        });
    }
    const chest_items: Element[] | undefined = send_chest ? readForeignChestItems() : undefined;
    if (chest_items) {
        parts.push({
            label: getI18N(texts.foreign_home_chest) ?? '',
            sent: saveCitizenChest(user_id, countInventoryObjects(resolveInventoryObjects(chest_items)))
        });
    }
    return parts;
}
