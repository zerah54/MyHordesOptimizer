<?php
// INCLUDE 'https://gitlab.com/eternaltwin/myhordes/myhordes/-/blob/master/packages/myhordes-fixtures/src/Service/RecipeDataService.php';

// $filename_source = 'https://gitlab.com/eternaltwin/myhordes/myhordes/-/blob/master/packages/myhordes-fixtures/src/Service/RecipeDataService.php';

// echo($data);

$recipes = [
    'ws001' => ['type' => 'Recipe::WorkshopType', 'in' => 'repair_kit_part_#00', 'out' => 'repair_kit_#00', 'action' => 'Wandeln'],
    'ws002' => ['type' => 'Recipe::WorkshopType', 'in' => 'can_#00',             'out' => 'can_open_#00', 'action' => 'Öffnen'],
    'ws003' => ['type' => 'Recipe::WorkshopType', 'in' => 'plate_raw_#00',       'out' => 'plate_#00', 'action' => 'Wandeln'],
    'ws004' => ['type' => 'Recipe::WorkshopType', 'in' => 'wood_log_#00',        'out' => 'wood2_#00', 'action' => 'Wandeln'],
    'ws005' => ['type' => 'Recipe::WorkshopType', 'in' => 'wood_bad_#00',        'out' => 'wood2_#00', 'action' => 'Wandeln'],
    'ws006' => ['type' => 'Recipe::WorkshopType', 'in' => 'wood2_#00',           'out' => 'wood_beam_#00', 'action' => 'Wandeln'],
    'ws007' => ['type' => 'Recipe::WorkshopType', 'in' => 'wood_beam_#00',       'out' => 'wood2_#00', 'action' => 'Wandeln'],
    'ws008' => ['type' => 'Recipe::WorkshopType', 'in' => 'metal_bad_#00',       'out' => 'metal_#00', 'action' => 'Wandeln'],
    'ws009' => ['type' => 'Recipe::WorkshopType', 'in' => 'metal_#00',           'out' => 'metal_beam_#00', 'action' => 'Wandeln'],
    'ws010' => ['type' => 'Recipe::WorkshopType', 'in' => 'metal_beam_#00',      'out' => 'metal_#00', 'action' => 'Wandeln'],
    'ws011' => ['type' => 'Recipe::WorkshopType', 'in' => 'electro_box_#00',     'out' => [ ['pile_#00', 15], ['pilegun_empty_#00', 16], ['electro_#00', 23], ['meca_parts_#00', 18], ['tagger_#00', 14], ['deto_#00', 14] ], 'action' => 'Zerlegen' ],
    'ws012' => ['type' => 'Recipe::WorkshopType', 'in' => 'mecanism_#00',        'out' => [ ['metal_#00', 51], ['tube_#00', 9], ['metal_bad_#00', 8], ['meca_parts_#00', 32] ], 'action' => 'Zerlegen' ],
    'ws013' => ['type' => 'Recipe::WorkshopType', 'in' => 'chest_#00',           'out' => [ ['drug_#00', 16], ['bandage_#00', 28], /*['vodka_de_#00', 20],*/ ['vodka_#00', 20], ['explo_#00', 8], ['lights_#00', 4], ['drug_hero_#00', 16], ['rhum_#00', 8] ], 'action' => 'Öffnen' ],
    'ws014' => ['type' => 'Recipe::WorkshopType', 'in' => 'chest_xl_#00',        'out' => [ ['watergun_opt_part_#00', 19], ['pilegun_upkit_#00', 10], ['pocket_belt_#00', 12], ['cutcut_#00', 10], ['chainsaw_part_#00', 12], ['mixergun_part_#00', 19], ['big_pgun_part_#00', 7], ['lawn_part_#00', 12] ], 'action' => 'Öffnen' ],
    'ws015' => ['type' => 'Recipe::WorkshopType', 'in' => 'chest_tools_#00',     'out' => [ ['pile_#00', 12], ['meca_parts_#00', 17], ['rustine_#00', 13], ['tube_#00', 13], ['pharma_#00', 25], ['explo_#00', 19] ], 'action' => 'Öffnen' ],
    'ws016' => ['type' => 'Recipe::WorkshopType', 'in' => 'chest_food_#00',      'out' => [ ['food_bag_#00', 8], ['can_#00', 11], ['meat_#00', 7], ['hmeat_#00', 13], ['vegetable_#00', 8] ], 'action' => 'Öffnen' ],
    'ws017' => ['type' => 'Recipe::WorkshopType', 'in' => 'deco_box_#00',        'out' => [ ['door_#00', 44], ['chair_basic_#00', 60], ['trestle_#00', 35], ['table_#00', 35], ['chair_#00', 46] ], 'action' => 'Wandeln' ],
    'ws018' => ['type' => 'Recipe::WorkshopType', 'in' => 'catbox_#00',          'out' => [ 'poison_part_#00', 'pet_cat_#00', 'angryc_#00' ], 'action' => 'Öffnen' ],
    'ws019' => ['type' => 'Recipe::WorkshopType', 'in' => 'prints_#00',          'out' => 'magneticKey_#00', 'action' => 'Wandeln' ],   // Magnetic key
    'ws020' => ['type' => 'Recipe::WorkshopType', 'in' => 'prints_#01',          'out' => 'bumpKey_#00', 'action' => 'Wandeln' ],       // Bump key
    'ws021' => ['type' => 'Recipe::WorkshopType', 'in' => 'prints_#02',          'out' => 'classicKey_#00', 'action' => 'Wandeln' ],    // Bottle Opener key
    'ws023' => ['type' => 'Recipe::WorkshopType', 'in' => 'food_xmas_#00',       'out' => 'wood_xmas_#00', 'action' => 'Wandeln' ],    // Chocolate log food
    'ws024' => ['type' => 'Recipe::WorkshopType', 'in' => 'noodle_prints_#00',   'out' => 'magneticKey_#00', 'action' => 'Wandeln' ],   // Magnetic key
    'ws025' => ['type' => 'Recipe::WorkshopType', 'in' => 'noodle_prints_#01',   'out' => 'bumpKey_#00', 'action' => 'Wandeln' ],       // Bump key
    'ws026' => ['type' => 'Recipe::WorkshopType', 'in' => 'noodle_prints_#02',   'out' => 'classicKey_#00', 'action' => 'Wandeln' ],    // Bottle Opener key
    // Do not rename ws030!
    'ws030' => ['type' => 'Recipe::WorkshopType', 'provoking' => 'wood_log_#00',    'in' => ['wood_log_#00', 'knife_#00', 'rustine_#00' ], 'out' => 'saw_tool_temp_#00', 'action' => 'Wandeln' ], //Makeshift Hacksaw

    // Shaman Specific recipes
    'ws022' => ['type' => 'Recipe::WorkshopTypeShamanSpecific', 'in' => 'soul_blue_#00',      'out' => 'soul_yellow_#00', 'action' => 'Wandeln', "picto"=> "r_mystic2_#00" ],

    //Technicians workbench Specific recipes
    'ws027' => ['type' => 'Recipe::WorkshopTypeTechSpecific', 'provoking' => 'meca_parts_#00',    'in' => ['meca_parts_#00', 'plate_#00', 'plate_#00' ],                                      'out' => 'car_door_#00', 'action' => 'Wandeln' ], //Car door
    'ws028' => ['type' => 'Recipe::WorkshopTypeTechSpecific', 'provoking' => 'cutter_#00',        'in' => ['pet_snake2_#00', 'pet_snake2_#00', 'cutter_#00', 'wood2_#00', 'wire_#00' ],       'out' => 'sheet_#00', 'action' => 'Wandeln' ], //Groundsheet
    'ws029' => ['type' => 'Recipe::WorkshopTypeTechSpecific', 'provoking' => 'bone_meat_#00',     'in' => ['bone_meat_#00', 'poison_part_#00' ],                                              'out' => ['bone_#00', 'smelly_meat_#00'], 'multi_out' => true, 'action' => 'Wandeln' ], //Broken human bone + Festering Flesh

    //Manual transformations recipes
    'com001' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'coffee_machine_#00',     'provoking' => 'coffee_machine_part_#00','in' => ['coffee_machine_part_#00', 'cyanure_#00', 'electro_#00', 'meca_parts_#00', 'rustine_#00', 'metal_#00', 'tube_#00' ] ],
    'com002' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'music_#00',              'provoking' => 'music_part_#00',         'in' => ['music_part_#00', 'pile_#00', 'electro_#00'] ],
    'com003' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'guitar_#00',             'provoking' => 'staff2_#00',             'in' => ['wire_#00', 'oilcan_#00', 'staff2_#00'] ],
    'com004' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'car_door_#00',           'provoking' => 'car_door_part_#00',      'in' => ['car_door_part_#00', 'meca_parts_#00', 'rustine_#00', 'metal_#00'] ],
    'com005' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'torch_#00',              'provoking' => 'lights_#00',             'in' => ['lights_#00', 'wood_bad_#00'] ],
    'com006' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'wood_plate_#00',         'provoking' => 'wood_plate_part_#00',    'in' => ['wood_plate_part_#00', 'wood2_#00'] ],
    'com007' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'concrete_wall_#00',      'provoking' => 'concrete_#00',           'in' => ['concrete_#00', 'water_#00'] ],
    'com008' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'chama_tasty_#00',        'provoking' => 'chama_#00',              'in' => ['chama_#00', 'torch_#00'], 'keep' => ['torch_#00'], 'tooltip' => 'Du hast {item_list} in {item} verwandelt.' ],
    'com009' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'food_noodles_hot_#00',   'provoking' => 'food_noodles_#00',       'in' => ['food_noodles_#00', 'spices_#00', 'water_#00'] ],
    'com010' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'coffee_#00',             'provoking' => 'coffee_machine_#00',     'in' => ['pile_#00', 'pharma_#00', 'wood_bad_#00'] ],

    'com011' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'watergun_opt_empty_#00', 'provoking' => 'watergun_opt_part_#00',  'in' => ['watergun_opt_part_#00', 'tube_#00', 'deto_#00', 'grenade_empty_#00', 'rustine_#00' ], "picto"=> "r_watgun_#00"],
    'com012' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'pilegun_up_empty_#00',   'provoking' => 'pilegun_upkit_#00',      'in' => ['pilegun_upkit_#00', 'pilegun_empty_#00', 'meca_parts_#00', 'electro_#00', 'rustine_#00' ] ],
    'com013' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'mixergun_empty_#00',     'provoking' => 'mixergun_part_#00',      'in' => ['mixergun_part_#00', 'meca_parts_#00', 'electro_#00', 'rustine_#00' ] ],
    'com014' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'jerrygun_#00',           'provoking' => 'jerrygun_part_#00',      'in' => ['jerrygun_part_#00', 'jerrycan_#00', 'rustine_#00' ], "picto"=> "r_watgun_#00"],
    'com015' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'chainsaw_empty_#00',     'provoking' => 'chainsaw_part_#00',      'in' => ['chainsaw_part_#00', 'engine_#00', 'meca_parts_#00', 'courroie_#00', 'rustine_#00' ], 'picto' => 'r_tronco_#00' ],
    'com016' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'bgrenade_empty_#00',     'provoking' => 'deto_#00',               'in' => ['explo_#00', 'grenade_empty_#00', 'deto_#00', 'rustine_#00' ] ],
    'com017' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'lawn_#00',               'provoking' => 'lawn_part_#00',          'in' => ['lawn_part_#00', 'meca_parts_#00', 'metal_#00', 'rustine_#00' ] ],
    'com018' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'flash_#00',              'provoking' => 'powder_#00',             'in' => ['powder_#00', 'grenade_empty_#00', 'rustine_#00' ] ],
    'com019' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'big_pgun_empty_#00',     'provoking' => 'big_pgun_part_#00',      'in' => ['big_pgun_part_#00', 'meca_parts_#00', 'courroie_#00' ], 'picto' => 'r_batgun_#00' ],

    'com020' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'cart_#00',               'provoking' => 'cart_part_#00',          'in' => ['cart_part_#00', 'rustine_#00', 'metal_#00', 'tube_#00' ] ],
    'com021' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'poison_#00',             'provoking' => 'poison_part_#00',        'in' => ['poison_part_#00', 'pile_#00', 'pharma_#00' ] ],
    'com022' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'flesh_#00',              'provoking' => 'flesh_part_#00',         'in' => ['flesh_part_#00', 'flesh_part_#00' ], "picto"=> "r_solban_#00", "stealthy" => true ],
    'com023' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'saw_tool_#00',           'provoking' => 'saw_tool_part_#00',      'in' => ['saw_tool_part_#00', 'rustine_#00', 'meca_parts_#00' ] ],
    'com024' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'engine_#00',             'provoking' => 'engine_part_#00',        'in' => ['engine_part_#00', 'rustine_#00', 'meca_parts_#00', 'metal_#00', 'deto_#00', 'bone_#00' ] ],
    'com025' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'repair_kit_#00',         'provoking' => 'repair_kit_part_raw_#00','in' => ['repair_kit_part_raw_#00', 'rustine_#00', 'meca_parts_#00', 'wood2_#00' ] ],
    'com026' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'fruit_part_#00',         'provoking' => 'fruit_sub_part_#00',     'in' => ['fruit_sub_part_#00', 'fruit_sub_part_#00' ], "picto"=> "r_solban_#00", "stealthy" => true ],

    /** Do not change the name of com27! */
    'com027' => ['type' => 'Recipe::ManualAnywhere', 'out' => [ ['drug_#00', 42], ['xanax_#00', 40], ['drug_random_#00', 46], ['drug_water_#00', 46], ['water_cleaner_#00', 43], ['drug_hero_#00', 49] ], 'provoking' => 'pharma_#00', 'in' => ['pharma_#00', 'pharma_#00' ] ],
    'com028' => ['type' => 'Recipe::ManualAnywhere', 'out' => [ ['drug_#00', 1], ['xanax_#00', 1], ['drug_random_#00', 2], ['drug_water_#00', 2], ['water_cleaner_#00', 1], ['pharma_#00', 7] ], 'provoking' => 'pharma_part_#00', 'in' => ['pharma_part_#00', 'pharma_part_#00' ], "picto"=> "r_solban_#00", "stealthy" => true ],

    'com029' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'trapma_#00',               'provoking' => 'claymo_#00',            'in' => ['claymo_#00','door_carpet_#00'] ],
    'com030' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'claymo_#00',               'provoking' => 'wire_#00',              'in' => ['wire_#00','explo_#00', 'meca_parts_#00', 'rustine_#00'] ],
    'com031' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'scope_#00',                'provoking' => 'lens_#00',              'in' => ['tube_#00', 'lens_#00'] ],
    'com032' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'fungus_#00',               'provoking' => 'ryebag_#00',            'in' => ['ryebag_#00', 'lens_#00'] ],
    'com033' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'lsd_#00',                  'provoking' => 'fungus_#00',            'in' => ['fungus_#00', 'poison_part_#00'] ],
    'com034' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'chkspk_#00',               'provoking' => 'chudol_#00',            'in' => ['chudol_#00', 'lsd_#00'] ],
    'com035' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'fruit_#00',                'provoking' => 'fruit_part_#00',        'in' => ['fruit_sub_part_#00', 'fruit_part_#00'], "picto"=> "r_solban_#00", "stealthy" => true ],
    'com036' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'dfhifi_#00',               'provoking' => 'cdelvi_#00',            'in' => ['cdelvi_#00', 'music_#00'] ],
    'com037' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'hifiev_#00',               'provoking' => 'cdphil_#00',            'in' => ['cdphil_#00', 'music_#00'] ],
    'com038' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'hifiev_#00',               'provoking' => 'cdbrit_#00',            'in' => ['cdbrit_#00', 'music_#00'] ],
    'com039' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'dfhifi_#01',               'provoking' => 'bquies_#00',            'in' => ['hifiev_#00', 'bquies_#00'] ],
    'com040' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'lpoint4_#00',              'provoking' => 'diode_#00',             'in' => ['wire_#00', 'meca_parts_#00', 'tube_#00', 'maglite_2_#00', 'diode_#00'] ],
    'com041' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'hmbrew_#00',               'provoking' => 'oilcan_#00',            'in' => ['fungus_#00', 'vodka_#00', 'oilcan_#00'] ],
    'com042' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'wood_xmas_#00',            'provoking' => 'food_xmas_#00',         'in' => ['food_xmas_#00', 'can_open_#00'] ],
    'com043' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'gun_#00',                  'provoking' => 'gun_#00',               'in' => ['gun_#00', 'bullets_#00'] ],
    'com044' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'machine_gun_#00',          'provoking' => 'machine_gun_#00',       'in' => ['machine_gun_#00', 'bullets_#00'] ],
    'com045' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'christmas_suit_full_#00',  'provoking' => 'christmas_suit_1_#00',  'in' => ['christmas_suit_1_#00', 'christmas_suit_2_#00', 'christmas_suit_3_#00'] ],
    'com046' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'christmas_suit_full_#00',  'provoking' => 'christmas_suit_2_#00',  'in' => ['christmas_suit_1_#00', 'christmas_suit_2_#00', 'christmas_suit_3_#00'] ],
    'com047' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'christmas_suit_full_#00',  'provoking' => 'christmas_suit_3_#00',  'in' => ['christmas_suit_1_#00', 'christmas_suit_2_#00', 'christmas_suit_3_#00'] ],
    'com048' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'pumpkin_on_#00',           'provoking' => 'pumpkin_off_#00',       'in' => ['pumpkin_off_#00', 'lights_#00', 'pharma_#00'] ],
    'com049' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'angryc_#00',               'provoking' => 'pet_snake2_#00',        'in' => ['pet_snake2_#00', 'cutter_#00'] ],
    'com050' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'pumpkin_off_#00',          'provoking' => 'pumpkin_raw_#00',       'in' => ['pumpkin_raw_#00', 'small_knife_#00'], 'keep' => ['small_knife_#00'] ],
    'com051' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'infect_poison_#00',        'provoking' => 'infect_poison_part_#00','in' => ['infect_poison_part_#00', 'drug_#00', 'pharma_#00', 'water_#00', 'drug_water_#00' ] ],
    'com052' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'bike_#00',                 'provoking' => 'bike_part_#00',         'in' => ['bike_part_#00', 'rustine_#00', 'metal_#00', 'chain_#00' ] ],
    'com053' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'soccer_#00',               'provoking' => 'soccer_part_#00',       'in' => ['soccer_part_#00', 'rustine_#00' ] ],

    'com054' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'moldy_food_part_#00',      'provoking' => 'moldy_food_subpart_#00',  'in' => ['moldy_food_subpart_#00', 'moldy_food_subpart_#00' ] ],
    'com055' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'moldy_food_#00',           'provoking' => 'moldy_food_part_#00',     'in' => ['moldy_food_part_#00', 'moldy_food_subpart_#00' ] ],
    'com056' => ['type' => 'Recipe::ManualAnywhere', 'out' => 'moldy_food_spicy_#00',     'provoking' => 'spices_#00',              'in' => ['moldy_food_subpart_#00', 'spices_#00' ] ],
];

foreach ($recipes as &$recipe) {
    if (!is_array($recipe['in'])) {
        $recipe['in'] = [$recipe['in']];
    }
    if (!is_array($recipe['out'])) {
        $recipe['out'] = [$recipe['out']];
    }
}
$new_recipes = json_encode($recipes, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
$filename_target = '../../MyHordesOptimizerApi/MyHordesOptimizerApi/Data/Items/recipes.json';

file_put_contents($filename_target, $new_recipes)

?>
