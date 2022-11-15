<?php

$possible_offsets = [
    '00' => [],
    '04' => [],
    '08' => [],
    '13' => [],
    '17' => [],
    '21' => [],
    '25' => [],
    '29' => [],
    '33' => [],
    '38' => [],
    '42' => [],
    '46' => [],
    '50' => [],
    '54' => [],
    '58' => [],
    '63' => [],
    '67' => [],
    '71' => [],
    '75' => [],
    '79' => [],
    '83' => [],
    '88' => [],
    '92' => [],
    '96' => [],
    '100' => []
];

$start_possible_offsets_min = [];
for ($i=15; $i <= 36; $i++) {
    $offsets = [
        "offset_min" => $i, 
        "offset_max" => 48 - $i
    ];
    array_push($start_possible_offsets_min, $offsets);
}

$possible_offsets['00'] = $start_possible_offsets_min;

foreach ($possible_offsets as $value) {
    var_dump(json_encode($value));
}


function calculate_offsets(&$offsetMin, &$offsetMax, $nbRound){
    for ($i = 0; $i < min($nbRound, 24); $i++) {
        if ($offsetMin + $offsetMax > 10) {
            $increase_min = $this->random->chance($offsetMin / ($offsetMin + $offsetMax));
            $alter = mt_rand(500, 2000) / 1000.0;
            if ($this->random->chance(0.25)){
                $alterMax = mt_rand(500, 2000) / 1000.0;
                if($offsetMin > 3)
                    $offsetMin -= $alter;
                if($offsetMax > 3)
                    $offsetMax -= $alterMax;
            } else {
                if ($increase_min && $offsetMin > 3) $offsetMin -= $alter;
                elseif ( $offsetMax > 3 ) $offsetMax -= $alter;
            }
        }
    }
}

?>
