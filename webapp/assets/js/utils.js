// Weight, Width, Height, Length, grouped by vehicle type
var vehicleProps = {
  'Light': [3, 2.5, 2, 4],
  'Medium': [5, 2.5, 2.5, 6],
  'Heavy': [20, 3, 2.5, 12],
};

// Default vehicle is a Goods Vehicle
var currentVehicle = vehicleProps['Light'].join();

// To be used when planning and following itineraries
var currentDestination = null;
var currentOptimal = false;
var currentStep = 0;
var totalDistLeft = null;
var totalTimeLeft = null;
var distanceTimes = [];

// Map layer to add markers and polygons
var routingLayer = new L.LayerGroup();
var stepsLayer = [];

// Loading points (POIs)
var loadingPoints = [];
var optimalPoints = [];
var checkedInPoints = [];

// For the itinerary zoom operations
var currentFullZoom = false;
var currentZoomIcon = 'fa-search-minus';

// Buttons for the vehicle choice and for the itineraries
var sidebarControl = L.easyButton('fa-navicon', toggleSidebar, 'Show Itinerary', map, 'topleft');
var helpControl = L.easyButton('fa-question', showModalWindow, 'Show Help', map, 'topright');
var vehicleControl = L.easyButton('fa-truck', showModalWindow, 'Vehicle Type', map, 'topright');
var itinControl = L.easyButton('fa-flag-checkered', getNextPOI, 'Control Itinerary', map, 'topright');
var zoomControl = L.easyButton(currentZoomIcon, changeZoom, 'Change Itinerary zoom levels', map, 'topright');
var recalcControl = L.easyButton('fa-refresh', recalculateItinerary, 'Recalculate Itinerary', map, 'topright');
var cleanControl = L.easyButton('fa-eraser', clearItinerary, 'Clear Itinerary', map, 'topright');

// Div for the recalcControl button
// (needed to be unhidden when itinerary is planned)
var locRefresh = document.getElementsByClassName('fa-refresh')[0].parentNode.parentNode;
var locClear = document.getElementsByClassName('fa-eraser')[0].parentNode.parentNode;

// When routino fails plan, we need to retry its API but
// only 3 times, in order not to enter an infinite loop
var routinoCalls = 0;

// Function to change value of input
$.fn.changeVal = function (v) {
  return $(this).val(v).trigger("change");
};

// Called when browser page finishes loading
$(document).ready(function() {
  locateControl.locate();
  map.addLayer(routingLayer);
  updateVehicleProps($('#vehicle-choice').find(".selection").text());
  fixButtons();
  setupPlaces();
  getOptimalPlan();
});

// Updates the selected value in vehicle dropdown
$(".dropdown-menu li a").click(function() {
  var option = $(this).text();
  updateVehicleProps(option);
  $(this).parents(".btn-group").find('.selection').text(option);
  $(this).parents(".btn-group").find('.selection').val(option);
});

// Modal Windows and Sidebar display functions
function showModalWindow(modalId) {
  if(modalId === null || modalId === undefined) {
    if(this.options.intentedIcon === "fa-question") {
      modalId = "#aboutModal";
    } else if(this.options.intentedIcon === "fa-truck") {
      modalId = "#vehicleModal";
    }
  }
  $(modalId).modal("show");
};

function toggleSidebar() {
  $("#sidebar").toggle();
};

// Reset itinerary for recalculation
function clearItinerary() {
  // Removes polylines from routing layer
  // and table rows from sidebar (step-by-step)
  var locZoom = document.getElementsByClassName(currentZoomIcon)[0].parentNode.parentNode;
  if(map.hasLayer(destinationMarker)) {
    map.removeLayer(destinationMarker);
  }
  map.removeLayer(locationMarker);
  locateControl._circleMarker.hideLabel();
  routingLayer.clearLayers();
  locRefresh.style["display"] = "none";
  locClear.style["display"] = "none";
  locZoom.style["display"] = "none";
  currentDestination = null;
  currentStep = 0;
  showUser();
  $("#route-description").text("No itinerary information available yet.");
  $("#feature-list tbody").find("tr").remove();
};

