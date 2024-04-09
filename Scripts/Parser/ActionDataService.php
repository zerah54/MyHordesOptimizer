<?php

$actions = [
    'meta_requirements' => [],
    'requirements' => [],

    'meta_results' => [
        'do_nothing' => [],
        'do_nothing_attack' => ['message' => ['text' => 'Mit aller Kraft schlägst du mehrmals auf einen Zombie ein, aber <strong>es scheint ihm nichts anzuhaben</strong>!']],
        'do_nothing_attack2' => ['message' => ['text' => 'Sie greifen einen Zombie mit Ihrem {item} an, aber <strong>er reagiert nicht einmal</strong> und macht weiter!']],

        'contaminated_zone_infect' => ['collection' => ['custom' => [22]]],

        'consume_item' => ['item' => ['consume' => true, 'morph' => null, 'break' => null, 'poison' => null]],
        'break_item' => ['item' => ['consume' => false, 'morph' => null, 'break' => true, 'poison' => null], 'picto' => 'picto_break', "message" => ['text' => 'Deine Waffe ist durch den harten Aufschlag <strong>kaputt</strong> gegangen...', 'ordering' => 99999]],
        'cleanse_item' => ['item' => ['consume' => false, 'morph' => null, 'break' => true, 'poison' => false]],
        'empty_jerrygun' => ['item' => ['consume' => false, 'morph' => 'jerrygun_off_#00', 'break' => null, 'poison' => null]],

        'consume_water' => ['consume' => ['water_#00']],
        'consume_matches' => ['consume' => ['lights_#00']],
        'consume_battery' => ['consume' => ['pile_#00']],
        'consume_micropur' => ['consume' => ['water_cleaner_#00']],
        'consume_drug' => ['consume' => ['drug_#00']],
        'consume_jerrycan' => ['consume' => ['jerrycan_#00']],

        'spawn_target' => ['target' => ['consume' => false, 'morph' => null, 'break' => null, 'poison' => null]],
        'consume_target' => ['target' => ['consume' => true, 'morph' => null, 'break' => null, 'poison' => null]],
        'repair_target' => ['target' => ['consume' => false, 'morph' => null, 'break' => false, 'poison' => null]],
        'poison_target' => ['target' => ['consume' => false, 'morph' => null, 'break' => null, 'poison' => 'ItemPoisonType::Deadly']],
        'poison_infect_target' => ['target' => ['consume' => false, 'morph' => null, 'break' => null, 'poison' => 'ItemPoisonType::Infectious']],

        'drink_ap_1' => ['status' => 'add_has_drunk', 'ap' => 'to_max_plus_0'],
        'drink_ap_2' => ['status' => 'remove_thirst'],
        'drink_no_ap' => ['status' => 'replace_dehydration'],
        'reset_thirst_counter' => ['status' => 'reset_thirst_counter'],

        'eat_ap6' => ['status' => 'add_has_eaten', 'ap' => 'to_max_plus_0', 'message' => ['escort' => false, 'text' => 'Es schmeckt wirklich komisch... aber es erfüllt seinen Zweck: Dein Hunger ist gestillt. Glaub aber nicht, dass du dadurch zusätzliche APs erhältst...']],
        'eat_ap6_silent' => ['status' => 'add_has_eaten', 'ap' => 'to_max_plus_0'],
        'eat_ap7' => ['status' => 'add_has_eaten', 'ap' => 'to_max_plus_1', 'message' => ['escort' => false, 'text' => 'Einmal ist zwar keinmal, dennoch genießt du dein(e) <span class="tool">{item}</span>. Das ist mal ne echte Abwechslung zu dem sonstigen Fraß... Du spürst deine Kräfte wieder zurückkehren.{hr}Du hast <strong>1 zusätzlichen AP erhalten!</strong>']],

        'drunk' => ['status' => 'add_drunk', 'picto' => ['r_alcool_#00']],

        'drug_any' => ['status' => 'add_is_drugged', 'picto' => ['r_drug_#00']],
        'drug_addict' => ['status' => 'add_addicted', 'picto' => ['r_drug_#00'], 'message' => ['text' => '<t-stat-up-addict>Schlechte Neuigkeiten! Du bist jetzt abhängig! Von nun an musst du jeden Tag eine Droge nehmen... oder STERBEN!</t-stat-up-addict>', 'ordering' => 1000]],
        'drug_addict_no_msg' => ['status' => 'add_addicted', 'picto' => ['r_drug_#00']],
        'terrorize' => ['status' => 'add_terror'],
        'unterrorize' => ['status' => 'remove_terror'],

        'infect' => ['status' => 'add_infection', 'message' => ['text' => 'Schlechte Nachrichten, das hättest du nicht in den Mund nehmen sollen... Du bist infiziert!']],
        'infect_no_msg' => ['status' => 'add_infection'],
        'disinfect' => ['status' => 'remove_infection'],
        'immune' => ['status' => 'add_immune'],
        'give_shaman_immune' => ['status' => 'shaman_immune'],

        'minus_1ap' => ['ap' => 'minus_1'],
        'minus_5ap' => ['ap' => 'minus_5'],
        'minus_6ap' => ['ap' => 'minus_6'],
        'minus_1pm' => ['pm' => 'minus_1'],
        'minus_2pm' => ['pm' => 'minus_2'],
        'minus_3pm' => ['pm' => 'minus_3'],
        'minus_1cp' => ['cp' => 'minus_1'],
        'plus_4ap' => ['ap' => 'plus_4'],
        'plus_2ap' => ['ap' => 'plus_2'],
        'plus_2ap_7' => ['ap' => 'plus_2_7'],
        'just_ap6' => ['ap' => 'to_max_plus_0'],
        'just_ap7' => ['ap' => 'to_max_plus_1'],
        'just_ap8' => ['ap' => 'to_max_plus_2'],
        'plus_ap8_30' => ['ap' => 'plus_8_30'],

        'april' => ['status' => ['from' => null, 'to' => 'tg_april_ooze']],

        'produce_watercan3' => ['item' => ['consume' => false, 'morph' => 'water_can_3_#00']],
        'produce_watercan2' => ['item' => ['consume' => false, 'morph' => 'water_can_2_#00']],
        'produce_watercan1' => ['item' => ['consume' => false, 'morph' => 'water_can_1_#00']],
        'produce_watercan0' => ['item' => ['consume' => false, 'morph' => 'water_can_empty_#00', 'break' => null, 'poison' => false]],

        'kill_1_zombie' => ['zombies' => 'kill_1z', 'message' => ['text_key' => 'weapon_use']],
        'kill_1_zombie_s' => ['zombies' => 'kill_1z'],
        'kill_1_2_zombie' => ['zombies' => 'kill_1z_2z', 'message' => ['text_key' => 'weapon_use']],
        'kill_2_zombie' => ['zombies' => 'kill_2z', 'message' => ['text_key' => 'weapon_use']],
        'kill_3_zombie' => ['zombies' => 'kill_3z', 'message' => ['text_key' => 'weapon_use']],
        'kill_all_zombie' => ['zombies' => 'kill_all_z'],

        'find_rp' => ['rp' => [true]],

        'casino_dice' => ['custom' => [1], 'status' => ['from' => null, 'to' => 'tg_dice']],
        'casino_card' => ['custom' => [2], 'status' => ['from' => null, 'to' => 'tg_cards']],
        'casino_guitar' => ['custom' => [3]],
        'casino_banned_note' => ['custom' => [15]],

        'heal_wound' => ['status' => 'heal_wound'],
        'add_bandage' => ['status' => 'add_bandage'],
        'inflict_wound' => ['status' => 'inflict_wound'],

        'zonemarker' => ['zone' => ['scout' => true]],
        'nessquick' => ['zone' => ['uncover' => true]],

        'cyanide' => ['death' => ['CauseOfDeath::Cyanide']],
        'death_poison' => ['death' => ['CauseOfDeath::Poison']],

        'hero_tamer_1' => ['custom' => [4]],
        'hero_tamer_2' => ['custom' => [5]],
        'hero_tamer_1b' => ['custom' => [16]],
        'hero_tamer_2b' => ['custom' => [17]],
        'hero_tamer_3' => ['item' => ['consume' => false, 'morph' => 'tamed_pet_drug_#00']],

        'hero_surv_0' => ['status' => ['from' => null, 'to' => 'tg_sbook']],
        'hero_surv_1' => ['custom' => [6]],
        'hero_surv_2' => ['custom' => [7]],

        'hero_act' => ['status' => ['from' => null, 'to' => 'tg_hero']],
        'hero_immune' => ['status' => ['from' => null, 'to' => 'hsurvive']],

        'hero_hunter' => ['item' => ['consume' => false, 'morph' => 'vest_on_#00']],

        'camp_hide' => ['status' => ['from' => null, 'to' => 'tg_hide']],
        'camp_tomb' => ['status' => ['from' => null, 'to' => 'tg_tomb']],
        'camp_unhide' => ['status' => ['from' => 'tg_hide', 'to' => null]],
        'camp_untomb' => ['status' => ['from' => 'tg_tomb', 'to' => null]],

        'home_lab_success' => ['spawn' => 'lab_success_drugs', 'picto' => ['r_drgmkr_#00'], 'message' => ['text_key' => 'use_lab_success']],
        'home_lab_failure' => ['spawn' => 'lab_fail_drugs', 'message' => ['text_key' => 'use_lab_fail']],

        'home_kitchen_success' => ['spawn' => 'kitchen_success_food', 'picto' => ['r_cookr_#00']],
        'home_kitchen_failure' => ['spawn' => 'kitchen_fail_food'],
    ],

    'results' => [
        'ap' => [
            'to_max_plus_0' => ['max' => true, 'num' => 0],
            'to_max_plus_1' => ['max' => true, 'num' => 1],
            'to_max_plus_2' => ['max' => true, 'num' => 2],
            'to_max_plus_3' => ['max' => true, 'num' => 3],
            'plus_4' => ['max' => false, 'num' => 4],
            'plus_2' => ['max' => false, 'num' => 2],
            'plus_2_7' => ['max' => false, 'num' => 2, 'bonus' => 1],
            'plus_8_30' => ['max' => false, 'num' => 8, 'bonus' => 24],
            'minus_1' => ['max' => false, 'num' => -1],
            'minus_5' => ['max' => false, 'num' => -5],
            'minus_6' => ['max' => false, 'num' => -6],
        ],
        'pm' => [
            'to_max_plus_0' => ['max' => true, 'num' => 0],
            'minus_1' => ['max' => false, 'num' => -1],
            'minus_2' => ['max' => false, 'num' => -2],
            'minus_3' => ['max' => false, 'num' => -3],
        ],
        'cp' => [
            'minus_1' => ['max' => false, 'num' => -1],
        ],
        'status' => [
            'replace_dehydration' => ['from' => 'thirst2', 'to' => 'thirst1'],
            'add_has_drunk' => ['from' => null, 'to' => 'hasdrunk'],
            'remove_thirst' => ['from' => 'thirst1', 'to' => null],
            'remove_dehydration' => ['from' => 'thirst2', 'to' => null],
            'reset_thirst_counter' => ['reset_thirst' => true],

            'add_infection' => ['from' => null, 'to' => 'infection'],
            'remove_infection' => ['from' => 'infection', 'to' => null],
            'add_immune' => ['from' => null, 'to' => 'immune'],

            'add_drunk' => ['from' => null, 'to' => 'drunk'],

            'add_has_eaten' => ['from' => null, 'to' => 'haseaten'],
            'add_is_drugged' => ['from' => null, 'to' => 'drugged'],
            'add_addicted' => ['from' => null, 'to' => 'addict'],
            'add_terror' => ['from' => null, 'to' => 'terror'],
            'remove_terror' => ['from' => 'terror', 'to' => null],

            'inflict_wound' => ['from' => null, 'to' => 'tg_meta_wound'],
            'heal_wound' => ['from' => 'tg_meta_wound', 'to' => null],
            'add_bandage' => ['from' => null, 'to' => 'healed'],
            'shaman_immune' => ['from' => null, 'to' => 'tg_shaman_immune'],

            'increase_lab_counter' => ['counter' => 'ActionCounter::ActionTypeHomeLab'],
            'increase_kitchen_counter' => ['counter' => 'ActionCounter::ActionTypeHomeKitchen'],

            'heal_ghoul' => ['role' => 'ghoul', 'enabled' => false, 'hunger' => -9999999, 'force' => true],
            'satisfy_ghoul_50' => ['hunger' => -50],
            'satisfy_ghoul_30' => ['hunger' => -30],
            'satisfy_ghoul_10' => ['hunger' => -15],
        ],
        'item' => [],
        'picto' => [
            'picto_break' => ['r_broken_#00']
        ],

        'spawn' => [
            'xmas_dv' => [['omg_this_will_kill_you_#00', 8], ['pocket_belt_#00', 8], ['christmas_candy_#00', 8], 'rp_manual_#00', 'rp_sheets_#00', 'rp_letter_#00', 'rp_scroll_#00', 'rp_book_#00', 'rp_book_#01', 'rp_book2_#00'],
            'xmas_3' => ['omg_this_will_kill_you_#00'],
            'xmas_2' => ['christmas_candy_#00'],
            'xmas_1' => ['xmas_gift_#00'],
            'matbox' => ['wood2_#00', 'metal_#00'],

            'metalbox' => ['what' => [['drug_#00', 16], ['bandage_#00', 28], /*['vodka_de_#00', 20],*/
                ['vodka_#00', 20], ['explo_#00', 8], ['lights_#00', 4], ['drug_hero_#00', 16], ['rhum_#00', 8]], 'where' => 'AffectItemSpawn::DropTargetRucksack'],
            'metalbox2' => ['what' => [['watergun_opt_part_#00', 19], ['pilegun_upkit_#00', 10], ['pocket_belt_#00', 12], ['cutcut_#00', 10], ['chainsaw_part_#00', 12], ['mixergun_part_#00', 19], ['big_pgun_part_#00', 7], ['lawn_part_#00', 12]], 'where' => 'AffectItemSpawn::DropTargetRucksack'],
            'catbox' => ['poison_part_#00', 'pet_cat_#00', 'angryc_#00'],
            'toolbox' => [['pile_#00', 12], ['meca_parts_#00', 17], ['rustine_#00', 13], ['tube_#00', 13], ['pharma_#00', 25], ['explo_#00', 19]],
            'foodbox' => [['food_bag_#00', 8], ['can_#00', 11], ['meat_#00', 7], ['hmeat_#00', 13], ['vegetable_#00', 8]],

            'phone' => ['what' => ['deto_#00', 'metal_bad_#00', 'pile_broken_#00', 'electro_#00'], 'where' => 'AffectItemSpawn::DropTargetFloor'],
            'phone_nw' => ['what' => ['deto_#00', 'metal_bad_#00', 'pile_broken_#00', 'electro_#00'], 'where' => 'AffectItemSpawn::DropTargetRucksack'],
            'proj' => ['lens_#00'],
            'empty_battery' => ['what' => ['pile_broken_#00'], 'where' => 'AffectItemSpawn::DropTargetFloor'],
            'battery' => ['what' => ['pile_#00'], 'where' => 'AffectItemSpawn::DropTargetFloor'],
            'safe' => ['what' => [['watergun_opt_part_#00', 10], ['big_pgun_part_#00', 5], ['lawn_part_#00', 10], ['chainsaw_part_#00', 10], ['mixergun_part_#00', 10], ['cutcut_#00', 10], ['pilegun_upkit_#00', 10], ['book_gen_letter_#00', 5], ['pocket_belt_#00', 15], ['meca_parts_#00', 10]], 'where' => 'AffectItemSpawn::DropTargetRucksack'],
            'asafe' => ['bplan_e_#00'],

            'lab_fail_drugs' => ['what' => ['drug_#00', 'xanax_#00', 'drug_random_#00', 'drug_water_#00', 'water_cleaner_#00'], "where" => 'AffectItemSpawn::DropTargetFloor'],
            'lab_success_drugs' => ['what' => ['drug_hero_#00'], "where" => 'AffectItemSpawn::DropTargetFloor'],

            'kitchen_fail_food' => ['what' => ['dish_#00'], 'where' => 'AffectItemSpawn::DropTargetFloor'],
            'kitchen_success_food' => ['what' => ['dish_tasty_#00'], 'where' => 'AffectItemSpawn::DropTargetFloor'],

            'meat_4xs' => ['what' => [['meat_#00', 4]], 'where' => 'AffectItemSpawn::DropTargetFloorOnly'],
            'meat_4x' => ['what' => [['undef_#00', 4]], 'where' => 'AffectItemSpawn::DropTargetFloorOnly'],
            'meat_2xs' => ['what' => [['meat_#00', 2]], 'where' => 'AffectItemSpawn::DropTargetFloorOnly'],
            'meat_2x' => ['what' => [['undef_#00', 2]], 'where' => 'AffectItemSpawn::DropTargetFloorOnly'],
            'meat_bmb' => ['what' => [['flesh_#00', 2]], 'where' => 'AffectItemSpawn::DropTargetFloorOnly'],

            'potion' => ['what' => [['potion_#00', 1]], "where" => 'AffectItemSpawn::DropTargetFloor'],
        ],

        'consume' => [
            '2_pharma' => ['pharma_#00', 2]
        ],

        'bp' => [],

        'group' => [
            'g_break_15' => [[['do_nothing'], 85], [['break_item'], 15]],
            'g_break_20' => [[['do_nothing'], 80], [['break_item'], 20]],
            'g_break_25' => [[['do_nothing'], 75], [['break_item'], 25]],
            'g_break_30' => [[['do_nothing'], 70], [['break_item'], 30]],
            'g_break_33' => [[['do_nothing'], 67], [['break_item'], 33]],
            'g_break_35' => [[['do_nothing'], 65], [['break_item'], 35]],
            'g_break_40' => [[['do_nothing'], 60], [['break_item'], 40]],
            'g_break_43' => [[['do_nothing'], 57], [['break_item'], 43]],
            'g_break_45' => [[['do_nothing'], 55], [['break_item'], 45]],
            'g_break_50' => [[['do_nothing'], 50], [['break_item'], 50]],
            'g_break_60' => [[['do_nothing'], 40], [['break_item'], 60]],
            'g_break_66' => [[['do_nothing'], 34], [['break_item'], 66]],
            'g_break_70' => [[['do_nothing'], 30], [['break_item'], 70]],
            'g_break_75' => [[['do_nothing'], 25], [['break_item'], 75]],
            'g_break_80' => [[['do_nothing'], 20], [['break_item'], 80]],
            'g_break_90' => [[['do_nothing'], 10], [['break_item'], 90]],

            'g_kill_1z_10' => [[['do_nothing_attack'], 90], [['kill_1_zombie'], 10]],
            'g_kill_1z_15' => [[['do_nothing_attack'], 85], [['kill_1_zombie'], 15]],
            'g_kill_1z_20' => [[['do_nothing_attack'], 80], [['kill_1_zombie'], 20]],
            'g_kill_1z_25' => [[['do_nothing_attack'], 75], [['kill_1_zombie'], 25]],
            'g_kill_1z_33' => [[['do_nothing_attack'], 67], [['kill_1_zombie'], 33]],
            'g_kill_1z_40' => [[['do_nothing_attack'], 60], [['kill_1_zombie'], 40]],
            'g_kill_1z_50' => [[['do_nothing_attack'], 50], [['kill_1_zombie'], 50]],
            'g_kill_1z_60' => [[['do_nothing_attack'], 40], [['kill_1_zombie'], 60]],
            'g_kill_1z_75' => [[['do_nothing_attack'], 25], [['kill_1_zombie'], 75]],
            'g_kill_1z_80' => [[['do_nothing_attack'], 20], [['kill_1_zombie'], 80]],
            'g_kill_1z_85' => [[['do_nothing_attack'], 15], [['kill_1_zombie'], 85]],
            'g_kill_1z_90_msg2' => [[['do_nothing_attack2'], 10], [['kill_1_zombie'], 90]], /* based on Hordes data */
            'g_kill_1z_95' => [[['do_nothing_attack'], 5], [['kill_1_zombie'], 95]],
            'g_kill_1z_99' => [[['do_nothing_attack'], 1], [['kill_1_zombie'], 99]],

            'g_kill_1z_30_taser' => [[['do_nothing_attack2'], 70], [['kill_1_zombie'], 30]], /* based on Hordes data */

            'g_kill_2z_80' => [[['do_nothing_attack'], 20], [['kill_2_zombie'], 80]],
            'g_immune_98' => [[['do_nothing'], 2], [['give_shaman_immune'], 98]],

            'g_empty_jerrygun' => [[['do_nothing'], 85], [['empty_jerrygun'], 15]], /* based on Hordes data */
        ],

        'zombies' => [
            'kill_1z_2z' => ['min' => 1, 'max' => 2],
            'kill_1z' => ['num' => 1],
            'kill_2z' => ['num' => 2],
            'kill_3z' => ['num' => 3],
            'kill_all_z' => ['num' => 999999],
        ],

        'well' => [],
    ],

    'actions' => [
        'water_tl0' => ['label' => 'Trinken', 'priority' => 1, 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['not_role_ghoul', 'not_thirsty', 'drink_mesg', 'drink_tl0a', 'drink_tl0b'], 'result' => ['contaminated_zone_infect', 'reset_thirst_counter', 'drink_ap_1', 'consume_item'], 'escort_message_key' => 'escort_water_drink', 'message_key' => 'water_drink'],
        'water_tl1a' => ['label' => 'Trinken', 'priority' => 1, 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['not_role_ghoul', 'drink_hide', 'drink_tl1'], 'result' => ['contaminated_zone_infect', 'reset_thirst_counter', 'drink_ap_1', 'drink_ap_2', 'consume_item'], 'escort_message_key' => 'escort_water_drink', 'message_key' => 'water_drink'],
        'water_tl1b' => ['label' => 'Trinken', 'priority' => 1, 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['not_role_ghoul', 'drink_rhide', 'drink_tl1'], 'result' => ['contaminated_zone_infect', 'reset_thirst_counter', 'drink_ap_2', 'consume_item'], 'escort_message_key' => 'escort_water_drink', 'message_key' => 'water_drink'],
        'water_tl2' => ['label' => 'Trinken', 'priority' => 1, 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['not_role_ghoul', 'drink_tl2'], 'result' => ['contaminated_zone_infect', 'reset_thirst_counter', 'drink_no_ap', 'consume_item'], 'escort_message_key' => 'escort_water_drink_dehydration', 'message_key' => 'water_drink_dehydration'],
        'water_g' => ['label' => 'Trinken', 'priority' => 1, 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['role_ghoul', 'drink_mesg'], 'result' => ['inflict_wound', 'consume_item'], 'escort_message_key' => 'escort_water_drink', 'message_key' => 'water_drink_ghoul'],

        'potion_tl0a' => ['label' => 'Trinken', 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['not_role_ghoul', 'not_yet_immune', 'drink_hide', 'drink_tl0a', 'drink_tl0b'], 'result' => ['contaminated_zone_infect', 'reset_thirst_counter', 'drink_ap_1', 'consume_item', ['group' => 'g_immune_98'],], 'message' => 'Du hast soeben den mystischen Trank getrunken. Hoffen wir, dass dieser Schamane weiß, was er tut...', 'escort_message' => 'Der Bürger hat den mystischen Trank in einem Zug ausgetrunken. Hoffen wir, dass dieser Schamane weiß, was er tut...'],
        'potion_tl0b' => ['label' => 'Trinken', 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['not_role_ghoul', 'not_yet_immune', 'drink_rhide', 'drink_tl0a', 'drink_tl0b'], 'result' => ['contaminated_zone_infect', 'reset_thirst_counter', 'consume_item', ['group' => 'g_immune_98'],], 'message' => 'Du hast soeben den mystischen Trank getrunken. Hoffen wir, dass dieser Schamane weiß, was er tut...', 'escort_message' => 'Der Bürger hat den mystischen Trank in einem Zug ausgetrunken. Hoffen wir, dass dieser Schamane weiß, was er tut...'],
        'potion_tl1a' => ['label' => 'Trinken', 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['not_role_ghoul', 'not_yet_immune', 'drink_hide', 'drink_tl1'], 'result' => ['contaminated_zone_infect', 'reset_thirst_counter', 'drink_ap_1', 'drink_ap_2', 'consume_item', ['group' => 'g_immune_98'],], 'message' => 'Du hast soeben den mystischen Trank getrunken. Hoffen wir, dass dieser Schamane weiß, was er tut...', 'escort_message' => 'Der Bürger hat den mystischen Trank in einem Zug ausgetrunken. Hoffen wir, dass dieser Schamane weiß, was er tut...'],
        'potion_tl1b' => ['label' => 'Trinken', 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['not_role_ghoul', 'not_yet_immune', 'drink_rhide', 'drink_tl1'], 'result' => ['contaminated_zone_infect', 'reset_thirst_counter', 'drink_ap_2', 'consume_item', ['group' => 'g_immune_98'],], 'message' => 'Du hast soeben den mystischen Trank getrunken. Hoffen wir, dass dieser Schamane weiß, was er tut...', 'escort_message' => 'Der Bürger hat den mystischen Trank in einem Zug ausgetrunken. Hoffen wir, dass dieser Schamane weiß, was er tut...'],
        'potion_tl2' => ['label' => 'Trinken', 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['not_role_ghoul', 'not_yet_immune', 'drink_tl2'], 'result' => ['contaminated_zone_infect', 'reset_thirst_counter', 'drink_no_ap', 'consume_item', ['group' => 'g_immune_98'],], 'message' => 'Du hast soeben den mystischen Trank getrunken. Hoffen wir, dass dieser Schamane weiß, was er tut...', 'escort_message' => 'Der Bürger hat den mystischen Trank in einem Zug ausgetrunken. Hoffen wir, dass dieser Schamane weiß, was er tut...'],
        'potion_g' => ['label' => 'Trinken', 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['role_ghoul', 'not_yet_immune', 'drink_mesg'], 'result' => ['inflict_wound', 'consume_item', ['group' => 'g_immune_98'],], 'message' => 'Du hast soeben den mystischen Trank getrunken. Hoffen wir, dass dieser Schamane weiß, was er tut...', 'escort_message' => 'Der Bürger hat den mystischen Trank in einem Zug ausgetrunken. Hoffen wir, dass dieser Schamane weiß, was er tut...'],

        'potion_tl0a_immune' => ['label' => 'Trinken', 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['not_role_ghoul', 'immune', 'drink_hide', 'drink_tl0a', 'drink_tl0b'], 'result' => ['contaminated_zone_infect', 'reset_thirst_counter', 'drink_ap_1', 'consume_item', ['group' => 'g_immune_98'],], 'message' => 'Tja, Vertrauen ist gut, Kontrolle ist besser... Ja, du wurdest bereits geschützt!', 'escort_message' => 'Der Bürger hat den mystischen Trank in einem Zug ausgetrunken. Hoffen wir, dass dieser Schamane weiß, was er tut...'],
        'potion_tl0b_immune' => ['label' => 'Trinken', 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['not_role_ghoul', 'immune', 'drink_rhide', 'drink_tl0a', 'drink_tl0b'], 'result' => ['contaminated_zone_infect', 'reset_thirst_counter', 'consume_item', ['group' => 'g_immune_98'],], 'message' => 'Tja, Vertrauen ist gut, Kontrolle ist besser... Ja, du wurdest bereits geschützt!', 'escort_message' => 'Der Bürger hat den mystischen Trank in einem Zug ausgetrunken. Hoffen wir, dass dieser Schamane weiß, was er tut...'],
        'potion_tl1a_immune' => ['label' => 'Trinken', 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['not_role_ghoul', 'immune', 'drink_hide', 'drink_tl1'], 'result' => ['contaminated_zone_infect', 'reset_thirst_counter', 'drink_ap_1', 'drink_ap_2', 'consume_item', ['group' => 'g_immune_98'],], 'message' => 'Tja, Vertrauen ist gut, Kontrolle ist besser... Ja, du wurdest bereits geschützt!', 'escort_message' => 'Der Bürger hat den mystischen Trank in einem Zug ausgetrunken. Hoffen wir, dass dieser Schamane weiß, was er tut...'],
        'potion_tl1b_immune' => ['label' => 'Trinken', 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['not_role_ghoul', 'immune', 'drink_rhide', 'drink_tl1'], 'result' => ['contaminated_zone_infect', 'reset_thirst_counter', 'drink_ap_2', 'consume_item', ['group' => 'g_immune_98'],], 'message' => 'Tja, Vertrauen ist gut, Kontrolle ist besser... Ja, du wurdest bereits geschützt!', 'escort_message' => 'Der Bürger hat den mystischen Trank in einem Zug ausgetrunken. Hoffen wir, dass dieser Schamane weiß, was er tut...'],
        'potion_tl2_immune' => ['label' => 'Trinken', 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['not_role_ghoul', 'immune', 'drink_tl2'], 'result' => ['contaminated_zone_infect', 'reset_thirst_counter', 'drink_no_ap', 'consume_item', ['group' => 'g_immune_98'],], 'message' => 'Tja, Vertrauen ist gut, Kontrolle ist besser... Ja, du wurdest bereits geschützt!', 'escort_message' => 'Der Bürger hat den mystischen Trank in einem Zug ausgetrunken. Hoffen wir, dass dieser Schamane weiß, was er tut...'],
        'potion_g_immune' => ['label' => 'Trinken', 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['role_ghoul', 'immune', 'drink_mesg'], 'result' => ['inflict_wound', 'consume_item', ['group' => 'g_immune_98'],], 'message' => 'Tja, Vertrauen ist gut, Kontrolle ist besser... Ja, du wurdest bereits geschützt!', 'escort_message' => 'Der Bürger hat den mystischen Trank in einem Zug ausgetrunken. Hoffen wir, dass dieser Schamane weiß, was er tut...'],

        'watercan3_tl0' => ['label' => 'Trinken', 'priority' => 4, 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['not_role_ghoul', 'not_thirsty', 'drink_mesg', 'drink_tl0a', 'drink_tl0b'], 'result' => ['contaminated_zone_infect', 'reset_thirst_counter', 'drink_ap_1', 'produce_watercan2'], 'escort_message_key' => 'escort_water_drink', 'message_key' => 'water_drink'],
        'watercan3_tl1a' => ['label' => 'Trinken', 'priority' => 4, 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['not_role_ghoul', 'drink_hide', 'drink_tl1'], 'result' => ['contaminated_zone_infect', 'reset_thirst_counter', 'drink_ap_1', 'drink_ap_2', 'produce_watercan2'], 'escort_message_key' => 'escort_water_drink', 'message_key' => 'water_drink'],
        'watercan3_tl1b' => ['label' => 'Trinken', 'priority' => 4, 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['not_role_ghoul', 'drink_rhide', 'drink_tl1'], 'result' => ['contaminated_zone_infect', 'reset_thirst_counter', 'drink_ap_2', 'produce_watercan2'], 'escort_message_key' => 'escort_water_drink', 'message_key' => 'water_drink'],
        'watercan3_tl2' => ['label' => 'Trinken', 'priority' => 4, 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['not_role_ghoul', 'drink_tl2'], 'result' => ['contaminated_zone_infect', 'reset_thirst_counter', 'drink_no_ap', 'produce_watercan2'], 'escort_message_key' => 'escort_water_drink_dehydration', 'message_key' => 'water_drink_dehydration'],
        'watercan3_g' => ['label' => 'Trinken', 'priority' => 4, 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['role_ghoul', 'drink_mesg'], 'result' => ['inflict_wound', 'produce_watercan2'], 'escort_message_key' => 'escort_water_drink', 'message_key' => 'water_drink_ghoul'],

        'watercan2_tl0' => ['label' => 'Trinken', 'priority' => 3, 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['not_role_ghoul', 'not_thirsty', 'drink_mesg', 'drink_tl0a', 'drink_tl0b'], 'result' => ['contaminated_zone_infect', 'reset_thirst_counter', 'drink_ap_1', 'produce_watercan1'], 'escort_message_key' => 'escort_water_drink', 'message_key' => 'water_drink'],
        'watercan2_tl1a' => ['label' => 'Trinken', 'priority' => 3, 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['not_role_ghoul', 'drink_hide', 'drink_tl1'], 'result' => ['contaminated_zone_infect', 'reset_thirst_counter', 'drink_ap_1', 'drink_ap_2', 'produce_watercan1'], 'escort_message_key' => 'escort_water_drink', 'message_key' => 'water_drink'],
        'watercan2_tl1b' => ['label' => 'Trinken', 'priority' => 3, 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['not_role_ghoul', 'drink_rhide', 'drink_tl1'], 'result' => ['contaminated_zone_infect', 'reset_thirst_counter', 'drink_ap_2', 'produce_watercan1'], 'escort_message_key' => 'escort_water_drink', 'message_key' => 'water_drink'],
        'watercan2_tl2' => ['label' => 'Trinken', 'priority' => 3, 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['not_role_ghoul', 'drink_tl2'], 'result' => ['contaminated_zone_infect', 'reset_thirst_counter', 'drink_no_ap', 'produce_watercan1'], 'escort_message_key' => 'escort_water_drink_dehydration', 'message_key' => 'water_drink_dehydration'],
        'watercan2_g' => ['label' => 'Trinken', 'priority' => 3, 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['role_ghoul', 'drink_mesg'], 'result' => ['inflict_wound', 'produce_watercan1'], 'escort_message_key' => 'escort_water_drink', 'message_key' => 'water_drink_ghoul'],

        'watercan1_tl0' => ['label' => 'Trinken', 'priority' => 2, 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['not_role_ghoul', 'not_thirsty', 'drink_mesg', 'drink_tl0a', 'drink_tl0b'], 'result' => ['contaminated_zone_infect', 'reset_thirst_counter', 'drink_ap_1', 'produce_watercan0'], 'escort_message_key' => 'escort_water_drink', 'message_key' => 'water_drink'],
        'watercan1_tl1a' => ['label' => 'Trinken', 'priority' => 2, 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['not_role_ghoul', 'drink_hide', 'drink_tl1'], 'result' => ['contaminated_zone_infect', 'reset_thirst_counter', 'drink_ap_1', 'drink_ap_2', 'produce_watercan0'], 'escort_message_key' => 'escort_water_drink', 'message_key' => 'water_drink'],
        'watercan1_tl1b' => ['label' => 'Trinken', 'priority' => 2, 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['not_role_ghoul', 'drink_rhide', 'drink_tl1'], 'result' => ['contaminated_zone_infect', 'reset_thirst_counter', 'drink_ap_2', 'produce_watercan0'], 'escort_message_key' => 'escort_water_drink', 'message_key' => 'water_drink'],
        'watercan1_tl2' => ['label' => 'Trinken', 'priority' => 2, 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['not_role_ghoul', 'drink_tl2'], 'result' => ['contaminated_zone_infect', 'reset_thirst_counter', 'drink_no_ap', 'produce_watercan0'], 'escort_message_key' => 'escort_water_drink_dehydration', 'message_key' => 'water_drink_dehydration'],
        'watercan1_g' => ['label' => 'Trinken', 'priority' => 2, 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['role_ghoul', 'drink_mesg'], 'result' => ['inflict_wound', 'produce_watercan0'], 'escort_message_key' => 'escort_water_drink', 'message_key' => 'water_drink_ghoul'],

        'water_no_effect' => ['label' => 'Trinken', 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => [], 'result' => ['contaminated_zone_infect', 'consume_item'], 'message' => 'Du hast {item} getrunken, aber scheinbar geschieht nichts...'],

        'alcohol' => ['label' => 'Trinken', 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['not_drunk', 'not_hungover'], 'result' => ['contaminated_zone_infect', 'just_ap6', 'drunk', 'consume_item'], 'message' => 'Dir ist schwindelig und du würdest dich am liebsten übergeben... Egal was, Hauptsache <strong>du bekommst wieder einen klaren Kopf</strong>.'],
        'alcohol_dx' => ['label' => 'Trinken', 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => [], 'result' => ['contaminated_zone_infect', 'just_ap6', 'drunk', 'consume_item'], 'message' => 'Dir ist schwindelig und du würdest dich am liebsten übergeben... Egal was, Hauptsache <strong>du bekommst wieder einen klaren Kopf</strong>.'],

        'coffee' => ['label' => 'Trinken', 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => [], 'result' => ['contaminated_zone_infect', 'plus_4ap', 'consume_item'], 'message' => 'Dieses Gefühl des Wohlbefindens, das dieser kleine Kaffee hervorruft, bringt dich sofort wieder auf die Beine. Aah!'],

        'special_dice' => ['label' => 'Werfen', 'at00' => true, 'meta' => ['not_yet_dice', 'no_bonus_ap'], 'result' => ['casino_dice'], 'message' => '{casino}'],
        'special_card' => ['label' => 'Karte ziehen', 'at00' => true, 'meta' => ['not_yet_card', 'no_bonus_ap'], 'result' => ['casino_card'], 'message' => '{casino}'],
        'special_guitar' => ['label' => 'Spielen', 'meta' => ['not_yet_guitar', 'must_be_inside'], 'result' => ['casino_guitar'], 'message' => '{casino}'],

        'can' => ['label' => 'Öffnen', 'at00' => true, 'meta' => ['not_profession_tech', 'have_can_opener', 'is_not_wounded_hands'], 'result' => [['item' => ['consume' => false, 'morph' => 'can_open_#00']]], 'message_key' => 'container_open_tool'],
        'can_t1' => ['label' => 'Öffnen', 'at00' => true, 'meta' => ['profession_tech', 'have_can_opener_hd', 'is_not_wounded_hands'], 'result' => [['item' => ['consume' => false, 'morph' => 'can_open_#00']]], 'message_key' => 'container_open_tool'],
        'can_t2' => ['label' => 'Öffnen (1 BP)', 'at00' => true, 'meta' => ['profession_tech', 'not_have_can_opener_hd', 'min_1_cp_hd'], 'result' => ['minus_1cp', ['item' => ['consume' => false, 'morph' => 'can_open_#00']]], 'message_key' => 'container_open'],
        'can_t3' => ['label' => 'Öffnen', 'at00' => true, 'meta' => ['profession_tech', 'not_have_can_opener_hd', 'have_can_opener', 'no_cp', 'is_not_wounded_hands'], 'result' => []],

        'eat_6ap' => ['label' => 'Essen', 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['eat_ap', 'no_full_ap_msg_food'], 'result' => ['contaminated_zone_infect', 'eat_ap6', 'consume_item'], 'escort_message_key' => 'escort_food_eat'],
        'eat_7ap' => ['label' => 'Essen', 'priority' => 1, 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['eat_ap', 'no_full_ap_msg_food'], 'result' => ['contaminated_zone_infect', 'eat_ap7', 'consume_item'], 'escort_message_key' => 'escort_food_eat'],

        'drug_xana1' => ['label' => 'Einsetzen', 'cover' => true, 'at00' => true, 'allow_when_terrorized' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['drug_1', 'must_be_terrorized_hd'], 'result' => ['contaminated_zone_infect', 'drug_any', 'unterrorize', 'consume_item'], 'message_key' => 'drug_xanax'],
        'drug_xana2' => ['label' => 'Einsetzen', 'cover' => true, 'at00' => true, 'allow_when_terrorized' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['drug_2', 'must_be_terrorized_hd'], 'result' => ['contaminated_zone_infect', 'drug_addict', 'unterrorize', 'consume_item'], 'message_key' => 'drug_xanax'],
        'drug_xana3' => ['label' => 'Einsetzen', 'cover' => true, 'at00' => true, 'allow_when_terrorized' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['drug_1', 'must_not_be_terrorized'], 'result' => ['contaminated_zone_infect', 'drug_any', 'consume_item'], 'message_key' => 'drug_no_use'],
        'drug_xana4' => ['label' => 'Einsetzen', 'cover' => true, 'at00' => true, 'allow_when_terrorized' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['drug_2', 'must_not_be_terrorized'], 'result' => ['contaminated_zone_infect', 'drug_addict', 'consume_item'], 'message_key' => 'drug_no_use'],
        'drug_par_1' => ['label' => 'Einnehmen', 'cover' => true, 'at00' => true, 'allow_when_terrorized' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['drug_1', 'is_not_infected_h'], 'result' => [['message' => ['text' => 'Die Medizin gibt dir Kraft: Du bist jetzt immun gegen Infektionen und kannst nicht in einen Ghul verwandelt werden. Diese Wirkung lässt nach dem Angriff nach.']], 'contaminated_zone_infect', 'drug_any', 'immune', 'consume_item'], 'message_key' => 'drug_no_use_2'],
        'drug_par_2' => ['label' => 'Einnehmen', 'cover' => true, 'at00' => true, 'allow_when_terrorized' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['drug_2', 'is_not_infected_h'], 'result' => [['message' => ['text' => 'Die Medizin gibt dir Kraft: Du bist jetzt immun gegen Infektionen und kannst nicht in einen Ghul verwandelt werden. Diese Wirkung lässt nach dem Angriff nach.']], 'contaminated_zone_infect', 'drug_addict', 'immune', 'consume_item'], 'message_key' => 'drug_no_use_2'],
        'drug_par_3' => ['label' => 'Einnehmen', 'cover' => true, 'at00' => true, 'allow_when_terrorized' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['drug_1', 'is_infected_h'], 'result' => [['message' => ['text' => 'Die Medizin gibt dir Kraft: Du bist jetzt immun gegen Infektionen und kannst nicht in einen Ghul verwandelt werden. Diese Wirkung lässt nach dem Angriff nach.']], 'contaminated_zone_infect', 'drug_any', 'disinfect', 'immune', 'consume_item'], 'message_key' => 'drug_para'],
        'drug_par_4' => ['label' => 'Einnehmen', 'cover' => true, 'at00' => true, 'allow_when_terrorized' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['drug_2', 'is_infected_h'], 'result' => [['message' => ['text' => 'Die Medizin gibt dir Kraft: Du bist jetzt immun gegen Infektionen und kannst nicht in einen Ghul verwandelt werden. Diese Wirkung lässt nach dem Angriff nach.']], 'contaminated_zone_infect', 'drug_addict', 'disinfect', 'immune', 'consume_item'], 'message_key' => 'drug_para'],
        'drug_6ap_1' => ['label' => 'Einnehmen', 'cover' => true, 'at00' => true, 'allow_when_terrorized' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['drug_1'], 'result' => ['contaminated_zone_infect', 'drug_any', 'just_ap6', 'consume_item'], 'message_key' => 'drug_normal_ap'],
        'drug_6ap_2' => ['label' => 'Einnehmen', 'cover' => true, 'at00' => true, 'allow_when_terrorized' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['drug_2'], 'result' => ['contaminated_zone_infect', 'drug_addict', 'just_ap6', 'consume_item'], 'message_key' => 'drug_normal_ap'],
        'drug_7ap_1' => ['label' => 'Einnehmen', 'cover' => true, 'at00' => true, 'allow_when_terrorized' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['drug_1'], 'result' => ['contaminated_zone_infect', 'drug_any', 'just_ap7', 'consume_item']],
        'drug_7ap_2' => ['label' => 'Einnehmen', 'cover' => true, 'at00' => true, 'allow_when_terrorized' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['drug_2'], 'result' => ['contaminated_zone_infect', 'drug_addict', 'just_ap7', 'consume_item']],
        'drug_8ap_1' => ['label' => 'Einnehmen', 'cover' => true, 'at00' => true, 'allow_when_terrorized' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['drug_1'], 'result' => ['contaminated_zone_infect', 'drug_any', 'just_ap8', 'consume_item'], 'message_key' => 'drug_twin_ap'],
        'drug_8ap_2' => ['label' => 'Einnehmen', 'cover' => true, 'at00' => true, 'allow_when_terrorized' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['drug_2'], 'result' => ['contaminated_zone_infect', 'drug_addict', 'just_ap8', 'consume_item'], 'message_key' => 'drug_twin_ap'],

        'drug_april_1' => ['label' => 'Einnehmen', 'cover' => true, 'at00' => true, 'allow_when_terrorized' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['drug_1', 'must_be_aprils_fools'], 'result' => ['contaminated_zone_infect', 'drug_any', 'just_ap8', 'april', 'consume_item'], 'message_key' => 'drug_no_use_3'],
        'drug_april_2' => ['label' => 'Einnehmen', 'cover' => true, 'at00' => true, 'allow_when_terrorized' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['drug_2', 'must_be_aprils_fools'], 'result' => ['contaminated_zone_infect', 'drug_addict', 'just_ap8', 'april', 'consume_item'], 'message_key' => 'drug_no_use_3'],

        'drug_hyd_1' => ['label' => 'Einnehmen', 'cover' => true, 'at00' => true, 'allow_when_terrorized' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['drug_1', 'drink_tl0a', 'drink_tl0b'], 'result' => ['contaminated_zone_infect', 'drug_any', 'consume_item'], 'message_key' => 'drug_no_use'],
        'drug_hyd_2' => ['label' => 'Einnehmen', 'cover' => true, 'at00' => true, 'allow_when_terrorized' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['drug_2', 'drink_tl0a', 'drink_tl0b'], 'result' => ['contaminated_zone_infect', 'drug_addict', 'consume_item'], 'message_key' => 'drug_no_use'],
        'drug_hyd_3' => ['label' => 'Einnehmen', 'cover' => true, 'at00' => true, 'allow_when_terrorized' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['drug_1', 'drink_tl1'], 'result' => ['contaminated_zone_infect', 'drug_any', 'drink_ap_2', 'consume_item'], 'message_key' => 'drug_hyd'],
        'drug_hyd_4' => ['label' => 'Einnehmen', 'cover' => true, 'at00' => true, 'allow_when_terrorized' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['drug_2', 'drink_tl1'], 'result' => ['contaminated_zone_infect', 'drug_addict', 'drink_ap_2', 'consume_item'], 'message_key' => 'drug_hyd'],
        'drug_hyd_5' => ['label' => 'Einnehmen', 'cover' => true, 'at00' => true, 'allow_when_terrorized' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['drug_1', 'drink_tl2'], 'result' => ['contaminated_zone_infect', 'drug_any', 'drink_no_ap', 'consume_item'], 'message_key' => 'drug_hyd'],
        'drug_hyd_6' => ['label' => 'Einnehmen', 'cover' => true, 'at00' => true, 'allow_when_terrorized' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['drug_2', 'drink_tl2'], 'result' => ['contaminated_zone_infect', 'drug_addict', 'drink_no_ap', 'consume_item'], 'message_key' => 'drug_hyd'],

        'drug_beta' => ['label' => 'Einnehmen', 'cover' => true, 'at00' => true, 'allow_when_terrorized' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['not_yet_beta'], 'result' => [['ap' => ['max' => true, 'num' => 20], 'status' => ['from' => null, 'to' => 'tg_betadrug']]]],
        'cyanide' => ['label' => 'Einnehmen', 'cover' => true, 'at00' => true, 'allow_when_terrorized' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['not_before_day_2'], 'result' => ['contaminated_zone_infect', 'cyanide', 'consume_item']],

        'bandage' => ['label' => 'Verbinden', 'at00' => true, 'meta' => ['is_wounded', 'is_not_bandaged'], 'result' => ['heal_wound', 'consume_item', 'add_bandage'], 'message' => 'So, zur Desinfektion nur noch draufspucken und hopp: Sieht wie neu aus!'],
        'emt' => ['label' => 'Einsetzen', 'at00' => true, 'meta' => ['is_not_wounded'], 'result' => ['just_ap6', 'inflict_wound', ['item' => ['consume' => false, 'morph' => 'sport_elec_empty_#00']], ['picto' => ['r_maso_#00']]], 'message' => 'Es geht doch nichts über einen schönen Stromstoß in die Wirbelsäule, um so richtig wach zu werden! Aber irgendwie riecht es jetzt hier nach verbranntem Fleisch...'],

        'drug_rand_1' => ['label' => 'Einnehmen', 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['drug_1'], 'result' => ['contaminated_zone_infect', 'consume_item', ['picto' => ['r_cobaye_#00']], ['group' => [
            [['drug_any', 'just_ap6', ['message' => ['text_key' => 'drug_normal_ap']]], 40],
            [['drug_any', 'terrorize', ['message' => ['text_key' => 'drug_terror']]], 20],
            [['drug_any', 'drug_addict', 'just_ap7', ['message' => ['text_key' => 'drug_addict_ap']]], 20],
            [['do_nothing', ['message' => ['text_key' => 'drug_no_effect']]], 20],
        ]]]],
        'drug_rand_2' => ['label' => 'Einnehmen', 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['drug_2'], 'result' => ['contaminated_zone_infect', 'consume_item', ['picto' => ['r_cobaye_#00']], ['group' => [
            [['drug_addict', 'just_ap6', ['message' => ['text_key' => 'drug_normal_ap']]], 40],
            [['drug_addict', 'terrorize', ['message' => ['text_key' => 'drug_terror']]], 20],
            [['drug_addict', 'just_ap7', ['message' => ['text_key' => 'drug_addict_ap']]], 20],
            [['do_nothing', ['message' => ['text_key' => 'drug_no_effect']]], 20],
        ]]]], /* Unlabelled drugs, based on Igloo stats (1 894 test) */
        'drug_lsd_1' => ['label' => 'Einnehmen', 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['drug_1'], 'result' => ['contaminated_zone_infect', 'consume_item', ['picto' => ['r_cobaye_#00']], ['group' => [
            [['drug_any', 'just_ap6', ['message' => ['text_key' => 'drug_normal_ap']]], 75],
            [['drug_any', 'just_ap6', 'terrorize', ['message' => ['text_key' => 'drug_terror']]], 25],
        ]]]],
        'drug_lsd_2' => ['label' => 'Einnehmen', 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['drug_2'], 'result' => ['contaminated_zone_infect', 'consume_item', ['picto' => ['r_cobaye_#00']], ['group' => [
            [['drug_addict', 'just_ap6', ['message' => ['text_key' => 'drug_normal_ap']]], 75],
            [['drug_addict', 'just_ap6', 'terrorize', ['message' => ['text_key' => 'drug_terror']]], 25],
        ]]]],
        'drug_beta_bad_1' => ['label' => 'Einnehmen', 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['drug_1'], 'result' => ['contaminated_zone_infect', 'consume_item', ['picto' => ['r_cobaye_#00']], ['group' => [
            [['drug_any', 'just_ap6', ['message' => ['text_key' => 'drug_normal_ap']]], 4],
            [['drug_any', 'terrorize', ['message' => ['text_key' => 'drug_terror']]], 2],
            [['drug_any', 'drug_addict', 'just_ap7', ['message' => ['text_key' => 'drug_addict_ap']]], 2],
            [['do_nothing', ['message' => ['text_key' => 'drug_no_effect']]], 2],
        ]]]],
        'drug_beta_bad_2' => ['label' => 'Einnehmen', 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['drug_2'], 'result' => ['contaminated_zone_infect', 'consume_item', ['picto' => ['r_cobaye_#00']], ['group' => [
            [['drug_addict', 'just_ap6', ['message' => ['text_key' => 'drug_normal_ap']]], 4],
            [['drug_addict', 'terrorize', ['message' => ['text_key' => 'drug_terror']]], 2],
            [['drug_addict', 'just_ap7', ['message' => ['text_key' => 'drug_addict_ap']]], 2],
            [['do_nothing', ['message' => ['text_key' => 'drug_no_effect']]], 2],
        ]]]],
        'drug_rand_xmas' => ['label' => 'Essen', 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['eat_ap'], 'result' => ['contaminated_zone_infect', 'consume_item', ['picto' => ['r_cobaye_#00']], ['group' => [
            // [ ['plus_ap8_30', ['message' => ['text' => 'Du schluckst das Bonbon mit einem Lächeln auf den Lippen herunter.']]], 22 ],
            [['plus_ap8_30', 'drug_addict_no_msg', ['message' => ['text' => 'Du schluckst das Bonbon mit einem Lächeln auf den Lippen herunter... das jedoch schnell wieder verschwindet! Die Füllung besteht aus einem <strong>starken psychoaktiven Gift!</strong><t-stat-up-addict>{hr}Du bist jetzt ein Süchtiger!</t-stat-up-addict>']]], 18],
            [['plus_ap8_30', 'terrorize', ['message' => ['text' => 'Du schluckst das Bonbon mit einem Lächeln auf den Lippen herunter... das jedoch schnell wieder verschwindet! Die Füllung besteht aus einem <strong>starken psychoaktiven Gift!</strong><t-stat-up-terror>{hr}Du bist vor Angst erstarrt!</t-stat-up-terror>']]], 50],
            [['plus_ap8_30', 'infect_no_msg', ['message' => ['text' => 'Du schluckst das Bonbon mit einem Lächeln auf den Lippen herunter... das jedoch schnell wieder verschwindet! Die Füllung besteht aus einem <strong>starken psychoaktiven Gift!</strong><t-stat-up-infection>{hr}Du bist jetzt infiziert!</t-stat-up-infection>']]], 30],
            [['death_poison'], 2],
        ]]]],

        'open_doggybag' => ['label' => 'Öffnen', 'at00' => true, 'meta' => ['is_not_wounded_hands'], 'result' => ['consume_item', ['spawn' => [['food_pims_#00', 186], ['food_tarte_#00', 174], ['food_chick_#00', 194], ['food_biscuit_#00', 188], ['food_bar3_#00', 181], ['food_bar1_#00', 168], ['food_sandw_#00', 162], ['food_bar2_#00', 222]]]], 'message' => 'Du hast dein <span class="tool">{item}</span> ausgepackt und <span class="tool">{items_spawn}</span> erhalten!'],
        'open_lunchbag' => ['label' => 'Öffnen', 'at00' => true, 'meta' => ['is_not_wounded_hands'], 'result' => ['consume_item', ['spawn' => ['food_candies_#00', 'food_noodles_hot_#00', 'vegetable_tasty_#00', 'meat_#00']]], 'message_key' => 'container_open'],
        'open_c_chest' => ['label' => 'Öffnen', 'at00' => true, 'meta' => ['is_not_wounded_hands'], 'result' => ['consume_item', ['spawn' => ['pile_#00', 'radio_off_#00', 'pharma_#00', 'lights_#00']]], 'message_key' => 'container_open'],
        'open_h_chest' => ['label' => 'Öffnen', 'at00' => true, 'meta' => ['is_not_wounded_hands'], 'result' => ['consume_item', ['spawn' => ['watergun_empty_#00', 'pilegun_empty_#00', 'flash_#00', 'repair_one_#00', 'smoke_bomb_#00']]], 'message_key' => 'container_open'],
        'open_postbox' => ['label' => 'Öffnen', 'at00' => true, 'meta' => ['is_not_wounded_hands'], 'result' => ['consume_item', ['spawn' => ['money_#00', 'rp_book_#00', 'rp_book_#01', 'rp_sheets_#00']]], 'message_key' => 'container_open'],
        'open_postbox_xl' => ['label' => 'Öffnen', 'at00' => true, 'meta' => ['is_not_wounded_hands'], 'result' => ['consume_item', ['spawn' => ['machine_gun_#00', 'rsc_pack_2_#00', 'rhum_#00', 'vibr_empty_#00']]], 'message_key' => 'container_open'],
        'open_letterbox' => ['label' => 'Öffnen', 'at00' => true, 'meta' => ['is_not_wounded_hands'], 'result' => ['consume_item', ['spawn' => ['rp_book2_#00', 'rp_manual_#00', 'rp_scroll_#00', 'rp_scroll_#01', 'rp_sheets_#00', 'rp_letter_#00']]], 'message_key' => 'container_open'],
        'open_justbox' => ['label' => 'Öffnen', 'at00' => true, 'meta' => ['is_not_wounded_hands'], 'result' => ['consume_item', ['spawn' => ['money_#00', 'rp_book_#00', 'rp_book_#01', 'rp_sheets_#00']]], 'message_key' => 'container_open'],

        'open_gamebox' => ['label' => 'Öffnen', 'at00' => true, 'meta' => ['is_not_wounded_hands'], 'result' => ['consume_item', ['spawn' => ['dice_#00', 'cards_#00']]], 'message_key' => 'container_open'],
        'open_abox' => ['label' => 'Öffnen', 'at00' => true, 'meta' => ['is_not_wounded_hands'], 'result' => ['consume_item', ['spawn' => ['bplan_r_#00']]], 'message_key' => 'container_open'],
        'open_cbox' => ['label' => 'Öffnen', 'at00' => true, 'meta' => ['is_not_wounded_hands'], 'result' => ['consume_item', ['spawn' => [['bplan_c_#00', 50], ['bplan_u_#00', 35], ['bplan_r_#00', 10], ['bplan_e_#00', 5]]]], 'message_key' => 'container_open_cbox'],

        'open_matbox3' => ['label' => 'Öffnen', 'at00' => true, 'meta' => ['is_not_wounded_hands', 'room_for_item'], 'result' => [['item' => ['consume' => false, 'morph' => 'rsc_pack_2_#00'], 'spawn' => 'matbox']], 'message_key' => 'container_open_not_empty'],
        'open_matbox2' => ['label' => 'Öffnen', 'at00' => true, 'meta' => ['is_not_wounded_hands', 'room_for_item'], 'result' => [['item' => ['consume' => false, 'morph' => 'rsc_pack_1_#00'], 'spawn' => 'matbox']], 'message_key' => 'container_open_not_empty'],
        'open_matbox1' => ['label' => 'Öffnen', 'at00' => true, 'meta' => ['is_not_wounded_hands'], 'result' => ['consume_item', ['spawn' => 'matbox']], 'message_key' => 'container_open_empty'],

        'open_xmasbox3' => ['label' => 'Öffnen', 'at00' => true, 'meta' => ['is_not_wounded_hands'], 'result' => [['item' => ['consume' => false, 'morph' => 'chest_christmas_2_#00'], 'spawn' => 'xmas_3']], 'message_key' => 'container_open_not_empty'],
        'open_xmasbox2' => ['label' => 'Öffnen', 'at00' => true, 'meta' => ['is_not_wounded_hands'], 'result' => [['item' => ['consume' => false, 'morph' => 'chest_christmas_1_#00'], 'spawn' => 'xmas_2']], 'message_key' => 'container_open_not_empty'],
        'open_xmasbox1' => ['label' => 'Öffnen', 'at00' => true, 'meta' => ['is_not_wounded_hands'], 'result' => ['consume_item', ['spawn' => 'xmas_1']], 'message_key' => 'container_open_empty'],

        'open_metalbox' => ['label' => 'Öffnen', 'at00' => true, 'meta' => ['not_profession_tech', 'have_can_opener', 'is_not_wounded_hands'], 'result' => ['consume_item', ['spawn' => 'metalbox']], 'message_key' => 'container_open_tool'],
        'open_metalbox2' => ['label' => 'Öffnen', 'at00' => true, 'meta' => ['not_profession_tech', 'have_can_opener', 'is_not_wounded_hands'], 'result' => ['consume_item', ['spawn' => 'metalbox2']], 'message_key' => 'container_open_tool'],
        'open_catbox' => ['label' => 'Öffnen', 'at00' => true, 'meta' => ['not_profession_tech', 'have_can_opener', 'is_not_wounded_hands'], 'result' => ['consume_item', ['spawn' => 'catbox']], 'message_key' => 'container_open_tool'],
        'open_toolbox' => ['label' => 'Öffnen', 'at00' => true, 'meta' => ['not_profession_tech', 'have_box_opener', 'is_not_wounded_hands'], 'result' => ['consume_item', ['spawn' => 'toolbox']], 'message_key' => 'container_open_weapon'],
        'open_foodbox_out' => ['label' => 'Öffnen', 'at00' => true, 'meta' => ['not_profession_tech', 'have_parcel_opener', 'is_not_wounded_hands', 'must_be_outside_or_exploring'], 'result' => ['consume_item', ['spawn' => 'foodbox']], 'message_key' => 'container_open_weapon'],
        'open_foodbox_in' => ['label' => 'Öffnen', 'at00' => true, 'meta' => ['not_profession_tech', 'have_parcel_opener_home', 'is_not_wounded_hands', 'must_be_inside'], 'result' => ['consume_item', ['spawn' => 'foodbox']], 'message_key' => 'container_open_weapon'],

        'open_metalbox_t1' => ['label' => 'Öffnen', 'at00' => true, 'meta' => ['profession_tech', 'have_can_opener_hd', 'is_not_wounded_hands'], 'result' => ['consume_item', ['spawn' => 'metalbox']], 'message_key' => 'container_open_tool'],
        'open_metalbox2_t1' => ['label' => 'Öffnen', 'at00' => true, 'meta' => ['profession_tech', 'have_can_opener_hd', 'is_not_wounded_hands'], 'result' => ['consume_item', ['spawn' => 'metalbox2']], 'message_key' => 'container_open_tool'],
        'open_catbox_t1' => ['label' => 'Öffnen', 'at00' => true, 'meta' => ['profession_tech', 'have_can_opener_hd', 'is_not_wounded_hands'], 'result' => ['consume_item', ['spawn' => 'catbox']], 'message_key' => 'container_open_tool'],
        'open_toolbox_t1' => ['label' => 'Öffnen', 'at00' => true, 'meta' => ['profession_tech', 'have_box_opener_hd', 'is_not_wounded_hands'], 'result' => ['consume_item', ['spawn' => 'toolbox']], 'message_key' => 'container_open_weapon'],
        'open_foodbox_out_t1' => ['label' => 'Öffnen', 'at00' => true, 'meta' => ['profession_tech', 'have_parcel_opener_hd', 'is_not_wounded_hands', 'must_be_outside_or_exploring'], 'result' => ['consume_item', ['spawn' => 'foodbox']], 'message_key' => 'container_open_weapon'],
        'open_foodbox_in_t1' => ['label' => 'Öffnen', 'at00' => true, 'meta' => ['profession_tech', 'have_parcel_opener_home_hd', 'is_not_wounded_hands', 'must_be_inside'], 'result' => ['consume_item', ['spawn' => 'foodbox']], 'message_key' => 'container_open_weapon'],

        'open_metalbox_t2' => ['label' => 'Öffnen (1 BP)', 'at00' => true, 'meta' => ['profession_tech', 'not_have_can_opener_hd', 'min_1_cp'], 'result' => ['minus_1cp', 'consume_item', ['spawn' => 'metalbox']], 'message_key' => 'container_open'],
        'open_metalbox2_t2' => ['label' => 'Öffnen (1 BP)', 'at00' => true, 'meta' => ['profession_tech', 'not_have_can_opener_hd', 'min_1_cp'], 'result' => ['minus_1cp', 'consume_item', ['spawn' => 'metalbox2']], 'message_key' => 'container_open'],
        'open_catbox_t2' => ['label' => 'Öffnen (1 BP)', 'at00' => true, 'meta' => ['profession_tech', 'not_have_can_opener_hd', 'min_1_cp'], 'result' => ['minus_1cp', 'consume_item', ['spawn' => 'catbox']], 'message_key' => 'container_open'],
        'open_toolbox_t2' => ['label' => 'Öffnen (1 BP)', 'at00' => true, 'meta' => ['profession_tech', 'not_have_box_opener_hd', 'min_1_cp'], 'result' => ['minus_1cp', 'consume_item', ['spawn' => 'toolbox']], 'message_key' => 'container_open'],
        'open_foodbox_out_t2' => ['label' => 'Öffnen (1 BP)', 'at00' => true, 'meta' => ['profession_tech', 'not_have_parcel_opener_hd', 'min_1_cp', 'must_be_outside_or_exploring'], 'result' => ['minus_1cp', 'consume_item', ['spawn' => 'foodbox']], 'message_key' => 'container_open'],
        'open_foodbox_in_t2' => ['label' => 'Öffnen (1 BP)', 'at00' => true, 'meta' => ['profession_tech', 'not_have_parcel_opener_home_hd', 'min_1_cp', 'must_be_inside'], 'result' => ['minus_1cp', 'consume_item', ['spawn' => 'foodbox']], 'message_key' => 'container_open'],

        'open_safe' => ['label' => 'Öffnen', 'at00' => true, 'meta' => ['min_1_ap', 'not_tired', 'is_not_wounded_hands'], 'result' => ['minus_1ap', ['group' => [[['do_nothing'], 95], [['consume_item', ['spawn' => 'safe']], 5]]]], 'message_key' => 'container_optional'],
        'open_asafe' => ['label' => 'Öffnen', 'at00' => true, 'meta' => ['min_1_ap', 'not_tired', 'is_not_wounded_hands'], 'result' => ['minus_1ap', ['group' => [[['do_nothing'], 95], [['consume_item', ['spawn' => 'asafe']], 5]]]], 'message_key' => 'container_optional'],

        'load_pilegun' => ['label' => 'Laden', 'at00' => true, 'meta' => ['have_battery'], 'result' => ['consume_battery', ['item' => ['consume' => false, 'morph' => 'pilegun_#00']]], 'message_key' => 'item_load'],
        'load_pilegun2' => ['label' => 'Laden', 'at00' => true, 'meta' => ['have_battery'], 'result' => ['consume_battery', ['item' => ['consume' => false, 'morph' => 'pilegun_up_#00']]], 'message_key' => 'item_load'],
        'load_pilegun3' => ['label' => 'Laden', 'at00' => true, 'meta' => ['have_battery'], 'result' => ['consume_battery', ['item' => ['consume' => false, 'morph' => 'big_pgun_#00']]], 'message_key' => 'item_load'],
        'load_mixergun' => ['label' => 'Laden', 'at00' => true, 'meta' => ['have_battery'], 'result' => ['consume_battery', ['item' => ['consume' => false, 'morph' => 'mixergun_#00']]], 'message_key' => 'item_load'],
        'load_chainsaw' => ['label' => 'Laden', 'at00' => true, 'meta' => ['have_battery'], 'result' => ['consume_battery', ['item' => ['consume' => false, 'morph' => 'chainsaw_#00']]], 'message_key' => 'item_load'],
        'load_taser' => ['label' => 'Laden', 'at00' => true, 'meta' => ['have_battery'], 'result' => ['consume_battery', ['item' => ['consume' => false, 'morph' => 'taser_#00']]], 'message_key' => 'item_load'],
        'load_lpointer' => ['label' => 'Laden', 'at00' => true, 'meta' => ['have_battery'], 'result' => ['consume_battery', ['item' => ['consume' => false, 'morph' => 'lpoint4_#00']]], 'message_key' => 'item_load'],

        'load_lamp' => ['label' => 'Laden', 'at00' => true, 'meta' => ['have_battery'], 'result' => ['consume_battery', ['item' => ['consume' => false, 'morph' => 'lamp_on_#00']]], 'message_key' => 'item_load'],
        'load_dildo' => ['label' => 'Laden', 'at00' => true, 'meta' => ['have_battery'], 'result' => ['consume_battery', ['item' => ['consume' => false, 'morph' => 'vibr_#00']]], 'message_key' => 'item_load'],
        'load_rmk2' => ['label' => 'Laden', 'at00' => true, 'meta' => ['have_battery'], 'result' => ['consume_battery', ['item' => ['consume' => false, 'morph' => 'radius_mk2_#00']]], 'message_key' => 'item_load'],
        'load_maglite' => ['label' => 'Laden', 'at00' => true, 'meta' => ['have_battery'], 'result' => ['consume_battery', ['item' => ['consume' => false, 'morph' => 'maglite_2_#00']]], 'message_key' => 'item_load'],
        'load_radio' => ['label' => 'Laden', 'at00' => true, 'meta' => ['have_battery'], 'result' => ['consume_battery', ['item' => ['consume' => false, 'morph' => 'radio_on_#00']]], 'message_key' => 'item_load'],
        'load_emt' => ['label' => 'Laden', 'at00' => true, 'meta' => ['have_battery'], 'result' => ['consume_battery', ['item' => ['consume' => false, 'morph' => 'sport_elec_#00']]], 'message_key' => 'item_load'],

        'light_cig' => ['label' => 'Rauchen', 'meta' => ['have_matches', 'must_be_terrorized'], 'result' => [['group' => [[['do_nothing'], 33], [['consume_matches'], 66]]], ['group' => [[['do_nothing'], 66], [['consume_item'], 33]]], 'unterrorize'], 'message' => 'Du zündest eine Zigarette an. Der Rauch lässt dich kräftig Husten, vermutlich weil du daran nicht gewöhnt bist... Nach ein paar Minuten <strong>gelingt es dir dich zu beruhigen</strong>. Dieser Kurze Moment des Friedens ermöglicht lässt dich deinen Kummer vergessen und bringt dich zurück in die Wirklichkeit.<hr />Du drückst den Stummel auf dem Boden aus und bist bereit für einen weiteren Tag des Überlebens.!<t-consumed><hr />Dir fällt auf dass <strong>die Packung leer ist</strong>!</t-consumed><t-item-consumed>Das war dein <strong>letztes Streichholz</strong>... Es wird schwer sein, jetzt noch eine Zigarette anzuzünden.</t-item-consumed>'],

        'fill_jsplash' => ['label' => 'Befüllen', 'at00' => true, 'meta' => ['have_canister'], 'result' => ['consume_jerrycan', ['item' => ['consume' => false, 'morph' => 'jerrygun_#00']]], 'message_key' => 'item_fill'],

        'fill_asplash1' => ['label' => 'Befüllen', 'meta' => ['have_water', 'must_not_have_valve', 'must_be_inside'], 'result' => ['consume_water', ['item' => ['consume' => false, 'morph' => 'watergun_opt_5_#00']]], 'message_key' => 'item_fill'],
        'fill_asplash2' => ['label' => 'Befüllen', 'at00' => true, 'meta' => ['have_water', 'must_be_outside_or_exploring'], 'result' => ['consume_water', ['item' => ['consume' => false, 'morph' => 'watergun_opt_5_#00']]], 'message_key' => 'item_fill'],
        'fill_splash1' => ['label' => 'Befüllen', 'meta' => ['have_water', 'must_not_have_valve', 'must_be_inside'], 'result' => ['consume_water', ['item' => ['consume' => false, 'morph' => 'watergun_3_#00']]], 'message_key' => 'item_fill'],
        'fill_splash2' => ['label' => 'Befüllen', 'at00' => true, 'meta' => ['have_water', 'must_be_outside_or_exploring'], 'result' => ['consume_water', ['item' => ['consume' => false, 'morph' => 'watergun_3_#00']]], 'message_key' => 'item_fill'],
        'fill_ksplash1' => ['label' => 'Befüllen', 'meta' => ['have_water', 'must_not_have_valve', 'must_be_inside'], 'result' => ['consume_water', ['item' => ['consume' => false, 'morph' => 'kalach_#00']]], 'message_key' => 'item_fill'],
        'fill_ksplash2' => ['label' => 'Befüllen', 'at00' => true, 'meta' => ['have_water', 'must_be_outside_or_exploring'], 'result' => ['consume_water', ['item' => ['consume' => false, 'morph' => 'kalach_#00']]], 'message_key' => 'item_fill'],
        'fill_grenade1' => ['label' => 'Befüllen', 'meta' => ['have_water', 'must_not_have_valve', 'must_be_inside'], 'result' => ['consume_water', ['item' => ['consume' => false, 'morph' => 'grenade_#00']]], 'message_key' => 'item_fill'],
        'fill_grenade2' => ['label' => 'Befüllen', 'at00' => true, 'meta' => ['have_water', 'must_be_outside_or_exploring'], 'result' => ['consume_water', ['item' => ['consume' => false, 'morph' => 'grenade_#00']]], 'message_key' => 'item_fill'],
        'fill_exgrenade1' => ['label' => 'Befüllen', 'meta' => ['have_water', 'must_not_have_valve', 'must_be_inside'], 'result' => ['consume_water', ['item' => ['consume' => false, 'morph' => 'bgrenade_#00']]], 'message_key' => 'item_fill'],
        'fill_exgrenade2' => ['label' => 'Befüllen', 'at00' => true, 'meta' => ['have_water', 'must_be_outside_or_exploring'], 'result' => ['consume_water', ['item' => ['consume' => false, 'morph' => 'bgrenade_#00']]], 'message_key' => 'item_fill'],

        'fill_watercan0' => ['label' => 'Befüllen', 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerTransgress', 'meta' => ['have_water'], 'result' => ['consume_water', 'produce_watercan1'], 'message_key' => 'item_fill'],
        'fill_watercan1' => ['label' => 'Befüllen', 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerTransgress', 'meta' => ['have_water'], 'result' => ['consume_water', 'produce_watercan2'], 'message_key' => 'item_fill'],
        'fill_watercan2' => ['label' => 'Befüllen', 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerTransgress', 'meta' => ['have_water'], 'result' => ['consume_water', 'produce_watercan3'], 'message_key' => 'item_fill'],

        'fire_pilegun' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies'], 'result' => [['spawn' => 'empty_battery', 'item' => ['morph' => 'pilegun_empty_#00', 'consume' => false], 'group' => 'g_kill_1z_90_msg2', 'message' => ['text_key' => 'battery_use', 'ordering' => 1000]]]], /* based on Hordes data */
        'fire_pilegun2' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies'], 'result' => [['group' => [[[['spawn' => 'battery', 'item' => ['morph' => 'pilegun_up_empty_#00', 'consume' => false], 'message' => ['text_key' => 'battery_dropped', 'ordering' => 1000]]], 8], [[['spawn' => 'empty_battery', 'item' => ['morph' => 'pilegun_up_empty_#00', 'consume' => false], 'message' => ['text_key' => 'battery_destroyed', 'ordering' => 1000]]], 2]]], 'kill_1_zombie']], /* based on Hordes data */
        'fire_pilegun3' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies'], 'result' => [['group' => [[[['spawn' => 'empty_battery', 'item' => ['morph' => 'big_pgun_empty_#00', 'consume' => false], 'message' => ['text_key' => 'battery_destroyed', 'ordering' => 1000]]], 50], [[['spawn' => 'battery', 'item' => ['morph' => 'big_pgun_empty_#00', 'consume' => false], 'message' => ['text_key' => 'battery_dropped', 'ordering' => 1000]]], 50]]], 'kill_2_zombie']], /* based on Hordes data */
        'fire_mixergun' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies'], 'result' => [['group' => [[['do_nothing'], 6], [[['item' => ['morph' => 'mixergun_empty_#00', 'consume' => false], 'message' => ['text_key' => 'battery_use', 'ordering' => 1000]]], 4]]], 'kill_1_zombie']], /* based on Hordes data */
        'fire_chainsaw' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies'], 'result' => [['group' => [[['do_nothing'], 7], [[['item' => ['morph' => 'chainsaw_empty_#00', 'consume' => false], 'message' => ['text_key' => 'battery_use', 'ordering' => 1000]]], 3]]], 'kill_3_zombie']], /* based on Hordes data */
        'fire_taser' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies'], 'result' => [['group' => 'g_kill_1z_30_taser'], ['group' => [[['do_nothing'], 3], [[['item' => ['morph' => 'taser_empty_#00', 'consume' => false], 'message' => ['text_key' => 'battery_use']]], 7]]]]], /* based on Hordes data */
        'fire_lpointer4' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies'], 'result' => [['item' => ['morph' => 'lpoint3_#00', 'consume' => false]], 'kill_2_zombie']],
        'fire_lpointer3' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies'], 'result' => [['item' => ['morph' => 'lpoint2_#00', 'consume' => false]], 'kill_2_zombie']],
        'fire_lpointer2' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies'], 'result' => [['item' => ['morph' => 'lpoint1_#00', 'consume' => false]], 'kill_2_zombie']],
        'fire_lpointer1' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies'], 'result' => [['item' => ['morph' => 'lpoint_#00', 'consume' => false]], 'kill_2_zombie']],

        'fire_asplash5' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies'], 'result' => [['item' => ['morph' => 'watergun_opt_4_#00', 'consume' => false]], 'kill_1_zombie']],
        'fire_asplash4' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies'], 'result' => [['item' => ['morph' => 'watergun_opt_3_#00', 'consume' => false]], 'kill_1_zombie']],
        'fire_asplash3' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies'], 'result' => [['item' => ['morph' => 'watergun_opt_2_#00', 'consume' => false]], 'kill_1_zombie']],
        'fire_asplash2' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies'], 'result' => [['item' => ['morph' => 'watergun_opt_1_#00', 'consume' => false]], 'kill_1_zombie']],
        'fire_asplash1' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies'], 'result' => [['item' => ['morph' => 'watergun_opt_empty_#00', 'consume' => false]], 'kill_1_zombie']],
        'fire_splash3' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies'], 'result' => [['item' => ['morph' => 'watergun_2_#00', 'consume' => false]], 'kill_1_zombie']],
        'fire_splash2' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies'], 'result' => [['item' => ['morph' => 'watergun_1_#00', 'consume' => false]], 'kill_1_zombie']],
        'fire_splash1' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies'], 'result' => [['item' => ['morph' => 'watergun_empty_#00', 'consume' => false]], 'kill_1_zombie']],
        'fire_ksplash' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies'], 'result' => [['item' => ['morph' => 'kalach_#01', 'consume' => false]], 'kill_3_zombie']],

        'throw_animal' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies'], 'result' => ['consume_item', 'kill_1_zombie_s', ['picto' => ['r_animal_#00']]], 'message_key' => 'throw_animal'],
        'throw_animal_cat' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies'], 'result' => [['group' => [[['do_nothing'], 80], [['consume_item', ['picto' => ['r_animal_#00']]], 20]]], 'kill_1_zombie_s'], 'message_key' => 'throw_animal'], /* based on Igloo stats (5 288 tests) */
        'throw_animal_dog' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies'], 'result' => [['group' => [[['do_nothing'], 90], [['consume_item', ['picto' => ['r_animal_#00']]], 10]]], 'kill_1_zombie_s'], 'message_key' => 'throw_animal'], /* based on Hordes data */
        'throw_animal_tekel' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies'], 'result' => [['group' => [[['do_nothing'], 85], [['consume_item', ['picto' => ['r_animal_#00']]], 15]]], 'kill_1_zombie_s'], 'message_key' => 'throw_animal'], /* Hordes was at 5% of fail */
        'throw_animal_angryc' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies'], 'result' => ['consume_item', ['group' => [[['inflict_wound'], 50], [['kill_all_zombie'], 50]]], ['picto' => ['r_animal_#00']]], 'message' => '<nt-kills>Diese Katze ist unglaublich! Sie scheint keine Angst zu haben, nicht einmal vor dir. Das Tier springt dir an die Kehle und vergräbt seine Krallen tief in deinem Fleisch.</nt-kills><t-kills>Diese Katze ist unglaublich! Sie scheint keine Angst zu haben, nicht einmal vor dem abartigen Gestank der Zombies. Mit mehr Zerstörungskraft als der Duracell-Hase und das Killer-Kaninchen von Caerbannog hat sie die Zone komplett bereinigt.</t-kills>'], /* based on Hordes data */

        'throw_b_machine_1' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies', 'not_tired', 'is_not_wounded_hands'], 'result' => [['group' => 'g_break_40'], 'kill_1_zombie']], /* based on Hordes data */
        'throw_b_bone' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies', 'not_tired', 'is_not_wounded_hands'], 'result' => [['group' => 'g_break_80'], 'kill_1_zombie']], /* based on Hordes data */
        'throw_b_can_opener' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies', 'not_tired', 'is_not_wounded_hands'], 'result' => ['break_item', ['group' => 'g_kill_1z_50']]], /* based on Hordes data */
        'throw_b_chair_basic' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies', 'not_tired', 'is_not_wounded_hands'], 'result' => [['group' => 'g_break_50'], ['group' => 'g_kill_1z_50']]], /* based on Hordes data */
        'throw_b_torch' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies', 'not_tired'], 'result' => [['item' => ['morph' => 'torch_off_#00', 'consume' => false]], 'kill_1_zombie']], /* based on Hordes data */
        'throw_b_chain' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies', 'not_tired', 'is_not_wounded_hands'], 'result' => [['group' => 'g_break_25'], ['group' => 'g_kill_1z_50']]], /* based on Hordes data */
        'throw_b_staff' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies', 'not_tired', 'is_not_wounded_hands'], 'result' => [['group' => [[['do_nothing'], 60], [[['item' => ['consume' => false, 'morph' => 'staff2_#00']], ['message' => ['text' => 'Deine Waffe ist durch den harten Aufschlag <strong>kaputt</strong> gegangen...', 'ordering' => 99999]]], 60]]], ['group' => 'g_kill_1z_40']]], /* based on Hordes data */
        'throw_b_knife' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies', 'not_tired', 'is_not_wounded_hands'], 'result' => [['group' => 'g_break_33'], 'kill_1_zombie']], /* based on Hordes data */
        'throw_b_machine_2' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies', 'not_tired', 'is_not_wounded_hands'], 'result' => [['group' => 'g_break_43'], 'kill_1_zombie']], /* based on Hordes data */
        'throw_b_small_knife' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies', 'not_tired', 'is_not_wounded_hands'], 'result' => [['group' => 'g_break_45'], ['group' => 'g_kill_1z_15']]], /* based on Hordes data */
        'throw_b_cutcut' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies', 'not_tired', 'is_not_wounded_hands'], 'result' => [['group' => 'g_break_25'], 'kill_2_zombie']], /* based on Hordes data */
        'throw_b_machine_3' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies', 'not_tired', 'is_not_wounded_hands'], 'result' => [['group' => 'g_break_40'], 'kill_1_zombie']], /* based on Hordes data */
        'throw_b_pc' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies', 'not_tired', 'is_not_wounded_hands'], 'result' => [['group' => 'g_break_50'], 'kill_1_zombie']], /* based on Hordes data */
        'throw_b_lawn' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies', 'not_tired', 'is_not_wounded_hands'], 'result' => [['group' => 'g_break_20'], 'kill_2_zombie']], /* based on Hordes data */
        'throw_b_screw' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies', 'not_tired', 'is_not_wounded_hands'], 'result' => [['group' => 'g_break_40'], ['group' => 'g_kill_1z_20']]], /* based on Hordes data */
        'throw_b_swiss_knife' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies', 'not_tired', 'is_not_wounded_hands'], 'result' => [['group' => 'g_break_50'], ['group' => 'g_kill_1z_15']]], /* based on Hordes data */
        'throw_b_cutter' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies', 'not_tired', 'is_not_wounded_hands'], 'result' => [['group' => 'g_break_70'], ['group' => 'g_kill_1z_60']]], /* based on Hordes data */
        'throw_b_concrete_wall' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies', 'not_tired', 'is_not_wounded_hands'], 'result' => [['group' => 'g_break_50'], 'kill_1_zombie']], /* based on Hordes data */
        'throw_b_torch_off' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies', 'not_tired', 'is_not_wounded_hands'], 'result' => [['group' => 'g_break_75'], ['group' => 'g_kill_1z_10']]], /* based on Hordes data */
        'throw_b_wrench' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies', 'not_tired', 'is_not_wounded_hands'], 'result' => [['group' => 'g_break_20'], ['group' => 'g_kill_1z_33']]], /* based on Hordes data */
        'throw_hurling_stick' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies', 'not_tired', 'is_not_wounded_hands'], 'result' => [['group' => 'g_break_15'], ['group' => 'g_kill_1z_60']]], /* based on Hordes data */
        'throw_phone' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies', 'not_tired', 'is_not_wounded_hands'], 'result' => ['consume_item', ['spawn' => 'phone'], 'kill_1_2_zombie']], /* based on Hordes data */
        'throw_projector' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies', 'not_tired', 'is_not_wounded_hands'], 'result' => ['consume_item', ['spawn' => 'proj'], 'kill_1_zombie']], /* based on Hordes data */

        'throw_grenade' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies'], 'result' => ['consume_item', ['zombies' => ['min' => 2, 'max' => 4]]], 'message_key' => 'weapon_use'],
        'throw_exgrenade' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies'], 'result' => ['consume_item', ['zombies' => ['min' => 6, 'max' => 10]]], 'message_key' => 'weapon_use'],
        'throw_boomfruit' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies'], 'result' => ['consume_item', ['zombies' => ['min' => 5, 'max' => 9]]], 'message_key' => 'weapon_use'],
        'throw_jerrygun' => ['label' => 'Waffe einsetzen', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies'], 'result' => ['kill_1_zombie', ['group' => 'g_empty_jerrygun', 'message' => ['text' => '<nt-morphed>Gute Nachrichten: Es ist noch Wasser im Kanister!</nt-morphed><t-morphed><strong>Der Kanister ist LEER</strong>!</t-morphed>']]]],

        'bp_generic_1' => ['label' => 'Lesen', 'meta' => ['must_be_inside_bp'], 'result' => ['consume_item', ['bp' => [1]]], 'message_key' => 'read_blueprint'],
        'bp_generic_2' => ['label' => 'Lesen', 'meta' => ['must_be_inside_bp'], 'result' => ['consume_item', ['bp' => [2]]], 'message_key' => 'read_blueprint'],
        'bp_generic_3' => ['label' => 'Lesen', 'meta' => ['must_be_inside_bp'], 'result' => ['consume_item', ['bp' => [3]]], 'message_key' => 'read_blueprint'],
        'bp_generic_4' => ['label' => 'Lesen', 'meta' => ['must_be_inside_bp'], 'result' => ['consume_item', ['bp' => [4]]], 'message_key' => 'read_blueprint'],

        'bp_hotel_2' => ['label' => 'Lesen', 'meta' => ['must_be_inside_bp'], 'result' => ['consume_item', ['bp' => ['small_bamba_#00', 'small_catapult3_#00', 'small_howlingbait_#00', 'small_trash_#01', 'small_trash_#02', 'small_trash_#04', 'small_court_#00', 'item_plate_#03']]], 'message_key' => 'read_blueprint'],
        'bp_hotel_3' => ['label' => 'Lesen', 'meta' => ['must_be_inside_bp'], 'result' => ['consume_item', ['bp' => ['small_sprinkler_#00', 'item_digger_#00', 'item_shield_#00', 'small_city_up_#00', 'small_falsecity_#00', 'small_lastchance_#00', 'small_lighthouse_#00', 'small_strategy_#00', 'small_valve_#00']]], 'message_key' => 'read_blueprint'],
        'bp_hotel_4' => ['label' => 'Lesen', 'meta' => ['must_be_inside_bp'], 'result' => ['consume_item', ['bp' => ['small_cinema_#00', 'small_derrick_#01', 'small_trash_#06', 'small_castle_#00', 'small_coffin_#00']]], 'message_key' => 'read_blueprint'],

        'bp_bunker_2' => ['label' => 'Lesen', 'meta' => ['must_be_inside_bp'], 'result' => ['consume_item', ['bp' => ['item_bgrenade_#00', 'item_bgrenade_#01', 'small_trash_#03', 'small_trash_#05', 'small_watercanon_#00', 'small_tourello_#00', 'small_armor_#00']]], 'message_key' => 'read_blueprint'],
        'bp_bunker_3' => ['label' => 'Lesen', 'meta' => ['must_be_inside_bp'], 'result' => ['consume_item', ['bp' => ['item_home_def_#00', 'item_tube_#00', 'small_labyrinth_#00', 'small_eden_#00', 'small_rocket_#00', 'small_rocketperf_#00', 'small_trashclean_#00', 'small_valve_#00', 'item_jerrycan_#01']]], 'message_key' => 'read_blueprint'],
        'bp_bunker_4' => ['label' => 'Lesen', 'meta' => ['must_be_inside_bp'], 'result' => ['consume_item', ['bp' => ['small_waterdetect_#00', 'small_arma_#00', 'small_slave_#00', 'small_trash_#06', 'small_wheel_#00']]], 'message_key' => 'read_blueprint'],

        'bp_hospital_2' => ['label' => 'Lesen', 'meta' => ['must_be_inside_bp'], 'result' => ['consume_item', ['bp' => ['small_ikea_#00', 'item_hmeat_#00', 'small_tourello_#00', 'small_watchmen_#00']]], 'message_key' => 'read_blueprint'],
        'bp_hospital_3' => ['label' => 'Lesen', 'meta' => ['must_be_inside_bp'], 'result' => ['consume_item', ['bp' => ['item_digger_#00', 'item_jerrycan_#01', 'item_shield_#00', 'small_appletree_#00', 'small_chicken_#00', 'small_infirmary_#00', 'small_trashclean_#00', 'small_lighthouse_#00', 'small_rocketperf_#00']]], 'message_key' => 'read_blueprint'],
        'bp_hospital_4' => ['label' => 'Lesen', 'meta' => ['must_be_inside_bp'], 'result' => ['consume_item', ['bp' => ['small_strategy_#01', 'small_balloon_#00', 'small_crow_#00', 'small_derrick_#01', 'small_pmvbig_#00']]], 'message_key' => 'read_blueprint'],

        'read_rp' => ['label' => 'Lesen', 'cover' => false, 'at00' => true, 'meta' => [], 'result' => ['consume_item', 'find_rp'], 'message' => 'Der Text ist überschrieben mit {rp_text}. Du beginnst, ihn zu lesen<t-rp_ok>! Der Text wurde deinem Archiv hinzugefügt.</t-rp_ok><t-rp_fail>... Leider stellst du fest, dass du diesen Text bereits kennst.</t-rp_fail>'],
        'read_rp_cover' => ['label' => 'Lesen', 'cover' => true, 'at00' => true, 'meta' => [], 'result' => ['consume_item', 'find_rp'], 'message' => 'Der Text ist überschrieben mit {rp_text}. Du beginnst, ihn zu lesen<t-rp_ok>! Der Text wurde deinem Archiv hinzugefügt.</t-rp_ok><t-rp_fail>... Leider stellst du fest, dass du diesen Text bereits kennst.</t-rp_fail>'],

        'read_banned_note' => ['label' => 'Lesen', 'cover' => true, 'at00' => true, 'meta' => [], 'result' => ['consume_item', 'casino_banned_note'], 'message' => 'Der Text ist überschrieben mit {item}. Du beginnst, ihn zu lesen.<t-bannote_ok>Diese gekritzelte Notiz gehörte früher einem verbanntem Bürger... Das einzige, was du lesen kannst, ist "{zone}"... Seltsam. Du zerstörst die Seite, nur um sicherzugehen, dass niemand die Nachricht liest...</t-bannote_ok><t-bannote_fail>Leider ist der Inhalt dieses Manuskripts völlig unleserlich.</t-bannote_fail>'],

        'vibrator' => ['label' => 'Verwenden', 'meta' => ['must_be_inside', 'must_be_terrorized'], 'result' => ['unterrorize', ['item' => ['morph' => 'vibr_empty_#00', 'consume' => false]], ['picto' => ['r_maso_#00']]], 'message' => 'Du machst es dir daheim gemütlich und entspannst dich... doch dann erlebst du ein böse Überraschung: Dieses Ding ist unglaublich schmerzhaft! Du versuchst es weiter bis du Stück für Stück Gefallen daran findest. Die nach wenige Minuten einsetzende Wirkung ist berauschend! Du schwitzt und zitterst und ein wohlig-warmes Gefühl breitet sich in dir aus...Die Batterie ist komplett leer.'],

        'watercup_1' => ['label' => 'Reinigen (Wasser)', 'meta' => ['must_be_inside', 'must_have_micropur_in', 'must_not_have_purifier', 'must_not_have_filter', 'must_not_be_banished'], 'result' => ['consume_micropur', 'consume_item', ['spawn' => [['water_cup_#00', 2]], 'picto' => ['r_solban_#00']]], 'message_key' => 'item_clean_watercup'],
        'watercup_2' => ['label' => 'Reinigen (Wasser)', 'meta' => ['must_be_outside_or_exploring', 'must_have_micropur'], 'result' => ['consume_micropur', 'consume_item', ['spawn' => [['water_cup_#00', 2]], 'picto' => ['r_solban_#00']]], 'message_key' => 'item_clean_watercup'],
        'watercup_3' => ['label' => 'In den Brunnen schütten', 'meta' => ['must_be_inside', 'must_have_purifier', 'must_not_be_banished'], 'result' => ['consume_item', ['well' => ['min' => 2, 'max' => 2]]], 'message_key' => 'water_to_well'],
        'jerrycan_1' => ['label' => 'Reinigen (Wasser)', 'meta' => ['must_be_inside', 'must_have_micropur_in', 'must_not_have_purifier', 'must_not_be_banished'], 'result' => ['consume_micropur', 'consume_item', ['group' => [
            [[['spawn' => ['what' => [['water_#00', 2]], 'where' => 'AffectItemSpawn::DropTargetPreferRucksack']]], 1],
            [[['spawn' => ['what' => [['water_#00', 3]], 'where' => 'AffectItemSpawn::DropTargetPreferRucksack']]], 1]
        ]]], 'message_key' => 'item_clean'],
        'jerrycan_2' => ['label' => 'In den Brunnen schütten', 'meta' => ['must_be_inside', 'must_have_purifier', 'must_not_have_filter', 'must_not_be_banished'], 'result' => ['consume_item', ['well' => ['min' => 1, 'max' => 3]]], 'message_key' => 'water_to_well'],
        'jerrycan_3' => ['label' => 'In den Brunnen schütten', 'meta' => ['must_be_inside', 'must_have_filter', 'must_not_be_banished'], 'result' => ['consume_item', ['well' => ['min' => 4, 'max' => 9]]], 'message_key' => 'water_to_well'],

        'watercup_1b' => ['label' => 'Reinigen (Wasser)', 'meta' => ['must_be_inside', 'must_have_micropur_in', 'must_be_banished'], 'result' => ['consume_micropur', 'consume_item', ['spawn' => [['water_cup_#00', 2]], 'picto' => ['r_solban_#00']]], 'message_key' => 'item_clean_watercup'],
        'jerrycan_1b' => ['label' => 'Reinigen (Wasser)', 'meta' => ['must_be_inside', 'must_have_micropur_in', 'must_be_banished'], 'result' => ['consume_micropur', 'consume_item', ['group' => [
            [[['spawn' => [['water_#00', 2]]]], 1],
            [[['spawn' => [['water_#00', 3]]]], 1]
        ]]], 'message_key' => 'item_clean'],

        'home_def_plus' => ['label' => 'Aufstellen', 'meta' => ['must_be_inside'], 'result' => ['consume_item', ['home' => ['def' => 1]], ['picto' => ['r_hbuild_#00']], ['message' => ['text' => 'Sorgfältig befestigst du bei dir daheim ein(e) {item}. So und das hält jetzt, so viel steht schon mal fest.{hr}Dieser Gegenstand gibt deinem Haus permament <strong>{home_defense} zusätzliche Verteidigungspunkt(e).</strong>']]]],
        'home_store_plus' => ['label' => 'Aufstellen', 'meta' => ['must_be_inside'], 'result' => ['consume_item', ['home' => ['store' => 1]], ['picto' => ['r_hbuild_#00']], ['message' => ['text' => 'Du stellst den(die) {item} bei dir daheim auf. Zugegeben, es sieht nicht gerade ästhetisch aus, aber mal ganz ehrlich: Wen kümmert das?{hr}Dieser Gegenstand erweitert deine Truhe dauerhaft um soviele freie Plätze: <strong>{home_storage}</strong>.']]]],
        'home_store_plus2' => ['label' => 'Aufstellen', 'meta' => ['must_be_inside'], 'result' => ['consume_item', ['home' => ['store' => 2]], ['picto' => ['r_hbuild_#00']], ['message' => ['text' => 'Du stellst den(die) {item} bei dir daheim auf. Zugegeben, es sieht nicht gerade ästhetisch aus, aber mal ganz ehrlich: Wen kümmert das?{hr}Dieser Gegenstand erweitert deine Truhe dauerhaft um soviele freie Plätze: <strong>{home_storage}</strong>.']]]],

        'repair_1' => ['label' => 'Reparieren mit', 'at00' => true, 'target' => ['broken' => true], 'meta' => ['min_1_ap', 'not_tired', 'is_not_wounded_hands'], 'result' => ['minus_1ap', 'consume_item', 'repair_target', ['picto' => ['r_repair_#00']]], 'message' => 'Du hast das {item} verbraucht, um damit {target} zu reparieren. Dabei hast du {minus_ap} AP eingesetzt.'],
        'repair_2' => ['label' => 'Reparieren mit', 'at00' => true, 'target' => ['broken' => true], 'meta' => ['min_1_ap', 'not_tired', 'is_not_wounded_hands'], 'result' => ['minus_1ap', ['item' => ['consume' => false, 'morph' => 'repair_kit_part_#00'], 'picto' => ['r_repair_#00']], 'repair_target'], 'message' => 'Du hast das {item} verbraucht, um damit {target} zu reparieren. Dabei hast du {minus_ap} AP eingesetzt.'],
        'poison_1' => ['label' => 'Vergiften mit', 'at00' => true, 'target' => ['type' => 'ItemTargetDefinition::ItemSelectionTypePoison', 'property' => 'can_poison', 'poison' => false], 'meta' => [], 'result' => ['consume_item', 'poison_target'], 'message' => 'Du hast {target} mit {item} kombiniert und {target} erzeugt.{hr}Achtung: Du hast {target} vergiftet. Es ist <strong>nahezu unmöglich, es vom Original zu unterscheiden</strong>, sei also vorsichtig... Es liegt ganz an dir, was du damit jetzt tun möchtest.'],
        'poison_2' => ['label' => 'Vergiften mit', 'at00' => true, 'target' => ['type' => 'ItemTargetDefinition::ItemSelectionTypePoison', 'property' => 'can_poison', 'poison' => false], 'meta' => [], 'result' => ['consume_item', 'poison_infect_target'], 'message' => 'Du hast {target} mit {item} kombiniert und {target} erzeugt.{hr}Achtung: Du hast {target} vergiftet. Es ist <strong>nahezu unmöglich, es vom Original zu unterscheiden</strong>, sei also vorsichtig... Es liegt ganz an dir, was du damit jetzt tun möchtest.'],

        'zonemarker_1' => ['label' => 'Einsetzen', 'cover' => true, 'at00' => true, 'meta' => [], 'result' => ['consume_item', 'zonemarker'], 'message' => 'Mithilfe des {item} hast du die Umgebung gescannt.'],
        'zonemarker_2' => ['label' => 'Einsetzen', 'cover' => true, 'at00' => true, 'meta' => [], 'result' => [['group' => [['do_nothing', 2], [[['item' => ['consume' => false, 'morph' => 'radius_mk2_part_#00']]], 1]]], 'zonemarker'], 'message' => 'Mithilfe des {item} hast du die Umgebung gescannt.'],
        'nessquick' => ['label' => 'Einsetzen', 'meta' => ['must_be_outside', 'must_be_at_buried_ruin'], 'result' => ['consume_item', 'nessquick'], 'message' => 'Du hast das Gebiet mit deinem {item} teilweise geräumt ({bury_count} Punkte geräumt).'],

        'bomb_1' => ['label' => 'Werfen', 'cover' => true, 'meta' => ['must_be_outside', 'must_be_blocked'], 'result' => ['consume_item', ['zone' => ['escape' => 40]]], 'message_key' => 'escape_item'],
        'bomb_2' => ['label' => 'Werfen', 'cover' => true, 'meta' => ['must_be_outside_or_exploring', 'must_be_blocked'], 'result' => ['consume_item', ['zone' => ['escape' => 300]]], 'message_key' => 'escape_item'],

        'smokebomb' => ['label' => 'Werfen', 'meta' => ['must_be_outside_not_at_doors'], 'result' => ['consume_item', ['zone' => ['chatSilence' => 60]]], 'message' => 'Du wirfst eine Rauchbombe in diese Zone und ein Großes Durcheinander bricht aus!{hr}Deine <strong>nächste Bewegungsaktion</strong> wird night in das Register eingetragen, wenn sie <strong>innerhalb von 1 Minute</strong> erfolgt.'],

        'eat_fleshroom_1' => ['label' => 'Essen', 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['eat_ap', 'no_full_ap_msg_food', 'not_role_ghoul'], 'result' => ['contaminated_zone_infect', 'eat_ap6', 'consume_item', ['status' => ['role' => 'ghoul', 'enabled' => true, 'hunger' => 25, 'force' => true, 'probability' => 4]]], 'escort_message_key' => 'escort_food_eat'], /* based on Hordes data */
        'eat_fleshroom_2' => ['label' => 'Essen', 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['eat_ap', 'no_full_ap_msg_food', 'role_ghoul'], 'result' => ['contaminated_zone_infect', 'eat_ap6', 'consume_item'], 'escort_message_key' => 'escort_food_eat'],

        'eat_meat_1' => ['label' => 'Essen', 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['eat_ap', 'no_full_ap_msg_food', 'not_role_ghoul'], 'result' => ['contaminated_zone_infect', 'eat_ap6_silent', 'consume_item', ['picto' => ['r_cannib_#00'], 'status' => ['role' => 'ghoul', 'enabled' => true, 'hunger' => 25, 'force' => true, 'probability' => 5]]], 'message_key' => 'eat_human_meat', 'escort_message_key' => 'escort_food_eat'], /* based on Hordes data */
        'eat_meat_2' => ['label' => 'Essen', 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['eat_ap', 'role_ghoul'], 'result' => ['contaminated_zone_infect', 'eat_ap6_silent', 'consume_item', ['picto' => ['r_cannib_#00'], 'status' => 'satisfy_ghoul_10']], 'message_key' => 'eat_human_meat_ghoul', 'escort_message_key' => 'escort_food_eat'],

        'eat_bone_1' => ['label' => 'Essen', 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['eat_ap', 'no_full_ap_msg_food', 'not_role_ghoul'], 'result' => ['contaminated_zone_infect', 'eat_ap6_silent', ['picto' => ['r_cannib_#00'], 'item' => ['consume' => false, 'morph' => 'bone_#00'], 'group' => [['do_nothing', 47], ['infect', 50], [[['status' => ['role' => 'ghoul', 'enabled' => true, 'hunger' => 25, 'force' => true, 'probability' => 100]]], 3]]]], 'message_key' => 'eat_human_meat'], /* based on Hordes data */
        'eat_bone_2' => ['label' => 'Essen', 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['eat_ap', 'role_ghoul'], 'result' => ['contaminated_zone_infect', 'eat_ap6_silent', ['picto' => ['r_cannib_#00'], 'item' => ['consume' => false, 'morph' => 'bone_#00'], 'status' => 'satisfy_ghoul_10']], 'message_key' => 'eat_human_meat_ghoul'],

        'eat_cadaver_1' => ['label' => 'Essen', 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['eat_ap', 'no_full_ap_msg_food', 'not_role_ghoul'], 'result' => ['contaminated_zone_infect', 'eat_ap6', ['picto' => ['r_cannib_#00'], 'item' => ['consume' => false, 'morph' => 'cadaver_remains_#00']], ['group' => [['infect', 10], [[['status' => ['role' => 'ghoul', 'enabled' => true, 'hunger' => 5, 'force' => true, 'probability' => 100]]], 90]]]]], /* based on Hordes data */
        'eat_cadaver_2' => ['label' => 'Essen', 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['eat_ap', 'role_ghoul'], 'result' => ['contaminated_zone_infect', 'eat_ap6_silent', ['picto' => ['r_cannib_#00'], 'item' => ['consume' => false, 'morph' => 'cadaver_remains_#00'], 'status' => 'satisfy_ghoul_30']], 'message_key' => 'eat_human_meat_ghoul'],

        'ghoul_serum' => ['label' => 'Einnehmen', 'cover' => true, 'at00' => true, 'poison' => 'ItemAction::PoisonHandlerConsume', 'meta' => ['role_ghoul_serum'], 'result' => ['consume_item', ['status' => 'heal_ghoul']], 'message' => 'Unglaublich! Die ganze Gier, die dich innerlich aufgefressen hat, verschwindet langsam. Ist es wirklich möglich, dass du wieder ein Mensch geworden bist?'],

        'cuddle_teddy_1' => ['label' => 'Knuddeln', 'meta' => ['must_be_terrorized', 'not_yet_teddy'], 'result' => [['status' => ['from' => null, 'to' => 'tg_teddy'], 'group' => [['do_nothing', 70], ['unterrorize', 30]]]], 'message' => 'Du drückst den {item} eng an deine Brust... <t-stat-down-terror>Tränen laufen über deine Wange, als du an die Hölle denkst, in der du lebst. Nach ein paar Minuten fühlst du dich besser!</t-stat-down-terror><nt-stat-down-terror>Aber nichts geschieht!</nt-stat-down-terror>'], /* based on Hordes data */
        'cuddle_teddy_2' => ['label' => 'Knuddeln', 'meta' => ['must_not_be_terrorized'], 'result' => ['terrorize'], 'message' => 'Du drückst den {item} eng an deine Brust... <t-stat-up-terror>Panik steigt in dir auf!</t-stat-up-terror><nt-stat-up-terror>Aber nichts geschieht!</nt-stat-up-terror>'],

        'clean_clothes' => ['label' => 'Reinigen (Kleidung)', 'meta' => ['must_be_inside'], 'result' => [['status' => ['from' => null, 'to' => 'tg_clothes', 'counter' => 'ActionCounter::ActionTypeClothes'], 'item' => ['consume' => false, 'morph' => 'basic_suit_#00']]], 'message' => 'Du nimmst dir ein paar Minuten, um deine {item} zu reinigen. Du schrubbst sorgfältig die Blutflecken ab und flickst ein paar kleine Löcher.'],

        'flash_photo_3' => ['label' => 'Benutzen', 'meta' => ['must_be_outside_not_at_doors', 'must_have_zombies', 'must_be_blocked'], 'result' => [['item' => ['consume' => false, 'morph' => 'photo_2_#00'], 'group' => [[['do_nothing'], 1], [[['zone' => ['escape' => 120]]], 100]]]], 'message_key' => 'escape_item_camera'],
        'flash_photo_2' => ['label' => 'Benutzen', 'meta' => ['must_be_outside_not_at_doors', 'must_have_zombies', 'must_be_blocked'], 'result' => [['item' => ['consume' => false, 'morph' => 'photo_1_#00'], 'group' => [[['do_nothing'], 30], [[['zone' => ['escape' => 60]]], 66]]]], 'message_key' => 'escape_item_camera'],
        'flash_photo_1' => ['label' => 'Benutzen', 'meta' => ['must_be_outside_not_at_doors', 'must_have_zombies', 'must_be_blocked'], 'result' => [['item' => ['consume' => false, 'morph' => 'photo_off_#00'], 'group' => [[['do_nothing'], 60], [[['zone' => ['escape' => 30]]], 33]]]], 'message_key' => 'escape_item_camera'],

        'alarm_clock' => ['label' => 'Benutzen', 'at00' => true, 'meta' => [], 'result' => [['item' => ['consume' => false, 'morph' => 'alarm_on_#00']]], 'message' => 'Du hast {item_from} in {item_to} verwandelt.'],

        'pumpkin' => ['label' => 'Einsetzen', 'meta' => [], 'result' => [['item' => ['consume' => false, 'morph' => 'pumpkin_off_#00']]]],
        'flare' => ['label' => 'Benutzen', 'meta' => [], 'result' => [['custom' => [21]]], 'message' => '<t-flare_ok>Die Leuchtrakete hat neue Informationen zu folgender Zone geliefert: {zone}</t-flare_ok><t-flare_ok_ruin>Mit Hilfe der Leuchrakete wurde ein neues Gebäude entdeckt: {zone_ruin}. Seine Koordinaten lauten: {zone}</t-flare_ok_ruin><t-flare_fail>Es gibt keine weitere Zone zu entdecken.</t-flare_fail>'],

        'hero_tamer_1' => ['label' => 'Zur Bank schicken', 'at00' => true, 'renderer' => 'tamer_dog_popup', 'meta' => ['must_be_outside_or_exploring'], 'result' => ['hero_tamer_1'], 'message' => '<t-fail><t-door-closed>Das Stadttor ist geschlossen...</t-door-closed><t-no-items>{tamer_dog} kann nichts mitnehmen, da du <strong>nichts im Rucksack hast</strong>.</t-no-items><t-too-heavy>{tamer_dog} kann deinen Rucksackinhalt nicht mitnehmen, da du einen <strong>sperrigen Gegenstand</strong> mit dir rumschleppt. Das ist dann wohl etwas zu viel des Guten für den Kleinen!</t-too-heavy></t-fail><nt-fail>Du befiehlst {tamer_dog} deinen Rucksackinhalt in die Stadt zu bringen.{hr}<strong>Deine Mitbürger werden sich über all diese Gegenstände in der Bank mächtig freuen.</strong></nt-fail>'],
        'hero_tamer_2' => ['label' => 'Zur Bank schicken', 'at00' => true, 'renderer' => 'tamer_dog_popup', 'meta' => ['must_be_outside_or_exploring'], 'result' => ['hero_tamer_2'], 'message' => '<t-fail><t-door-closed>Das Stadttor ist geschlossen...</t-door-closed><t-no-items>{tamer_dog} kann nichts mitnehmen, da du <strong>nichts im Rucksack hast</strong>.</t-no-items></t-fail><nt-fail>Du befiehlst {tamer_dog} deinen Rucksackinhalt in die Stadt zu bringen.{hr}<strong>Deine Mitbürger werden sich über all diese Gegenstände in der Bank mächtig freuen.</strong></nt-fail>'],
        'hero_tamer_1b' => ['label' => 'Zur Truhe schicken', 'at00' => true, 'renderer' => 'tamer_dog_popup', 'meta' => ['must_be_outside_or_exploring'], 'result' => ['hero_tamer_1b'], 'message' => '<t-fail><t-no-room>Deine Truhe kann nicht <strong>{items_count} Gegenstände</strong> aufnehmen: er hat <strong>{size} Platz(e)</strong> übrig.</t-no-room><t-door-closed>Das Stadttor ist geschlossen...</t-door-closed><t-no-items>{tamer_dog} kann nichts mitnehmen, da du <strong>nichts im Rucksack hast</strong>.</t-no-items><t-too-heavy>{tamer_dog} kann deinen Rucksackinhalt nicht mitnehmen, da du einen <strong>sperrigen Gegenstand</strong> mit dir rumschleppt. Das ist dann wohl etwas zu viel des Guten für den Kleinen!</t-too-heavy></t-fail><nt-fail>Du befiehlst {tamer_dog} deinen Rucksackinhalt in die Stadt zu bringen.{hr}Genau wie du es gewünscht hast, <strong>hat er alles zur Truhe in deinem Haus gebracht</strong>.{hr}Braver Junge!</nt-fail>'],
        'hero_tamer_2b' => ['label' => 'Zur Truhe schicken', 'at00' => true, 'renderer' => 'tamer_dog_popup', 'meta' => ['must_be_outside_or_exploring'], 'result' => ['hero_tamer_2b'], 'message' => '<t-fail><t-no-room>Deine Truhe kann nicht <strong>{items_count} Gegenstände</strong> aufnehmen: er hat <strong>{size} Platz(e)</strong> übrig.</t-no-room><t-door-closed>Das Stadttor ist geschlossen...</t-door-closed><t-no-items>{tamer_dog} kann nichts mitnehmen, da du <strong>nichts im Rucksack hast</strong>.</t-no-items></t-fail><nt-fail>Du befiehlst {tamer_dog} deinen Rucksackinhalt in die Stadt zu bringen.{hr}Genau wie du es gewünscht hast, <strong>hat er alles zur Truhe in deinem Haus gebracht</strong>.{hr}Braver Junge!</nt-fail>'],
        'hero_tamer_3' => ['label' => 'Dopen', 'at00' => true, 'renderer' => 'tamer_dog_popup', 'meta' => ['must_be_outside_or_exploring', 'must_have_drug'], 'result' => ['consume_drug', 'hero_tamer_3'], 'message' => 'Du gibst deinem {tamer_dog} {items_consume}, die er gierig hinunterschlingt.{hr}Es vergeht keine Minute bis die Drogen Wirkung zeigen: Dein Fifi hat nun leuchtende Augen, ein glänzendes Fell und einen wedelnden Schwanz.'],

        'hero_surv_1' => ['label' => 'Wasser suchen', 'renderer' => 'survivalist_popup', 'meta' => ['must_be_outside', 'must_be_outside_3km', 'not_yet_sbook'], 'result' => ['contaminated_zone_infect', 'hero_surv_0', 'hero_surv_1'], 'message' => '{casino}'],
        'hero_surv_2' => ['label' => 'Essen suchen', 'renderer' => 'survivalist_popup', 'meta' => ['must_be_outside', 'no_full_ap', 'must_be_outside_3km', 'not_yet_sbook', 'eat_ap'], 'result' => ['contaminated_zone_infect', 'hero_surv_0', 'hero_surv_2'], 'message' => '{casino}'],

        'hero_hunter_1' => ['label' => 'Tarnen', 'at00' => true, 'meta' => ['must_be_outside', 'hunter_no_followers', 'must_have_control_hunter'], 'result' => ['hero_hunter'], 'message' => 'Du bist ab sofort getarnt.'],
        'hero_hunter_2' => ['label' => 'Tarnen', 'at00' => true, 'meta' => ['must_be_inside'], 'result' => ['hero_hunter'], 'message' => 'Du bist nun getarnt.'],

        'hero_generic_return' => ['label' => 'Die Rückkehr des Helden', 'tooltip' => 'Wenn du 11 km oder weniger von der Stadt entfernt bist, kehrst du sofort in die Stadt zurück!', 'cover' => true, 'at00' => true, 'meta' => ['must_be_outside_or_exploring', 'must_be_outside_within_11km', 'not_yet_hero'], 'result' => ['hero_act', ['custom' => [8]], ['message' => ['text' => 'Mit deiner letzten Kraft hast du dich *in die Stadt geschleppt*... *Ein Wunder*!']]],],
        'hero_generic_find' => ['label' => 'Fund', 'tooltip' => 'Wie durch ein Wunder treibst du einen nützlichen Gegenstand auf.', 'cover' => true, 'at00' => true, 'target' => ['type' => 'ItemTargetDefinition::ItemTypeSelectionType', 'property' => 'hero_find'], 'meta' => ['not_yet_hero'], 'result' => ['hero_act', 'spawn_target', ['message' => ['text' => 'So was nennt man wohl <strong>Glück</strong>! <t-inside>Du hast soeben {items_spawn} in einem Abfallberg neben deinem Haus gefunden!</t-inside><t-outside>Du hast soeben {items_spawn} im Wüstensand gefunden!</t-outside> Genau das, was du gebraucht hast!']]]],
        'hero_generic_find_lucky' => ['label' => 'Schönes Fundstück', 'tooltip' => 'Wie durch ein Wunder treibst du einen nützlichen Gegenstand auf.', 'cover' => true, 'at00' => true, 'target' => ['type' => 'ItemTargetDefinition::ItemTypeSelectionType', 'property' => 'hero_find_lucky'], 'meta' => ['not_yet_hero'], 'result' => ['hero_act', 'spawn_target', ['message' => ['text' => 'So was nennt man wohl <strong>Glück</strong>! <t-inside>Du hast soeben {items_spawn} in einem Abfallberg neben deinem Haus gefunden!</t-inside><t-outside>Du hast soeben {items_spawn} im Wüstensand gefunden!</t-outside> Genau das, was du gebraucht hast!']]]],
        'hero_generic_punch' => ['label' => 'Wildstyle Uppercut', 'tooltip' => 'Damit kannst du mit einem Schlag 2 Zombies umbringen!', 'meta' => ['must_be_outside_or_exploring', 'must_have_zombies', 'not_yet_hero'], 'result' => ['hero_act', ['zombies' => 'kill_2z'], ['message' => ['text' => 'Mit Hilfe deiner übermenschlichen Heldenkräfte hast du <strong>{kills} Zombie(s)</strong> platt gemacht!']]]],
        'hero_generic_ap' => ['label' => 'Zweite Lunge', 'tooltip' => 'Stellt deine AP wieder her und beseitigt deine Müdigkeit.', 'cover' => true, 'at00' => true, 'meta' => ['no_full_ap_msg', 'not_yet_hero'], 'result' => ['hero_act', 'just_ap6', ['message' => ['text' => 'Du atmest tief durch und drückst den Rücken durch. Auf geht\'s! Ich werde nicht hier sterben!{hr}Du hast soeben Kraft getankt und <strong>{ap} neue AP erhalten</strong>.']]]],
        'hero_generic_immune' => ['label' => 'Den Tod besiegen', 'tooltip' => 'Beim nächsten Angriff wird der Durst-, Infektions- und Abhängigkeitszustand außer Kraft gesetzt.', 'cover' => true, 'at00' => true, 'meta' => ['not_yet_hero'], 'result' => ['hero_act', 'hero_immune', ['message' => ['text' => 'Du versucht nochmal alle deine Kräfte für heute Abend zu mobilisieren. Die Anspannung steht dir ins Gesicht geschrieben. Du schwitzt und deine Hände zittern.{hr}Beim heutigen Angriff wirst du weder weder Durst, noch Krankheitssymptome (Infektion), noch Entzugserscheinungen verspüren.']]]],
        'hero_generic_rescue' => ['label' => 'Rettung', 'tooltip' => 'Du bringst einen anderen Spieler nach Hause (dieser darf max. 2 Felder von der Stadt entfernt sein).', 'confirm' => true, 'confirmMsg' => 'Möchtest du {target} heimbringen?', 'target' => ['type' => 'ItemTargetDefinition::ItemHeroicRescueType'], 'meta' => ['must_be_inside', 'not_yet_hero'], 'result' => ['hero_act', ['custom' => [9]]], 'message' => 'Du hast {citizen} auf heldenhafte Weise in die Stadt gebracht!'],
        'hero_generic_friendship' => ['label' => 'Freundschaft', 'tooltip' => 'Du spendest eine deiner noch nicht verwendeten Heldentaten an einen anderen Spieler.', 'confirm' => true, 'confirmMsg' => 'Möchtest du deine Heldentat {targetAction} an {targetPlayer} spenden? Du kannst sie danach nicht mehr selbst verwenden. ACHTUNG: Wenn {targetPlayer} bereits eine Heldentat von jemand anderem erhalten oder {targetAction} noch nicht selbst verwendet hat, verfällt dein Geschenk.', 'target' => ['type' => 'ItemTargetDefinition::ItemFriendshipType'], 'meta' => ['not_yet_hero', 'can_use_friendship'], 'result' => ['hero_act', ['custom' => [70]]], 'message' => 'Du hast deine Heldentat an {citizen} weitergegeben.'],

        'throw_sandball' => ['label' => 'Werfen', /* 'target' => ['type' => ItemTargetDefinition::ItemCitizenOnZoneSBType], */
            'meta' => ['must_be_outside', 'during_christmas'], 'result' => [['custom' => [20]]], 'message' => '<nt-fail>Du hast einen Sandball in {citizen}s Gesicht geworfen.</nt-fail><t-fail>Hier ist niemand, auf den du den Sandball werfen könntest...</t-fail>'],

        'special_armag' => ['label' => 'Durchgang in Kraft', 'tooltip_key' => 'heroic_arma_tooltip', 'allow_when_terrorized' => true, 'meta' => ['must_be_outside', 'must_be_blocked'], 'result' => [['group' => [[['do_nothing', ['message' => ['text_key' => 'heroic_arma_fail']]], 50], [[['zone' => ['escape' => ['armag', 600]]], ['zombies' => 'kill_1z'], ['message' => ['text_key' => 'heroic_arma_success']]], 50]]]]],
        'special_armag_d' => ['label' => 'Durchgang in Kraft', 'tooltip_key' => 'heroic_arma_tooltip', 'allow_when_terrorized' => true, 'meta' => ['must_be_outside', 'must_be_blocked', 'must_be_day'], 'result' => [['group' => [[['do_nothing', ['message' => ['text_key' => 'heroic_arma_fail']]], 50], [[['zone' => ['escape' => ['armag', 600]]], ['zombies' => 'kill_1z'], ['message' => ['text_key' => 'heroic_arma_success']]], 50]]]]],
        'special_armag_n' => ['label' => 'Durchgang in Kraft', 'tooltip_key' => 'heroic_arma_tooltip', 'allow_when_terrorized' => true, 'meta' => ['must_be_outside', 'must_be_blocked', 'must_be_night'], 'result' => [['group' => [[['do_nothing', ['message' => ['text_key' => 'heroic_arma_fail']]], 25], [[['zone' => ['escape' => ['armag', 600]]], ['zombies' => 'kill_1z'], ['message' => ['text_key' => 'heroic_arma_success']]], 75]]]]],
        'special_vote_shaman' => ['label' => 'Den Shamane wählen', 'target' => ['type' => 'ItemTargetDefinition::ItemCitizenVoteType'], 'meta' => ['must_be_outside', 'profession_heroic', 'vote_shaman_needed', 'vote_shaman_not_given'], 'result' => [['custom' => [18]]]],
        'special_vote_guide' => ['label' => 'Den Reiseleiter in der Außenwelt wählen', 'target' => ['type' => 'ItemTargetDefinition::ItemCitizenVoteType'], 'meta' => ['must_be_outside', 'profession_heroic', 'vote_guide_needed', 'vote_guide_not_given'], 'result' => [['custom' => [19]]]],

        'improve' => ['label' => 'Aufbauen', 'meta' => ['must_be_outside', 'zone_is_improvable', 'min_1_ap', 'must_be_outside_not_at_doors', 'feature_camping'], 'result' => ['minus_1ap', 'consume_item', ['zone' => ['improve' => 9]]], 'message' => 'Du befestigst den {item} und bedeckst ihn zur Tarnung mit herumliegendem Müll und vertrockneten Zweigen. Na bitte, das sollte hoffentlich deine Überlebenschancen heute Nacht verbessern. Du hast dafür 1 Aktionspunkt verbraucht.'], // Each item used as zone improvement gives 9% chance

        'cm_campsite_hide' => ['label' => 'Sich verstecken und die Nacht hier schlafen!', 'meta' => ['must_be_outside', 'must_not_be_hidden', 'must_not_be_tombed'], 'result' => ['camp_hide', ['custom' => [10]]], 'message' => 'Du hast Dich notdürftig versteckt.'],
        'cm_campsite_improve' => ['label' => 'Schlafplatz verbessern (schwacher permanenter Bonus, 1AP)', 'meta' => ['min_1_ap', 'not_tired', 'must_be_outside', 'must_not_be_hidden', 'must_not_be_tombed', 'zone_is_improvable'], 'result' => ['minus_1ap', ['zone' => ['improve' => 5]]], 'message' => 'Du hast das hiesige Versteck verbessert.'], // Each improvement adds 5% chance
        'cm_campsite_tomb' => ['label' => '"Grab" schaufeln (mittelmäßiger vorübergehender Bonus, 1AP)', 'meta' => ['min_1_ap', 'not_tired', 'must_be_outside', 'must_not_be_hidden', 'must_not_be_tombed'], 'result' => ['minus_1ap', 'camp_tomb', ['custom' => [10]]], 'message' => 'Du hast Dir Dein eigenes Grab geschaufelt. Oh welche Ironie!'],
        'cm_campsite_unhide' => ['label' => 'Versteck verlassen', 'meta' => ['must_be_outside', 'must_be_hidden'], 'result' => ['camp_unhide', ['custom' => [11]]], 'message' => 'Du hast Dein Versteck verlassen.'],
        'cm_campsite_untomb' => ['label' => 'Grab verlassen', 'meta' => ['must_be_outside', 'must_be_tombed'], 'result' => ['camp_untomb', ['custom' => [11]]], 'message' => 'Du hast Dein Grab verlassen. Die schöne Arbeit umsonst!'],

        'home_clean' => ['label' => 'Haus aufräumen und putzen', 'meta' => ['must_be_inside', 'not_yet_home_cleaned'], 'result' => [['status' => ['from' => null, 'to' => 'tg_home_clean', 'counter' => 'ActionCounter::ActionTypeHomeCleanup']]], 'message' => 'Du räumst deinen ganzen Plunder auf und machst ein wenig Ordnung, damit es hier etwas aufgeräumter aussieht. Auch wenn\'s ne Bruchbude ist, es ist DEIN Zuhause...'],
        'home_shower' => ['label' => 'Duschen', 'meta' => ['must_be_inside', 'must_have_shower', 'not_yet_home_showered'], 'result' => [['status' => ['from' => null, 'to' => 'tg_home_shower', 'counter' => 'ActionCounter::ActionTypeShower']]], 'message' => 'Du springst unter die hausgemachte Dusche ohne weiter darüber nachzudenken. Das eiskalte Wasser erschreckt dich, aber dennoch bleibst du für einige Augenblicke unter dem schwachen Wasserstrahl stehen. In Ermangelung von Seife reibst du dich mit einem glatten Stein ab und versuchst, den Schlamm und die Blutflecken abzuwaschen. Dabei versuchst du, dir einzureden, dass es sich gut anfühlt.'],
        'home_heal_1' => ['label' => 'Heilen', 'meta' => ['min_5_ap', 'must_be_inside', 'must_have_hospital', 'not_yet_home_heal_1', 'is_wounded_h', 'is_not_infected_h'], 'result' => ['minus_5ap', 'heal_wound', ['status' => ['from' => null, 'to' => 'tg_home_heal_1']]], 'message_key' => 'home_heal_wound'],
        'home_heal_2' => ['label' => 'Heilen', 'meta' => ['min_5_ap', 'must_be_inside', 'must_have_hospital', 'not_yet_home_heal_2', 'is_not_wounded_h', 'is_infected_h'], 'result' => ['minus_5ap', 'disinfect', ['status' => ['from' => null, 'to' => 'tg_home_heal_2']]], 'message_key' => 'home_heal_infect'],
        'home_heal_3' => ['label' => 'Heilen', 'meta' => ['min_5_ap', 'must_be_inside', 'must_have_hospital', 'not_yet_home_heal_2', 'is_wounded_h', 'is_infected_h'], 'result' => ['minus_5ap', 'disinfect', ['status' => ['from' => null, 'to' => 'tg_home_heal_2']]], 'message_key' => 'home_heal_infect'],
        'home_defbuff' => ['label' => 'Verteidigung organisieren', 'meta' => ['profession_guardian', 'min_1_ap', 'must_be_inside', 'must_have_guardtower', 'not_yet_home_defbuff', 'guard_tower_not_max'], 'result' => ['minus_1ap', ['custom' => [13], 'status' => ['from' => null, 'to' => 'tg_home_defbuff']]], 'message' => 'Du hast dir etwas Zeit genommen und zur Verteidigung der Stadt beigetragen.'],
        'home_crows' => ['label' => 'Nach Ruinen Ausschau halten', 'meta' => ['profession_hunter', 'must_be_inside', 'must_have_crowsnest', 'not_yet_home_defbuff'], 'result' => [['custom' => [12], 'status' => ['from' => null, 'to' => 'tg_home_defbuff']]], 'message' => '<t-zone>Du hast ein neues Gebäude bei den Koordinaten {zone} entdeckt!</t-zone><nt-zone>Du suchst den gesamten Horizont mit deinen Adleraugen ab. Aber es scheint keine weiteren Gebäude zu entdecken zu geben.</nt-zone>'],
        'home_fillwater' => ['label' => 'Wasserwaffen füllen', 'meta' => ['must_be_inside', 'must_have_valve'], 'result' => [['custom' => [14]]], 'message' => '<t-fail>Du hast <strong>keine Wasserwaffen zum Befüllen</strong> in deinem Rucksack oder deiner Truhe.</t-fail><nt-fail>Du hast {items_spawn} dank des Wasserhahns kostenlos auffüllen können.</nt-fail>'],
        'home_cinema' => ['label' => 'Ins Kino gehen', 'meta' => ['must_be_inside', 'must_have_cinema'], 'result' => ['unterrorize'], 'message' => 'Ja, klar... Du hast ihn schon hunderte Male gesehen, das Thema ändert sich auch nicht allzu sehr, aber trotzdem: Es geht nichts über einen guten Zombie-Film zur Entspannung.<t-stat-down-terror><hr />Diese seltsam fernen Schreie des Schreckens haben dir den Kopf gerade gerückt: <strong>Du hast deine Angst abgeschüttelt</strong>.</t-stat-down-terror>'],

        'home_lab_1a' => ['label' => 'Droge herstellen', 'meta' => ['must_be_inside', 'must_have_home_lab_v1', 'must_not_have_lab', 'have_2_pharma', 'lab_counter_below_1'], 'result' => [['status' => 'increase_lab_counter', 'consume' => '2_pharma', 'group' => [['home_lab_success', 25], ['home_lab_failure', 75]]],], 'message_key' => 'use_lab'],
        'home_lab_2a' => ['label' => 'Droge herstellen', 'meta' => ['must_be_inside', 'must_have_home_lab_v2', 'must_not_have_lab', 'have_2_pharma', 'lab_counter_below_1'], 'result' => [['status' => 'increase_lab_counter', 'consume' => '2_pharma', 'group' => [['home_lab_success', 50], ['home_lab_failure', 50]]],], 'message_key' => 'use_lab'],
        'home_lab_3a' => ['label' => 'Droge herstellen', 'meta' => ['must_be_inside', 'must_have_home_lab_v3', 'must_not_have_lab', 'have_2_pharma', 'lab_counter_below_1'], 'result' => [['status' => 'increase_lab_counter', 'consume' => '2_pharma', 'group' => [['home_lab_success', 75], ['home_lab_failure', 25]]],], 'message_key' => 'use_lab'],
        'home_lab_4a' => ['label' => 'Droge herstellen', 'meta' => ['must_be_inside', 'must_have_home_lab_v4', 'must_not_have_lab', 'have_2_pharma', 'lab_counter_below_4'], 'result' => [['status' => 'increase_lab_counter', 'consume' => '2_pharma'], 'home_lab_success'], 'message_key' => 'use_lab'],
        'home_lab_1b' => ['label' => 'Droge herstellen', 'meta' => ['must_be_inside', 'must_have_home_lab_v1', 'must_have_lab', 'have_2_pharma', 'lab_counter_below_6'], 'result' => [['status' => 'increase_lab_counter', 'consume' => '2_pharma', 'group' => [['home_lab_success', 25], ['home_lab_failure', 75]]],], 'message_key' => 'use_lab'],
        'home_lab_2b' => ['label' => 'Droge herstellen', 'meta' => ['must_be_inside', 'must_have_home_lab_v2', 'must_have_lab', 'have_2_pharma', 'lab_counter_below_6'], 'result' => [['status' => 'increase_lab_counter', 'consume' => '2_pharma', 'group' => [['home_lab_success', 50], ['home_lab_failure', 50]]],], 'message_key' => 'use_lab'],
        'home_lab_3b' => ['label' => 'Droge herstellen', 'meta' => ['must_be_inside', 'must_have_home_lab_v3', 'must_have_lab', 'have_2_pharma', 'lab_counter_below_6'], 'result' => [['status' => 'increase_lab_counter', 'consume' => '2_pharma', 'group' => [['home_lab_success', 75], ['home_lab_failure', 25]]],], 'message_key' => 'use_lab'],
        'home_lab_4b' => ['label' => 'Droge herstellen', 'meta' => ['must_be_inside', 'must_have_home_lab_v4', 'must_have_lab', 'have_2_pharma', 'lab_counter_below_9'], 'result' => [['status' => 'increase_lab_counter', 'consume' => '2_pharma'], 'home_lab_success'], 'message_key' => 'use_lab'],

        'home_kitchen_1a' => ['label' => 'Kochen', 'target' => ['property' => 'can_cook', 'poison' => false, 'broken' => false], 'meta' => ['must_be_inside', 'must_have_home_kitchen_v1', 'must_not_have_canteen', 'kitchen_counter_below_1'], 'result' => ['consume_target', ['status' => 'increase_kitchen_counter', 'group' => [['home_kitchen_success', 33], ['home_kitchen_failure', 66]]],], 'message_key' => 'use_kitchen'],
        'home_kitchen_2a' => ['label' => 'Kochen', 'target' => ['property' => 'can_cook', 'poison' => false, 'broken' => false], 'meta' => ['must_be_inside', 'must_have_home_kitchen_v2', 'must_not_have_canteen', 'kitchen_counter_below_1'], 'result' => ['consume_target', ['status' => 'increase_kitchen_counter', 'group' => [['home_kitchen_success', 66], ['home_kitchen_failure', 33]]],], 'message_key' => 'use_kitchen'],
        'home_kitchen_3a' => ['label' => 'Kochen', 'target' => ['property' => 'can_cook', 'poison' => false, 'broken' => false], 'meta' => ['must_be_inside', 'must_have_home_kitchen_v3', 'must_not_have_canteen', 'kitchen_counter_below_2'], 'result' => ['consume_target', ['status' => 'increase_kitchen_counter'], 'home_kitchen_success'], 'message_key' => 'use_kitchen'],
        'home_kitchen_4a' => ['label' => 'Kochen', 'target' => ['property' => 'can_cook', 'poison' => false, 'broken' => false], 'meta' => ['must_be_inside', 'must_have_home_kitchen_v4', 'must_not_have_canteen', 'kitchen_counter_below_3'], 'result' => ['consume_target', ['status' => 'increase_kitchen_counter'], 'home_kitchen_success'], 'message_key' => 'use_kitchen'],
        'home_kitchen_1b' => ['label' => 'Kochen', 'target' => ['property' => 'can_cook', 'poison' => false, 'broken' => false], 'meta' => ['must_be_inside', 'must_have_home_kitchen_v1', 'must_have_canteen', 'kitchen_counter_below_4'], 'result' => ['consume_target', ['status' => 'increase_kitchen_counter', 'group' => [['home_kitchen_success', 33], ['home_kitchen_failure', 66]]],], 'message_key' => 'use_kitchen'],
        'home_kitchen_2b' => ['label' => 'Kochen', 'target' => ['property' => 'can_cook', 'poison' => false, 'broken' => false], 'meta' => ['must_be_inside', 'must_have_home_kitchen_v2', 'must_have_canteen', 'kitchen_counter_below_4'], 'result' => ['consume_target', ['status' => 'increase_kitchen_counter', 'group' => [['home_kitchen_success', 66], ['home_kitchen_failure', 33]]],], 'message_key' => 'use_kitchen'],
        'home_kitchen_3b' => ['label' => 'Kochen', 'target' => ['property' => 'can_cook', 'poison' => false, 'broken' => false], 'meta' => ['must_be_inside', 'must_have_home_kitchen_v3', 'must_have_canteen', 'kitchen_counter_below_5'], 'result' => ['consume_target', ['status' => 'increase_kitchen_counter'], 'home_kitchen_success'], 'message_key' => 'use_kitchen'],
        'home_kitchen_4b' => ['label' => 'Kochen', 'target' => ['property' => 'can_cook', 'poison' => false, 'broken' => false], 'meta' => ['must_be_inside', 'must_have_home_kitchen_v4', 'must_have_canteen', 'kitchen_counter_below_6'], 'result' => ['consume_target', ['status' => 'increase_kitchen_counter'], 'home_kitchen_success'], 'message_key' => 'use_kitchen'],

        'slaughter_4xs' => ['label' => 'Ausweiden', 'meta' => ['must_be_inside', 'must_have_slaughter'], 'result' => ['consume_item', ['spawn' => 'meat_4xs'], ['picto' => ['r_animal_#00']]], 'message_key' => 'use_butcher'],
        'slaughter_2xs' => ['label' => 'Ausweiden', 'meta' => ['must_be_inside', 'must_have_slaughter'], 'result' => ['consume_item', ['spawn' => 'meat_2xs'], ['picto' => ['r_animal_#00']]], 'message_key' => 'use_butcher'],
        'slaughter_4x' => ['label' => 'Ausweiden', 'meta' => ['must_be_inside', 'must_have_slaughter'], 'result' => ['consume_item', ['spawn' => 'meat_4x'], ['picto' => ['r_animal_#00']]], 'message_key' => 'use_butcher'],
        'slaughter_2x' => ['label' => 'Ausweiden', 'meta' => ['must_be_inside', 'must_have_slaughter'], 'result' => ['consume_item', ['spawn' => 'meat_2x'], ['picto' => ['r_animal_#00']]], 'message_key' => 'use_butcher'],
        'slaughter_bmb' => ['label' => 'Ausweiden', 'meta' => ['must_be_inside', 'must_have_slaughter'], 'result' => ['consume_item', ['spawn' => 'meat_bmb'], ['picto' => ['r_animal_#00']]], 'message_key' => 'use_butcher'],
        'purify_soul' => ['label' => 'Läutern', 'meta' => ['must_be_inside', 'must_have_hammam'], 'result' => ['consume_item', ['town' => ['def' => 5]], ['picto' => ['r_collec_#00']], ['globalpicto' => ['r_mystic_#00']]], 'message' => "Du hast die Seele gereinigt und sie friedlich gemacht."],
        'brew_shamanic_potion' => ['label' => 'Herstellung eines Mystischern Trank', 'poison' => 'ItemAction::PoisonHandlerTransgress', 'tooltip' => 'Du kannst einen schamanischen Trank zubereiten, der den Rezipienten vor bösen Geistern schützt.', 'meta' => ['must_be_inside', 'have_water_shaman', 'min_1_pm', 'role_shaman'], 'result' => ['consume_water', 'minus_1pm', ['spawn' => 'potion']], 'message' => 'Das ist ein Musterbeispiel eines schamanischen Tranks! Nun liegt es an die, der Stadt dessen Wirksamkeit zu vermitteln und sie von deinen schamanischen Fähigkeiten zu überzeugen.'],

        'home_rest_1' => ['label' => 'Nickerchen machen', 'meta' => ['must_be_inside', 'must_have_home_rest_v1', 'not_yet_rested', 'no_full_ap_msg'], 'result' => [['status' => ['from' => null, 'to' => 'tg_rested'], 'group' => [['plus_2ap_7', 33], ['do_nothing', 66]]]], 'message_key' => 'use_bed'],
        'home_rest_2' => ['label' => 'Nickerchen machen', 'meta' => ['must_be_inside', 'must_have_home_rest_v2', 'not_yet_rested', 'no_full_ap_msg'], 'result' => [['status' => ['from' => null, 'to' => 'tg_rested'], 'group' => [['plus_2ap_7', 66], ['do_nothing', 33]]]], 'message_key' => 'use_bed'],
        'home_rest_3' => ['label' => 'Nickerchen machen', 'meta' => ['must_be_inside', 'must_have_home_rest_v3', 'not_yet_rested', 'no_full_ap_msg'], 'result' => [['status' => ['from' => null, 'to' => 'tg_rested'], 'group' => [['plus_2ap_7', 100], ['do_nothing', 0]]]], 'message_key' => 'use_bed'],

        'nw_break' => ['label' => '', 'meta' => [], 'result' => ['break_item']],
        'nw_destroy' => ['label' => '', 'meta' => [], 'result' => ['consume_item']],
        'nw_empty_big_pgun' => ['label' => '', 'meta' => [], 'result' => [['item' => ['morph' => 'big_pgun_empty_#00', 'consume' => false]]]],
        'nw_empty_pilegun_up' => ['label' => '', 'meta' => [], 'result' => [['item' => ['morph' => 'pilegun_up_empty_#00', 'consume' => false]]]],
        'nw_empty_pilegun' => ['label' => '', 'meta' => [], 'result' => [['item' => ['morph' => 'pilegun_empty_#00', 'consume' => false]]]],
        'nw_empty_taser' => ['label' => '', 'meta' => [], 'result' => [['item' => ['morph' => 'taser_empty_#00', 'consume' => false]]]],
        'nw_empty_mixergun' => ['label' => '', 'meta' => [], 'result' => [['item' => ['morph' => 'mixergun_empty_#00', 'consume' => false]]]],
        'nw_empty_chainsaw' => ['label' => '', 'meta' => [], 'result' => [['item' => ['morph' => 'chainsaw_empty_#00', 'consume' => false]]]],
        'nw_empty_phone' => ['label' => '', 'meta' => [], 'result' => ['consume_item', ['spawn' => 'phone_nw']]],
        'nw_empty_watergun' => ['label' => '', 'meta' => [], 'result' => [['item' => ['morph' => 'watergun_empty_#00', 'consume' => false]]]],
        'nw_empty_watergun_opt' => ['label' => '', 'meta' => [], 'result' => [['item' => ['morph' => 'watergun_opt_empty_#00', 'consume' => false]]]],
        'nw_empty_torch' => ['label' => '', 'meta' => [], 'result' => [['item' => ['morph' => 'torch_off_#00', 'consume' => false]]]],
        'nw_empty_staff' => ['label' => '', 'meta' => [], 'result' => [['item' => ['morph' => 'staff2_#00', 'consume' => false]]]],
        'nw_empty_dildo' => ['label' => '', 'meta' => [], 'result' => [['item' => ['morph' => 'vibr_empty_#00', 'consume' => false]]]],
        'nw_empty_watercan' => ['label' => '', 'meta' => [], 'result' => [['item' => ['morph' => 'water_can_empty_#00', 'consume' => false]]]],
        'nw_empty_kalach' => ['label' => '', 'meta' => [], 'result' => [['item' => ['morph' => 'kalach_#01', 'consume' => false]]]],
        'nw_meat' => ['label' => '', 'meta' => [], 'result' => [['item' => ['morph' => 'undef_#00', 'consume' => false]], ['picto' => ['r_animal_#00']]]],
        'nw_meat_tasty' => ['label' => '', 'meta' => [], 'result' => [['item' => ['morph' => 'meat_#00', 'consume' => false]], ['picto' => ['r_animal_#00']]]],
    ],

    'heroics' => [
        ['name' => 'hero_generic_return', 'unlockable' => false, 'used' => 'Ahh, es ist immer wieder schön in die Stadt zurückzukehren... Nach einer deartigen Anstrengung, kann der Wille schon mal schwach werden. Versuche es in einem nächsten Leben erneut.'],
        ['name' => 'hero_generic_find', 'unlockable' => false, 'used' => 'Du hast heute schon verdammt viel Schwein gehabt. So viel Glück kannst du erst in deinem nächsten Leben wieder haben...'],
        ['name' => 'hero_generic_punch', 'unlockable' => false, 'used' => 'Ahh... Das hat dir gefallen, nicht wahr? Du kannst deine Fäuste erst in deinem nächsten Leben wieder schwingen lassen...'],
        ['name' => 'hero_generic_ap', 'unlockable' => true],
        ['name' => 'hero_generic_immune', 'unlockable' => true],
        ['name' => 'hero_generic_find_lucky', 'unlockable' => true, 'used' => 'Du hast heute schon verdammt viel Schwein gehabt. So viel Glück kannst du erst in deinem nächsten Leben wieder haben...', 'replace' => 'hero_generic_find'],
        ['name' => 'hero_generic_rescue', 'unlockable' => false, 'used' => 'Du hast bereits versucht, einen deiner Mitbürger zu retten! Für deine nächste Rettungsaktion musst du bis zu deinem nächsten Leben warten!'],
        ['name' => 'hero_generic_friendship', 'unlockable' => false, 'used' => 'Du hast deine Großzügigkeit in diesem Leben bereits unter Beweis gestellt!'],
    ],

    'specials' => [
        ['name' => 'special_armag', 'icon' => 'armag', 'consumable' => true],
        ['name' => 'special_armag_d', 'icon' => 'armag', 'consumable' => true],
        ['name' => 'special_armag_n', 'icon' => 'armag', 'consumable' => true],
        ['name' => 'special_vote_shaman', 'icon' => 'hero', 'consumable' => false],
        ['name' => 'special_vote_guide', 'icon' => 'hero', 'consumable' => false],
    ],

    'camping' => [
        'cm_campsite_hide', 'cm_campsite_improve', 'cm_campsite_tomb', 'cm_campsite_unhide', 'cm_campsite_untomb'
    ],

    'home' => [
        ['home_clean', 'sort'], ['home_shower', 'shower'], ['home_heal_1', 'heal_wound'], ['home_heal_2', 'heal_infection'], ['home_heal_3', 'heal_infection'], ['home_defbuff', 'watchmen'], ['home_crows', 'watchmen'], ['home_fillwater', 'water'], ['home_cinema', 'cinema'],

        ['home_lab_1a', 'home_lab'], ['home_lab_2a', 'home_lab'], ['home_lab_3a', 'home_lab'], ['home_lab_4a', 'home_lab'],
        ['home_lab_1b', 'lab'], ['home_lab_2b', 'lab'], ['home_lab_3b', 'lab'], ['home_lab_4b', 'lab'],
        ['home_kitchen_1a', 'kitchen'], ['home_kitchen_2a', 'kitchen'], ['home_kitchen_3a', 'kitchen'], ['home_kitchen_4a', 'kitchen'],
        ['home_kitchen_1b', 'canteen'], ['home_kitchen_2b', 'canteen'], ['home_kitchen_3b', 'canteen'], ['home_kitchen_4b', 'canteen'],
        ['brew_shamanic_potion', 'shaman'], ['home_rest_1', 'rest'], ['home_rest_2', 'rest'], ['home_rest_3', 'rest']
    ],

    'escort' => [
        'ex_drink' => ['icon' => 'drink', 'label' => 'Trinken', 'tooltip' => '{citizen} befehlen etwas zu trinken.', 'actions' => [
            'water_tl0', 'water_tl1a', 'water_tl1b', 'water_tl2', 'water_g',
            'potion_tl0a', 'potion_tl0b', 'potion_tl1a', 'potion_tl1b', 'potion_tl2', 'potion_g',
            'potion_tl0a_immune', 'potion_tl0b_immune', 'potion_tl1a_immune', 'potion_tl1b_immune', 'potion_tl2_immune', 'potion_g_immune',
            'watercan3_tl0', 'watercan3_tl1a', 'watercan3_tl1b', 'watercan3_tl2', 'watercan3_g',
            'watercan2_tl0', 'watercan2_tl1a', 'watercan2_tl1b', 'watercan2_tl2', 'watercan2_g',
            'watercan1_tl0', 'watercan1_tl1a', 'watercan1_tl1b', 'watercan1_tl2', 'watercan1_g'
        ]],
        'ex_eat' => ['icon' => 'eat', 'label' => 'Essen', 'tooltip' => '{citizen} befehlen etwas zu essen.', 'actions' => [
            'eat_6ap', 'eat_7ap', 'eat_fleshroom_1', 'eat_fleshroom_2', 'eat_meat_1', 'eat_meat_2'
        ]],
    ],

    'items' => [
        'water_#00' => ['water_tl0', 'water_tl1a', 'water_tl1b', 'water_tl2', 'water_g'],
        'water_cup_#00' => ['water_tl0', 'water_tl1a', 'water_tl1b', 'water_tl2', 'water_g'],
        'potion_#00' => ['potion_tl0a', 'potion_tl0b', 'potion_tl1a', 'potion_tl1b', 'potion_tl2', 'potion_g', 'potion_tl0a_immune', 'potion_tl0b_immune', 'potion_tl1a_immune', 'potion_tl1b_immune', 'potion_tl2_immune', 'potion_g_immune'],

        'water_can_3_#00' => ['watercan3_tl0', 'watercan3_tl1a', 'watercan3_tl1b', 'watercan3_tl2', 'watercan3_g'],
        'water_can_2_#00' => ['fill_watercan2', 'watercan2_tl0', 'watercan2_tl1a', 'watercan2_tl1b', 'watercan2_tl2', 'watercan2_g'],
        'water_can_1_#00' => ['fill_watercan1', 'watercan1_tl0', 'watercan1_tl1a', 'watercan1_tl1b', 'watercan1_tl2', 'watercan1_g'],
        'water_can_empty_#00' => ['fill_watercan0'],

        'can_#00' => ['can', 'can_t1', 'can_t2', 'can_t3'],

        'can_open_#00' => ['eat_6ap'],
        'bretz_#00' => ['eat_6ap'],
        'undef_#00' => ['eat_6ap'],
        'dish_#00' => ['eat_6ap'],
        'vegetable_#00' => ['eat_6ap'],
        'food_bar1_#00' => ['eat_6ap'],
        'food_bar2_#00' => ['eat_6ap'],
        'food_bar3_#00' => ['eat_6ap'],
        'food_biscuit_#00' => ['eat_6ap'],
        'food_chick_#00' => ['eat_6ap'],
        'food_pims_#00' => ['eat_6ap'],
        'food_tarte_#00' => ['eat_6ap'],
        'food_sandw_#00' => ['eat_6ap'],
        'food_noodles_#00' => ['eat_6ap'],
        'wood_xmas_#00' => ['eat_6ap'],
        'fruit_#00' => ['eat_fleshroom_1', 'eat_fleshroom_2'],
        'hmeat_#00' => ['eat_meat_1', 'eat_meat_2'],
        'bone_meat_#00' => ['eat_bone_1', 'eat_bone_2'],
        'cadaver_#00' => ['eat_cadaver_1', 'eat_cadaver_2'],
        'vagoul_#00' => ['ghoul_serum'],

        'food_noodles_hot_#00' => ['eat_7ap'],
        'meat_#00' => ['eat_7ap'],
        'vegetable_tasty_#00' => ['eat_7ap'],
        'dish_tasty_#00' => ['eat_7ap'],
        'food_candies_#00' => ['eat_7ap'],
        'chama_tasty_#00' => ['eat_7ap'],
        'woodsteak_#00' => ['eat_7ap'],
        'egg_#00' => ['eat_7ap'],
        'apple_#00' => ['eat_7ap'],

        'disinfect_#00' => ['drug_par_1', 'drug_par_2', 'drug_par_3', 'drug_par_4'],
        'drug_#00' => ['drug_6ap_1', 'drug_6ap_2'],
        'drug_hero_#00' => ['drug_8ap_1', 'drug_8ap_2'],
        'drug_random_#00' => ['drug_rand_1', 'drug_rand_2'],
        'lsd_#00' => ['drug_lsd_1', 'drug_lsd_2'],
        'beta_drug_bad_#00' => ['drug_beta_bad_1', 'drug_beta_bad_2'],
        'beta_drug_#00' => ['drug_beta'],
        'xanax_#00' => ['drug_xana1', 'drug_xana2', 'drug_xana3', 'drug_xana4'],
        'drug_water_#00' => ['drug_hyd_1', 'drug_hyd_2', 'drug_hyd_3', 'drug_hyd_4', 'drug_hyd_5', 'drug_hyd_6'],
        'april_drug_#00' => ['drug_april_1', 'drug_april_2'],

        'food_bag_#00' => ['open_doggybag'],
        'food_armag_#00' => ['open_lunchbag'],
        'chest_citizen_#00' => ['open_c_chest'],
        'chest_hero_#00' => ['open_h_chest'],
        'postal_box_#00' => ['open_postbox'],
        'postal_box_#01' => ['open_postbox'],
        'postal_box_xl_#00' => ['open_postbox_xl'],
        'book_gen_letter_#00' => ['open_letterbox'],
        'book_gen_box_#00' => ['open_justbox'],

        'game_box_#00' => ['open_gamebox'],
        'bplan_box_#00' => ['open_abox'],
        'bplan_drop_#00' => ['open_cbox'],

        'rsc_pack_3_#00' => ['open_matbox3'],
        'rsc_pack_2_#00' => ['open_matbox2'],
        'rsc_pack_1_#00' => ['open_matbox1'],
        'chest_christmas_3_#00' => ['open_xmasbox3'],
        'chest_christmas_2_#00' => ['open_xmasbox2'],
        'chest_christmas_1_#00' => ['open_xmasbox1'],

        'chest_#00' => ['open_metalbox', 'open_metalbox_t1', 'open_metalbox_t2'],
        'chest_xl_#00' => ['open_metalbox2', 'open_metalbox2_t1', 'open_metalbox2_t2'],
        'catbox_#00' => ['open_catbox', 'open_catbox_t1', 'open_catbox_t2'],
        'chest_tools_#00' => ['open_toolbox', 'open_toolbox_t1', 'open_toolbox_t2'],
        'chest_food_#00' => ['open_foodbox_in', 'open_foodbox_out', 'open_foodbox_in_t1', 'open_foodbox_out_t1', 'open_foodbox_in_t2', 'open_foodbox_out_t2'],

        'safe_#00' => ['open_safe'],
        'bplan_box_e_#00' => ['open_asafe'],

        'pilegun_empty_#00' => ['load_pilegun'],
        'pilegun_up_empty_#00' => ['load_pilegun2'],
        'big_pgun_empty_#00' => ['load_pilegun3'],
        'mixergun_empty_#00' => ['load_mixergun'],
        'chainsaw_empty_#00' => ['load_chainsaw'],
        'taser_empty_#00' => ['load_taser'],
        'lpoint_#00' => ['load_lpointer'],

        'lamp_#00' => ['load_lamp'],
        'vibr_empty_#00' => ['load_dildo'],
        'radius_mk2_part_#00' => ['load_rmk2'],
        'maglite_off_#00' => ['load_maglite'],
        'maglite_1_#00' => ['load_maglite'],
        'radio_off_#00' => ['load_radio'],
        'sport_elec_empty_#00' => ['load_emt'],

        'watergun_opt_empty_#00' => ['fill_asplash1', 'fill_asplash2'],
        'watergun_empty_#00' => ['fill_splash1', 'fill_splash2'],
        'jerrygun_off_#00' => ['fill_jsplash'],
        'jerrygun_#00' => ['throw_jerrygun'],
        'kalach_#01' => ['fill_ksplash1', 'fill_ksplash2'],
        'grenade_empty_#00' => ['fill_grenade1', 'fill_grenade2'],
        'bgrenade_empty_#00' => ['fill_exgrenade1', 'fill_exgrenade2'],

        'grenade_#00' => ['throw_grenade'],
        'bgrenade_#00' => ['throw_exgrenade'],
        'boomfruit_#00' => ['throw_boomfruit'],

        'pilegun_#00' => ['fire_pilegun'],
        'pilegun_up_#00' => ['fire_pilegun2'],
        'big_pgun_#00' => ['fire_pilegun3'],
        'mixergun_#00' => ['fire_mixergun'],
        'chainsaw_#00' => ['fire_chainsaw'],
        'taser_#00' => ['fire_taser'],
        'lpoint4_#00' => ['fire_lpointer4'],
        'lpoint3_#00' => ['fire_lpointer3'],
        'lpoint2_#00' => ['fire_lpointer2'],
        'lpoint1_#00' => ['fire_lpointer1'],

        'watergun_opt_5_#00' => ['fire_asplash5'],
        'watergun_opt_4_#00' => ['fire_asplash4'],
        'watergun_opt_3_#00' => ['fire_asplash3'],
        'watergun_opt_2_#00' => ['fire_asplash2'],
        'watergun_opt_1_#00' => ['fire_asplash1'],
        'watergun_3_#00' => ['fire_splash3'],
        'watergun_2_#00' => ['fire_splash2'],
        'watergun_1_#00' => ['fire_splash1'],
        'kalach_#00' => ['fire_ksplash'],

        'pet_chick_#00' => ['slaughter_2x', 'throw_animal'],
        'pet_rat_#00' => ['slaughter_2x', 'throw_animal'],
        'pet_pig_#00' => ['slaughter_4x', 'throw_animal'],
        'pet_snake_#00' => ['slaughter_4xs', 'throw_animal'],
        'pet_cat_#00' => ['slaughter_2xs', 'throw_animal_cat'],
        'tekel_#00' => ['slaughter_2xs', 'throw_animal_tekel'],
        'pet_dog_#00' => ['slaughter_2xs', 'throw_animal_dog'],
        'angryc_#00' => ['slaughter_bmb', 'throw_animal_angryc'],

        'machine_1_#00' => ['throw_b_machine_1'],
        'bone_#00' => ['throw_b_bone'],
        'can_opener_#00' => ['throw_b_can_opener'],
        'chair_basic_#00' => ['throw_b_chair_basic'],
        'torch_#00' => ['throw_b_torch'],
        'chain_#00' => ['throw_b_chain'],
        'staff_#00' => ['throw_b_staff'],
        'knife_#00' => ['throw_b_knife'],
        'machine_2_#00' => ['throw_b_machine_2'],
        'small_knife_#00' => ['throw_b_small_knife'],
        'cutcut_#00' => ['throw_b_cutcut'],
        'machine_3_#00' => ['throw_b_machine_3'],
        'pc_#00' => ['throw_b_pc'],
        'lawn_#00' => ['throw_b_lawn'],
        'screw_#00' => ['throw_b_screw'],
        'swiss_knife_#00' => ['throw_b_swiss_knife'],
        'cutter_#00' => ['throw_b_cutter'],
        'concrete_wall_#00' => ['throw_b_concrete_wall'],
        'torch_off_#00' => ['throw_b_torch_off'],
        'wrench_#00' => ['throw_b_wrench'],
        'hurling_stick_#00' => ['throw_hurling_stick'],
        'iphone_#00' => ['throw_phone'],
        'cinema_#00' => ['throw_projector'],

        'bplan_c_#00' => ['bp_generic_1'],
        'bplan_u_#00' => ['bp_generic_2'],
        'bplan_r_#00' => ['bp_generic_3'],
        'bplan_e_#00' => ['bp_generic_4'],
        'hbplan_u_#00' => ['bp_hotel_2'],
        'hbplan_r_#00' => ['bp_hotel_3'],
        'hbplan_e_#00' => ['bp_hotel_4'],
        'bbplan_u_#00' => ['bp_bunker_2'],
        'bbplan_r_#00' => ['bp_bunker_3'],
        'bbplan_e_#00' => ['bp_bunker_4'],
        'mbplan_u_#00' => ['bp_hospital_2'],
        'mbplan_r_#00' => ['bp_hospital_3'],
        'mbplan_e_#00' => ['bp_hospital_4'],

        'rp_book_#00' => ['read_rp'],
        'rp_book_#01' => ['read_rp'],
        'rp_book2_#00' => ['read_rp'],
        'rp_scroll_#00' => ['read_rp'],
        'rp_scroll_#01' => ['read_rp'],
        'rp_sheets_#00' => ['read_rp'],
        'rp_letter_#00' => ['read_rp'],
        'rp_manual_#00' => ['read_rp'],
        'lilboo_#00' => ['read_rp_cover'],
        'rp_twin_#00' => ['read_rp'],

        'banned_note_#00' => ['read_banned_note'],

        'dice_#00' => ['special_dice'],
        'cards_#00' => ['special_card'],
        'guitar_#00' => ['special_guitar'],

        'rhum_#00' => ['alcohol'],
        'vodka_#00' => ['alcohol'],
        'vodka_de_#00' => ['alcohol'],
        'fest_#00' => ['alcohol'],
        'guiness_#00' => ['alcohol'],
        'hmbrew_#00' => ['alcohol_dx'],

        'coffee_#00' => ['coffee'],
        'vibr_#00' => ['vibrator'],

        'home_def_#00' => ['home_def_plus'],
        'home_box_#00' => ['home_store_plus'],
        'home_box_xl_#00' => ['home_store_plus2'],

        'bandage_#00' => ['bandage'],
        'sport_elec_#00' => ['emt'],

        'jerrycan_#00' => ['jerrycan_1', 'jerrycan_1b', 'jerrycan_2', 'jerrycan_3'],
        'water_cup_part_#00' => ['watercup_1', 'watercup_1b', 'watercup_2', 'watercup_3'],

        'cyanure_#00' => ['cyanide'],

        'repair_one_#00' => ['repair_1'],
        'repair_kit_#00' => ['repair_2'],
        'poison_#00' => ['poison_1'],
        'infect_poison_#00' => ['poison_2'],

        'tagger_#00' => ['zonemarker_1'],
        'radius_mk2_#00' => ['zonemarker_2'],
        'digger_#00' => ['nessquick'],
        'flesh_#00' => ['bomb_1'],
        'flash_#00' => ['bomb_2'],

        'smoke_bomb_#00' => ['smokebomb'],

        'teddy_#00' => ['cuddle_teddy_1'],
        'teddy_#01' => ['cuddle_teddy_2'],

        'cigs_#00' => ['light_cig'],

        'basic_suit_dirt_#00' => ['clean_clothes'], // 'campsite_improve', 'campsite_hide', 'campsite_tomb', 'campsite_unhide', 'campsite_untomb' ],

        'tamed_pet_#00' => ['hero_tamer_1', 'hero_tamer_1b', 'hero_tamer_3'],
        'tamed_pet_drug_#00' => ['hero_tamer_2', 'hero_tamer_2b'],

        'surv_book_#00' => ['hero_surv_1', 'hero_surv_2'],

        'vest_off_#00' => ['hero_hunter_1', 'hero_hunter_2'],

        'door_#00' => ['improve'],
        'plate_#00' => ['improve'],
        'trestle_#00' => ['improve'],
        'bed_#00' => ['improve'],
        'wood_plate_#00' => ['improve'],
        'out_def_#00' => ['improve'],
        'table_#00' => ['improve'],

        'soul_blue_#00' => ["purify_soul"],
        'soul_red_#00' => ["purify_soul"],
        'soul_blue_#01' => ['purify_soul'],

        'photo_3_#00' => ['flash_photo_3'],
        'photo_2_#00' => ['flash_photo_2'],
        'photo_1_#00' => ['flash_photo_1'],

        'omg_this_will_kill_you_#00' => ['water_no_effect'],
        'christmas_candy_#00' => ['drug_rand_xmas'],
        'sand_ball_#00' => ['throw_sandball'],

        'flare_#00' => ['flare'],

        'alarm_off_#00' => ['alarm_clock'],

        'pumpkin_on_#00' => ['pumpkin'],
    ],

    'items_nw' => [
        'can_open_#00' => 'nw_destroy',
        'pilegun_#00' => 'nw_empty_pilegun',
        'taser_#00' => 'nw_empty_taser',
        'mixergun_#00' => 'nw_empty_mixergun',
        'chainsaw_#00' => 'nw_empty_chainsaw',
        'lawn_#00' => 'nw_break',
        'wrench_#00' => 'nw_break',
        'screw_#00' => 'nw_break',
        'staff_#00' => 'nw_empty_staff',
        'knife_#00' => 'nw_break',
        'cutcut_#00' => 'nw_break',
        'small_knife_#00' => 'nw_break',
        'swiss_knife_#00' => 'nw_break',
        'cutter_#00' => 'nw_break',
        'cart_#00' => 'nw_destroy',
        'can_opener_#00' => 'nw_break',
        'chair_#00' => 'nw_destroy',
        'bed_#00' => 'nw_destroy',
        'lamp_#00' => 'nw_destroy',
        'carpet_#00' => 'nw_destroy',
        'engine_#00' => 'nw_destroy',
        'pet_chick_#00' => 'nw_meat',
        'pet_pig_#00' => 'nw_meat',
        'pet_rat_#00' => 'nw_meat',
        'pet_cat_#00' => 'nw_meat_tasty',
        'pet_snake_#00' => 'nw_meat_tasty',
        'vibr_#00' => 'nw_empty_dildo',
        'meat_#00' => 'nw_destroy',
        'undef_#00' => 'nw_destroy',
        'sheet_#00' => 'nw_destroy',
        'grenade_#00' => 'nw_destroy',
        'hmeat_#00' => 'nw_destroy',
        'bgrenade_#00' => 'nw_destroy',
        'chest_#00' => 'nw_destroy',
        'chest_xl_#00' => 'nw_destroy',
        'chest_tools_#00' => 'nw_destroy',
        'lamp_on_#00' => 'nw_destroy',
        'music_#00' => 'nw_destroy',
        'radio_on_#00' => 'nw_destroy',
        'door_#00' => 'nw_destroy',
        'watergun_opt_3_#00' => 'nw_empty_watergun_opt',
        'watergun_opt_2_#00' => 'nw_empty_watergun_opt',
        'watergun_opt_1_#00' => 'nw_empty_watergun_opt',
        'big_pgun_#00' => 'nw_empty_big_pgun',
        'flare_#00' => 'nw_destroy',
        'chair_basic_#00' => 'nw_break',
        'bone_meat_#00' => 'nw_destroy',
        'bone_#00' => 'nw_break',
        'deco_box_#00' => 'nw_destroy',
        'trestle_#00' => 'nw_destroy',
        'table_#00' => 'nw_destroy',
        'machine_1_#00' => 'nw_break',
        'machine_2_#00' => 'nw_break',
        'machine_3_#00' => 'nw_break',
        'chain_#00' => 'nw_break',
        'dish_#00' => 'nw_destroy',
        'dish_tasty_#00' => 'nw_destroy',
        'home_box_xl_#00' => 'nw_destroy',
        'home_box_#00' => 'nw_destroy',
        'watergun_3_#00' => 'nw_empty_watergun',
        'watergun_2_#00' => 'nw_empty_watergun',
        'watergun_1_#00' => 'nw_empty_watergun',
        'watergun_opt_5_#00' => 'nw_empty_watergun_opt',
        'watergun_opt_4_#00' => 'nw_empty_watergun_opt',
        'pilegun_up_#00' => 'nw_empty_pilegun_up',
        'car_door_#00' => 'nw_destroy',
        'torch_#00' => 'nw_empty_torch',
        'torch_off_#00' => 'nw_break',
        'pc_#00' => 'nw_break',
        'water_can_1_#00' => 'nw_empty_watercan',
        'water_can_2_#00' => 'nw_empty_watercan',
        'water_can_3_#00' => 'nw_empty_watercan',
        'iphone_#00' => 'nw_empty_phone',
        'boomfruit_#00' => 'nw_destroy',
        'rlaunc_#00' => 'nw_destroy',
        'kalach_#00' => 'nw_empty_kalach',
        'bureau_#00' => 'nw_destroy',
        'distri_#00' => 'nw_destroy',
        'renne_#00' => 'nw_destroy',
        'paques_#00' => 'nw_destroy',
        'badge_#00' => 'nw_destroy',
        'claymo_#00' => 'nw_destroy',
        'guitar_#00' => 'nw_break',
        'chkspk_#00' => 'nw_destroy',
    ],

    'message_keys' => [
        'water_drink' => 'Du trinkst deine Wasserration in einem Zug aus. Ah! Das tut gut!',
        'escort_water_drink' => 'Der Bürger hat das Wasser in einem Zug ausgetrunken. Das tut gut!',
        'water_drink_dehydration' => 'Gierig schluckst du deine Wasserration runter, ohne auch nur einen Tropfen zu verschwenden... Die Zunge klebt dir noch immer am Gaumen und dein Hals ist noch genauso trocken wie vorher. Du hast deinen Verdurstungstod erfolgreich verhindert.{hr}<strong>Da du davor schon dehydriert warst, hast du keine neuen APs erhalten.</strong>',
        'escort_water_drink_dehydration' => 'Gierig schluckt dieser Bürger seine Wasserration runter, ohne auch nur einen Tropfen zu verschwenden... Seine Zunge klebt ihm noch immer am Gaumen und sein Hals ist noch genauso trocken wie vorher.{hr}<strong>Da er davor schon dehydriert warst, hat er keine neuen APs erhalten.</strong>',
        'water_drink_ghoul' => 'Gierig schluckst du deine Wasserration runter, ohne auch nur einen Tropfen zu verschwenden: aber das Ergebnis ist nicht, was du erwartet hast... Ohne Vorwarnung beginnt deine Kehle fürchterlich zu brennen und verursacht einen fürchterlich schmerzhaften Husten! Die sinkst auf die Knie und schnappst nach Luft. Als Ghul kannst du nicht länger Wasser konsumieren: <strong>du bist nun verletzt</strong>.',
        'water_to_well' => 'Du hast den Inhalt des {item} in den Brunnen geschüttet. Der Brunnen wurde um {well} Rationen Wasser aufgefüllt..',

        'escort_food_eat' => 'Du befielst diesem Bürger sich zu <strong>stärken</strong>, damit ihr gemeinsam weiterziehen könnt. Er ist einverstanden und holt eine(e,n) {item} aus seinem Sack... Ihr macht ne kleine Brotzeit...{hr}{user} hat seine AP aufgefüllt!',

        'container_open_tool' => 'Du hast mit dem(r) {item_tool} ein(e) {item_from} geöffnet und darin folgenden Gegenstand gefunden: {item_to}.',
        'container_open_weapon' => 'Du hast ein(e) {item_from} mit einer(m) {item_tool} zerstört. In den Resten auf dem Boden findest du: {item_to}.',
        'container_open' => 'Du hast ein(e) {item_from} geöffnet und darin folgenden Gegenstand gefunden: {items_spawn}.',
        'container_open_not_empty' => 'Du hast ein(e) {item_from} geöffnet und darin folgenden Gegenstand gefunden: {items_spawn}.{hr}Die Kiste ist nicht leer...',
        'container_open_empty' => 'Du hast ein(e) {item_from} geöffnet und darin folgenden Gegenstand gefunden: {items_spawn}.{hr}{item_from} ist <strong>leer</strong>.',
        'container_open_cbox' => 'Verloren inmitten einer lächerlichen Menge sinnloser Dokumente hast du einen {item_to} entdeckt.',
        'container_optional' => '<nt-spawned>Trotz aller Anstrengungen ist es dir nicht gelungen, den {item} zu öffnen...</nt-spawned><t-spawned>Du hast die {item} geöffnet und darin {items_spawn} gefunden!</t-spawned>',

        'drug_no_use' => 'Du hast {item} eingenommen, verspürst aber keine nennenswerte Wirkung... Vielleicht hast du das gar nicht gebraucht?',
        'drug_no_use_2' => 'Du nimmst das {item} ein, aber es scheint keinen Effekt zu haben... Vielleicht hast du das gar nicht gebraucht?',
        'drug_no_use_3' => 'Merkwürdig... anscheinend ist der erwartete Effekt ausgeblieben. Du sagst dir selbst, das dies eine unglaubliche Chance ist...',
        'drug_xanax' => 'Die Droge zeigt sofort Wirkung: Du bist auf einmal ganz <strong>ruhig</strong> geworden, so ausgeglichen... Die schrecklichen Ereignisse der letzten Tage erscheinen dir plötzlich bedeutungslos und ganz weit weg... Es geht dir schon viel besser.',
        'drug_para' => 'Das {item} beginnt rasch zu wirken. Das Fieber klingt ab, dein Herz beginnt wieder in einem halbwegs normalen Takt zu schlagen... Du warst nicht weit von einem schrecklichen Tod entfernt.',
        'drug_normal_ap' => 'Die Nebenwirkungen der Droge lassen nicht lange auf sich warten: Übelkeit, Zittern, Schweißausbrüche, das ganze Programm... Gleichzeitig spürst du jedoch einen <strong>unglaublichen Kraftschub</strong>. Übertreibe es aber nicht!',
        'drug_twin_ap' => 'So \'ne Quali bekommt man nicht jeden Tag in die Finger! Sicher, Übelkeit, Zittern und Schweißausbrüche hast du auch damit bekommen, aber die Wirkung ist weitaus stärker als bei \'ner normalen Droge (Du hast einen <strong>AP Bonus</strong> erhalten)... Übertreibe es aber nicht!',
        'drug_hyd' => 'Kaum hast du deine Pille geschluckt, da verschwindet auch schon dein Durst. Hoffen wir mal, das alles gut geht...',
        'drug_no_effect' => 'Du schluckst die {item} hinunter. Nach einigen Minuten beginnt dein Kopf zu pochen und deine Nase beginnt zu bluten. Der Schmerz ist nicht unerträglich, aber er ist ziemlich unangenehm...',
        'drug_addict_ap' => 'Sofort bereust du, dieses {item} heruntergeschluckt zu haben... Das Produkt entpuppt sich als ein starkes Steroid für Tiere (die Art, die üblicherweise Pferden verabreicht wird). Deine APs wurden wiederhergestellt, aber du bist ab sofort <strong>drogenabhängig</strong>!',
        'drug_terror' => 'Du schluckst das {item}... Nur ein paar Sekunden später ergreift dich die Panik... Kalte Schweißausbrüche, Paranoia... Du rollst dich zu einem Ball zusammen, außer Atem, und wartest darauf, dass die Wirkung nachlässt... aber das passiert nicht.<hr />Du bist <strong>vor Angst erstarrt</strong>.',

        'item_load' => 'Du hast eine {items_consume} in dein/e/n {item_from} eingelegt und {item_to} erhalten!',
        'item_fill' => 'Du hast eine {items_consume} in dein/e/n {item_from} gefüllt und {item_to} erhalten!',
        'item_clean' => 'Du hast den Inhalt des {item} gereinigt und {items_spawn} erhalten.',
        'item_clean_watercup' => 'Du hast {items_consume_1} verwendet, um das Wasser in {item_from} zu reinigen. Du hast {items_spawn} erhalten...',

        'weapon_use' => '<t-kill-latest>Du hast alle Zombies in dieser Zone mit dieser Waffe umgebracht: {item} ! Entspann dich mal... oder vielleicht besser nicht?</t-kill-latest><nt-kill-latest>Du hast mit dieser Waffe: {item} {kills} Zombie getötet. Ha! Ha! Ha! Das tut wirklich gut, ab und zu mal ein paar Zombies fertig zu machen...</nt-kill-latest>',
        'battery_use' => 'Die Waffe hat <strong>keine Batterie mehr</strong>.',
        'battery_dropped' => 'Die Batterie fällt ein paar Meter entfernt auf den Boden.',
        'battery_destroyed' => 'Die Batterie wurde beim Aufprall vollständig zerstört.',
        'throw_animal' => '<t-consumed>Du hetzt das/den/die {item} auf einen Zombie. Der Untote greift sich deinen tierischen Begleiter, zerquetscht es mit seinen Griffen und würgt es ganz langsam herunter... Dumm gelaufen.. aber wenigstens hast ihn damit eine Zeit lang beschäftigt...</t-consumed><nt-consumed>Dein Tier <strong>geht einem Zombie sofort an die Gurgel</strong> und reißt sich ein paar schöne Happen! Bravo!</nt-consumed>',

        'read_blueprint' => '<t-bp_ok>Du liest den {item} und stellst fest, dass es sich um einen Plan für {bp_spawn} handelt.</t-bp_ok><t-bp_parent>{hr}Dafür ist das Bauprojekt {bp_parent} nötig.</t-bp_parent><t-bp_fail>Du versuchst den {item} zu lesen, kannst seinen Inhalt aber nicht verstehen ...</t-bp_fail>',

        'use_lab' => 'Du zermahlst den Inhalt von {items_consume} auf dem Tisch und mischst ihn mit allem, was dir in die Hände fällt... und lässt ihn dann ziehen.',
        'use_lab_fail' => 'Der verdächtige Rauch, der aus der Mischung austritt, deutet darauf hin, dass <strong>nicht alles so gelaufen ist wie geplant</strong>. Du hast eine zufällige Droge erhalten: {items_spawn}',
        'use_lab_success' => 'Ein überragender Erfolg: Du hast {items_spawn} erhalten!',
        'use_kitchen' => 'In deiner Küche hast du {items_consume} in {items_spawn} umgewandelt.',
        'use_butcher' => 'Der Metzger hat sich gut um {item} gekümmert... Dafür hast du nun {items_spawn} erhalten. Auf wiedersehen, mein Freund!',
        'use_bed' => 'Du versuchst dich ein paar Minuten auszuruhen.<t-ap-up>Nach einer kurzen Pause fühlst du dich nun viel besser. Du hast 2 AP erhalten !</t-ap-up><nt-ap-up>Leider bekommst du kein Auge zu: Der Gedanke an heute Abend, deinen Tod, sowie deine geringen Überlebenschancen lassen dir keine Ruhe...</nt-ap-up>',

        'escape_item' => '<t-escape>Mithilfe der {item} hast du dir etwas Zeit erkauft ... du solltest diesen Ort schnell verlassen!</t-escape><t-reverse-escape>Du setzt {item} in Gang. Ein gewaltiger Blitz schießt heraus, mitten in die Reihen der Zombies! Geblendet ergreifen {zombies} Zombies die Flucht.</t-reverse-escape>',
        'escape_item_camera' => '<nt-any-escape>Ein stumpfes Klicken ertönt und ein wenig grünlicher Rauch entschwebt der {item} ...</nt-any-escape><t-escape>Du setzt {item} in Gang. Ein gewaltiger Blitz schießt heraus, mitten in die Reihen der Zombies! Geblendet stolpern sie umher und sind nicht länger in der Lage, dich zu finden.</t-escape><t-reverse-escape>Du setzt {item} in Gang. Ein gewaltiger Blitz schießt heraus, mitten in die Reihen der Zombies! Geblendet ergreifen {zombies} Zombies die Flucht.</t-reverse-escape>',

        'heroic_arma_tooltip' => 'Du hast die Chance, 1 Zombie in der Zone zu töten; wenn du erfolgreich bist, erhältst du die Kontrolle über die Zone für 10 Minuten.<br /><em>Angesichts des <strong>Armageddon</strong> kannst du diese Spezialaktion <strong>einmal pro Spiel</strong> durchführen.</em>',
        'heroic_arma_fail' => 'Du versuchst dich einem Zombie zu nähern, aber <strong>der Zombie reißt dir fast das Gesicht mit seinen Zähnen ab</strong>! Unmöglich zu bestehen...',
        'heroic_arma_success' => 'Du rennst schreiend in den ersten Zombie in Reichweite! Mit einem kraftvollen, gut angepassten Schulterschlag <strong>schickst du ihn ein paar Meter weiter in den Staub</strong>...{hr}Du kannst diese Gelegenheit zur Flucht nutzen!',

        'home_heal_wound' => 'Deine Wunde wurde geheilt, zumindest oberflächlich...',
        'home_heal_infect' => 'Deine unselige Infektion wurde kuriert!',

        'item_needed_generic' => 'Du benötigst {items_required}.',
        'water_purification_impossible' => 'Um dieses Wasser trinkbar zu machen, brauchst du <strong>irgendein Reinigungsmittel</strong> oder deine Stadt muss über einen <strong>Wasserreiniger</strong> verfügen. Die zweite Variante ist nicht verfügbar, wenn Du verbannt bist.',
        'once_a_day' => 'Du kannst diesen Gegenstand nur <strong>einmal am Tag</strong> verwenden...',
        'already_full_ap' => 'Du hast bereits volle AP.',
        'already_full_ap_drink' => 'Du brauchst im Moment <strong>nichts trinken</strong>, da du nicht müde bist und noch alle deine Aktionspunkte hast.',

        'pt_required' => 'Hierfür brauchst du mindestens {pt_min} {pt_name}.',

        'eat_human_meat' => '<nt-stat-up-infection><nt-role-up-ghoul>Nach ein paar Sekunden spürst du den furchtbaren Nachgeschmack...</nt-role-up-ghoul></nt-stat-up-infection>',
        'eat_human_meat_ghoul' => 'Es ist nicht so appetitlich wie ein <strong>schöner, frischer, zappelnder Mensch</strong>, aber es erfüllt seinen Zweck und lässt den <strong>Hunger</strong> ein wenig nachlassen.... Zum Glück ist das Fleisch ziemlich zart, sonst wäre diese Mahlzeit furchtbar gewesen.<hr/>Nach ein paar Sekunden spürst du den furchtbaren Nachgeschmack...',

        'not_in_event' => 'Dir fällt kein Grund ein, dies zu tun...'
    ],
];

$complete_heroic;
foreach ($actions['heroics'] as &$heroic) {
    $annexe_heroic = $actions['actions'][$heroic['name']];
    $complete_heroic[$heroic['name']] = [
        'name' => $heroic['name'],
        'title' => $annexe_heroic['label'],
        'description' => $annexe_heroic['tooltip'],
        'daysNeeded' => 0
    ];
}

$new_actions = json_encode($actions['actions'], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
$filename_actions_target = '../../MyHordesOptimizerApi/MyHordesOptimizerApi/Data/Items/actions.json';
file_put_contents($filename_actions_target, $new_actions);

$new_items_actions = json_encode($actions['items'], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
$filename_items_actions_target = '../../MyHordesOptimizerApi/MyHordesOptimizerApi/Data/Items/item-actions.json';
file_put_contents($filename_items_actions_target, $new_items_actions);

$new_items_nw = json_encode($actions['items_nw'], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
$filename_items_nw_target = '../../MyHordesOptimizerApi/MyHordesOptimizerApi/Data/Items/items-nightwatch.json';
file_put_contents($filename_items_nw_target, $new_items_nw);

$new_meta_results = json_encode($actions['meta_results'], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
$filename_meta_results_target = '../../MyHordesOptimizerApi/MyHordesOptimizerApi/Data/Items/meta-results.json';
file_put_contents($filename_meta_results_target, $new_meta_results);

$new_heroics = json_encode($complete_heroic, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
$filename_powers_target = '../../MyHordesOptimizerApi/MyHordesOptimizerApi/Data/Heroes/powers.json';
file_put_contents($filename_powers_target, $new_heroics);

$new_specials = json_encode($actions['specials'], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
$filename_specials_target = '../../MyHordesOptimizerApi/MyHordesOptimizerApi/Data/Heroes/specials.json';
file_put_contents($filename_specials_target, $new_specials);

?>
