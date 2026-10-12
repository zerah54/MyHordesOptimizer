import { Injectable, signal, WritableSignal } from '@angular/core';

import { JobEnum } from '../../../../_abstract_model/enum/job.enum';
import { Property } from '../../../../_abstract_model/enum/property.enum';
import { Citizen } from '../../../../_abstract_model/types/citizen.class';
import { Item } from '../../../../_abstract_model/types/item.class';

/** Réglages d'un campeur, hors ce qui tient à la zone. */
export interface CamperSettings {
    readonly job: JobEnum;
    /** Campings déjà effectués. */
    readonly campings: number;
    readonly pro_camper: boolean;
    /** Pelures de peau et toiles de tente dans le sac. */
    readonly objects: number;
    /** Tenue de camouflage : ne compte que pour un éclaireur. */
    readonly vest: boolean;
    readonly tomb: boolean;
    readonly r4: boolean;
    /** Niveau de la capacité Repos (0 à 4) : l'API en déduit Campeur pro et le plafond. `null` : inconnu, cases à cocher à la main. */
    readonly recluse_level: number | null;
}

export interface Camper extends CamperSettings {
    /** Identifiant stable dans la liste, pour la suivre malgré les déplacements. */
    readonly key: number;
    /** Citoyen de la ville, ou `null` pour un profil libre. */
    readonly citizen_id: number | null;
    /** Nom du citoyen ; vide pour un profil libre. */
    readonly name: string;
    /** Numéro d'un profil libre (« Profil 2 »), 0 pour un citoyen. */
    readonly profile_number: number;
}

/** Limite de l'API pour le calcul d'un groupe. */
export const MAX_CAMPERS: number = 16;

/** Tenue de camouflage portée : seule celle-ci protège des zombies au camping (MyHordes : `vest_on_#00`). */
export const SCOUT_VEST_UID: string = 'vest_on_#00';

const DEFAULT_SETTINGS: CamperSettings = {
    job: JobEnum.CITIZEN,
    campings: 0,
    pro_camper: false,
    objects: 0,
    vest: false,
    tomb: false,
    r4: false,
    recluse_level: null
};

/**
 * Réglages d'un citoyen de la ville tels que MHO les connaît : métier, campings et niveau de Repos saisis sur la liste
 * des citoyens, et dans son sac les objets qui comptent au camping (pelures de peau et toiles de tente intactes, comme
 * le jeu), et la tenue de camouflage portée.
 */
export function camperSettingsOf(citizen: Citizen): CamperSettings {
    const bag: readonly Item[] = citizen.bag?.items ?? [];
    return {
        ...DEFAULT_SETTINGS,
        job: citizen.job ?? JobEnum.CITIZEN,
        campings: citizen.camping_count,
        recluse_level: citizen.hero_skills.r,
        objects: bag.filter((item: Item): boolean => !item.is_broken
            && item.properties.some((property: Property | undefined): boolean => property?.key === Property.CAMP_BONUS.key)).length,
        vest: bag.some((item: Item): boolean => item.uid === SCOUT_VEST_UID)
    };
}

/**
 * Campeurs en cours d'étude dans le détail des cases, dans l'ordre où ils se cachent. Gardés en mémoire seulement
 * (rien n'est enregistré), le temps de comparer plusieurs cases ; changer de ville repart d'un groupe vide.
 * Les réglages de la nuit et du phare suivent le groupe d'une case à l'autre.
 */
@Injectable({ providedIn: 'root' })
export class CampersStore {
    public readonly campers: WritableSignal<readonly Camper[]> = signal([]);
    /** La section camping du détail d'une case est dépliée. */
    public readonly expanded: WritableSignal<boolean> = signal(false);
    /** Calcul de nuit : coché par défaut, la plupart des campeurs se cachent la nuit. */
    public readonly night: WritableSignal<boolean> = signal(true);
    public readonly phare: WritableSignal<boolean> = signal(false);

    private town_id: number | null = null;
    private next_key: number = 1;
    private next_profile_number: number = 1;

    /** Les campeurs sont ceux d'une ville : en changer vide le groupe. */
    public useTown(town_id: number | null): void {
        if (town_id === this.town_id) return;
        this.town_id = town_id;
        this.campers.set([]);
        this.next_profile_number = 1;
    }

    public addCitizen(citizen: Citizen): void {
        if (this.campers().some((camper: Camper): boolean => camper.citizen_id === citizen.id)) return;
        this.add({ ...camperSettingsOf(citizen), key: this.next_key++, citizen_id: citizen.id, name: citizen.name, profile_number: 0 });
    }

    public addProfile(): void {
        this.add({ ...DEFAULT_SETTINGS, key: this.next_key++, citizen_id: null, name: '', profile_number: this.next_profile_number++ });
    }

    public update(key: number, changes: Partial<CamperSettings>): void {
        this.campers.update((campers: readonly Camper[]): readonly Camper[] =>
            campers.map((camper: Camper): Camper => camper.key === key ? { ...camper, ...changes } : camper));
    }

    public remove(key: number): void {
        this.campers.update((campers: readonly Camper[]): readonly Camper[] => campers.filter((camper: Camper): boolean => camper.key !== key));
    }

    /** Déplace le campeur du rang `from` au rang `to` (flèches, glisser-déposer). */
    public move(from: number, to: number): void {
        const campers: Camper[] = [...this.campers()];
        if (from === to || from < 0 || to < 0 || from >= campers.length || to >= campers.length) return;
        const [moved]: Camper[] = campers.splice(from, 1);
        campers.splice(to, 0, moved);
        this.campers.set(campers);
    }

    /**
     * Range les campeurs dans l'ordre donné : `order[rang]` est l'indice actuel du campeur qui s'y cache. Un ordre
     * qui ne couvre pas exactement les campeurs actuels (liste changée depuis le calcul) est ignoré.
     */
    public applyOrder(order: readonly number[]): void {
        const campers: readonly Camper[] = this.campers();
        const is_permutation: boolean = order.length === campers.length
            && new Set(order).size === order.length
            && order.every((index: number): boolean => Number.isInteger(index) && index >= 0 && index < campers.length);
        if (!is_permutation) return;
        this.campers.set(order.map((index: number): Camper => campers[index]));
    }

    private add(camper: Camper): void {
        if (this.campers().length >= MAX_CAMPERS) return;
        this.campers.update((campers: readonly Camper[]): readonly Camper[] => [...campers, camper]);
    }
}
