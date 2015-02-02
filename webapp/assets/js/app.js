var map, userLocation, locationMarker, destinationMarker;

$("#sidebar-hide-btn").click(function() {
  $('#sidebar').hide();
  map.invalidateSize();
});

function setUserLocation(location) {
  if (location != undefined || location != null) {
    userLocation = location.latlng;
    if(locationMarker === null || locationMarker === undefined) {
      var truckMarker = L.AwesomeMarkers.icon({
        icon: 'truck',
        prefix: 'fa',
        markerColor: 'blue'
      });
      locationMarker = new L.marker(userLocation, {
        draggable: true,
        icon: truckMarker
      });
    }
    map.panTo(userLocation);
    getClosestPoint();
  }
};

/* Basemap Layers */
var mapquestOSM = L.tileLayer("http://{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png", {
  maxZoom: 19,
  subdomains: ["otile1", "otile2", "otile3", "otile4"],
  attribution: 'Tiles courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">. Map data (c) <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> contributors, CC-BY-SA.'
});
var mapquestOAM = L.tileLayer("http://{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg", {
  maxZoom: 18,
  subdomains: ["oatile1", "oatile2", "oatile3", "oatile4"],
  attribution: 'Tiles courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a>. Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency'
});
var mapquestHYB = L.layerGroup([L.tileLayer("http://{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg", {
  maxZoom: 18,
  subdomains: ["oatile1", "oatile2", "oatile3", "oatile4"]
}), L.tileLayer("http://{s}.mqcdn.com/tiles/1.0.0/hyb/{z}/{x}/{y}.png", {
  maxZoom: 19,
  subdomains: ["oatile1", "oatile2", "oatile3", "oatile4"],
  attribution: 'Labels courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">. Map data (c) <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> contributors, CC-BY-SA. Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency'
})]);

/* Single marker cluster layer to hold all clusters */
var markerClusters = new L.MarkerClusterGroup({
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: false,
  zoomToBoundsOnClick: true,
  disableClusteringAtZoom: 16
});

map = L.map("map", {
  zoom: 13,
  center: [38.7436266,-9.1602037],
  layers: [mapquestOSM, markerClusters],
  zoomControl: false,
  attributionControl: false
});

/* GPS enabled geolocation control set to follow the user's location */
var locateControl = L.control.locate({
  position: "topright",
  drawCircle: true,
  follow: true,
  setView: true,
  keepCurrentZoomLevel: true,
  markerStyle: {
    weight: 2,
    color: "#136AEC",
    fill: "#2A93EE",
    lineCap: "round",
    lineJoin: "round",
    opacity: 0.9,
    fillOpacity: 0.7,
    clickable: false,
  },
  circleStyle: {
    weight: 2,
    color: "#136AEC",
    fill: "#136AEC",
    opacity: 0.5,
    fillOpacity: 0.15,
    lineCap: "round",
    lineJoin: "round",
    clickable: false
  },
  icon: "icon-direction",
  metric: true,
  locateOptions: {
    maxZoom: 18,
    watch: true,
    enableHighAccuracy: true,
    maximumAge: 10000,
    timeout: 10000
  }
});

map.addControl(locateControl).on('locationfound', setUserLocation);

/* Larger screens get expanded layer control and visible sidebar */
if (document.body.clientWidth <= 767) {
  var isCollapsed = true;
} else {
  var isCollapsed = false;
}

var baseLayers = {};

var groupedOverlays = {};

