type abilities = {
  name: string;
  description: string;
};
export interface Character {
  id: string;
  name: string;
  description: string;
  speed: number;
  power: number;
  technique: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  game: string;
  abilities: abilities[];
  quote: string;
  color: string;
  unlocked: boolean;
}

export const characters: Character[] = [
  {
    id: "sonic",
    name: "Sonic the Hedgehog",
    description:
      "The fastest thing alive! A blue hedgehog with a love for adventure and a need for speed.",
    speed: 100,
    power: 60,
    technique: 70,
    rarity: "legendary",
    game: "Sonic Adventure 2",
    abilities: [
      {
        name: "Speed up the clock",
        description: "Allows Sonic to speed up the timer.",
      },
    ],
    quote: "Gotta go fast!",
    color: "bg-blue-500",
    unlocked: true,
  },
  {
    id: "tails",
    name: "Miles 'Tails' Prower",
    description:
      "Sonic's best friend and a mechanical genius with the ability to fly using his twin tails.",
    speed: 70,
    power: 50,
    technique: 95,
    rarity: "epic",
    game: "Sonic Adventure 2",
    abilities: [
      { name: "Flight", description: "Tails can fly using his twin tails." },
      { name: "Mech Walker", description: "Pilot a powerful mech suit." },
      {
        name: "Energy Cannon",
        description: "Fire energy projectiles at enemies.",
      },
    ],
    quote: "I can fly if I try!",
    color: "bg-yellow-500",
    unlocked: true,
  },
  {
    id: "knuckles",
    name: "Knuckles the Echidna",
    description:
      "The guardian of the Master Emerald with incredible strength and the ability to glide.",
    speed: 60,
    power: 100,
    technique: 70,
    rarity: "epic",
    game: "Sonic Adventure 2",
    abilities: [
      { name: "Glide", description: "Glide through the air using dreadlocks." },
      { name: "Climb", description: "Climb walls and ceilings." },
      { name: "Dig", description: "Dig through the ground to find treasures." },
      {
        name: "Super Strength",
        description: "Break obstacles with raw power.",
      },
    ],
    quote: "Here I come, rougher than the rest of them!",
    color: "bg-red-500",
    unlocked: true,
  },
  {
    id: "shadow",
    name: "Shadow the Hedgehog",
    description:
      "The ultimate life form created by Professor Gerald Robotnik with chaos powers.",
    speed: 95,
    power: 85,
    technique: 80,
    rarity: "legendary",
    game: "Sonic Adventure 2",
    abilities: [
      { name: "Chaos Control", description: "Manipulate time and space." },
      { name: "Chaos Spear", description: "Launch energy projectiles." },
      { name: "Chaos Blast", description: "Unleash a devastating explosion." },
    ],
    quote: "I am the ultimate life form!",
    color: "bg-gray-900",
    unlocked: false,
  },
  {
    id: "rouge",
    name: "Rouge the Bat",
    description:
      "A treasure hunter and government spy with a love for jewels and a talent for stealth.",
    speed: 75,
    power: 65,
    technique: 90,
    rarity: "rare",
    game: "Sonic Adventure 2",
    abilities: [
      { name: "Flight", description: "Fly using her wings." },
      { name: "Treasure Scope", description: "Detect hidden treasures." },
      { name: "Drill Drive", description: "Perform a powerful drilling kick." },
    ],
    quote: "A treasure hunter always gets her prize!",
    color: "bg-purple-500",
    unlocked: false,
  },
  {
    id: "amy",
    name: "Amy Rose",
    description:
      "Sonic's self-proclaimed girlfriend with a giant hammer and an optimistic attitude.",
    speed: 70,
    power: 80,
    technique: 60,
    rarity: "rare",
    game: "Sonic Heroes",
    abilities: [
      {
        name: "Piko Piko Hammer",
        description: "Wield a giant hammer in combat.",
      },
      {
        name: "Spin Hammer Attack",
        description: "Spin attack with the hammer.",
      },
      { name: "Hammer Jump", description: "Use the hammer to jump higher." },
    ],
    quote: "I'll show you what I'm made of!",
    color: "bg-pink-500",
    unlocked: false,
  },
  {
    id: "cream",
    name: "Cream the Rabbit",
    description:
      "A polite young rabbit who can fly using her ears, accompanied by her Chao friend Cheese.",
    speed: 65,
    power: 45,
    technique: 85,
    rarity: "common",
    game: "Sonic Heroes",
    abilities: [
      { name: "Ear Flight", description: "Fly using her large ears." },
      { name: "Chao Attack", description: "Command Cheese to attack enemies." },
      { name: "Healing", description: "Restore health to allies." },
    ],
    quote: "I'll do my best!",
    color: "bg-orange-300",
    unlocked: false,
  },
  {
    id: "big",
    name: "Big the Cat",
    description:
      "A large, gentle cat who loves fishing and his best friend Froggy.",
    speed: 40,
    power: 90,
    technique: 50,
    rarity: "common",
    game: "Sonic Adventure",
    abilities: [
      { name: "Fishing Rod", description: "Use a fishing rod to catch items." },
      { name: "Power Throw", description: "Throw heavy objects." },
      { name: "Heavy Weight", description: "Use weight to activate switches." },
    ],
    quote: "Froggy, where are you?",
    color: "bg-purple-600",
    unlocked: false,
  },
  {
    id: "omega",
    name: "E-123 Omega",
    description:
      "A powerful robot created by Dr. Eggman with a vendetta against his creator.",
    speed: 50,
    power: 100,
    technique: 75,
    rarity: "epic",
    game: "Sonic Heroes",
    abilities: [
      { name: "Heavy Machine Gun", description: "Rapid fire weapon." },
      { name: "Rocket Launcher", description: "Launch powerful rockets." },
      {
        name: "Lock-On Missiles",
        description: "Auto-targeting missile barrage.",
      },
    ],
    quote: "Worthless consumer models!",
    color: "bg-red-600",
    unlocked: false,
  },
  {
    id: "blaze",
    name: "Blaze the Cat",
    description:
      "A princess from another dimension with the power to control fire.",
    speed: 85,
    power: 75,
    technique: 90,
    rarity: "legendary",
    game: "Sonic Rush",
    abilities: [
      { name: "Fire Control", description: "Control and manipulate fire." },
      { name: "Burning Blaze", description: "Transform into a burning form." },
      { name: "Axel Tornado", description: "Create a fiery tornado attack." },
    ],
    quote: "I will protect the Sol Emeralds!",
    color: "bg-purple-400",
    unlocked: false,
  },
  {
    id: "silver",
    name: "Silver the Hedgehog",
    description:
      "A hedgehog from the future with powerful psychokinetic abilities.",
    speed: 70,
    power: 75,
    technique: 95,
    rarity: "epic",
    game: "Sonic '06",
    abilities: [
      { name: "Psychokinesis", description: "Move objects with the mind." },
      { name: "ESP", description: "Enhanced sensory perception." },
      { name: "Telekinesis", description: "Lift and throw objects mentally." },
    ],
    quote: "It's no use!",
    color: "bg-gray-300",
    unlocked: false,
  },
  {
    id: "espio",
    name: "Espio the Chameleon",
    description:
      "A ninja chameleon with the ability to turn invisible and climb walls.",
    speed: 75,
    power: 70,
    technique: 90,
    rarity: "rare",
    game: "Sonic Heroes",
    abilities: [
      { name: "Invisibility", description: "Turn invisible to enemies." },
      { name: "Shuriken", description: "Throw ninja stars at targets." },
      { name: "Wall Climb", description: "Scale walls and surfaces." },
    ],
    quote: "A ninja's work is never done!",
    color: "bg-purple-700",
    unlocked: false,
  },
  {
    id: "vector",
    name: "Vector the Crocodile",
    description:
      "The loud and boisterous leader of the Chaotix detective agency.",
    speed: 55,
    power: 90,
    technique: 60,
    rarity: "common",
    game: "Sonic Heroes",
    abilities: [
      { name: "Headphones Boom", description: "Sonic attack from headphones." },
      { name: "Breath Fire", description: "Exhale a stream of fire." },
      { name: "Bubble Gum", description: "Trap enemies in sticky gum." },
    ],
    quote: "We're Chaotix, and we're here to help!",
    color: "bg-green-600",
    unlocked: false,
  },
  {
    id: "charmy",
    name: "Charmy Bee",
    description:
      "An energetic young bee and member of the Chaotix with the ability to fly.",
    speed: 80,
    power: 40,
    technique: 70,
    rarity: "common",
    game: "Sonic Heroes",
    abilities: [
      { name: "Flight", description: "Fly freely through the air." },
      { name: "Sting Attack", description: "Attack with a powerful sting." },
      { name: "Thunder Shoot", description: "Fire electric projectiles." },
    ],
    quote: "Yeah! Let's do it!",
    color: "bg-yellow-400",
    unlocked: false,
  },
  {
    id: "metal-sonic",
    name: "Metal Sonic",
    description:
      "A robotic duplicate of Sonic created by Dr. Eggman to match Sonic's speed.",
    speed: 100,
    power: 80,
    technique: 85,
    rarity: "legendary",
    game: "Sonic Heroes",
    abilities: [
      { name: "Maximum Overdrive", description: "Extreme speed boost." },
      { name: "Black Shield", description: "Protective energy barrier." },
      { name: "V. Maximum Overdrive", description: "Ultimate speed mode." },
    ],
    quote: "...",
    color: "bg-blue-700",
    unlocked: false,
  },
];

export const getRarityColor = (rarity: Character["rarity"]): string => {
  switch (rarity) {
    case "common":
      return "from-gray-400 to-gray-600";
    case "rare":
      return "from-blue-400 to-blue-600";
    case "epic":
      return "from-purple-400 to-purple-600";
    case "legendary":
      return "from-yellow-400 to-orange-500";
    default:
      return "from-gray-400 to-gray-600";
  }
};

export const getRarityBorderColor = (rarity: Character["rarity"]): string => {
  switch (rarity) {
    case "common":
      return "border-gray-400";
    case "rare":
      return "border-blue-400";
    case "epic":
      return "border-purple-400";
    case "legendary":
      return "border-yellow-400";
    default:
      return "border-gray-400";
  }
};

export const getUnlockedCharacters = (): Character[] => {
  return characters.filter((char) => char.unlocked);
};

export const getLockedCharacters = (): Character[] => {
  return characters.filter((char) => !char.unlocked);
};

export const getCharacterById = (id: string): Character | undefined => {
  return characters.find((char) => char.id === id);
};
