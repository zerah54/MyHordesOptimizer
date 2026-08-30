export interface CitizenStateStepDTO {
    type: 'item' | 'move' | 'equip_shoes' | 'mount_bike' | 'dismount_bike' | 'pickup_defence_cp_item' | 'become_ghoul';
    itemId?: number;
    isNearZone?: boolean;
}