// Zooms in to the user position
function showUser() {
  map.setZoom(18);
  map.panTo(userLocation);
};

// When driver arrives near itinerary destination
// this function is called to show the next destination
function setNextDestination() {
  getNextPOI();
  if(currentOptimal === true) {
    var currentPoint = $("#opt-point-selection").text();
    currentPoint = currentPoint.substring(1, currentPoint.indexOf("-") - 1);
    for(var index in optimalPoints) {
      if(optimalPoints[index].name === currentPoint) {
        if(index < optimalPoints.length-1) {
          index++;
        }
        var point = optimalPoints[index];
        var pointName = "#" + point.name + " - " + point.street;
        updatePointProps(point.name, true);
        $("#opt-loadpoint-choice").find('.selection').text(pointName);
        $("#opt-loadpoint-choice").find('.selection').val(pointName);
      }
    };
  } else {
    $("#manualPlanTab")[0].setAttribute("class", "active");
    $("#optimalPlanTab")[0].setAttribute("class", "");
  }
};

// Prepares every attribute needed for the itinerary planning API
// optimal is a boolean variable for itinerary tab selection (manual/optimal)
function planItinerary(optimal) {
  locateControl.locate();
  var locZoom = document.getElementsByClassName(currentZoomIcon)[0].parentNode.parentNode;
  var vehicleType = $('#vehicle-choice').find(".selection").text().toLowerCase();
  var selectionId = optimal === true ? "#opt-point-selection" : "#point-selection";
  var pointId = $(selectionId).text().substring(1, $(selectionId).text().indexOf("-")-1);
  var point = getPoint(pointId, false);
  var coordinates = point.geom_feature.coordinates;
  var schedule = point.metadata['Horario'].replace('horas', 'hours');
  var destMarker = L.AwesomeMarkers.icon({
    icon: 'map-marker',
    prefix: 'fa',
    markerColor: 'green'
  });
  clearItinerary();
  if(map.hasLayer(destinationMarker)) {
    map.removeLayer(destinationMarker);
  }
  currentOptimal = optimal;
  currentDestination = [parseFloat(coordinates[1]), parseFloat(coordinates[0])];
  destinationMarker = L.marker(currentDestination, {
    icon: destMarker,
  });
  destinationMarker.bindPopup("<b>Load/Unload #" + pointId + "</b><br><b>Street:</b> " + point.street.name + "<br><b>Schedule:</b> " + schedule.replace('horas', 'hours'));
  map.addLayer(destinationMarker);
  getBestItinerary(currentDestination, vehicleType);
  map.invalidateSize();
  locRefresh.style["display"] = "block";
  locClear.style["display"] = "block";
  locZoom.style["display"] = "block";
};

// Sets locationMarker as draggable, shows Popup info and listens to dragging behaviour
function recalculateItinerary() {
  var vehicleType = $('#vehicle-choice').find(".selection").text().toLowerCase();
  var locZoom = document.getElementsByClassName(currentZoomIcon)[0].parentNode.parentNode;
  map.panTo(userLocation);
  var currDest = currentDestination;
  clearItinerary();
  currentDestination = currDest;
  map.addLayer(locationMarker);
  locationMarker.dragging.enable();
  locationMarker.bindPopup("Drag me to your desired starting position!").openPopup();
  locationMarker.on("dragend", function() {
    locationMarker.bindPopup("Click <i class='fa fa-refresh'></i> to change my position");
    locationMarker.dragging.disable();
    locationMarker.closePopup();
    userLocation = locationMarker.getLatLng();
    getBestItinerary(currentDestination, vehicleType);
    map.invalidateSize();
    locRefresh.style["display"] = "block";
    locClear.style["display"] = "block";
    locZoom.style["display"] = "block";
  });
};

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

// Returns the load/unload point attributes given its ID
function getPoint(pointId, optimal) {
  var array = optimal === true ? optimalPoints : loadingPoints;
  for (var index in array) {
    if (array[index].name === pointId) {
      return array[index];
    }
  }
};

