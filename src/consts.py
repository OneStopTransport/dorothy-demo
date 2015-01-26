##############################
# ROUTINO SPECIFIC CONSTANTS #
##############################

# Routino instance URL
HOST = 'http://localhost:8080/routino/'
# Route options = quickest / shortest
QUICK = 'quickest'
SHORT = 'shortest'
ROUTE_TYPES = [QUICK, SHORT]
# Routino response formats (there are more)
GPX_TRACK = 'gpx-track'
GPX_ROUTE = 'gpx-route'
# JSON File path with Optimal plan
JSON_FILE = 'data/plan.json'


#############################################################
# VEHICLE TYPES - Names (labels) on their own and on a list #
#############################################################

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
# Vehicle types on a list to help build the speed / properties dictionaries
VEHICLES = [CAR, GOODS, GOODS_TRAILER, HGV, HGV_TRAILER]

# Vehicle Sizes
LIGHT = 'light'
MEDIUM = 'medium'
HEAVY = 'heavy'

# Translation
SIZES = {
    LIGHT: GOODS,
    MEDIUM: GOODS,
    HEAVY: HGV,
}


#####################################
# VEHICLE ATTRIBUTES + RESTRICTIONS #
#####################################

# Vehicle attributes
HEIGHT = 'height'
LENGTH = 'length'
WEIGHT = 'weight'
WIDTH = 'width'
# Vehicle restrictions
ONEWAY = 'oneway'
TURNS = 'turns'
# The array with vehicle properties labels for the dictionary creation
CAR_ATTRIBUTES = [HEIGHT, LENGTH, WEIGHT, WIDTH, ONEWAY, TURNS]


############################################################
# ROAD PROPERTIES - road type preferences per vehicle type #
############################################################

PAVED = 'paved'
MULTILANE = 'multilane'
BRIDGE = 'bridge'
TUNNEL = 'tunnel'
FOOTROUTE = 'footroute'
BICYCLEROUTE = 'bicycleroute'
# The array with vehicle properties labels for the dictionary creation
PROPS = [PAVED, MULTILANE, BRIDGE, TUNNEL, FOOTROUTE, BICYCLEROUTE]


#####################################################
# ROADS - Names (labels) on their own and on a list #
#####################################################

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
    MOTORWAY, TRUNK, PRIMARY, SECONDARY, TERTIARY, RESIDENTIAL, SERVICE,
    UNCLASSIFIED, TRACK, FERRY, CYCLEWAY, PATH, STEPS,
]


####################################################
# AUXILIARY FUNCTIONS FOR DATA STRUCTURES CREATION #
####################################################


def get_road_prefs(vehicle_type):
    """
    Selects the %% preference for using each particular road type
    http://wiki.openstreetmap.org/wiki/Key:highway
    The value of <highway> can be selected from:
      * motorway = Motorway (high-way)
      * trunk = Trunk (major road)
      * primary = Primary (main recommended roads - single/dual carriageway)
      * secondary = Secondary (important but secondary to main arterial routes)
      * tertiary = Tertiary (connect minor streets to major roads)
      * unclassified = Least important in standard road network)
      * residential = Smaller road for access to residential properties
      * service = Smaller road for access to non-residential properties
      * track = Agricultural or forestry uses
      * cycleway = Non-specific path usable by cyclists
      * path = Non-specific path usable by cyclists
      * steps = For flights of steps (stairs) on footways
      * ferry = For roads that are accessed by ferryboat
    """
    road_prefs = {
        CAR: [100, 100, 90, 80, 70, 60, 50, 80, 0, 0, 0, 0, 0],
        GOODS: [100, 100, 90, 80, 70, 60, 50, 80, 0, 0, 0, 0, 0],
        GOODS_TRAILER: [100, 100, 90, 80, 70, 60, 50, 80, 0, 0, 0, 0, 0],
        HGV: [100, 100, 80, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        HGV_TRAILER: [100, 100, 80, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    }
    return road_prefs[vehicle_type] if vehicle_type in VEHICLES else []


def create_road_preferences_dict():
    """
    Returns the freshly-created and complex data structure:
      - A dictionary of dictionaries...
      - Where each key is a vehicle type and...
      - Each value is a dict mapping road types with speed limits
      e.g.
      {
        CAR: { MOTORWAY: 100, TRUNK: 100, PRIMARY: 90, ... },
        GOODS: { MOTORWAY: 100, TRUNK: 100, PRIMARY: 90, ... },
        ...
      }
    """
    return {each: dict(zip(ROADS, get_road_prefs(each))) for each in VEHICLES}


def get_road_props(vehicle_type):
    """
    Selects the %% preference for using each particular highway property
    The value of <property> can be selected from:
      * paved = Paved (suitable for normal wheels)
      * multilane = Multiple lanes
      * bridge = Bridge
      * tunnel = Tunnel
      * footroute = A route marked for foot travel
      * bicycleroute = A route marked for bicycle travel
    """
    # The array with vehicle properties labels for the dictionary creation
    car_props = {
        CAR: [100, 60, 50, 50, 45, 45],
        GOODS: [100, 60, 50, 50, 45, 45],
        GOODS_TRAILER: [100, 70, 50, 50, 45, 45],
        HGV: [100, 100, 50, 25, 10, 5],
        HGV_TRAILER: [100, 100, 50, 25, 10, 5],
    }
    return car_props[vehicle_type] if vehicle_type in VEHICLES else []


def create_road_properties_dict():
    """
    Returns the freshly-created and complex data structure:
      - A dictionary of dictionaries...
      - Where each key is a vehicle type and...
      - Each value is a dict mapping road properties with preference
    e.g.
    {
      CAR: { PAVED: 100, MULTILANE: 60, TUNNEL: 50, ... },
      HGV: { PAVED: 100, MULTILANE: 85, TUNNEL: 25, ... },
      ...
    }
    """
    return {each: dict(zip(PROPS, get_road_props(each))) for each in VEHICLES}


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
