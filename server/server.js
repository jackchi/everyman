if (Meteor.isServer) {
  self= this;

  Meteor.startup(function () {
    
    if (Everyman.find().count() === 0) {
      console.log("server");
      var names = ["Jack Chi",
                   "Zak Zibrat",
                   "Marie Curie",
                   "Carl Friedrich Gauss",
                   "Nikola Tesla",
                   "Claude Shannon"];
      for (var i = 0; i < names.length; i++)
        Everyman.insert({name: names[i], score: Math.floor(Random.fraction()*10)*5});
    }
  });
}