// By choosing a vehicle type in the form, fill it with
// values from the dictionary vehicleProps
function updatePointProps(option, optimal) {
  var coords, street, parish, municipality, metadata, point;
  var point = getPoint(option, optimal);
  // Updates the modal box with the details
  if(optimal === true) {
    coords = point.coordinates;
    street = point.street;
    parish = point.parish;
    metadata = point.schedule;
    $("#loadpoint-coords-opt").text(coords);
    $("#loadpoint-street-opt").text(street);
    $("#loadpoint-parish-opt").text(parish);
    $("#loadpoint-schedule-opt").text(metadata.replace('horas', 'hours'));
  } else {
    coords = prettyCoords(point.geom_feature.coordinates);
    street = point.street.name;
    parish = point.parish.name;
    metadata = point.metadata;
    $("#loadpoint-coords").text(coords);
    $("#loadpoint-street").text(street);
    $("#loadpoint-parish").text(parish);
    $("#loadpoint-schedule").text(metadata['Horario'].replace('horas', 'hours'));
  }
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
  var locZoom = document.getElementsByClassName(currentZoomIcon)[0].parentNode.parentNode;
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
      icons[index].style.fontSize = '32px';
      icons[index].style.padding = '10px';
      icons[index].style.verticalAlign = 'middle';
    }
  };
  // Disable location control
  var locControl = document.getElementsByClassName('leaflet-control-locate')[0];
  locControl.style.display = "none";
  // Hide recalculate itinerary control
  locRefresh.style.display = "none";
  locClear.style.display = "none";
  locZoom.style.display = "none";
};

// Returns string with lat,lon as a tuple string with 5 decimal points
function prettyCoords(coords) {
  var response = coords[1].toFixed(5) + ", " + coords[0].toFixed(5);
  return response;
};

// Changes application focus between user position and the whole itinerary
function changeZoom() {
  var locZoom = $('.' + currentZoomIcon);
  if(currentFullZoom === false) {
    locateControl.stopFollowing();
    map.fitBounds(routingLayer.getLayers()[0]);
  } else {
    locateControl._following = true;
    showUser();
  }
  locZoom.removeClass(currentZoomIcon);
  currentFullZoom = !currentFullZoom;
  currentZoomIcon = currentFullZoom === true ? "fa-search-plus" : "fa-search-minus";
  locZoom.addClass(currentZoomIcon);
};

// Function to call OST API and fetch Lisbon Loading POIs
// Selects a random point from the list and marks it as checked
function getNextPOI() {
  var index, poi_id;
  var isNewPlace = false;
  $("#loading").show();
  // We want one that hasn't been run on this session
  while(isNewPlace == false) {
    index = Math.floor(Math.random() * loadingPoints.length);
    poiName = loadingPoints[index].name;
    updatePointProps(poiName, false);
    if(checkedInPoints.indexOf(poiName) < 0) {
      isNewPlace = true;
      checkedInPoints.push(poiName);
    }
  }
  var option = "#" + poiName + " - " + loadingPoints[index].street.name;
  $("#loadpoint-choice").find('.selection').text(option);
  $("#loadpoint-choice").find('.selection').val(option);
  $("#loading").hide();
  $("#routePlanModal").modal("show");
};

