if (Meteor.isServer) {
  self= this;

  markers = new Meteor.Collection("markers");

  markers._ensureIndex({ loc : "2d" });


  users = new Meteor.Collection("user");

  agencies = new Meteor.Collection("agencies");

  Meteor.publish("myMarkers", function(agency_id,group_id,vis){
        if(typeof this.userId != 'null'){
            return markers.find({createdBy: this.userId});
            
            // hand this an extra query to find public visiblity and then
            // eventually use a client side session var to decide
            // which ones to show/ create lists etc.
            }
        else
            return markers.find({visibility: 'public'});
   
    });

  Meteor.startup(function () {
    // theres no org..
    });
 
   Meteor.methods({
    isLoggedIn : function(uid){
    
    },
    isAdmin : function(uid){
        // do we have session here?
        console.log(Session);
        return true;
    },
    newAgency : function(title,type){
        // figure out user id??? how???
        var user_id = '', timestamp = 212930212;
      //  agencies.insert({"title": title,"type":type,"owner":user_id,"created":timestamp});
    },
    
    findAgencies : function(agency_id){
        //
    },
    findMarker : function(x,y){
        console.log(x);
        console.log(y);
         markers._ensureIndex({ loc : "2d" });
         var theCenter = [[x,y],.1];
         // returns everything
         var r = markers.find({ loc : { "$geoWithin" : { "$center" : theCenter }}}).fetch();
         console.log(r.length);
        return r;
    },
    findMarkers : function(){
        console.log('finding markers');
        return markers.find({},{}).fetch();
    },
    markersIndex : function(){
        console.log('finding markers index');
        var c = markers.find({},{}).fetch(),r=[];
        c.filter(function(arr){
            console.log(arr);
            var x = {}
            // use underscore for this..
            x._id = arr._id;
            x.marker_name = arr.marker_name;
            r.push(x);
        });
        return r;
    }
  });
}