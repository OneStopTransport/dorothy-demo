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

# Vehicle properties labels
HEIGHT = 'height'
LENGTH = 'length'
WEIGHT = 'weight'
WIDTH = 'width'
ONEWAY = 'oneway'
TURNS = 'turns'
# The array with vehicle properties labels for the dictionary creation
CAR_ATTRIBUTES = [HEIGHT, LENGTH, WEIGHT, WIDTH, ONEWAY, TURNS]

# Road properties for road type preferences
PAVED = 'paved'
MULTILANE = 'multilane'
BRIDGE = 'bridge'
TUNNEL = 'tunnel'
FOOTROUTE = 'footroute'
BICYCLEROUTE = 'bicycleroute'
# The array with vehicle properties labels for the dictionary creation
PROPS = [PAVED, MULTILANE, BRIDGE, TUNNEL, FOOTROUTE, BICYCLEROUTE]

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
