var markersArray = [];
var instaArray = [];

Meteor.startup(function(){
  Session.set('photoset', '');
  Session.set('zoomed', '');
  getTwitter();

  var isMobile = navigator.userAgent.match(/(iPhone|iPod|iPad|Android|iemobile|BlackBerry)/);
  console.log(isMobile);

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(successFunction, errorFunction);
  }
  else {
      alert('It appears that Geolocation, which is required for this web page application, is not enabled in your browser. Please use a browser which supports the Geolocation API.');
  }

  function successFunction(success) {
      var navLatLng = newLatLng(success);
      createMap(navLatLng);
      placeNavMarker(navLatLng);
      addAutocomplete();
  }

  function errorFunction(success) {
    // alert("You've disabled your geolocation... So here are some pretty pictures of the Golden Gate bridge... You can always click around on the map or use the search to see more photos");
    var latlng = new google.maps.LatLng(37.808631, -122.474470);
    createMap(latlng);
    placeNavMarker(navLatLng);
    addAutocomplete();
  }

});

//GOOGLE MAPS HELPERS

function newLatLng(success) {
   return new google.maps.LatLng(success.coords.latitude, success.coords.longitude);
}

function createMap(latLng) {
  var mapOptions = {
    streetViewControl: false,
    scrollwheel: false,
    zoom: 15,
    center: latLng,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
}

function addAutocomplete() {
  var input = document.getElementById('searchTextField');
  autocomplete = new google.maps.places.Autocomplete(input);
  google.maps.event.addListener(autocomplete, 'place_changed', function() {
    var place = autocomplete.getPlace();
    placeClickMarker(place.geometry.location);
    map.setCenter(place.geometry.location);
    map.setZoom(15);
  });
}

function placeNavMarker(latLng) {
  var image = "http://gmaps-samples.googlecode.com/svn/trunk/markers/blue/blank.png";
  var blueIcon = new google.maps.Marker({
      position: latLng,
      map: map,
      icon: image
  });
}
//GENERAL HELPERS
var getTwitter = function() {
  !function(d,s,id){
    var js,fjs= d.getElementsByTagName(s)[0];
    if(!d.getElementById(id)){
      js=d.createElement(s);js.id=id;
      js.src="https://platform.twitter.com/widgets.js";
      fjs.parentNode.insertBefore(js,fjs);
    }
  }(document,"script","twitter-wjs");
}

$('div#social').hide()
