import json

import requests
from flask import Flask

from consts import ROUTE_TYPES
from utils import build_detail_urls
from utils import build_urls
from utils import create_vehicle_attrs
from utils import get_speeds_url_params
from utils import get_properties_url_params
from utils import get_vehicle_attrs_url
from utils import parse_gpx_route
from utils import parse_gpx_track
from utils import validate_coords


# Instantiate the Flask server
app = Flask(__name__)


@app.route('/')
def index():
    return 'Hello world! Just to confirm your server is working :)'


@app.route('/<orig>/<dest>/<route>/<vehicle>', defaults={'attrs': None})
@app.route('/<orig>/<dest>/<route>/<vehicle>/<attrs>')
def route(orig, dest, route, vehicle, attrs):
    # attrs is an optional parameter for the vehicle attributes
    if attrs is not None:
        # Create a dictionary from the received tuple
        attributes = create_vehicle_attrs(attrs)
    # Validate input coordinates before submitting to Routino
    orig_lat, orig_lon, msg = validate_coords(orig)
    if msg != 'OK':
        return 'Error with origin coordinates: {msg}'.format(msg=msg)
    dest_lat, dest_lon, message = validate_coords(dest)
    if msg != 'OK':
        return 'Error with destination coordinates: {msg}'.format(msg=msg)
    # Validate input route type before submitting to Routino
    if str(route).lower() not in ROUTE_TYPES:
        return 'Error with given route type. Allowed: quickest/shortest'
    # Get speed limits and road properties preferences for the given vehicle
    speeds = get_speeds_url_params(vehicle)
    props = get_properties_url_params(vehicle)
    car_attrs = get_vehicle_attrs_url(attributes) if attributes else ''
    # Build URLs for Routino (1st for router calling, 2nd for results)
    url1, url2 = build_urls(orig_lon, dest_lon, orig_lat, dest_lat, car_attrs)
    first_url = ''.join(url1).format(
        type=route,
        speeds=speeds,
        props=props,
        vehicle=vehicle,
    )
    uuid, status = requests.get(first_url).content.strip().split('\n')
    # Check if trip was successfully planned
    if status == 'OK':
        route_url, track_url = build_detail_urls(url2, uuid, route)
        # Get the step-by-step data
        route_resp = requests.get(route_url)
        # Get the points data
        track_resp = requests.get(track_url)
        # Parse the info to retrieve it in data objects
        route_gpx = parse_gpx_route(route_resp.content)
        track_gpx = parse_gpx_track(track_resp.content)
        # route is the step-by-step text, track is the polyline
        return json.dumps({'route': route_gpx, 'track': track_gpx})
    else:
        # Inform an error occurred
        return 'Error calling {url}'.format(url=first_url)


if __name__ == '__main__':
    app.debug = True
    app.host = '0.0.0.0'
    app.run()
