<?php

	ini_set('display_errors', 'On');
	error_reporting(E_ALL);

	$executionStartTime = microtime(true);

    $lat = $_REQUEST['lat'];
	$lng = $_REQUEST['lng'];

    $url='https://api.openweathermap.org/data/2.5/weather?lat=' . $lat . '&lon=' . $lng . '&lang=en&units=metric&appid=d271a5e70ad0c8777f5336fa89d786d6';
    

    $ch = curl_init();
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_URL,$url);

	$result=curl_exec($ch);

	curl_close($ch);

	$decode = json_decode($result,true);	

	$output['status']['code'] = "200";
	$output['status']['name'] = "ok";
	$output['status']['description'] = "success";
	$output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
	$output['data'] = $decode;

    //added extra outputs geonames, openweather, etc..
	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output); 

?>