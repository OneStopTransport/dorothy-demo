import xml.etree.ElementTree as ET

from consts import CAR_ATTRIBUTES
from consts import VEHICLES
from consts import GPX_ROUTE
from consts import GPX_TRACK
from consts import HOST
from consts import create_properties_dict
from consts import create_speeds_dict


# Create the complex data structure with road properties preferences by vehicle
PROPERTIES = create_properties_dict()
# Create the complex data structure with Portugal speed limits
SPEEDS = create_speeds_dict()


def build_point(rtept, tag_name, tag_desc):
    """ Returns a dictionary with the relevant attributes """
    point = rtept.attrib  # rtept is a dict with lat and lon, append the rest
    point['name'] = rtept.find(tag_name).text
    point['desc'] = rtept.find(tag_desc).text
    return point


def build_urls(lon1, lon2, lat1, lat2, attrs):
    """ Creates the two URLs needed for Routino """
    router = 'router.cgi?transport={vehicle};type={type};{speeds}{props}'
    router_url = ''.join([router, attrs])
    coords_str = 'lon1={lon1};lon2={lon2};lat1={lat1};lat2={lat2}'.format(
        lon1=lon1, lon2=lon2,
        lat1=lat1, lat2=lat2,
    )
    # The two URLs needed are url1 and url2
    url1 = [HOST, router_url, coords_str]
    url2 = [HOST, 'results.cgi?uuid={uuid};type={type};format={format}']
    return url1, url2


def build_urls_detail(result_url, uuid, route_type):
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


def create_vehicle_attrs(attrs):
    """ Returns a dictionary with the vehicle attributes """
    try:
        # Assert all values are integers, if not, discard everything
        attribs = [int(attrib) if attrib else 0 for attrib in attrs.split(',')]
        if len(attribs) == (len(CAR_ATTRIBUTES) - 2):
            attribs.extend([1, 1])  # Adds oneway and turns restriction
            return dict(zip(CAR_ATTRIBUTES, attribs))
        return {}
    except ValueError:
        return {}


def get_properties_url_params(vehicle):
    """ Returns the URL parameters with the received vehicle properties """
    if vehicle in VEHICLES:
        param = 'property-{key}={val};'
        props = [(key, val) for key, val in PROPERTIES[vehicle].items()]
        return ''.join([param.format(key=key, val=val) for key, val in props])
    return ''


def get_speeds_url_params(vehicle):
    """ Returns the URL parameters with the received vehicle speed limits """
    if vehicle in VEHICLES:
        param = 'speed-{key}={val};'
        speeds = [(key, val) for key, val in SPEEDS[vehicle].items()]
        return ''.join([param.format(key=key, val=val) for key, val in speeds])
    return ''


def get_vehicle_attrs_url(props):
    """ Returns vehicle properties from dict as URL params for Routino """
    param = '{key}={val};'
    return ''.join([param.format(key=k, val=v) for k, v in props.items()])


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
