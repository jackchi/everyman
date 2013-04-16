if (Meteor.isServer) {
  self= this;

  markers = new Meteor.Collection("clinics");

  markers._ensureIndex({ loc : "2d" });

  Org = new Meteor.Collection('Org');

  users = new Meteor.Collection("user");

  Meteor.startup(function () {
    // theres no org..
    if (Org.find().count() === 0) {
      
      var names = ["Jack Chi",
                   "Zak Zibrat",
                   "Marie Curie",
                   "Carl Friedrich Gauss",
                   "Nikola Tesla",
                   "Claude Shannon",
                   "Ronaldo Barbachano"];
      for (var i = 0; i < names.length; i++)
        Org.insert({name: names[i], score: Math.floor(Random.fraction()*10)*5});
    }
 



 });
 
   Meteor.methods({
   
    isLoggedIn : function(uid){
    
    },
   
    isAdmin : function(uid){
        // do we have session here?
        console.log(Session);
        return true;
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
    findmarkers : function(){
        console.log('finding markers');
        var c = markers.find({},{}).fetch();
        c.filter(function(arr){
            console.log(arr);
        });
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