// GB app
var GB = (function() {
  function GB(options) {
    var defaults = {};
    options = $.extend({}, defaults, options);
    this.init(options);
  }

  GB.prototype.init = function(options){
    var _this = this;

    // init
    this.opt = options;
    this.data = {};
    this.layers = {};
    this.map_feature_layer = new L.FeatureGroup();

    // init data objects
    _.each(this.opt.data, function(d){
      _this.data[d.year] = [];
      _this.layers[d.year] = {};
    });

    // init icons
    this.icons = {};
    _.each(this.opt.icons, function(icon, key){
      _this.icons[key] = L.icon(icon);
    });

    // init default/deeplink data
    this.params = this.opt.map_params;
    this.loadDeeplinking();

    // load map
    this.map_loaded = $.Deferred();
    $.when(this.map_loaded).done(function() {
      _this.onMapLoaded();
    });
    this.loadMap();
    this.loadYearSelects();
  };

  GB.prototype.addClusterLayer = function(year, data){
    if ('clusters' in this.layers[year]) return false;

    var icons = this.icons,
        cluster = new L.MarkerClusterGroup();

    _.each(data, function(point, i){
      var marker = L.marker(point.latlng, {icon: icons[point.icon]}),
          name = point.name + ' (' + point.type + ')',
          html = '<strong>' + name + '</strong>';

      // check for url
      if ('url' in point) html = '<a href="'+point.url+'" target="_blank">' + name + '</a>';
      html += '<br />' + point.address;

      // check for image
      if ('url' in point && 'image_id' in point) html += '<a href="'+point.url+'" target="_blank"><img src="http://images.nypl.org/index.php?id='+point.image_id+'&t=t" /></a>';
      else if ('image_id' in point) html += '<img src="http://images.nypl.org/index.php?id='+point.image_id+'&t=t" />';

      // bind html
      marker.bindPopup(html);
      cluster.addLayer(marker);
    });

    this.layers[year]['cluster'] = cluster;
  };

  GB.prototype.addHeatLayer = function(year, data){
    if ('heat' in this.layers[year]) return false;

    var points = _.pluck(data, 'latlng'),
        heat = L.heatLayer(points, {
          minOpacity: 0.3
        });

    this.layers[year]['heat'] = heat;
  };

  GB.prototype.deeplink = function(key, value){
    this.params[key] = value;
    var param = $.param(this.params);
    window.location.hash = '#' + param;
  };

  GB.prototype.loadData = function(year_data){
    var _this = this,
        year = year_data.year;

    if (this.data[year].length > 0) {
      this.data_loaded.resolve();
      return false;
    }

    $.getJSON(year_data.url, function(data) {
      var d = _.map(data.rows, function(row){ return _.object(data.cols, row); });

      _this.data[year] = _this.processData(d);

      console.log(data.totalrows + ' addresses loaded');
      _this.data_loaded.resolve();
    });

  };

  GB.prototype.loadDeeplinking = function(){
    if (!window.location.hash || window.location.hash.length < 1) return false;

    var paramString = window.location.hash.substr(1);
    var params = deparam(paramString);

    this.params = $.extend({}, this.params, params);
  };

  GB.prototype.loadListeners = function(){
    var _this = this;

    $('.layer-select').on('click', function(e){
      e.preventDefault();
      e.stopPropagation();

      if ($(this).hasClass('active')) return false;

      _this.showLayer(_this.params.year, $(this).attr('data-layer'));
    });

    $('#year-selects').on('click', '.year-select', function(e){
      e.preventDefault();
      e.stopPropagation();

      if ($(this).hasClass('active')) return false;

      _this.loadYear($(this).attr('data-year'));
    });

    $('.choose-year-link').on('click', function(e){
      e.preventDefault();
      e.stopPropagation();

      _this.loadYear($(this).attr('data-year'));
    });
  };

  GB.prototype.loadMap = function(){
    var _this = this;

    this.map = L.map('map');

    this.map.on('load', function(e) {
      console.log('Map loaded');
      _this.map_loaded.resolve();
    });

    L.tileLayer(this.opt.mapbox.url, {
      id: this.opt.mapbox.map_id,
      accessToken: this.opt.mapbox.access_token,
      attribution: this.opt.mapbox.attribution
    }).addTo(this.map);

    this.map.setView(this.opt.start_latlng, this.opt.start_zoom);
  };

  GB.prototype.loadYear = function(year){
    var _this = this,
        metadata = _.findWhere(this.opt.data, {year: year});

    this.data_loaded = $.Deferred();

    $.when(this.data_loaded).done(function() {
      var data = _this.data[year];
      _this.addClusterLayer(year, data);
      _this.addHeatLayer(year, data);
      _this.showLayer(year, _this.params.layer);

      $('.data-count').text(data.length);
      $('.data-link').text(metadata.title);
      $('.data-link').attr('href', metadata.dc_url);

      _this.deeplink('year', year);
    });

    this.loadData(metadata);
  };

  GB.prototype.loadYearSelects = function(){
    var _this = this,
        $target = $('#year-selects');

    _.each(this.opt.data, function(d){
      var className = 'year-select';
      if (d.year == _this.params.year) className += ' active';
      $target.append($('<a data-year="'+d.year+'" class="'+className+'">'+d.year+'</a>'))
    });
  };

  GB.prototype.onMapLoaded = function(){
    this.loadYear(this.params.year);

    this.loadListeners();
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

  GB.prototype.showLayer = function(year, name){
    $('.layer-select').removeClass('active');
    $('.layer-select[data-layer="'+name+'"]').addClass('active');

    $('.year-select').removeClass('active');
    $('.year-select[data-year="'+year+'"]').addClass('active');

    this.map_feature_layer.clearLayers();
    this.map_feature_layer.addLayer(this.layers[year][name]);
    this.map.addLayer(this.map_feature_layer);
    this.deeplink('layer', name);
  };

  return GB;

})();

// Load app on ready
$(function() {
  var app = new GB(config);
});
