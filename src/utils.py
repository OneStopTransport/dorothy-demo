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
