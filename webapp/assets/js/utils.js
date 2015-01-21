// Weight, Width, Height, Length, grouped by vehicle type
var vehicleProps = {
  'Light': [3, 2.5, 2, 4],
  'Medium': [5, 2.5, 2.5, 6],
  'Heavy': [20, 3, 2.5, 12],
};

// Default vehicle is a Goods Vehicle
var currentVehicle = vehicleProps['Light'].join();

// Map layer to add markers and polygons
var routingLayer = new L.LayerGroup();

// Loading points (POIs)
var loadingPoints = [];
var checkedInPoints = [];

// Buttons for the vehicle choice and for the itineraries
var sidebarControl = L.easyButton('fa-navicon', toggleSidebar, 'Show Itinerary', map, 'topleft');
var vehicleControl = L.easyButton('fa-truck', selectVehicleType, 'Vehicle Type', map, 'bottomleft');
var itinControl = L.easyButton('fa-flag-checkered', controlItinerary, 'Control Itinerary', map, 'bottomright');


// Function to change value of input
$.fn.changeVal = function (v) {
  return $(this).val(v).trigger("change");
};

$(document).ready(function() {
  locateControl.locate();
  map.addLayer(routingLayer);
  updateVehicleProps($('#vehicle-choice').find(".selection").text());
  fixButtons();
  setupPlaces();
});

function getPoint(pointId) {
  for(var index in loadingPoints) {
    if (loadingPoints[index].name === pointId) {
      return loadingPoints[index];
    }  
  }
};

function selectVehicleType() {
  $("#vehicleModal").modal("show");
};

function toggleSidebar() {
  $("#sidebar").toggle();
};

function controlItinerary() {
  getNextPOI();
};

function planItinerary() {
  locateControl.locate();
  var vehicleType = $('#vehicle-choice').find(".selection").text().toLowerCase();
  var pointId = $("#point-selection").text();
  pointId = pointId.substring(1, pointId.indexOf("-") - 1);
  var point = getPoint(pointId);
  var coords = [point.geom_feature.coordinates[1], point.geom_feature.coordinates[0]];
  var marker = L.marker(coords);
  marker.bindPopup("<b>Load/Unload #" + pointId + "</b><br><b>Street:</b> " + point.street.name + "<br><b>Schedule:</b> " + point.metadata['Horario']).openPopup();
  $("#feature-list tbody").html("");
  $("#route-description").text("No itinerary information available yet.");
  routingLayer.clearLayers();
  routingLayer.addLayer(marker);
  callRoutinoAPI(coords, vehicleType);
  map.invalidateSize();
}

// Updates the selected value in vehicle dropdown
$(".dropdown-menu li a").click(function() {
  var option = $(this).text();
  updateVehicleProps(option);
  $(this).parents(".btn-group").find('.selection').text(option);
  $(this).parents(".btn-group").find('.selection').val(option);
});

// By choosing a vehicle type in the form, fill it with
// values from the dictionary vehicleProps
function updateVehicleProps(option) {
  // Updates the image in modal window
  var attrs = vehicleProps[option];
  var choice = "assets/img/vehicles/" + option.toLowerCase() + ".png";
  // Updates the attributes in the form
  $("#vehicle-type-img")[0].src = choice;
  $("#weight-input").changeVal(attrs[0]);
  $("#height-input").changeVal(attrs[1]);
  $("#width-input").changeVal(attrs[2]);
  $("#length-input").changeVal(attrs[3]);
};

// By choosing a vehicle type in the form, fill it with
// values from the dictionary vehicleProps
function updatePointProps(option) {
  var point = getPoint(option);
  var coords, street, parish, municipality, metadata
  coords = prettyCoords(point.geom_feature.coordinates);
  street = point.street.name;
  parish = point.parish.name;
  metadata = point.metadata;
  // Updates the modal box with the details
  $("#loadpoint-coords").text(coords);
  $("#loadpoint-street").text(street);
  $("#loadpoint-parish").text(parish);
  $("#loadpoint-schedule").text(metadata['Horario'].replace('horas', 'hours'));
};

// Updates the string to be sent to Routino API
// with user-defined values in the vehicle form
function saveVehicleProps() {
  var vehicleChoice = [
    $("#weight-input").val(),
    $("#height-input").val(),
    $("#width-input").val(),
    $("#length-input").val(),
  ];
  currentVehicle = vehicleChoice.join();
};

