export const GAME = Object.freeze({
  name: "Grow Garden 2",
  version: "2.0.0",
  startingCoins: 250,
  startingGems: 10,
  maxEquippedPets: 3,
  autosaveMs: 60000,
  crops: {
    Carrot:{price:10,sell:18,grow:15,rarity:"Common",xp:5},
    Tomato:{price:35,sell:68,grow:30,rarity:"Uncommon",xp:10},
    Blueberry:{price:100,sell:210,grow:55,rarity:"Rare",xp:20},
    Starfruit:{price:350,sell:850,grow:100,rarity:"Epic",xp:45},
    Moonmelon:{price:1200,sell:3200,grow:180,rarity:"Legendary",xp:100}
  },
  pets: {
    Bunny:{price:250,multiplier:1.10,rarity:"Common"},
    Fox:{price:1200,multiplier:1.30,rarity:"Rare"},
    Bee:{price:3500,multiplier:1.60,rarity:"Epic"},
    Dragon:{price:15000,multiplier:2.20,rarity:"Legendary"}
  }
});