// Given an index it fetches the step description on
// that position (sidebar) and enhances its style (bold)
function markImportantStep(index) {
  var steps = $("tbody.list tr");
  var scrollIndex = index > 0 ? index-1 : index;
  currentStep = index;
  if(index == steps.length-2) {
    showModalWindow("#nextStepModal");
  }
  $.each(steps, function(i) {
    if(i == index) {
      steps[scrollIndex].scrollIntoView();
      steps[i].setAttribute("class", "clickableRow selected-step");
    } else {
      steps[i].setAttribute("class", "clickableRow");
    }
  });
  var labelIndex = index >= steps.length-2 ? steps.length-2 : index;
  var timeDiff = distanceTimes[labelIndex].time;
  var distDiff = parseFloat(distanceTimes[labelIndex].dist).toFixed(1)
  if(timeDiff > 60) {
    timeDiff = '' + Math.floor(timeDiff/60) + 'h ' + Math.ceil(timeDiff%60);
  } else {
    timeDiff = parseFloat(timeDiff).toFixed(0);
  }
  var label = "Time: " + timeDiff + " min. Distance: " + distDiff + " km";
  if(locateControl._circleMarker != undefined) {
    if(locateControl._circleMarker.getLabel() === undefined) {
      locateControl._circleMarker.unbindLabel();
      locateControl._circleMarker.bindLabel(label, {
        noHide: true,
        direction: 'auto'
      }).showLabel();
    } else {
      locateControl._circleMarker.getLabel().setContent(label)
      locateControl._circleMarker.showLabel();
    }
  }
};

// Shows details fa-chevron-rightstep position on map (user clicked on sidebar)
function showSegment() {
  var index = parseInt($(this)[0].rowIndex)-4;
  var latLng = new L.LatLng(stepsLayer[index].lat, stepsLayer[index].lon);
  map.panTo(latLng);
};

// Processes the itinerary step-by-step information
function writeStepInfo(steps) {
  var row, dist, time, prevDist, prevTime, prevStep;
  stepsLayer = [], distanceTimes = [];
  $("#route-description").text("Your itinerary has been planned. Here are the instructions:");
  $("#feature-list").find("tr.clickableRow").remove();
  var last = steps.length-1;
  var totalDist = steps[last].desc.substring(steps[last].desc.indexOf('Journey ')+8, steps[last].desc.indexOf(' km,'));
  var totalTime = steps[last].desc.substring(steps[last].desc.indexOf('km, ')+4, steps[last].desc.indexOf(' minutes'));
  $.each(steps, function(index) {
    if(index == last) {
      row = '<tr class="clickableRow" style="cursor: pointer;"><td style="vertical-align: middle;"><i class="fa fa-flag"></i></td><td class="feature-name"><strong>'+steps[index].desc+'</strong></td><td style="vertical-align: middle;"></td></tr>';
    } else {
      prevDist = (index > 0 ? distanceTimes[index-1].dist : totalDist);
      prevTime = (index > 0 ? distanceTimes[index-1].time : totalTime);
      if(index > 0) {
        prevStep = steps[index-1];
        dist = prevStep.desc.substring(prevStep.desc.indexOf(' for ')+5, prevStep.desc.indexOf(' km,'));
        time = prevStep.desc.substring(prevStep.desc.indexOf('km, ')+4, prevStep.desc.indexOf(' min'));
      } else {
        dist = 0;
        time = 0;
      }
      var distDiff = prevDist - dist;
      var timeDiff = prevTime - time;
      distanceTimes.push({'dist': distDiff.toFixed(2), 'time': timeDiff.toFixed(2)});
      row = '<tr class="clickableRow" style="cursor: pointer;"><td style="vertical-align: middle;"><i class="fa fa-angle-right"></i></td><td class="feature-name">'+steps[index].desc+'</td><td style="vertical-align: middle;"></td></tr>';
    }
    $("#feature-list tbody").append(row);
    stepsLayer.push({'id': index, 'lat': steps[index].lat, 'lon': steps[index].lon});
  });
  $(".clickableRow").click(showSegment);
  getClosestPoint();
  $("#sidebar").show();
};

