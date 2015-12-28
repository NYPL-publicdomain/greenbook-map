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

    this.data_loaded = $.Deferred();
    this.map_loaded = $.Deferred();

    $.when(this.data_loaded, this.map_loaded).done(function() {
      _this.onReady();
    });

    this.loadMap();
    this.loadData();
  };

  GB.prototype.loadData = function(){
    var _this = this;

    this.data = [];

    $.getJSON("data/greenbook_1956.json", function(data) {
      _this.data = _.map(data.rows, function(row){ return _.object(data.cols, row); });

      console.log(data.totalrows + ' addresses loaded');
      _this.data_loaded.resolve();
    });

  };

  GB.prototype.loadListeners = function(){
    var _this = this;
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

  return GB;

})();

// Load app on ready
$(function() {
  var app = new GB(config);
});
