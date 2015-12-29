var config = {
  mapbox: {
    access_token: 'pk.eyJ1IjoibnlwbGxhYnMiLCJhIjoiSFVmbFM0YyJ9.sl0CRaO71he1XMf_362FZQ',
    map_id: 'mapbox.light',
    url: 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}',
    attribution: 'Map data &copy; <a href="http://openstreetmap.org" target="blank">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/" target="blank">CC-BY-SA</a>, Imagery &copy; <a href="http://mapbox.com" target="blank">Mapbox</a>',
    directions_url: 'https://api.mapbox.com/v4/directions/mapbox.driving/{waypoints}.json?access_token={accessToken}',
    icon: {
      iconUrl: 'img/greenbooks_marker.png',
      iconSize: [25, 40],
      iconAnchor: [13, 40],
      popupAnchor: [0, -40]
    }
  },
  nominatim_url: 'http://nominatim.openstreetmap.org/search?q={q}&format=json',
  start_latlng: [38.5767, -92.1736], // Jefferson City, MO as center
  start_zoom: 4, // see the whole country
  pathfinder: {
    types: {
      hotel: ['Tourist Home', 'Hotel', 'Y.M.C.A./Y.W.C.A.', 'Guest House', 'Motel', 'Hotel; Tourist Home', 'Inn', 'Y.M.C.A./Y.W.C.A.; Tourist Home', 'Tourist Home; Restaurant', 'Motel; Restaurant', 'Inn; Tourist Home', 'Cabins', 'Cottage', 'Cottages; Tourist Home', 'Rooming House', 'Camp', 'Hotel; Restaurant', 'Lodge', 'Boarding House', 'Resort', 'Villa', 'Rooms'],
      restaurant: ['Restaurant', 'Tourist Home; Restaurant', 'Motel; Restaurant', 'Hotel; Restaurant']
    },
    mph: 50,
    hotel_every: 15,
    restaurant_every: 5,
    max_points: 20
  }
};

// Types:
// ['Tourist Home', 'Restaurant', 'Hotel', 'Y.M.C.A./Y.W.C.A.', 'Guest House', 'Motel', 'Hotel; Tourist Home', 'Inn', 'Y.M.C.A./Y.W.C.A.; Tourist Home', 'Not Specified / Other', 'Tourist Home; Restaurant', 'Motel; Restaurant', 'Inn; Tourist Home', 'Cabins', 'Cottage', 'Cottages; Tourist Home', 'Not Specified', 'Rooming House', 'Camp', 'Hotel; Restaurant', 'Apartments', 'Ranch', 'Court', 'Lodge', 'Cycle Livery', 'Beauty Parlor', 'Spa', 'Farm', 'Boarding House', 'Resort', 'Villa', 'Rooms']
