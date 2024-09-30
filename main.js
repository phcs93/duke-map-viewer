const fs = require("fs");
const zlib = require("zlib");
const Map = require("./src/models/Map.js");
require("./src/enums/Pincum.js");
require("./src/enums/EffectorTag.js");
require("./src/enums/SectorTag.js");

const json = [];

for (const file of fs.readdirSync("./res/maps")) {

    const map = new Map(fs.readFileSync(`./res/maps/${file}`));

    json.push({
        name: file.toLowerCase().replace(".map", ""),
        spawns: map.Sprites.filter(s => s.picnum === Picnum.Spawn && s.lotag === 0).length + 1,
        coop: map.Sprites.filter(s => s.picnum === Picnum.Spawn && s.lotag === 1).length,
        width: Math.abs(Math.max(...map.Walls.map(w => w.x)) - Math.min(...map.Walls.map(w => w.x))),
        height: Math.abs(Math.max(...map.Walls.map(w => w.y)) - Math.min(...map.Walls.map(w => w.y))),
        depth: Math.abs(Math.max(...map.Sectors.map(s => s.floorz)) - Math.min(...map.Sectors.map(s => s.ceilingz))),
        port: {
            produke: {
                flag: map.Sprites.filter(s => s.picnum === Picnum.ProDuke.Flag).length,
                teams: map.Sprites.filter(s => s.picnum === Picnum.Spawn && s.lotag === 0 && s.hitag > 0).reduce((teams, spawn) => {
                    if (!teams[spawn.hitag]) teams[spawn.hitag] = 0;
                    teams[spawn.hitag]++;
                    return teams;
                }, {})
            },
            nduke: {
                flag: map.Sprites.filter(s => s.picnum === Picnum.NDuke.Flag).length,
                teams: map.Sprites.filter(s => s.picnum === Picnum.Spawn && s.lotag === 0 && s.hitag > 0).reduce((teams, spawn) => {
                    if (!teams[spawn.hitag]) teams[spawn.hitag] = 0;
                    teams[spawn.hitag]++;
                    return teams;
                }, {})
            }
        },
        items: {
            cards: map.Sprites.filter(s => s.picnum === Picnum.Card).length,
            weapons: {
                pistol: map.Sprites.filter(s => s.picnum === Picnum.Weapons.Pistol).length,
                shotgun: map.Sprites.filter(s => s.picnum === Picnum.Weapons.Shotgun).length,
                chaingun: map.Sprites.filter(s => s.picnum === Picnum.Weapons.Chaingun).length,
                rpg: map.Sprites.filter(s => s.picnum === Picnum.Weapons.RPG).length,
                pipebomb: map.Sprites.filter(s => s.picnum === Picnum.Weapons.Pipebomb).length,
                shrinker: map.Sprites.filter(s => s.picnum === Picnum.Weapons.Shrinker).length,
                devastator: map.Sprites.filter(s => s.picnum === Picnum.Weapons.Devastator).length,
                freezer: map.Sprites.filter(s => s.picnum === Picnum.Weapons.Freezer).length,
                tripbomb: map.Sprites.filter(s => s.picnum === Picnum.Weapons.Tripbomb).length
            },
            ammo: {
                pistol: map.Sprites.filter(s => s.picnum === Picnum.Ammo.Pistol).length,
                shotgun: map.Sprites.filter(s => s.picnum === Picnum.Ammo.Shotgun).length,
                chaingun: map.Sprites.filter(s => s.picnum === Picnum.Ammo.Chaingun).length,
                rpg: map.Sprites.filter(s => s.picnum === Picnum.Ammo.RPG).length,
                pipebomb: map.Sprites.filter(s => s.picnum === Picnum.Ammo.Pipebomb).length,
                shrinker: map.Sprites.filter(s => s.picnum === Picnum.Ammo.Shrinker).length,
                expander: map.Sprites.filter(s => s.picnum === Picnum.Ammo.Expander).length,
                devastator: map.Sprites.filter(s => s.picnum === Picnum.Ammo.Devastator).length,
                freezer: map.Sprites.filter(s => s.picnum === Picnum.Ammo.Freezer).length,
                tripbomb: map.Sprites.filter(s => s.picnum === Picnum.Ammo.Tripbomb).length
            },
            inventory: {
                medkit: map.Sprites.filter(s => s.picnum === Picnum.Inventory.Medkit).length,
                armor: map.Sprites.filter(s => s.picnum === Picnum.Inventory.Armor).length,
                steroids: map.Sprites.filter(s => s.picnum === Picnum.Inventory.Steroids).length,
                scuba: map.Sprites.filter(s => s.picnum === Picnum.Inventory.Scuba).length,
                jetpack: map.Sprites.filter(s => s.picnum === Picnum.Inventory.JetPack).length,
                nightvision: map.Sprites.filter(s => s.picnum === Picnum.Inventory.NightVision).length,
                boots: map.Sprites.filter(s => s.picnum === Picnum.Inventory.Boots).length,
                holoduke: map.Sprites.filter(s => s.picnum === Picnum.Inventory.Holoduke).length
            },
            health: {
                small: map.Sprites.filter(s => s.picnum === Picnum.Health.Small).length,
                medium: map.Sprites.filter(s => s.picnum === Picnum.Health.Medium).length,
                atomic: map.Sprites.filter(s => s.picnum === Picnum.Health.Atomic).length
            }
        },
        effectors: Object.keys(EffectorTag).reduce((counters, tag) => {
            counters[tag] = map.Sprites.filter(s => s.picnum === Picnum.Effector && s.lotag === EffectorTag[tag]).length;
            return counters;
        }, {}),
        sectors: Object.keys(SectorTag).reduce((counters, tag) => {
            counters[tag] = map.Sectors.filter(s => s.lotag === SectorTag[tag]).length;
            return counters;
        }, {}),
        damagingFloor: map.Sectors.some(s => Object.values(Picnum.DamagingFloorTextures).includes(s.floorpicnum))
    });

}

fs.mkdirSync("./bin", { recursive: true });

fs.writeFileSync("./bin/database.json", JSON.stringify(json, null, "\t"));
fs.writeFileSync("./bin/database.gzip", zlib.gzipSync(JSON.stringify(json)));