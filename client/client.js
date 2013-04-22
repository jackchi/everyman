Meteor.startup(function(){
    markers = new Meteor.Collection("markers");
    taxonomies = new Meteor.Collection("taxonomies");

    agencies = new Meteor.Collection("agencies");
    geocoder = new google.maps.Geocoder();
    
    Deps.autorun(function(){
        markersHandle = Meteor.subscribe("myMarkers",
            function(){
            // this will show the 'public markers' by default if not logged in.
                if(typeof map != 'undefined')
                    lookForMarkers();
                });
            });
        
        taxHandle = Meteor.subscribe("taxonomies",
        function(){
        // this will show the 'public markers' by default if not logged in.
            console.log('taxes ready');
        });
        
});


/*
 *  TEMPLATE EVENTS
 *
 */

Template.add_marker.events({
    'click input.add_marker' : function(evt,tmpl){
        var record ={};
        // TODO use values from 'tmpl.data' instead of doing searches!
        var geo_term=tmpl.find(".marker_address").value;
        record.name = tmpl.find(".marker_name").value;
        record.type = tmpl.find(".marker_type").value;
        record.visibility = tmpl.find(".marker_visiblity").value;
        if(typeof geocoder != 'undefined'){
            geocoder.geocode({'address':geo_term},function(results,status){
                results = results[0];
                if(status == google.maps.GeocoderStatus.OK){
                    map.setCenter(results.geometry.location);
                    record.loc = [results.geometry.location.jb,results.geometry.location.kb];
                    record.createdBy = Meteor.userId();
                    
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

Template.agencies.events({
    'click a.tax_title' : function(evt,tmpl){
        console.log(tmpl.data);
    }

});




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
        console.log(tmpl.findAll());
        // agencies.insert();
        // step to hide all menus (agency add was clicked)
        Template.loggedInMenu.rendered();
        $('div#agency_new').show();
 
    },
    'click .tax' : function(evt,tmpl){
        Template.loggedInMenu.rendered();
        $('div#taxonomy_add').show();
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

Template.add_taxonomy.events({
    'click .add_tax' : function(evt,tmpl){
        //Template.loggedInMenu.rendered();
        var record = {};
        record.title= tmpl.find(".tax_title").value;
        record.grouping= tmpl.find(".group_title").value;
        taxonomies.insert(record);
    }
});

/*
 *  TEMPLATE FUNCTIONS
 *
 */

Template.loggedInMenu.marker_index = function(evt,tmpl){
    lookForMarkers();
    return markers.find({},{});
}

Template.agencies.getAgencies = function(evt,tmpl){
//    console.log(Meteor.user);
}

Template.marker_select.getMarkerTypes = function(evt, tmpl){
    return taxonomies.find({'grouping':'marker_type'});
}
Template.loggedInMenu.rendered = function(evt,tmpl){
    $('div#marker_add').hide();
    $('div#user_settings').hide();
    $('div#the_markers').hide();
    $('div#marker_edit').hide();
    $('div#agency_new').hide();
    $('div#taxonomy_add').hide();

}

Template.content.rendered = function(){
// IF MOBILE .. attempt to detect screen orientation/load different css to do horizontal nav
// versus vertical
  var isMobile = navigator.userAgent.match(/(iPhone|iPod|iPad|Android|iemobile|BlackBerry)/);
  // set 'default' .. maybe store a 'default location; in user settings
  createMap(new google.maps.LatLng(37.7835478, -122.408953));
  lookForMarkers();
}
/*
 *  GMAPS FUNCTIONS
 *
 */

currentMarkers = [];

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

function lookForMarkers(theBox){
// set ceter of map to the marker you just created
    c = markers.find();
    c.forEach(function(doc){
       if(typeof doc['loc'] != 'undefined'){
        var co = new google.maps.LatLng(doc['loc'][0], doc['loc'][1]);
        var marker_type = '';
        if(doc['type'] == 'Shelter' || doc['type'] == 'Hospital' || doc['type'] == 'Other' || doc['type'] == 'Pharmacy' || doc['type'] == 'Clinic'){
        // default
            marker_type = doc['type'];
        }else{
            marker_type = undefined;
        }
        placeNavMarker(co,marker_type,function(){alert(doc['name'] + ' ' + doc['type']);});
        }
    });
}

function createMap (latLng) {
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
}

/* TODO
Template.settings.events({
 
    'click input.update' : function(evt,tmpl){
    
    }
});*/

