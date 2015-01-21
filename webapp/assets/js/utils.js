// Weight, Width, Height, Length, grouped by vehicle type
var vehicleProps = {
  'Light': [3, 2.5, 2, 4],
  'Medium': [5, 2.5, 2.5, 6],
  'Heavy': [20, 3, 2.5, 12],
};

// Default vehicle is a Goods Vehicle
var currentVehicle = vehicleProps['Light'].join();
var sidebarControl = L.easyButton('fa-navicon', toggleSidebar, 'Show Itinerary', map, 'topleft');
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

function toggleSidebar() {
  $("#sidebar").toggle();
};

function controlItinerary() {
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
  // Buttons size
  var buttons = document.getElementsByClassName('leaflet-control');
  for (var index in buttons) {
    if (buttons[index].children) {
      buttons[index].children[0].style['height'] = '52px';
      buttons[index].children[0].style['width'] = '52px';
      buttons[index].children[0].style['line-height'] = 'inherit';
    }
  };
  // Fontawesome icons
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