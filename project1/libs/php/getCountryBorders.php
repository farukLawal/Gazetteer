<?php

    $countryCode = $_REQUEST['iso'];
    $executionStartTime = microtime(true);
    
    $countryData = json_decode(file_get_contents("countryBorders.geo.json"), true);

    $border;

    foreach ($countryData['features'] as $feature) {
        if ($feature['properties']['iso_a2'] == $countryCode ) {
            $border['name'] = $feature["properties"]['name'];
            $border['geometry'] = $feature["geometry"];  
        };
    };

   
    $output['status']['code'] = "200";
    $output['status']['name'] = "ok";
    $output['status']['description'] = "success";
    $output['status']['executedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
    $output['data'] = $border;

    header('Content-Type: application/json; charset=UTF-8');


    echo json_encode($output);

?>