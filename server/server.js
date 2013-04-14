if (Meteor.isServer) {
  self= this;

  Meteor.startup(function () {
    
    if (Org.find().count() === 0) {
      
      var names = ["Jack Chi",
                   "Zak Zibrat",
                   "Marie Curie",
                   "Carl Friedrich Gauss",
                   "Nikola Tesla",
                   "Claude Shannon"];
      for (var i = 0; i < names.length; i++)
        Org.insert({name: names[i], score: Math.floor(Random.fraction()*10)*5});
    }
  });
}