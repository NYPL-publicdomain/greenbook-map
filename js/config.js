var config = {
  map_params: {
    layer: 'cluster',
    year: '1947'
  },
  trip_params: {
    year: '1947'
  },
  data: [
    {
      year: '1947',
      url: 'data/greenbook_1947.json',
      title: 'The Negro Motorist Green Book: 1947',
      dc_url: 'http://digitalcollections.nypl.org/items/29219280-892b-0132-4271-58d385a7bbd0'
    },{
      year: '1956',
      url: 'data/greenbook_1956.json',
      title: 'The Negro Travelers\' Green Book: Spring 1956',
      dc_url: 'http://digital.tcl.sc.edu/cdm/compoundobject/collection/greenbook/id/88'
    }
  ],
  mapbox: {
    access_token: 'pk.eyJ1IjoiYnJpYW5mb28iLCJhIjoiY2wxbTd3ZDBzMGg3cjNjbjR4N21ncHV6eiJ9.NI5jF8yQPpg3gmK70uf-Hw',
    map_style: 'mapbox://styles/mapbox/light-v9',
    attribution: 'Map data &copy; <a href="http://openstreetmap.org" target="blank">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/" target="blank">CC-BY-SA</a>, Imagery &copy; <a href="http://mapbox.com" target="blank">Mapbox</a>',
    directions_url: 'https://api.mapbox.com/v4/directions/mapbox.driving/{waypoints}.json?access_token={accessToken}'
  },
  icons: {
    place: {
      iconUrl: 'img/greenbooks_marker.png',
      iconSize: [25, 40],
      iconAnchor: [13, 40],
      popupAnchor: [0, -40]
    },
    hotel: {
      iconUrl: 'img/hotel_marker.png',
      iconSize: [40, 24],
      iconAnchor: [20, 24],
      popupAnchor: [0, -24]
    },
    restaurant: {
      iconUrl: 'img/restaurant_marker.png',
      iconSize: [21, 40],
      iconAnchor: [11, 40],
      popupAnchor: [0, -40]
    },
    nightlife: {
      iconUrl: 'img/nightlife_marker.png',
      iconSize: [13, 40],
      iconAnchor: [7, 40],
      popupAnchor: [0, -40]
    }
  },
  nominatim_url: 'https://nominatim.openstreetmap.org/search?q={q}&format=json',
  start_latlng: [38.5767, -92.1736], // Jefferson City, MO as center
  start_zoom: 4, // see the whole country
  pathfinder: {
    types: {
      hotel: ['tourist home', 'hotel', 'y.m.c.a./y.w.c.a.', 'guest house', 'motel', 'hotel; tourist home', 'inn', 'y.m.c.a./y.w.c.a.; tourist home', 'tourist home; restaurant', 'motel; restaurant', 'inn; tourist home', 'cabins', 'cottage', 'cottages; tourist home', 'rooming house', 'camp', 'hotel; restaurant', 'lodge', 'boarding house', 'resort', 'villa', 'rooms'],
      restaurant: ['restaurant', 'tourist home; restaurant', 'motel; restaurant', 'hotel; restaurant', 'tavern'],
      nightlife: ['tavern', 'liquor store', 'night club', 'road house']
    },
    mph: 50,
    hotel_every: 15,
    restaurant_every: 5,
    max_points: 20
  }
};

// Types:
// ['Tourist Home', 'Restaurant', 'Hotel', 'Y.M.C.A./Y.W.C.A.', 'Guest House', 'Motel', 'Hotel; Tourist Home', 'Inn', 'Y.M.C.A./Y.W.C.A.; Tourist Home', 'Not Specified / Other', 'Tourist Home; Restaurant', 'Motel; Restaurant', 'Inn; Tourist Home', 'Cabins', 'Cottage', 'Cottages; Tourist Home', 'Not Specified', 'Rooming House', 'Camp', 'Hotel; Restaurant', 'Apartments', 'Ranch', 'Court', 'Lodge', 'Cycle Livery', 'Beauty Parlor', 'Spa', 'Farm', 'Boarding House', 'Resort', 'Villa', 'Rooms']
