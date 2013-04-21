markers = new Meteor.Collection("clinics");

agencies = new Meteor.Collection("agencies");

Meteor.startup(function(){
      geocoder = new google.maps.Geocoder();
});



Template.add_marker.events({
    'click input.add_marker' : function(evt,tmpl){
   var record ={};
        var geo_term=tmpl.find(".marker_address").value;
        record.name = tmpl.find(".marker_name").value;
        record.type = tmpl.find(".marker_type").value;
        record.visibility = tmpl.find(".marker_type").marker_visiblity;
        console.log(record);
        if(typeof geocoder != 'undefined'){
            geocoder.geocode({'address':geo_term},function(results,status){
                results = results[0];
                if(status == google.maps.GeocoderStatus.OK){
                    map.setCenter(results.geometry.location);
                    record.loc = [results.geometry.location.jb,results.geometry.location.kb];
                    markers.insert(record);
                    lookForMarkers([results.geometry.location.jb,results.geometry.location.kb]);
                }else{
                /*
                    Would you like to insert this marker anyway?
                */
                    alert('Could not geocode location.. please check for internet connection');
                    // show input fields..
                }
            });
            $('#marker_add').hide();
            // show the button to add another marker
            $('.markerAddShow').show();
            
            // remove fields from session to avoid accidental field duplication/reentry
        }else{
            // ask to insert a location without a geocoder?
            alert('Gmaps does not seem to be loaded');
        
        }
    }
});

Template.add

//Template.map.events({
   // 'dblclick div#map_canvas' : function(evt,tmpl){
     //   placeNavMarker(map.center,undefined,function(){alert("Did you want to place a marker here?")});

//    }

//});

Template.markers.events({
    'click input.del_marker' : function(evt,tmpl){
        // Meteor.call("delete_record", mongo_id);
        // then remove locally ? this would not be needed.. probably
        markers.remove({_id:tmpl.data._id});
        // am i really to look for more markers? wont auto update do this?
    },
    'click a.edit_marker' :function(evt,tmpl){
        // probably use the index to look for the term eventually...
        var latlng = new google.maps.LatLng(tmpl.data.loc[0], tmpl.data.loc[1]);
        map.setCenter(latlng);
    }
});

Template.loggedInMenu.events({
    'click .agencyAdd' : function(evt,tmpl){
        // Meteor.call("add_agency");
        // step one get input from tmpl
        console.log(tmpl);
        // agencies.insert();
        // step to hide all menus (agency add was clicked)
        Template.loggedInMenu.rendered();
        $('div#agency_new').show();
 
    },
    'click .showMarkers' : function(evt,tmpl){
        Template.loggedInMenu.rendered();
        $('div#the_markers').show();
 
    },
    
    'click .markerEditShow': function(evt,tmpl){
        Template.loggedInMenu.rendered();
        $('div#marker_edit').show();
    },'click .markerAddShow': function(evt,tmpl){
        Template.loggedInMenu.rendered();
        $('div#marker_add').show();
    },
    'click .settingsShow': function(evt,tmpl){
        Template.loggedInMenu.rendered();
        console.log('showing settings');
        $('div#user_settings').show();
    },
    'click .geolocate': function(evt,tmpl){
        if(navigator.geolocation){
            navigator.geolocation.getCurrentPosition(successFunction, errorFunction);
        }else{
            alert('Could not geolocate');
        }
  
    }

});



Template.loggedInMenu.marker_index = function(evt,tmpl){
// get User. something to filter this find
    return markers.find({},{});
}

Template.loggedInMenu.rendered = function(evt,tmpl){
    
    $('div#marker_add').hide();
    $('div#user_settings').hide();
    $('div#the_markers').hide();
    $('div#marker_edit').hide();
    $('div#agency_new').hide();

    lookForMarkers();


}

Template.content.rendered = function(){
// IF MOBILE .. attempt to detect screen orientation/load different css to do horizontal nav
// versus vertical
  var isMobile = navigator.userAgent.match(/(iPhone|iPod|iPad|Android|iemobile|BlackBerry)/);
  
  //
  // default 
  createMap(new google.maps.LatLng(37.7835478, -122.408953));
  // is this running?
  lookForMarkers();

// lookForMarkers();
  // if no map can be created then we are working offline...
}

/* TODO
Template.settings.events({
 
    'click input.update' : function(evt,tmpl){
    
    }
});*/
/* BEGIN GMAPS


 TO Eventually support hiding /showing markers quickly in gmaps.. trying to get that to work properly..
 
 */
currentMarkers = [];

function lookForMarkers(theBox){
// set ceter of map to the marker you just created
    c = markers.find({}, {}).fetch();
    console.log(currentMarkers.length);
    //console.log(c);
    if(typeof c != 'undefined')
    c.filter(function (arr){
        // make new nat lav
        console.log(arr);
        
        /*
         Backwards support.. remove when releasing.. Supports the
         appropriate way of storing lat/long for geo queries.
        */
        if(typeof arr['loc'] != 'undefined'){
            var co = new google.maps.LatLng(arr['loc'][0], arr['loc'][1]);
            var marker_type = '';
            if(arr['type'] == 'Shelter' || arr['type'] == 'Hospital' || arr['type'] == 'Other' || arr['type'] == 'Pharmacy' || arr['type'] == 'Clinic'){
            // default
                marker_type = arr['type'];
            }else{
                marker_type = undefined;
            }
            placeNavMarker(co,marker_type,function(){alert(arr['name'] + ' ' + arr['type']);});
        }
        }
    );
}

function createMap (latLng) {
    console.log('making map');
    var mapOptions = {
        disableDoubleClick: true,
        streetViewControl: false,
        scrollwheel: false,
        zoom: 15,
        center: latLng,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
};

function successFunction(success) {
  var navLatLng = new google.maps.LatLng(success.coords.latitude, success.coords.longitude);
  // annoying...
  createMap(navLatLng);
  // send it true option to use different marker
  placeNavMarker(navLatLng,true);
  lookForMarkers([navLatLng.jb,navLatLng.kb]);
}

function errorFunction(success) {
    var latlng = new google.maps.LatLng(37.7835478, -122.408953);
    createMap(latlng);
    placeNavMarker(navLatLng);
//  addAutocomplete();
}

function placeNavMarker (latLng,image,clickCallBack) {

    if(typeof image == 'undefined')
        var image = "Other.png";
    else if(typeof image == 'string'){
        // dont show this marker for the geocoded location
        var image = image + ".png";
        console.log("Should be using"+image);
    }else{
        var image = "http://gmaps-samples.googlecode.com/svn/trunk/markers/blue/blank.png";
    }
    // this map is not always there>>>?
    var new_marker = new google.maps.Marker({
      position: latLng,
      map: map,
      icon: image
    });
    if(typeof clickCallBack == 'function')
        google.maps.event.addListener(new_marker,"click",clickCallBack);
    currentMarkers.push( new_marker );
}