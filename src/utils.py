import xml.etree.ElementTree as ET

from consts import CAR_ATTRIBUTES
from consts import CAR
from consts import GOODS
from consts import GOODS_TRAILER
from consts import GPX_ROUTE
from consts import GPX_TRACK
from consts import HGV
from consts import HGV_TRAILER
from consts import HOST
from consts import PROPS
from consts import ROADS
from consts import VEHICLES




def get_speeds(vehicle_type):
    """
    Auxiliary method to help building the speed limits dictionary.
    Values (speed limits) are taken from the legal site (IMTT), sorted
    by road type and grouped by vehicle type.
    This returns the array of speed limits of a given vehicle_type.
    """
    car_speeds = {
        CAR: [120, 100, 100, 90, 90, 50, 50, 50, 10, 10, 0, 0, 0],
        GOODS: [110, 90, 90, 80, 80, 50, 50, 50, 10, 10, 0, 0, 0],
        GOODS_TRAILER: [90, 80, 80, 70, 70, 50, 50, 50, 10, 10, 0, 0, 0],
        HGV: [90, 80, 80, 80, 80, 50, 50, 50, 10, 10, 0, 0, 0],
        HGV_TRAILER: [80, 70, 70, 70, 70, 40, 40, 40, 10, 10, 0, 0, 0],
    }
    return car_speeds[vehicle_type] if vehicle_type in VEHICLES else []


def create_speeds_dict():
    """
    Returns the freshly-created and complex data structure:
      - A dictionary of dictionaries...
      - Where each key is a vehicle type and...
      - Each value is a dict mapping road types with speed limits
    e.g.
    {
      CAR: { MOTORWAY: 120, TRUNK: 100, PRIMARY: 100, ... },
      GOODS: { MOTORWAY: 110, TRUNK: 90, PRIMARY: 90, ... },
      ...
    }
    """
    return {each: dict(zip(ROADS, get_speeds(each))) for each in VEHICLES}

# Create the complex data structure with Portugal speed limits
SPEEDS = create_speeds_dict()


def create_vehicle_attrs(attrs):
    """ Returns a dictionary with the vehicle attributes """
    if len(attrs) == (len(CAR_ATTRIBUTES) - 2):
        elements = [attrib if attrib else 0 for attrib in attrs.split(',')]
        elements.extend(1, 1)  # Adds oneway and turns restriction
        return dict(zip(CAR_ATTRIBUTES, elements))
    return {}


def get_vehicle_attrs_url(props):
    """ Returns vehicle properties from dict as URL params for Routino """
    param = '{key}={val};'
    return ''.join([param.format(key=k, val=v) for k, v in props.items()])


def validate_coords(coordinates):
    """ Validates a tuple of coordinates in datatype and range """
    try:
        # Check if it's a tuple of numbers
        lon, lat = coordinates.split(',')
        lat, lon = float(lat), float(lon)
    except ValueError as error:
        return (None, None, 'Invalid coordinates, expecting tuple of numbers')
    # Check if coordinates are in range
    if (lat < -90) or (lat > 90):
        error = 'Invalid latitude: {lat}, should be between -90 and 90'
        return (None, None, error.format(lat=lat))
    if (lon < -180) or (lon > 180):
        error = 'Invalid longitude: {lon}, should be between -180 and 180'
        return (None, None, error.format(lon=lon))
    # All OK
    return (lat, lon, 'OK')


def get_speeds_url_params(vehicle):
    """ Returns the URL parameters with the received vehicle speed limits """
    if vehicle in VEHICLES:
        param = 'speed-{key}={val};'
        speeds = [(key, val) for key, val in SPEEDS[vehicle].items()]
        return ''.join([param.format(key=key, val=val) for key, val in speeds])
    return ''


def build_urls(lon1, lon2, lat1, lat2, attrs):
    """ Creates the two URLs needed for Routino """
    router = 'router.cgi?transport={vehicle};type={type};{speeds}'
    router_url = ''.join([router, attrs])
    coords_str = 'lon1={lon1};lon2={lon2};lat1={lat1};lat2={lat2}'.format(
        lon1=lon1, lon2=lon2,
        lat1=lat1, lat2=lat2,
    )
    # The two URLs needed are url1 and url2
    url1 = [HOST, router, coords_str]
    url2 = [HOST, 'results.cgi?uuid={uuid};type={type};format={format}']
    return url1, url2


def build_detail_urls(result_url, uuid, route_type):
    """ Creates the URLs to retrieve the step-by-step information """
    route_url = ''.join(result_url).format(
        uuid=uuid,
        type=route_type,
        format=GPX_ROUTE,
    )
    track_url = ''.join(result_url).format(
        uuid=uuid,
        type=route_type,
        format=GPX_TRACK,
    )
    return route_url, track_url


def build_point(rtept, tag_name, tag_desc):
    """ Returns a dictionary with the relevant attributes """
    point = rtept.attrib  # rtept is a dict with lat and lon, append the rest
    point['name'] = rtept.find(tag_name).text
    point['desc'] = rtept.find(tag_desc).text
    return point


def parse_gpx_route(response):
    """ Receives gpx-route response from Routino, returns step string list """
    root = ET.fromstring(response)
    # Get attributes by name + namespace (the schema is public)
    namespace = root.tag.replace('gpx', '')
    rtept_name = ''.join([namespace, 'rtept'])
    name = ''.join([namespace, 'name'])
    desc = ''.join([namespace, 'desc'])
    # Returns a list of dictionaries with latitude, longitude, name, desc
    return [build_point(rtept, name, desc) for rtept in root.iter(rtept_name)]


def parse_gpx_track(response):
    """ Receives gpx-track response from Routino and returns points list """
    root = ET.fromstring(response)
    # Get attributes by name + namespace (the schema is public)
    namespace = root.tag.replace('gpx', '')
    trkpt_name = ''.join([namespace, 'trkpt'])
    # Returns a list of dictionaries with latitude and longitude
    return [trkpt.attrib for trkpt in root.iter(trkpt_name)]
