markers = new Meteor.Collection("clinics");
/*

    A GEO TAGGING COMMUNITY
    []

    Allow users to join agencies and be tracked
    independently in each. Present the user a way
    to select the agency they are in after logging in.
    
    Agencies act as a a list of markers that cannot be modified by
    its members. Members can send their own geocoding location and timestamps to
    agencies for their personal tracking and agencies can send sms messages 
    if the user opts in.
    

        Agency
        
        { 
          _id: <mongo_id>,
          title: <string>,
          owner: <mongo_id:users._id>
        }
        
        
        **Field 'access' might refer to a simple string,
        integer or another mongo id inside another collection;
        but controls the visibility of the marker. Wether its public,
        private to the user (default for users) or inside of the groups
        the user has the ability to post markers to.
        
        Marker
        {
            _id: <mongo_id>,
            title: <>,
            owner: <users._id || agencies.id>,
            address: <string>,
            access: <**>,
            loc : [<float>,<float>]
        
        }
    
    
    If users have accounts at the same agency that are different 
    'types' (i.e. user/marker admin) then show entries for each
    
    Admin accounts can add points that are viewable by everyone.
    
    Users can add points inside of their own account, and inside of 
    groups
*/

agencies = new Meteor.Collection("agencies");

Meteor.startup(function(){
      geocoder = new google.maps.Geocoder();
});



Template.add_marker.events({
    'click input.add_marker' : function(evt,tmpl){
    /*

        ADD NEW marker
            1) Geocode Address
            2) Store data to database for marker.

    */
        var record ={};
        // use tmpl.data??
        console.log('in add marker event');
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
                    //document.getElementById('.marker_address').value = '';
                }else{
                /*
                    Would you like to insert this marker anyway?
                */
                    alert('Could not geocode location.. please check for internet connection');
                    // show input fields..
                }
            });
            /*
            
                ALSO STORE A USER token of some sort so they might
                have secure access
                
            */
            
            // From here let server build the marker and update client.
            $('#marker_add').hide();
            
            // show the button to add another marker
            $('.markerAddShow').show();
            console.log('Its all here lets make an insert. and probably hide something...');
            
            // remove fields from session to avoid accidental field duplication/reentry
        }else{
            // ask to insert a location without a geocoder?
            alert('Gmaps does not seem to be loaded');
        
        }
    }
});


Template.map.events({
    'dblclick div#map_canvas' : function(evt,tmpl){
        placeNavMarker(map.center,undefined,function(){alert("Did you want to place a marker here?")});

    }

});



Template.markers.events({
    'click input.del_marker' : function(evt,tmpl){
        markers.remove({_id:tmpl.data._id});
        // refresh the overlays
        // eventually use SESSION variable to keep track of how to filter the markers
        // based on the user settings/permissions etc.
        lookForMarkers();
    
    },
    'click a.edit_marker' :function(evt,tmpl){
        console.log('edit');
        // probably use the index to look for the term eventually...
        var latlng = new google.maps.LatLng(tmpl.data.loc[0], tmpl.data.loc[1]);

        map.setCenter(latlng);
//        console.log(tmpl.data.loc[0]);
    }
});

var hideMenus = function(){
    
}

Template.loggedInMenu.events({
    'click .agencyAdd' : function(evt,tmpl){
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
  lookForMarkers(latLng);

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
    c = markers.find({}, {fields: {_id: 1}}).fetch();
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
            if(arr['type'] == 'Shelter'){
            // default
                marker_type = undefined;
            }else if (arr['type'] == 'Hospital' ){
            // set to 'hospital marker'
                marker_type = '';

            }else if( arr['type'] == '' ){
                
            }
            placeNavMarker(co,undefined,function(){alert(arr['name'] + ' ' + arr['type']);});
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
    var latlng = new google.maps.LatLng(37.808631, -122.474470);
    createMap(latlng);
    placeNavMarker(navLatLng);
//  addAutocomplete();
}

function placeNavMarker (latLng,image,clickCallBack) {

    if(typeof image == 'undefined')
        var image = "lodging.png";
    else if(typeof image == 'string'){
        // dont show this marker for the geocoded location
        var image = "http://gmaps-samples.googlecode.com/svn/trunk/markers/blue/blank.png";
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