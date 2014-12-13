import requests
from flask import Flask

# Instatiate the Flask server
app = Flask(__name__)
# Routino instance URL
host = 'http://localhost:8080/routino/'
# quickest / shortest are the options
route_type = 'quickest'
# Routino response format: html, gpx, text, ...
resp_format = 'html'


@app.route('/route/<orig_lon>,<orig_lat>/<dest_lon>,<dest_lat>')
def route(orig_lon, orig_lat, dest_lon, dest_lat):
    # Build URLs for Routino
    coords_str = 'lon1={lon1};lon2={lon2};lat1={lat1};lat2={lat2}'.format(
        lon1=orig_lon, lon2=dest_lon,
        lat1=orig_lat, lat2=dest_lat,
    )
    # URL components
    url1 = [host, 'router.cgi?transport=hgv;type={type};', coords_str]
    url2 = [host, 'results.cgi?uuid={uuid};type={type};format={format}']
    # Build the URL
    first_url = ''.join(url1).format(type=route_type)
    # Check if trip was successfully planned
    uuid, status = requests.get(first_url).content.strip().split('\n')
    if status == 'OK':
        # Get the step-by-step data
        second_url = ''.join(url2).format(
            uuid=uuid,
            type=route_type,
            format=resp_format,
        )
        response = requests.get(second_url)
        return requests.get(second_url).content
    else:
        # Inform an error occurred
        return 'Error\n\nCalling {url}'.format(url=first_url)


if __name__ == '__main__':
    app.debug = True
    app.host = '0.0.0.0'
    app.run()
