import { StatusEnum } from '../../_abstract_model/enum/status.enum';

/** Statut prévu cochable. */
export interface StatusOption {
    key: string;
    label: string;
    img: string;
}

/**
 * Statuts prévus (clés du référentiel de veille), libellés traduits à l'appel.
 * @returns {StatusOption[]} Statuts cochables.
 */
export function statusOptions(): StatusOption[] {
    return [
        { key: 'drugged', label: StatusEnum.DRUGGED.label, img: StatusEnum.DRUGGED.img },
        { key: 'drunk', label: StatusEnum.DRUNK.label, img: StatusEnum.DRUNK.img },
        { key: 'thirsty', label: StatusEnum.THIRST1.label, img: StatusEnum.THIRST1.img },
        { key: 'immune', label: StatusEnum.IMMUNE.label, img: StatusEnum.IMMUNE.img },
        { key: 'dog', label: $localize`Chien`, img: 'status/status_tamer_watch_1.gif' },
        { key: 'dogSteak', label: $localize`Chien avec steak`, img: 'status/status_tamer_watch_2.gif' },
        { key: 'ghoul', label: $localize`Goule`, img: StatusEnum.GHOUL.img }
    ];
}

/**
 * Libellé d'un statut du plan.
 * @param {string} key Clé du statut.
 * @returns {string} Libellé, la clé si elle est inconnue.
 */
export function statusLabel(key: string): string {
    return statusOptions().find((option: StatusOption): boolean => option.key === key)?.label ?? key;
}
