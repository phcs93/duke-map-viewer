const fs = require("fs");
const zlib = require("zlib");
const Map = require("./src/models/map.js");

const Picnum = {
    Spawn: 1405,
    Weapons: {
        Pistol: 21,
        Shotgun: 28,
        Chaingun: 22,
        RPG: 23,
        Pipebomb: 26,
        Shrinker: 25,
        Devastator: 29,
        Freezer: 24,
        Tripbomb: 27
    },
    Ammo: {
        Pistol: 40,
        Shotgun: 49,
        Chaingun: 41,
        RPG: 44,
        Pipebomb: 47,
        Shrinker: 46,
        Expander: 45,
        Devastator: 42,
        Freezer: 37
    },
    Inventory: {
        Medkit: 53,
        Armor: 54,
        Steroids: 55,
        Scuba: 56,
        JetPack: 57,
        NightVision: 59,
        Boots: 61,
        Holoduke: 1348
    },
    Health: {
        Small: 51,
        Medium: 52,
        Atomic: 100
    }
};

const json = [];

for (const file of fs.readdirSync("./res/maps")) {

    const bytes = fs.readFileSync(`./res/maps/${file}`);

    const map = new Map(bytes);

    json.push({
        name: file.toLowerCase().replace(".map", ""),
        spawns: map.sprites.filter(s => s.picnum === Picnum.Spawn && s.lotag === 0).length + 1,
        coop: map.sprites.filter(s => s.picnum === Picnum.Spawn && s.lotag === 1).length,
        items: {
            weapons: {
                pistol: map.sprites.filter(s => s.picnum === Picnum.Weapons.Pistol).length,
                shotgun: map.sprites.filter(s => s.picnum === Picnum.Weapons.Shotgun).length,
                chaingun: map.sprites.filter(s => s.picnum === Picnum.Weapons.Chaingun).length,
                rpg: map.sprites.filter(s => s.picnum === Picnum.Weapons.RPG).length,
                pipebomb: map.sprites.filter(s => s.picnum === Picnum.Weapons.Pipebomb).length,
                shrinker: map.sprites.filter(s => s.picnum === Picnum.Weapons.Shrinker).length,
                devastator: map.sprites.filter(s => s.picnum === Picnum.Weapons.Devastator).length,
                freezer: map.sprites.filter(s => s.picnum === Picnum.Weapons.Freezer).length,
                tripbomb: map.sprites.filter(s => s.picnum === Picnum.Weapons.Tripbomb).length
            },
            ammo: {
                pistol: map.sprites.filter(s => s.picnum === Picnum.Ammo.Pistol).length,
                shotgun: map.sprites.filter(s => s.picnum === Picnum.Ammo.Shotgun).length,
                chaingun: map.sprites.filter(s => s.picnum === Picnum.Ammo.Chaingun).length,
                rpg: map.sprites.filter(s => s.picnum === Picnum.Ammo.RPG).length,
                pipebomb: map.sprites.filter(s => s.picnum === Picnum.Ammo.Pipebomb).length,
                shrinker: map.sprites.filter(s => s.picnum === Picnum.Ammo.Shrinker).length,
                expander: map.sprites.filter(s => s.picnum === Picnum.Ammo.Expander).length,
                devastator: map.sprites.filter(s => s.picnum === Picnum.Ammo.Devastator).length,
                freezer: map.sprites.filter(s => s.picnum === Picnum.Ammo.Freezer).length,
                tripbomb: map.sprites.filter(s => s.picnum === Picnum.Ammo.Tripbomb).length
            },
            inventory: {
                medkit: map.sprites.filter(s => s.picnum === Picnum.Inventory.Medkit).length,
                armor: map.sprites.filter(s => s.picnum === Picnum.Inventory.Armor).length,
                steroids: map.sprites.filter(s => s.picnum === Picnum.Inventory.Steroids).length,
                scuba: map.sprites.filter(s => s.picnum === Picnum.Inventory.Scuba).length,
                jetpack: map.sprites.filter(s => s.picnum === Picnum.Inventory.JetPack).length,
                nightvision: map.sprites.filter(s => s.picnum === Picnum.Inventory.NightVision).length,
                boots: map.sprites.filter(s => s.picnum === Picnum.Inventory.Boots).length,
                holoduke: map.sprites.filter(s => s.picnum === Picnum.Inventory.Holoduke).length
            },
            health: {
                small: map.sprites.filter(s => s.picnum === Picnum.Health.Small).length,
                medium: map.sprites.filter(s => s.picnum === Picnum.Health.Medium).length,
                atomic: map.sprites.filter(s => s.picnum === Picnum.Health.Atomic).length
            }
        }
    });

}

fs.mkdirSync("./bin", { recursive: true });

fs.writeFileSync("./bin/database.json", JSON.stringify(json, null, "\t"));
fs.writeFileSync("./bin/database.gzip", zlib.gzipSync(JSON.stringify(json)));