// Function to retrieve the closest point from itinerary to userLocation
function getClosestPoint() {
  var currlat, currLon, currDiff, closerCoords;
  var distanceDiffs = [];
  var minDiff = (90+180)/2;
  var closest = L.GeometryUtil.closest(map, stepsLayer, userLocation);
  if (closest != null) {
    var lat = parseFloat(closest.lat.toFixed(4));
    var lon = parseFloat(closest.lng.toFixed(4));
    for (var index = stepsLayer.length-2; index >= currentStep; index--) {
      currlat = stepsLayer[index].lat;
      currlon = stepsLayer[index].lon;
      currDiff = (Math.abs(lat - parseFloat(currlat).toFixed(4)) + Math.abs(lon - parseFloat(currlon).toFixed(4)))/2;
      if(currDiff < minDiff) {
        minDiff = currDiff;
        closerCoords = index;
      }
      distanceDiffs.push({'averagediff': currDiff});
    }
    // console.log("CLOSER: " + closerCoords + " (" + minDiff + ")");
    markImportantStep(closerCoords);
  }
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
        updatePointProps(pointId, false);
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
  var host = "http://localhost:5000/";  // Replace with your Flask instance host
function getBestItinerary(destination, vehicleType) {
  var url = host + parseFloat(userLocation.lng).toFixed(4) + "," + parseFloat(userLocation.lat).toFixed(4) + "/" + parseFloat(destination[1]).toFixed(3) + "," + parseFloat(destination[0]).toFixed(4) + "/quickest/" + vehicleType + '/' +  currentVehicle;
  var response = null;
  var steps = null;
  $("#loading").show();
  map.addLayer(destinationMarker);
  $.ajax({
    url: url,
    dataType: 'jsonp',
    data: {},
    success: function(income) {
      routinoCalls++;
      response = $.parseJSON(JSON.stringify(income));
      // Response should be JSON list
      if(typeof(response) === "string") {
        console.log("BUG with Routino API");
        // We try the API for three times, then we give up
        if(routinoCalls > 3) {
          $("#loading").hide();
          alert("Sorry, but itinerary planning was not possible, please try again");
          return;
        }
        getBestItinerary(destination, vehicleType);
      } else {
        // Result received, parse the data we need
        var point, coords = [];
        var itinerary = response['track'];
        for (var seg in itinerary) {
          coords[seg] = [];
          for (var pt in itinerary[seg]) {
            point = new L.LatLng(itinerary[seg][pt].lat, itinerary[seg][pt].lon);
            coords[seg].push(point);
          };
        };
        steps = $.parseJSON(JSON.stringify(income.route));
        writeStepInfo(steps);
        routinoCalls = 0;
        var polyline = L.multiPolyline(coords, {color: 'blue'});
        routingLayer.addLayer(polyline);
        $("#loading").hide();
      }
    },
    error: function(data) {
      $("#loading").hide();
      console.log(data);
    }
  });
};

// Calls Flask server API to get the optimal plan from logistics
function getOptimalPlan() {
  $("#loading").show();
  $.ajax({
    // TODO Replace with your Flask instance server URL
    url: 'http://localhost:5000/plan',
    url: 'https://routino.ost.pt/api/plan',
    dataType: 'jsonp',
    data: {},
    success: function(income) {
      var pointsList = [];
      var selectionList = $("#opt-point-selection-list");
      optimalPoints = $.parseJSON(JSON.stringify(income.plan));
      $.each(optimalPoints, function(i) {
        var pointName = "#" + optimalPoints[i].name + " - " + optimalPoints[i].street;
        var li = $('<li/>').addClass('drop-item-large').appendTo(selectionList);
        var link = $('<a/>').addClass('opt-loadpoint-choice').text(pointName).appendTo(li);
      });
      // Updates the selected value in vehicle dropdown
      $(".dropdown-menu li a.opt-loadpoint-choice").click(function() {
        var option = $(this).text();
        var pointId = option.substring(1, option.indexOf("-") - 1);
        updatePointProps(pointId, true);
        $(this).parents(".btn-group").find('.selection').text(option);
        $(this).parents(".btn-group").find('.selection').val(option);
      });
      var point = optimalPoints[0]
      var pointName = "#" + point.name + " - " + point.street;
      updatePointProps(point.name, true);
      $("#opt-loadpoint-choice").find('.selection').text(pointName);
      $("#opt-loadpoint-choice").find('.selection').val(pointName);
      $("#loading").hide();
    },
    error: function(data) {
      $("#loading").hide();
      console.log(data);
    }
  });
};