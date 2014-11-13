
// used for updating city longitudes/latitudes var timeout = 3000;

$( document ).ready(function() {
    var ctx = $("#myChart").get(0).getContext("2d");
    var options = {
        scaleShowGridLines : true,
  legendTemplate : '<ul>'
                  +'<% for (var i=0; i<datasets.length; i++) { %>'
                    +'<li style="display:inline; padding:5px;">'
                    +'<span style=\"color:<%=datasets[i].pointColor%>;\">'
                    +'<% if (datasets[i].label) { %><%= datasets[i].label %><% } %></span>'
                  +'</li>'
                +'<% } %>'
              +'</ul>'
    };
    
    var data = {
        labels: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        datasets: [
            {
                label: "Rogers",
                fillColor: "rgba(220,0,0,0.2)",
                strokeColor: "rgba(220,0,0,1)",
                pointColor: "rgba(220,0,0,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(220,0,0,1)",
                data: [65, 59, 80, 81, 56, 55, 40]
            },
            {
                label: "Bell",
                fillColor: "rgba(151,187,205,0.2)",
                strokeColor: "rgba(151,187,205,1)",
                pointColor: "rgba(151,187,205,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(151,187,205,1)",
                data: [28, 48, 40, 19, 86, 27, 90]
            }
        ]
    };
    var lineChart = new Chart(ctx).Line(data, options);
    
    var legend = lineChart.generateLegend();
    $('#chart-container').prepend(legend);
    
    // place city ranks on the map
    $.ajax({
        url: "rankings/cities",
        }).done(function( data ) {
            var arrayLength = data.length;
            for (var i = 0; i < arrayLength; i++) {
                var city = data[i];
                if (city.latitude != null && city.longitude != null){
                    addMapMarker(data[i].latitude, data[i].longitude, data[i].name, data[i].rank, (parseFloat(data[i].avg_download_kbps) / 1024).toFixed(2) );
                } else {
                    console.log("No latitude/longitude for " + city.name);
                }
            }
        }).fail(function(jqXHR, msg) {
            alert( "error " + msg);
    });
    

    $("#city_id").change(function () {
        var city = $("#city_id option:selected").text();
        //alert("city value changed " + city); 
        
        getLocationFromCity(city, function(latitude, longitude) {
            changeMapPosition(latitude, longitude);
        });
    });

    // prompt to automatically get the location from the user
    getCityFromBrowserGeoLocation( function(cityName) {
        // change the dropdown to use the automatically obtained city
        $('#city_id option').filter(function() { 
            return ($(this).text() == cityName);
        }).prop('selected', true);
        // TODO: change the province dropdown as well
        $('#province_id').change();
    });
});

// get ISP data: defaults to guelph
$.ajax({
    url: "rankings/city/list",
    }).done(function( data ) {
        console.log( "city/list data: " + data );
    }).fail(function(jqXHR, msg) {
        alert( "error " + msg);
  });
  

// defaults to Canada
$.ajax({
    url: "rankings/country/list",
    }).done(function( data ) {
        console.log( "country/list data: " + data );
    }).fail(function(jqXHR, msg) {
        alert( "error " + msg);
  });

// Code to populate city longitude/latitudes updateLatLong($.map($('#city_id').find("option") ,function(option) { return $(option).html(); }));
  
function addMapMarker(latitude, longitude, city, rank, speed) {
    var loc = {lat: latitude, lng: longitude};
    var marker = new google.maps.Marker({
        position: loc,
        map: map
    });
    
    var contentString = '<div class="text-center" style="color:#000000">' + city + '</h1>' + 
                        '<div class="text-center" style="color:#000000">Rank ' + rank + '</h2>' + 
                        '<div class="text-center" style="color:#000000">Download ' + speed + ' mbps</h2>';
    var infowindow = new google.maps.InfoWindow({
          title: "Ranks 111",
          content: contentString
    });
    google.maps.event.addListener(marker, 'click', function() {
        infowindow.open(map,marker);
    });
}
  
function changeMapPosition(latitude, longitude) {
    var loc = {lat: latitude, lng: longitude};
    map.panTo(loc);
}
  
function updateLatLong(cities) {
    for (i in cities) {
        getLocationFromCityWithTimeout(cities[i]);
    }
}
function getLocationFromCityWithTimeout(city) {
  setTimeout(
    function() { 
        getLocationFromCity(city, 
            function(latitude, longitude) { 
                console.log(city + " " + longitude + " " + latitude);
                updateCity(city, latitude, longitude);
            }); 
    }, timeout += 3000);
}
function updateCity(city, latitude, longitude) {
  $.ajax({
    type: "post",
    url: "city/update",
    data: { city_name: city, latitude: latitude, longitude: longitude }
    }).done(function( data ) {
        console.log( "done: " + data );
    }).fail(function(jqXHR, msg) {
        alert( "error " + msg);
  });
}
function getLatitudeLongitudeFromBrowser(locationCallback) {
    if (navigator.geolocation) {
      var startPos;
      var geoOptions = {
         timeout: 10 * 1000
      }

      var geoSuccess = function(position) {
        startPos = position;
        var latitude = startPos.coords.latitude;
        var longitude = startPos.coords.longitude;
        console.log(latitude);
        console.log(longitude);
        locationCallback(latitude, longitude);
      };
      var geoError = function(error) {
          console.log('Error occurred. Error code: ' + error.code);
          return "";
      };

      navigator.geolocation.getCurrentPosition(geoSuccess, geoError, geoOptions);
    }
}

function getLocationFromCity(cityName, callback) {
    var geocoder =  new google.maps.Geocoder();
    geocoder.geocode( { 'address': cityName + ', canada'}, function(results, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            var latitude = results[0].geometry.location.lat();
            var longitude = results[0].geometry.location.lng();
            callback(latitude, longitude);
          } else {
            return "";
          }
        });
}
  
// calls cityCallback() with the city as the parameter if it was found, otherwise an empty string is passed
function getCityFromBrowserGeoLocation(cityCallback) {

    getLatitudeLongitudeFromBrowser( function(latitude, longitude) {
        changeMapPosition(latitude, longitude);
    
        var url = 'https://maps.googleapis.com/maps/api/geocode/json?latlng='+latitude+','+longitude+'&sensor=false&key=AIzaSyBxKrzd5Mmk4Bbjbbg0xnfESgso--qJ6kk'

        $.ajax({
            dataType: "json",
            url: url,
        })
        .done(function(json) {
                if (json && json.results.length > 0)
                {
                    for (var k=0; k < json.results.length; k++ ) {                    
                        if (json.results[k].address_components) {
                            for (var i = 0; i < json.results[k].address_components.length; i++) {
                                if (json.results[k].address_components[i]) {
                                    for (var j = 0; j < json.results[k].address_components[i].types.length; j++) {
                                        if(json.results[k].address_components[i].types[j] == 'locality') {
                                            var city_name = json.results[k].address_components[i].long_name;
                                            cityCallback(city_name);
                                            return;
                                        }
                                    }
                                }
                            }
                        }
                    }
                 }
                 cityCallback("");
        })
        .fail(function( jqxhr, textStatus, error ) {
            var err = textStatus + ", " + error;
            console.log("Request Failed: " + err );
            cityCallback("");
        });  
    });
}