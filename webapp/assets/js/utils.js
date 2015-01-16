var lisbonCentre = "38.7436266,-9.1602037";
$(document).ready(function() {
  map.locate();
  updateVehicleProps($('#vehicle-choice').find(".selection").text());
  setupPlaces();
});

// Buttons for the vehicle choice and for the itineraries
var itinControl = L.easyButton('fa-flag-checkered', controlItinerary, 'Control Itinerary', map, 'bottomright');
var vehicleControl = L.easyButton('fa-truck', selectVehicleType, 'Vehicle Type', map, 'bottomleft');

function selectVehicleType() {
  $("#vehicleModal").modal("show");
};

function controlItinerary() {

};

// Weight, Width, Height, Length, grouped by vehicle type
var vehicleProps = {
    'Goods':  [5, 2.5, 2, 5],
    'Goods + Trailer': [7.5, 2.5, 2, 7],
    'Heavy Goods (HGV)': [10, 3, 2.5, 6],
    'HGV + Trailer': [15, 3, 2.5, 10],
};

// Function to change value of input
$.fn.changeVal = function (v) {
    return $(this).val(v).trigger("change");
};

// Updates the selected value in vehicle dropdown
$(".dropdown-menu li a").click(function() {
  var option = $(this).text();
  updateVehicleProps(option);
  $(this).parents(".btn-group").find('.selection').text(option);
  $(this).parents(".btn-group").find('.selection').val(option);
});
function updateVehicleProps(option) {
    // Updates the image
    var attrs = vehicleProps[option];
    var choice = option.indexOf("HGV") >= 0 ? "assets/img/vehicles/HGV.png" : "assets/img/vehicles/Goods.png";
    $("#vehicle-type-img")[0].src = choice;
    $("#weight-input").changeVal(attrs[0]);
    $("#height-input").changeVal(attrs[1]);
    $("#width-input").changeVal(attrs[2]);
    $("#length-input").changeVal(attrs[3]);
};


function fixButtons() {
  var buttons = document.getElementsByClassName('leaflet-control');
  for (var index in buttons) {
    if (buttons[index].children) {
      buttons[index].children[0].style['height'] = '52px';
      buttons[index].children[0].style['width'] = '52px';
      buttons[index].children[0].style['line-height'] = 'inherit';
    }
  };
  
  var icons = document.getElementsByClassName('button-icon');
  for (var index in icons) {
    if (icons[index].children) {
      icons[index].style['font-size'] = '30px';
      icons[index].style['vertical-align'] = 'middle';
      icons[index].style['line-height'] = 'inherit';
    }
  };
};

// Prepares the places for routing, corrects buttons and other
function setupPlaces() {
  fixButtons();
  $("#loading").show();
  $("#loading").hide();
};