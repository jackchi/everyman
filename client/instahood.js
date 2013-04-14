Meteor.startup(function(){

  clinics = new Meteor.Collection("clinics");
  users = new Meteor.Collection("user");
  geocoder = new google.maps.Geocoder();
  var mapOptions = {
        streetViewControl: false,
        scrollwheel: false,
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };
  map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
   
});

Template.add_clinic.events({
    'click input.add_clinic' : function(evt,tmpl){
        ["clinic_name","clinic_address"].filter(function(arr){
            Session.set(arr,tmpl.find("." + arr ).value);
        });
    }
});

Template.settings.events({
    'click input.update_phone' : function(evt,tmpl){
    
    },
    'click input.update_email' : function(evt,tmpl){
    
    }
});


  var makeMarker = function(loc) {
    if(!loc.coordinates) return;

    var pinColor = "AF83CC";
    var pinImage = new google.maps.MarkerImage(
      "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColor,
      new google.maps.Size(21, 34),
      new google.maps.Point(0,0),
      new google.maps.Point(10, 34)
    );

    var marker = new google.maps.Marker({
      map: map,
      icon: pinImage,
      position: new google.maps.LatLng(loc.coordinates[0], loc.coordinates[1])
    });

    google.maps.event.addListener(marker, 'click', function() {
      window.open(loc.link);
    });

    // save to avoid duplicates later
    locations[loc._id] = marker;
  }

    var createMap=function (latLng) {
      var mapOptions = {
        streetViewControl: false,
        scrollwheel: false,
        zoom: 15,
        center: latLng,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };
      map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
      lookForMarkers();
    };
    
    var addAutocomplete=function () {
      var input = document.getElementById('searchTextField');
      autocomplete = new google.maps.places.Autocomplete(input);
      google.maps.event.addListener(autocomplete, 'place_changed', function() {
        var place = autocomplete.getPlace();
        placeClickMarker(place.geometry.location);
        map.setCenter(place.geometry.location);
        map.setZoom(15);
      });
    }
    var placeNavMarker=function (latLng,start) {
      if(typeof start == 'undefined')
        var image = "lodging.png";
      else{
      // dont show this marker for the geocoded location
        var image = "http://gmaps-samples.googlecode.com/svn/trunk/markers/blue/blank.png";
        
          //Meteor.subscribe("markers", Session.get("searchQuery"));
        
        }
      // this map is not always there>>>?
      var blueIcon = new google.maps.Marker({
          position: latLng,
          map: map,
          icon: image
      });
    }


  function errorFunction(success) {
    // alert("You've disabled your geolocation... So here are some pretty pictures of the Golden Gate bridge... You can always click around on the map or use the search to see more photos");
    
    //console.log('error');
    var latlng = new google.maps.LatLng(37.808631, -122.474470);
    createMap(latlng);
    placeNavMarker(navLatLng);
    addAutocomplete();
  }


 function lookForMarkers(theBox){
    console.log(theBox);
//    if(typeof theBox != 'undefined'){
  //        console.log('looking for specific markers');
     //  var c= clinics.find({ loc : { $within : { "$box" : theBox }}});
    //   console.log(c);
 
//    }else{
       console.log('looking for ALL markers');
       // c is undefined??
       // supports callback??
       var c = Meteor.call("findMarker",theBox,function(err,data){
       console.log(err);
        console.log(data);
        // server side.. great...
       });
        
       
       var c = clinics.find({}, {fields: {_id: 1}}).fetch();
//       }
    
       //console.log(c);
        c.filter(function (arr){
        // make new nat lav
            console.log(arr['loc']);
            /*
             Backwards support.. remove when releasing.. Supports the
             appropriate way of storing lat/long for geo queries.
            */
            if(typeof arr['loc'] != 'undefined'){
                var co = new google.maps.LatLng(arr['loc'][0], arr['loc'][1]);
                placeNavMarker(co);
            }else if(typeof arr['x'] != 'undefined' && typeof arr['y'] != 'undefined'){
                var co = new google.maps.LatLng(arr['x'], arr['y']);
                placeNavMarker(co);

            }
        });
 }
Template.content.rendered = function(){

Deps.autorun(function (c) {
// this cause problems if more than one key are undefined....
  filter_var = true;
  var fields = ["clinic_name","clinic_address"]
  fields.filter(function(key){
  // do other filtering here too .. but probably easier in second block
    if (( Session.equals(key, undefined) || Session.equals(key, '')) && filter_var == true){
     filter_var = false;
    }
   });
   
   if(filter_var == true){
    // then insert a record
    /*
        Do validation here
    */
        var record ={};
        var geo_term='';
        fields.filter(function(key){
            record[key] = Session.get(key);
            geo_term += ' '+record[key];
        });
        
        console.log('attempting to geo code ' + geo_term);
         geocoder.geocode({'address':geo_term},function(results,status){
        console.log(results);
        results = results[0];
        if(status == google.maps.GeocoderStatus.OK){
        // try to avoid recreating map.. but only function that seems to work for now...
        
            console.log(record);
            record.loc = [results.geometry.location.jb,results.geometry.location.kb];

            clinics.insert(record);
           // placeNavMarker(results.geometry.location);
           // createMap(results.geometry.location);
            console.log(results.geometry.location.kb);
            // wants a box.. aghhhh
            lookForMarkers([results.geometry.location.jb,results.geometry.location.kb]);


        }else{
            alert('Could not geocode location.. please check');
            // show input fields..
        }
        });

        
        /*
        
            ALSO STORE A USER token of some sort so they might
            have secure access
            
        */
        
        // From here let server build the marker and update client.
        $('#clinic_add').hide();
        // show the button to add another clinic
        $('.clinicAddShow').show();
        console.log('Its all here lets make an insert. and probably hide something...');
        
        // remove fields from session to avoid accidental field duplication/reentry
        fields.filter(function(key){
            Session.set(key,undefined);
            Template.find('input.' + key).value = '';
        });
        
        
        // also set the values in the dom to nothing
        
        
   }else{
   /*
    Move this code to a template function!!!
   */
    // check to see if any new markers exist and put them on the screen somehow? without erasing everything...
          //map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
      // add different markers now?
      
        //placeNavMarker(results.geometry.location);
   }
  });
  var isMobile = navigator.userAgent.match(/(iPhone|iPod|iPad|Android|iemobile|BlackBerry)/);
      if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(successFunction, errorFunction);
  }
  else {
      alert('It appears that Geolocation, which is required for this web page application, is not enabled in your browser. Please use a browser which supports the Geolocation API.');
  }

  function successFunction(success) {
      var navLatLng = newLatLng(success);
      // annoying...
      createMap(navLatLng);
      // send it true option to use different marker
      placeNavMarker(navLatLng,true);
      console.log(navLatLng);
      // set 
      // pass in x,y?
      // pass this navLatLng and then perform a geomongo lookup
     //  console.log('subscribing');
       // Meteor.subscribe("markers", [navLatLng.jb,navLatLng.kb]);
    // this doesnt seem to be working... hmm
      lookForMarkers();
      lookForMarkers([navLatLng.jb,navLatLng.kb]);
  }

    $('div#social').hide();
    $('div#clinic_add').hide();
    $('div#user_settings').hide();
    // not sure where this one is going...
    getTwitter();

}


//GOOGLE MAPS HELPERS

function newLatLng(success) {
   return new google.maps.LatLng(success.coords.latitude, success.coords.longitude);
}

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