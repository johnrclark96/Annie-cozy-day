    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const STORE_PREFIX = "anniesCozyDay_";

    const COLORS = {
      cream: "#FFF8F0",
      peach: "#FFDAB9",
      softPink: "#FFB6C1",
      gold: "#FFD700",
      sage: "#A8C686",
      brown: "#D2B48C",
      warmRed: "#C0392B",
      wall: "#F5E6D3",
      couch: "#C59A6A",
      couchDark: "#AA7C50",
      rug: "#D8C2A8",
      floor: "#EFD8BE",
      dark: "#5C4434",
      shadow: "rgba(0,0,0,0.14)"
    };

    const ACHIEVEMENTS = [
      { key: "obiBestFriend", name: "Obi's Best Friend", desc: "Catch 30 total treats across all Treat Toss games.", color: "#A97142", icon: "bone" },
      { key: "comboStar", name: "Combo Star", desc: "Reach a 10x combo in Treat Toss.", color: "#FFD700", icon: "star" },
      { key: "catWhisperer", name: "Cat Whisperer", desc: "Score 400+ in a single Laser Chase game.", color: "#7CB342", icon: "catEye" },
      { key: "pouncePerfect", name: "Pounce Perfect", desc: "Reach a 5x combo in Laser Chase.", color: "#E53935", icon: "paw" },
      { key: "couchPotato", name: "Couch Potato", desc: "Survive 30 seconds in Cuddle Pile.", color: "#7FB3D5", icon: "couch" },
      { key: "maximumCozy", name: "Maximum Cozy", desc: "Reach the 90-second win state in Cuddle Pile.", color: "#F48FB1", icon: "heart" },
      { key: "goodWalker", name: "Good Walker", desc: "Score 300+ on Obi's Walk.", color: "#8D6E4C", icon: "bone" },
      { key: "napMaster", name: "Nap Master", desc: "Score 400+ on Luna's Nap Spot.", color: "#C39BD3", icon: "heart" },
      { key: "squeakyClean", name: "Squeaky Clean", desc: "Score 200+ in Bath Time.", color: "#87CEEB", icon: "heart" },
      { key: "sortingPro", name: "Sorting Pro", desc: "Sort 10 treats correctly in a row.", color: "#E8A84C", icon: "star" },
      { key: "whackQueen", name: "Whack Queen", desc: "Score 250+ in Pillow Pop.", color: "#F48FB1", icon: "paw" },
      { key: "sharpEye", name: "Sharp Eye", desc: "Find Luna 8 times in a row in Where's Luna.", color: "#7CB342", icon: "catEye" },
      { key: "birdWatcher", name: "Bird Watcher", desc: "Score 300+ in Window Watch.", color: "#87CEEB", icon: "star" },
      { key: "goodMemory", name: "Good Memory", desc: "Repeat a 7-step sequence in Pawstep Patterns.", color: "#C39BD3", icon: "heart" }
    ];

    const TITLE_SUBTITLES = [
      "A cozy little gift for Annie, Obi, and Luna",
      "Obi wants belly rubs",
      "Luna is judging you lovingly",
      "Everyone's favorite nap spot",
      "A game about the important things",
      "Obi found something interesting to sniff",
      "Luna claims this is her couch now",
      "Made with love and way too much JavaScript"
    ];

    const DECOR_ITEMS = [
      { key: "fairyLights", name: "Fairy Lights", desc: "Twinkling lights along the wall", stars: 1, type: "toggle" },
      { key: "plant2", name: "Flower Pot", desc: "A flowering plant on the side table", stars: 3, type: "toggle" },
      { key: "petBed", name: "Pet Bed", desc: "A cozy pink bed for napping", stars: 5, type: "toggle" },
      { key: "rugColor", name: "Rug Color", desc: "Change the rug color", stars: 2, type: "cycle", max: 3, labels: ["Default", "Sage", "Lavender", "Rose"] },
      { key: "roomPreset", name: "Room Style", desc: "Change the room's color palette", stars: 0, type: "cycle", max: 4, labels: ["Cozy Neutral", "Pastel Cute", "Warm Cottage", "Moonlight Blue", "Bookish Cozy"] },
      { key: "timeOfDay", name: "Time of Day", desc: "Change the lighting and atmosphere", stars: 0, type: "cycle", max: 3, labels: ["Morning", "Daytime", "Evening", "Nighttime"] },
      { key: "wallArt2", name: "Wall Art", desc: "New artwork for the wall", stars: 7, type: "cycle", max: 3, labels: ["Landscape", "Floral", "Portraits", "Abstract"] },
      { key: "windowPlant", name: "Window Herbs", desc: "Fresh herbs on the window sill", stars: 6, type: "toggle" },
      { key: "cozyBlanket", name: "Cozy Blanket", desc: "A warm blanket on the couch", stars: 0, type: "toggle", streakUnlock: 7 },
      { key: "photoWall", name: "Photo Wall", desc: "Family photos on the wall", stars: 0, type: "toggle", streakUnlock: 30 }
    ];

    const DAILY_TASK_POOL = [
      { id: "pet", text: "Pet Obi or Luna" },
      { id: "feed", text: "Fill the food bowl" },
      { id: "water", text: "Fill the water bowl" },
      { id: "brush", text: "Brush a pet" },
      { id: "toy", text: "Throw a toy" },
      { id: "treat", text: "Toss a treat" },
      { id: "game", text: "Play a minigame" }
    ];

    const ACCESSORIES = {
      obi: [
        { key: "bandanaRed", name: "Red Bandana", price: 10, slot: "neck" },
        { key: "bandanaPlaid", name: "Plaid Bandana", price: 15, slot: "neck" },
        { key: "bandanaCamo", name: "Camo Bandana", price: 15, slot: "neck" },
        { key: "sweaterRed", name: "Red Sweater", price: 35, slot: "body" }
      ],
      luna: [
        { key: "bowPink", name: "Pink Bow", price: 10, slot: "head" },
        { key: "flowerCrown", name: "Flower Crown", price: 20, slot: "head" },
        { key: "starCollar", name: "Star Collar", price: 15, slot: "neck" }
      ]
    };

    const LUNA_PERCHES = {
      tower:  { x: 694, y: 258 },
      couch:  { x: 402, y: 256 },
      window: { x: 126, y: 200 },
      floor:  { x: 598, y: 430 }
    };
