// ------------------------------------------- DOCUMENT READY FUNCTION ------------------------------------------- // 
$(function() {

// Remove the pre-loader when the document is ready
$('select').removeAttr('hidden');

// ------------------------------------------- INITIALISING MAP ------------------------------------------- //

    // Initlizing tile layer variables
    const osm = '<a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>';
    const thunderForestMap = '<a href="http://www.thunderforest.com">Thunderforest</a>';
    const attribution = 'Maps &copy; ' +thunderForestMap+ ', Data &copy; ' +osm;
    const tileLayers = ['atlas', 'cycle', 'landscape', 'neighbourhood',  'outdoors', 'pioneer', 
                        'transport', 'mobile-atlas', 'transport-dark','spinal-map'];

    const baseMaps = {};

    // Creating thunderforest tiles layers
    tileLayers.map(maps =>{
        let tile = 'https://tile.thunderforest.com/' + maps + '/{z}/{x}/{y}.png?apikey=a6188e7fa80c44df99707c2b466d0fc2';
        baseMaps[maps] = L.tileLayer(tile, {attribution});
    });

    // Setting the map view 
    const map = L.map('map', {maxZoom: 17, minZoom: 3, zoomControl: false, layers: baseMaps.cycle}).setView([51, -1], 4);

    //Adding the thunderforest tiles layers to map and dropdown to the topright of the map 
    let layerControl = L.control.layers(baseMaps, null, {position: 'topright'});
    layerControl.addTo(map)

    // Setting the zoom and scale of the map 
    L.control.zoom({position: 'topleft'}).addTo(map);
    L.control.scale().addTo(map);

    // Setting the zoom and scale buttons to the top left of the map 
    L.control.locate({
        position: 'topleft',
        strings: {
            title: "Click to see your location"
        }
    }).addTo(map);

// ------------------------------------------- SELECT GEOLOCATION AND BORDERS ------------------------------------------- //

    // Populating select with countries
    $.ajax({
        url: 'libs/php/populateSelect.php',
        type: 'POST',
        dataType: 'json',
        success: function(result) {
            result['data'].forEach( (feature) => {
                $("<option>", {
                    value: feature.iso_a2,
                    text: feature.name
                }).appendTo("#selectCountry");
            });
        }
    });

    // Getting the location of the user and populates select with their location 
    if (window.navigator.geolocation) {
        window.navigator.geolocation.getCurrentPosition(showLocation);
    } else {
        console.log("Sorry but it looks like you don't have geolocation support");
    }
    
    function showLocation(location) { 
        let latitudeOne = location.coords.latitude
        let longitudeOne = location.coords.longitude

        // Getting the current user location 
        $.ajax({
            url: 'libs/php/userLocation.php',
            type: 'POST',
            dataType: 'json',
            data: {
                latOne: latitudeOne,
                lngOne: longitudeOne
            },
            success: function(result){
                if(result.status.name == "ok"){
                    // Changing the value of the select tag (#selectCountry) to the user's country
                    $('#selectCountry').val(result.data.countryCode).change();

                    // Fading out the pre-loader when the user's country is loaded 
                    $('.preloader').addClass("preloader--hidden");
                    $('.form-container').show();

                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log("ERROR")
            }
        });
    };


    // Adding borders to country selected 
    let Countryborder;

    $('#selectCountry').on('change', () =>{
        let countryIso = $('#selectCountry').val();
        console.log(`Selected Country's ISO_a2 name is ${countryIso}`);

        // Getting the country borders from countryBorders.geo.json and adding it to map
        $.ajax({

            url: "libs/php/getCountryBorders.php",
                type: 'GET',
                dataType: 'json',
                data: {

                    iso: $('#selectCountry').val()

                },
                success: function(result){
                    console.log(result);
                    if(Countryborder != undefined){
                        map.removeLayer(Countryborder);
                    }
                    Countryborder = L.geoJSON(result.data.geometry, {
                        style: () => ({
                            color: "Blue",
                                weight: 2,
                                opacity: 3
                        })
                    }).addTo(map);
                    map.fitBounds(Countryborder.getBounds());
                },error:function(err){
                    console.log(err);
                }
        });    
    });

// ------------------------------------------- MARKERS AND CLUSTERS ------------------------------------------- //

    // Storing cluster group into a variable called overlays
    let overlays = L.markerClusterGroup();


    // Adding the cluster group to the overlay drop down
    layerControl.addOverlay(overlays, "Overlays");


    // Getting the overlay markers based on the country selected
    $('#selectCountry').on('change', () =>{
        overlays.clearLayers();
        $.ajax({
            url: "libs/php/getCoordiates.php",
            type: 'POST',
            dataType: 'json',
            data: {
                countryCord: $('#selectCountry').val()
            },
            success: function (result) {

                // Storing the coordiates in their respective variables 
                let north = result.data.geonames[0].north;
                let east = result.data.geonames[0].east;
                let south = result.data.geonames[0].south;
                let west = result.data.geonames[0].west;

                // Webcam Markers 
                $.ajax({
                    url: "libs/php/webcamMarkers.php",
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        webcamCountry: $('#selectCountry').val()
                    },
        
                    success: function (result) {
                        if (result.status.name == "ok") {
        
                            let camResult = result.data.result.webcams
        
                            for (let i = 0; i < camResult.length; i++) {
                                let lat = result.data.result.webcams[i].location.latitude;
                                let lng = result.data.result.webcams[i].location.longitude;
                                let title = result.data.result.webcams[i].title;
                                let webcam = result.data.result.webcams[i].player.day.embed;
        
        
                                let redMarker = L.ExtraMarkers.icon({
                                    icon: 'fa-solid fa-video',
                                    markerColor: 'orange',
                                    iconColor: 'white',
                                    shape: 'square',
                                });
        
                                let webcams = L.marker([lat,lng], {icon: redMarker});
        
                                webcams.bindPopup('<b>' + title + '</b><br>'
                                                        + '(' + lat.toFixed(4) + ', ' + lng.toFixed(4) + ')<hr class="m-2">'
                                                        + `<div class="webcam"><iframe title="${title} webcam" src=${webcam}></iframe><div>`
                                                        , {'className' : 'custom-windy-popup'});
        
                                                        overlays.addLayer(webcams);
                                                        
                                                        map.addLayer(overlays);
                                                        
                            };
                            
                            
                        }
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        console.log("ERROR")
                    }
                });


                // Earthquake Markers 
                $.ajax({
                    url: "libs/php/earthquakeMarkers.php",
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        north: north,
                        south: south,
                        east: east,
                        west: west
                    },
                    success: function (result) {
                        if (result.status.name == "ok") {
                            
                            let earthquakes = result.data
                            
                            for(let i = 0; i < earthquakes.length; i++) {

                                let lat = result.data[i].lat;
                                let lng = result.data[i].lng;
                                let mag = result.data[i].magnitude;
                                let depth = result.data[i].depth;

                                let earthquakeIcon = L.ExtraMarkers.icon({
                                    icon: 'fas fa-house-damage fa-2x',
                                    markerColor: 'red',
                                    iconColor: 'white',
                                    shape: 'star',						
                                });

                                let earthquakes = L.marker([lat,lng], {icon: earthquakeIcon});


                                earthquakes.bindPopup('<b>Earthquake</b><br>'
                                                        + '(' + lat.toFixed(4) + ', ' + lng.toFixed(4) + ')<hr class="m-2">'
                                                        + '<br>Magnitude: ' +  mag
                                                        + '<br>Depth: ' +  depth 
                                                        , {'className' : 'custom-popup'});

                                                        overlays.addLayer(earthquakes);	
                                                        map.addLayer(overlays);
                            } 

                        };
                    }, error: function (jqXHR, textStatus, errorThrown) {
                        console.log("ERROR")
                    },
                });

                //POI Markers 
                $.ajax({
                    url: "libs/php/poiMarkers.php",
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        north: north,
                        south: south,
                        east: east,
                        west: west
                    },
                    success: function (result) {
                        if (result.status.name == "ok") {

                            for (let i = 0; i < result.data.length; i++) {

                                let lat = result.data[i].lat;
                                let lng = result.data[i].lng;
                                let wiki = result.data[i].wikipediaUrl;


                                let places = L.ExtraMarkers.icon({
                                    icon: 'fa-solid fa-house-flag',
                                    markerColor: 'black',
                                    iconColor: 'white',
                                    shape: 'square',
                                });

                                let placesOfInterest = L.marker([lat,lng], {icon: places});
                                                        
                                placesOfInterest.bindPopup('<b>' + result.data[i].title + '</b><br>' 
                                                        + '(' + lat.toFixed(4) + ', ' + lng.toFixed(4) + ')<hr class="m-2">'
                                                        + '<br>' + `<a target="_blank" style="color:black; text-decoration:none;" href="//${wiki}">Click For More</a>`
                                                        , {'className' : 'custom-popup'});
                                
                                overlays.addLayer(placesOfInterest);	
                                    
                                if (i > 28) break;
                            }
                        };
                    },  error: function (jqXHR, textStatus, errorThrown) {
                        console.log("ERROR")
                    },
                });

            }, error: function (jqXHR, textStatus, errorThrown) {
            console.log("ERROR")
        }
        });
    });
        

