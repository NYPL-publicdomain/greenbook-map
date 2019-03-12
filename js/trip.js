// GB app
var GB = (function() {
  function GB(options) {
    var defaults = {};
    options = $.extend({}, defaults, options);
    this.init(options);
  }

  GB.prototype.init = function(options){
    var _this = this;

    this.opt = options;

    // init pathfinder
    this.hotel_every = this.opt.pathfinder.hotel_every * this.opt.pathfinder.mph;
    this.restaurant_every = this.opt.pathfinder.restaurant_every * this.opt.pathfinder.mph;
    console.log('Hotel every '+this.hotel_every+' miles');
    console.log('Restaurant every '+this.restaurant_every+' miles');
    $('.data-hotel-miles').text(this.hotel_every);
    $('.data-restaurant-miles').text(this.restaurant_every);

    // init icons
    this.icons = {};
    _.each(this.opt.icons, function(icon, key){
      _this.icons[key] = L.icon(icon);
    });

    this.data_loaded = $.Deferred();
    this.map_loaded = $.Deferred();
    this.path_loaded = false;

    $.when(this.data_loaded, this.map_loaded).done(function() {
      _this.onReady();
    });

    this.loadYearSelects();
    this.loadMap();
    this.loadData();
  };

  GB.prototype.addPathToList = function(){
    var _this = this,
        $list = $('#path-list');

    $list.empty();

    _.each(this.path, function(point){
      $list.append($('<li class="'+point.type_group+'"><div class="name">'+point.name+'</div><div class="address">'+point.address+'</div><div class="type">'+point.type+'</div></li>'));
    });
  };

  GB.prototype.addPathToMap = function(){
    var _this = this,
        icons = this.icons;

    // clear or initialize feature layer
    if (this.map_feature_layer) {
      this.map_feature_layer.clearLayers();
    } else {
      this.map_feature_layer = new L.FeatureGroup();
    }

    // draw markers
    _.each(this.path, function(point, i){
      var icon = point.icon || 'place',
          marker = L.marker(point.latlng, {icon: icons[icon]}),
          name = point.name + ' (' + point.type + ')',
          html = '<strong>' + name + '</strong>';

      // check for url
      if ('url' in point) html = '<a href="'+point.url+'" target="_blank">' + name + '</a>';
      html += '<br />' + point.address;

      // check for image
      if ('url' in point && 'image_id' in point) html += '<a href="'+point.url+'" target="_blank"><img src="http://images.nypl.org/index.php?id='+point.image_id+'&t=t" /></a>';
      else if ('image_id' in point) html += '<img src="http://images.nypl.org/index.php?id='+point.image_id+'&t=t" />';

      // draw marker
      marker.bindPopup(html);
      _this.map_feature_layer.addLayer(marker);
      _this.path[i].marker = marker;
    });

    // create a red polyline from an array of LatLng points
    var latlngs = _.pluck(this.path, 'latlng');
    this.route_loaded = $.Deferred();

    $.when(this.route_loaded).done(function(route) {
      if (!route || !route.length) {
        route = latlngs;
      }
      var polyline = L.polyline(route, {color: 'red'});
      _this.map_feature_layer.addLayer(polyline);

      // zoom the map to the polyline
      _this.map.addLayer(_this.map_feature_layer);
      _this.map.fitBounds(polyline.getBounds());
      _this.onPathLoaded();
    });

    this.loadRoute(latlngs);
  };

  GB.prototype.doPath = function(origin, destination){
    var _this = this,
        total_miles = _getDistanceFromLatLonInMiles(origin.lat, origin.lon, destination.lat, destination.lon),
        angle_between = _angleBetween(origin.lat, origin.lon, destination.lat, destination.lon);

    console.log(total_miles + ' miles between two points');
    console.log(angle_between + ' radians between two points');

    this.path = [
      {
        name: 'Start Location',
        address: origin.display_name,
        type: 'Address',
        type_group: 'address',
        latlng: [origin.lat, origin.lon]
      }
    ];

    var current_lat = origin.lat,
        current_lng = origin.lon,
        miles_travelled = 0,
        miles_since_hotel = 0,
        miles_left = total_miles,
        points = 0,
        max_points = this.opt.pathfinder.max_points;

    while(miles_left > this.restaurant_every && points < max_points) {
      // move and look for a restaurant
      var latlng = _movePoint(current_lat, current_lng, angle_between, this.restaurant_every);
      // console.log('Moved '+this.restaurant_every+' miles from ['+current_lat+','+current_lng+'] to ['+latlng[0]+','+latlng[1]+']')
      this.path.push(this.findClosestPlace(latlng, 'restaurant'));

      // determine how many miles we travelled
      var miles = _getDistanceFromLatLonInMiles(current_lat, current_lng, latlng[0], latlng[1]);
      miles_travelled += miles;
      miles_since_hotel += miles;

      // if we've travelled far enough, stop at a hotel
      if (miles_since_hotel >= this.hotel_every) {
        this.path.push(this.findClosestPlace(latlng, 'hotel'));
        miles_since_hotel = 0;
      }

      // set destination to current, update angle
      current_lat = latlng[0];
      current_lng = latlng[1];
      angle_between = _angleBetween(current_lat, current_lng, destination.lat, destination.lon);
      miles_left = _getDistanceFromLatLonInMiles(current_lat, current_lng, destination.lat, destination.lon);
      points++;
    }

    // add restaurant if path is empty
    if (!this.path.length) {
      this.path.push(this.findClosestPlace([destination.lat, destination.lon], 'restaurant'));
    }

    // if no hotel in last spot, add hotel to path
    if (this.path[this.path.length-1].type != 'hotel') {
      this.path.push(this.findClosestPlace([destination.lat, destination.lon], 'hotel'));
    }

    // console.log(this.path.length + ' steps in path');
    // console.log(this.path);

    this.addPathToMap();
    this.addPathToList();
  };

  GB.prototype.findClosestPlace = function(latlng, type) {
    var _this = this,
        lat = latlng[0],
        lng = latlng[1],
        types = this.opt.pathfinder.types[type];

    // filter list to place types and places not already in current path
    var places = _.filter(this.current_year_data.rows, function(item){
      return _.contains(types, item.type.toLowerCase()) && !_.find(_this.path, function(p){ return p.latlng[0]==item.latlng[0] && p.latlng[1]==item.latlng[1];});
    });

    // console.log(places.length + ' possible places');
    // console.log(places);

    var closest = _.min(places, function(item){
      return _dist(lat, lng, item.latlng[0], item.latlng[1]);
    });

    // console.log('Found closest address: ', closest);
    closest.type_group = type;

    return closest;
  };

  GB.prototype.loadData = function(){
    var _this = this;

    this.data = {};
    this.yearsTotal = this.opt.data.length;
    this.yearsLoaded = 0;

    _.each(this.opt.data, function(metadata){
      var year_data = _.clone(metadata);
      year_data.rows = [];
      _this.data[metadata.year] = year_data;

      $.getJSON(metadata.url, function(data) {
        var d = _.map(data.rows, function(row){ return _.object(data.cols, row); });

        _this.data[data.year].rows = _this.processData(d);
        _this.yearsLoaded++;

        console.log(data.totalrows + ' addresses loaded from ' + data.year);
        if (_this.yearsLoaded >= _this.yearsTotal) {
          _this.data_loaded.resolve();
        }
      });
    });
  };

  GB.prototype.loadListeners = function(){
    var _this = this;

    $('.form-button').on('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      _this.modalShow('#path-form-modal');
    });

    $('#path-form').on('submit', function(e){
      e.preventDefault();
      if ($('#path-form-submit').hasClass('loading')) return false;
      _this.submitPath($('#origin').val(), $('#destination').val(), $('#select-year .select.active').first().attr('data-value'));
    });

    $('#path-list').on('mouseover', 'li', function(e) {
      _this.markerShow($('#path-list li').index($(this)));
    });

    $('#path-list').on('mouseleave', 'li', function(e) {
      _this.markerHide($('#path-list li').index($(this)));
    });

    $('.modal-close').on('click', function(e){
      e.preventDefault();
      if (!_this.path) return false;
      _this.modalHide();
    });

    $('.select-group').on('click', '.select', function(e){
      e.preventDefault();
      var $group = $(this.closest('.select-group'));
      $group.find('.select').removeClass('active');
      $(this).addClass('active');
    });
  };

  GB.prototype.loadMap = function(){
    var _this = this;

    var map = L.map('map', {maxZoom: 15}).setView(this.opt.start_latlng, this.opt.start_zoom);

    var gl = L.mapboxGL({
        accessToken: this.opt.mapbox.access_token,
        style: this.opt.map_style
    }).addTo(map);

    this.map = map;
    console.log('Map loaded');
    this.map_loaded.resolve();
  };

  GB.prototype.loadRoute = function(latlngs) {
    var _this = this,
        latlng_strings = _.map(latlngs, function(ll){ return ll[1] + ',' + ll[0]; }),
        latlng_string = latlng_strings.join(';'),
        url = this.opt.mapbox.directions_url.replace('{accessToken}',this.opt.mapbox.access_token).replace('{waypoints}',latlng_string);

    // console.log('Retrieving directions from '+url);

    // look up route
    $.getJSON(url)
      .done(function(data) {
        if (data && data.routes && data.routes.length && data.routes[0].geometry && data.routes[0].geometry.coordinates.length) {
          var route = _.map(data.routes[0].geometry.coordinates, function(c){ return [c[1], c[0]]; });
          console.log('Loaded route with ' + route.length + ' coordinates.');
          _this.route_loaded.resolve(route);
        } else {
          console.log('Invalid route');
          _this.route_loaded.resolve([]);
        }
      })
      .fail(function( jqxhr, textStatus, error ) {
        console.log('Request Failed: ' + textStatus + ', ' + error);
        _this.route_loaded.resolve([]);
      });
  };

  GB.prototype.loadYearSelects = function(){
    var _this = this,
        $target = $('#select-year'),
        current_year = this.opt.trip_params.year;

    _.each(this.opt.data, function(d){
      var className = 'select button';
      if (d.year == current_year) className += ' active';
      $target.append($('<div data-value="'+d.year+'" class="'+className+'">'+d.year+'</a>'));
    });
  };

  GB.prototype.lookupAddress = function(address, deferred) {
    $.getJSON(this.opt.nominatim_url.replace('{q}', _urlencode(address)), function(data) {
      if (!data.length) {
        alert('No matches found for '+address);
        return false;
      }
      var the_address = data[0],
          name = the_address.display_name;

      if ((name.indexOf('United States of America')<0 && name.indexOf('US')<0) || name.indexOf('Alaska')>=0 || name.indexOf('Hawaii')>=0) {
        console.log(the_address);
        alert('Addresses must be in the continental U.S.');
      }

      the_address.lat = parseFloat(the_address.lat);
      the_address.lon = parseFloat(the_address.lon);
      console.log('Found: '+name+' ['+the_address.lat+','+the_address.lon+']');
      deferred.resolve(the_address);
    });
  };

  GB.prototype.markerHide = function(i){
    this.path[i].marker.closePopup();
  };

  GB.prototype.markerShow = function(i){
    this.path[i].marker.openPopup();
  };

  GB.prototype.modalHide = function(){
    $('#modal').removeClass('active');
  };

  GB.prototype.modalShow = function(id){
    $('.modal-content').removeClass('active');
    $(id).addClass('active');
    $('#modal').addClass('active');
  };

  GB.prototype.onReady = function(){
    $('.loading').removeClass('loading');

    $('#origin').focus().select();

    this.loadListeners();
  };

  GB.prototype.onPathLoaded = function(){
    this.modalHide();
    this.path_loaded = true;
    $('#path-form-submit').removeClass('loading');
  };

  GB.prototype.processData = function(data){
    var icons = this.opt.icons,
        types = this.opt.pathfinder.types,
        icon_keys = _.keys(icons),
        type_keys = _.keys(types);

    _.each(data, function(d, i){
      var icon = 'place';

      // search for icon
      _.each(icon_keys, function(key){
        if (_.contains(type_keys, key)) {
          if (_.contains(types[key], d.type.toLowerCase())) {
            icon = key;
            return false;
          }
        }
      });

      // add icons
      data[i]['icon'] = icon;
    });

    return data;
  };

  GB.prototype.submitPath = function(origin, destination, year){
    if (!origin.length || !destination.length) {
      alert('Please enter an origin and destination address.');
      return false;
    }

    this.current_year_data = this.data[year];

    $('#path-form-submit').addClass('loading');

    var _this = this,
        origin_found = $.Deferred(),
        destination_found = $.Deferred();

    $.when(origin_found, destination_found).done(function(the_origin, the_destination) {
      _this.doPath(the_origin, the_destination);
    });

    this.updateMetadata(this.current_year_data);
    this.lookupAddress(origin, origin_found);
    this.lookupAddress(destination, destination_found);

  };

  GB.prototype.updateMetadata = function(data){
    $('.data-count').text(data.rows.length);
    $('.data-link').text(data.title);
    $('.data-link').attr('href', data.dc_url);
    $('.map-link').attr('href', 'map.html#year='+data.year);
  };

  function _angleBetween(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
  };

  function _deg2rad(deg) {
    return deg * (Math.PI/180);
  };

  function _dist(x1, y1, x2, y2) {
    return Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
  };

  function _getDistanceFromLatLonInMiles(lat1,lon1,lat2,lon2) {
    var R = 3959; // Radius of the earth in miles
    var dLat = _deg2rad(lat2-lat1);  // deg2rad below
    var dLon = _deg2rad(lon2-lon1);
    var a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(_deg2rad(lat1)) * Math.cos(_deg2rad(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c; // Distance in km
    return d;
  };

  function _movePoint(lat, lng, rad, distance){
    // determine miles to travel
    var milesX = distance * Math.cos(rad);
    var milesY = distance * Math.sin(rad);

    // Reference:
    // http://stackoverflow.com/questions/1253499/simple-calculations-for-working-with-lat-lon-km-distance
    var degX = milesX / 68.70749821,
        lat2 = lat + degX;

    var degY = milesY / 69.1710411,
        lng2 = lng + degY;

    return [lat2, lng2];
  }

  function _urlencode(str){
    return encodeURIComponent(str).replace('%20','+');
  };

  return GB;

})();

// Load app on ready
$(function() {
  var app = new GB(config);
});
