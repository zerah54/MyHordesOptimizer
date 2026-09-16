export interface CitizenStateStepDTO {
    type: 'item' | 'move' | 'equip_shoes' | 'mount_bike' | 'dismount_bike' | 'pickup_defence_cp_item' | 'become_ghoul' | 'second_wind';
    itemId?: number;
    isNearZone?: boolean;
    /** Niveau du Second Souffle (0-3, arbre Endurant) — requis avec type === 'second_wind'. */
    level?: number;
}