// ------------------------------------------- MODAL BUTTONS ------------------------------------------- //  

    //General Information and Weather Modal 
    $('#selectCountry').on('change', () =>{ 

    // General Info Modal        
    $.ajax({
        url: 'libs/php/restCountries.php',
        type: 'POST',
        dataType: 'json',
        data: {
            countryiso: $('#selectCountry').val()
        },
        success: function(result){ 

            let latitude = result.data.latlng[0];
            let longitude = result.data.latlng[1];
            

            if(result.status.name == "ok"){

                // Weather modal flag 
                $('#weather-country-flag').empty().append(`<img style="height: 1rem;" src="${result.data.flag}"></img>`);
                
                // General info modal flags
                $('#general-country-flag').empty().append(`<img style="height: 1rem;" src="${result.data.flag}"></img>`);
                $('#general-flag').empty().append(`<img style="height: 1rem;" src="${result.data.flag}"></img>`);

                // General info modal information 
                $('#general-capital').html(result.data.capital);
                $('#general-region').html(result.data.region);
                $('#general-population').html(result.data.population);
                $('#general-timezone').html(result.data.timezones[0]);
                $('#general-area').html(result.data.area);
                $('#general-nativename').html(result.data.nativeName);
                $('#general-language').html(result.data.languages[0].name);

                // Currency exchange modal information
                $('#txtCurrName').html(result.data.currencies[0].name);
				$('#txtCurrCode').html(result.data.currencies[0].code);
				$('.txtCurrSymbol').html(result.data.currencies[0].symbol);

                //Modal country Name labels 

                    // Weather Modal country name
                $('#weather-country-name').html(result.data.name);

                    // General Modal country name
                $('#general-country-name').html(result.data.name)
                $('#general-name').html(result.data.name);

                    // Currency country name
                $('#exchange-country-name').html(result.data.name);

                    // Country news name 
                $('#news-country-name').html(result.data.name);

                    // Photo name
                $('#photo-country-name').html(result.data.name);
            } 

            // Weather Modal 
            $.ajax({
        
                url: 'libs/php/getWeather.php',
                type: 'POST',
                dataType: 'json',
                data: {
                    lat: latitude,
                    lng: longitude
                },
                success: function(result){ 

                    if(result.status.name == "ok"){
                        
                        //weather description 
                        $('#weather-description').html(result.data.weather[0].description);
                        $('#weather-icon').empty().append('<img id="weather-icon" src="https://openweathermap.org/img/wn/' + result.data.weather[0].icon + '@2x.png"></img>');
                        //Weather information

                        $('#temperature').html(Math.round(result['data']['main']['temp']).toString());
                        $('#feelslike').html(Math.round(result['data']['main']['feels_like']).toString());
                        $('#mintemp').html(Math.round(result['data']['main']['temp_min']).toString());
                        $('#maxtemp').html(Math.round(result['data']['main']['temp_max']).toString());
                        $('#pressure').html(Math.round(result['data']['main']['pressure']).toString());
                        $('#humidity').html(Math.round(result['data']['main']['humidity']).toString());
                        $('#clouds').html(Math.round(result['data']['clouds']['all']).toString());
                        $('#windSpeed').html(Math.round(result['data']['wind']['speed']).toString());
                    }

                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        console.log("ERROR!")
                }
                });
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log("ERROR!")
        }

        });
    });



    // Currency Exchange Modal
    $('#selectCountry').on('change', () =>{
        $.ajax({
            url: 'libs/php/getCurrencyNames.php',
            type: 'POST',
            dataType: 'json',
            success: function(result){
                if (result.status.name == "ok") {
                    const names = result.data
                    for(let currency in names) {
                        if (names.hasOwnProperty(currency)){
                            if (currency  === 'VEF') {
                                continue;	
                            };
                            let currecnyText = currency + " - " + names[currency]
                            let currencyValue = currency
                        $("<option>", {
                            text: currecnyText,
                            value: currencyValue
                        }).appendTo("#selectConversion");
                        }
                        
                    }

                }

                $('#currencyConvert').add('#selectConversion').on('change', function() {
                    let selAmount = $('#currencyConvert').val()
                

                $.ajax({
                    url: 'libs/php/getExchangeRates.php',
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        base: $("#txtCurrCode").text(),
                        conversion: $("#selectConversion").val(),
                        amount: selAmount
                    },
                    success: function(result){
                        if (result.status.name == "ok") {
                            let curren = result.data.result
                            // let currencyResult = curren.toFixed(2)

                            $('#ansConversion').html(curren)
                            $('#txtExchange').html(result.data.info.rate)
                        }
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        console.log("ERROR")
                    }
                });

                
            });
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log("ERROR")
            }
        });
    });

    $('#selectConversion').append('<option selected="true" disabled>Convert to...</option>');

    $('#resetConverter').on('click', function () {    
        $('#currencyConvert').val(10);         
        
        $('#selectConversion').prop('selectedIndex', 0);
        $('#ansConversion, #txtExchange').empty();
    });


    //Wikipedia Modal 
    const wikipedia = () => {
        
    let countryName = $("#selectCountry option:selected").text(); 
    let countrySearch = countryName.split(" ").join("%20");


    $.ajax({
        url: 'libs/php/getWikiSearch.php',
        type: 'POST',
        dataType: 'json',
        data: {
            country: countrySearch
        },
        success: function(result){
            if (result.status.name == "ok") {
                let unfliteredWiki = result.data 
                let wikiFilter = [];
                let filteredSearch = [];

                for(let i = 0; i < unfliteredWiki.length; i++){
                    if('summary' in  unfliteredWiki[i]){
                        wikiFilter.push(unfliteredWiki[i]);
                    }
                };
                
                for(let i = 0; i < wikiFilter.length; i++){
                    if(wikiFilter[i].summary.includes(countryName)){
                        filteredSearch.push(wikiFilter[i]);
                    }
                };


                // chop string function to display a summary
                let chopStr = (str) => {
                    if(str.length > 300) {
                        return str = str.substring(0,300) + '... '; 
                    } else return str + ' ';
                };

                //Url function to diplay the url version of the code 
                let url = (mobileVersion) => {
                    return mobileVersion.substring(0,3) + 'm.' + mobileVersion.substring(3)
                };

                let body = $('#wikibody'); 
                let frame = $('#wikiframe');
                
                for (let i = 0; i < filteredSearch.length; i++) {
                    body.append(`<p style="border-bottom: 1px solid lightgrey; padding-bottom: 1em;"><strong><span class="txtTitle"></span>${filteredSearch[i].title}:</strong><span class="txtSummary"></span>${chopStr(filteredSearch[i].summary)}</span><a class="wikiLinkLoad" href="${'//' + url(filteredSearch[i].wikipediaUrl)}" target="wikiLink">See More</a></p>`)
                    if (i > 10) break;
                }

                frame.append(`<iframe id="wikiLink" name="wikiLink" src="${'//' + url(filteredSearch[0].wikipediaUrl)}" title="${'Wiki Search: ' + $("#selectCountry option:selected").text()}" class="w-100"></iframe>`)

                $('#wikiNewTab').attr('href','//' + url(filteredSearch[0].wikipediaUrl));

            }
            
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log("ERROR")
        }
    });
    }
    

    //ensuring that when user clicks a different country there is no duplication in WIKI data 
    $("#modalWikiBox").on('hide.bs.modal', function() {
        $('#wikibody, #wikiframe').empty();
        $('.wikiLinkLoad', '#wikiNewTab').attr("href", '');
        $('#wikiLink').attr("src", '');
    });


    //News Modal 
    $('#selectCountry').on('change', () =>{
        let country = $('#selectCountry').val();

        $.ajax({
            url: 'libs/php/getLatestNews.php',
            type: 'POST',
            dataType: 'json',
            data: {
                country: $('#selectCountry').val()
            },
            success: function(result){
                

                if(result.status.name == "ok"){

                    // News-1
                    $('#news-title1').html(result.data.articles[0].title);
                    $('#news-description1').html(result.data.articles.description);
                    $('#news-link1').empty().append(`<a href="${result.data.articles[0].url}" style="color: black;" target="_blank">Click here to view the full story</a>`);
                    // News-2
                    $('#news-title2').html(result.data.articles[1].title);
                    $('#news-description2').html(result.data.articles.description);
                    $('#news-link2').empty().append(`<a href="${result.data.articles[1].url}" style="color: black;" target="_blank">Click here to view the full story</a>`);
                    // News-3
                    $('#news-title3').html(result.data.articles[2].title);
                    $('#news-description3').html(result.data.articles.description);
                    $('#news-link3').empty().append(`<a href="${result.data.articles[2].url}" style="color: black;" target="_blank">Click here to view the full story</a>`);
                    // News-4
                    $('#news-title4').html(result.data.articles[3].title);
                    $('#news-description4').html(result.data.articles.description);
                    $('#news-link4').empty().append(`<a href="${result.data.articles[3].url}" style="color: black;" target="_blank">Click here to view the full story</a>`);


                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log("ERROR")
            }
        })
    });


    // Country Image Modal 
    $('#selectCountry').on('change', () =>{

    let country = $("#selectCountry option:selected").text(); 

    $.ajax({
        url: 'libs/php/getCountryImage.php',
        type: 'POST',
        dataType: 'json',
        data: {
            country: country .split(" ").join("%20")
        },
        success: function (result) {
            if (result.status.name == "ok") {
                let imageUrls = []
                let finalImageUrls = []
                let imagePush = []

                let links = result.data.results

                for(let i = 0; i < 4; i++) {
                    imageUrls.push(links[i])
                }

                for(let i = 0; i < imageUrls.length; i++) {
                    let obj = imageUrls[i]
                    finalImageUrls.push(obj.urls)


                }

                for(let i = 0; i < finalImageUrls.length; i++) {
                    let push = finalImageUrls[i]
                    imagePush.push(push.regular)
                }
                
                $('#first-image').attr("src", `${imagePush[0]}`)
                $('#second-image').attr("src", `${imagePush[1]}`)
                $('#third-image').attr("src", `${imagePush[2]}`)

            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log("ERROR")
        }
    });
    });


// ------------------------------------------- MODAL FUNCTIONS ------------------------------------------- // 

    // Helper functions(come to this if needed)
    
    //leafleat easyButtons function
    function buttons(name, icon) {
        L.easyButton({
            position: 'topleft',
            states:[{
                stateName: name,
                icon: icon, 
                title: name,
                onClick: function () {
                    if(name == 'Weather') {
                        $('#weather-modal').modal('show');
                        
                    } else if (name == 'General Information') {
                        $('#general-modal').modal('show');

                    } else if (name == 'Currency') {
                        $('#exchange-modal').modal('show');
                        
                    } else if (name == 'Wiki') {
                        wikipedia()
                        $('#modalWikiBox').modal('show');
                        
                    } else if (name == 'news') {
                        $('#news-modal').modal('show');

                    } else if (name == 'photos'){
                        $('#photo-modal').modal('show');
                    }
                }
              }
            ]
        }).addTo(map);
    };

    //adding the leafleatEasybuttons using the created function
    buttons('Weather', '<i class="fa-solid fa-cloud"></i>');
    buttons('General Information', '<i class="fa-solid fa-circle-question"></i>');
    buttons('Currency', '<i class="fa-solid fa-wallet"></i>');
    buttons('Wiki', '<i class="fa-brands fa-wikipedia-w"></i>');
    buttons('news', '<i class="fa-solid fa-newspaper"></i>');
    buttons('photos', '<i class="fa-solid fa-image"></i>');
    


});



