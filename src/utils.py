import xml.etree.ElementTree as ET


# Routino instance URL
HOST = 'http://localhost:8080/routino/'

# Route options = quickest / shortest
QUICK = 'quickest'
SHORT = 'shortest'
ROUTE_TYPES = [QUICK, SHORT]

# Routino response formats (there are more)
GPX_TRACK = 'gpx-track'
GPX_ROUTE = 'gpx-route'

# Lightweight vehicle for people (just for validation)
CAR = 'motorcar'
# Lightweight vehicle for goods
GOODS = 'goods'
# Same as previous but with a trailer
GOODS_TRAILER = 'goods-trailer'
# Heavy Goods Vehicle (Heavy vehicle for goods)
HGV = 'hgv'
# Same as previous but with a trailer
HGV_TRAILER = 'hgv-trailer'
# Vehicle types on a list to help build the speed limits dictionary
VEHICLES = [CAR, GOODS, GOODS_TRAILER, HGV, HGV_TRAILER]

# Motorway = Auto-estrada - fastest road
MOTORWAY = 'motorway'
# Reserved Routes - second fastest
TRUNK = 'trunk'
PRIMARY = 'primary'
# Outside cities
SECONDARY = 'secondary'
TERTIARY = 'tertiary'
# Inside cities
RESIDENTIAL = 'residential'
SERVICE = 'service'
UNCLASSIFIED = 'unclassified'
# Slow roads
TRACK = 'track'
FERRY = 'ferry'
# Forbidden roads
CYCLEWAY = 'cycleway'
PATH = 'path'
STEPS = 'steps'
# Road types on a list to help build the speed limits dictionary
ROADS = [
    MOTORWAY, TRUNK, PRIMARY, SECONDARY, TERTIARY, RESIDENTIAL, SERVICE, \
    UNCLASSIFIED, TRACK, FERRY, CYCLEWAY, PATH, STEPS, \
]


def get_speeds(vehicle_type):
    """ Auxiliary method to help building the speed limits dictionary.
        Values (speed limits) are taken from the legal site (IMTT), sorted
        by road type and grouped by vehicle type.
        This returns the array of speed limits of a given vehicle_type. """
    car_speeds = {
        CAR: [120, 100, 100, 90, 90, 50, 50, 50, 10, 10, 0, 0, 0],
        GOODS: [110, 90, 90, 80, 80, 50, 50, 50, 10, 10, 0, 0, 0],
        GOODS_TRAILER: [90, 80, 80, 70, 70, 50, 50, 50, 10, 10, 0, 0, 0],
        HGV: [90, 80, 80, 80, 80, 50, 50, 50, 10, 10, 0, 0, 0],
        HGV_TRAILER: [80, 70, 70, 70, 70, 40, 40, 40, 10, 10, 0, 0, 0],
    }
    return car_speeds[vehicle_type] if vehicle_type in VEHICLES else []


def validate_coords(lat, lon):
    """ Validates a tuple of coordinates in datatype and range """
    try:
        # Check if both variables are numbers
        lat = float(lat)
        lon = float(lon)
    except ValueError as error:
        return (None, None, 'Invalid coordinates, expecting numbers')
    # Check if coordinates are in range
    if (lat < -90) or (lat > 90):
        error = 'Invalid latitude: {lat}, should be between -90 and 90'
        return (None, None, error.format(lat=lat))
    if (lon < -180) or (lon > 180):
        error = 'Invalid longitude: {lon}, should be between -180 and 180'
        return (None, None, error.format(lon=lon))
    # All OK
    return (lat, lon, 'OK')


def build_urls(lon1, lon2, lat1, lat2):
    """ Creates the two URLs needed for Routino """
    # TODO receive type of vehicle and add properties accordingly
    coords_str = 'lon1={lon1};lon2={lon2};lat1={lat1};lat2={lat2}'.format(
        lon1=lon1, lon2=lon2,
        lat1=lat1, lat2=lat2,
    )
    url1 = [HOST, 'router.cgi?transport=hgv;type={type};', coords_str]
    url2 = [HOST, 'results.cgi?uuid={uuid};type={type};format={format}']
    return url1, url2


def build_detail_urls(url2, uuid, route_type):
    """ Creates the URLs to retrieve the step-by-step information """
    track_url = ''.join(url2).format(
        uuid=uuid,
        type=route_type,
        format=GPX_TRACK,
    )
    route_url = ''.join(url2).format(
        uuid=uuid,
        type=route_type,
        format=GPX_ROUTE,
    )
    return track_url, route_url


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