// Sets the correct style to buttons added to
// the map (location, vehicle and route)
function fixButtons() {
  // Fix buttons size
  var buttons = document.getElementsByClassName('leaflet-control');
  for (var index in buttons) {
    if (buttons[index].children) {
      buttons[index].children[0].style['height'] = '52px';
      buttons[index].children[0].style['width'] = '52px';
      buttons[index].children[0].style['line-height'] = 'inherit';
    }
  };
  // Fix Fontawesome icons
  var icons = document.getElementsByClassName('button-icon');
  for (var index in icons) {
    if (icons[index].children) {
      icons[index].style['font-size'] = '30px';
      icons[index].style['vertical-align'] = 'middle';
      icons[index].style['line-height'] = 'inherit';
    }
  };
};

// Returns string with lat,lon as a tuple string with 5 decimal points 
function prettyCoords(coords) {
  var response = coords[1].toFixed(5) + ", " + coords[0].toFixed(5);
  return response;
};

// Function to call OST API and fetch Lisbon Loading POIs
function getNextPOI() {
  var index, poi_id;
  var isNewPlace = false;
  $("#loading").show();
  // We want one that hasn't been run on this session
  while(isNewPlace == false) {
    index = Math.floor(Math.random() * loadingPoints.length);
    poiName = loadingPoints[index].name;
    updatePointProps(poiName);
    if(checkedInPoints.indexOf(poiName) < 0) {
      isNewPlace = true;
      // checkedInPoints.push(poi_id);
    }
  }
  var option = "#" + poiName + " - " + loadingPoints[index].street.name;
  $("#loadpoint-choice").find('.selection').text(option);
  $("#loadpoint-choice").find('.selection').val(option);
  $("#loading").hide();
  $("#routePlanModal").modal("show");
};

// Process the itinerary step-by-step information
function writeStepInfo(steps) {
  $("#route-description").text("Your itinerary has been planned. Here are the instructions:");
  for(var index in steps) {
    var row = '<tr style="cursor: pointer;"><td style="vertical-align: middle;"><i class="fa fa-angle-right"></i></td><td class="feature-name">'+steps[index].desc+'</td><td style="vertical-align: middle;"></td></tr>';
    $("#feature-list tbody").append(row);
  }
  $("#sidebar").show();
};

// Prepares the places for routing, corrects buttons and other
function setupPlaces() {
  $("#loading").show();
  $.ajax({
    url: 'https://api.ost.pt/pois',
    dataType: 'jsonp',
    data: {
      'key':'<INSERT_BROWSER_KEY_HERE>',
      'category':'303', 'municipality':'769', 'results':'50'
    },
    success: function(income) {
      var pointsList = [];
      var selectionList = $("#point-selection-list");
      loadingPoints = $.parseJSON(JSON.stringify(income.Objects));
      $.each(loadingPoints, function(i) {
        var pointName = "#" + loadingPoints[i].name + " - " + loadingPoints[i].street.name;
        var li = $('<li/>').addClass('drop-item-large').appendTo(selectionList);
        var link = $('<a/>').addClass('point-choice').text(pointName).appendTo(li);
      });
      // Updates the selected value in vehicle dropdown
      $(".dropdown-menu li a.point-choice").click(function() {
        var option = $(this).text();
        var pointId = option.substring(1, option.indexOf("-") - 1);
        updatePointProps(pointId);
        $(this).parents(".btn-group").find('.selection').text(option);
        $(this).parents(".btn-group").find('.selection').val(option);
      });
      $("#loading").hide();
    },
    error: function(data) {
      $("#loading").hide();
      console.log(data);
    }
  });
};

// Calls Routino API and draws result on map
function callRoutinoAPI(destination, vehicleType) {
  var host = "http://localhost:5000/";  // Replace with your Flask instance host
  var url = host + userLocation.lng + "," + userLocation.lat + "/" + destination[1] + "," + destination[0] + "/quickest/" + vehicleType + '/' +  currentVehicle;
  var itinerary = null;
  var steps = null;
  $("#loading").show();
  $.ajax({
    url: url,
    dataType: 'jsonp',
    data: {},
    success: function(income) {
      itinerary = $.parseJSON(JSON.stringify(income.track));
      var coords = [];
      for(var seg in itinerary) {
        coords[seg] = [];
        for(var pt in itinerary[seg]) {
          var point = new L.LatLng(itinerary[seg][pt].lat, itinerary[seg][pt].lon);
          coords[seg].push(point);
        }
      }
      steps = $.parseJSON(JSON.stringify(income.route));
      writeStepInfo(steps);
      var polyline = L.multiPolyline(coords, {color: 'blue'});
      routingLayer.addLayer(polyline);
      map.fitBounds(polyline.getBounds());
      $("#loading").hide();
    },
    error: function(data) {
      $("#loading").hide();
      console.log(data);
    }
  });
};