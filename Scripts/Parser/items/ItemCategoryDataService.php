<?php

$categories = [
    ["name" => "Rsc", "label" => "Baustoffe", "parent" => null, "ordering" => 0],
    ["name" => "Furniture", "label" => "Einrichtungen", "parent" => null, "ordering" => 1],
    ["name" => "Weapon", "label" => "Waffenarsenal", "parent" => null, "ordering" => 2],
    ["name" => "Box", "label" => "Taschen und Behälter", "parent" => null, "ordering" => 3],
    ["name" => "Armor", "label" => "Verteidigung", "parent" => null, "ordering" => 4],
    ["name" => "Drug", "label" => "Apotheke und Labor", "parent" => null, "ordering" => 5],
    ["name" => "Food", "label" => "Grundnahrungsmittel", "parent" => null, "ordering" => 6],
    ["name" => "Misc", "label" => "Sonstiges", "parent" => null, "ordering" => 7],
];

$new_categories = json_encode($categories, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
$filename_target = '../../../MyHordesOptimizerApi/MyHordesOptimizerApi/Data/Items/categories.json';
file_put_contents($filename_target, $new_categories)

?>