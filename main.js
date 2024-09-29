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
        spawns: map.sprites.filter(s => s.picnum === Picnum.Spawn && s.lotag === 0).length + 1,
        coop: map.sprites.filter(s => s.picnum === Picnum.Spawn && s.lotag === 1).length,
        width: Math.abs(Math.max(...map.walls.map(w => w.x)) - Math.min(...map.walls.map(w => w.x))),
        height: Math.abs(Math.max(...map.walls.map(w => w.y)) - Math.min(...map.walls.map(w => w.y))),
        depth: Math.abs(Math.max(...map.sectors.map(s => s.floorz)) - Math.min(...map.sectors.map(s => s.ceilingz))),
        port: {
            produke: {
                flag: map.sprites.filter(s => s.picnum === Picnum.ProDuke.Flag).length,
                teams: map.sprites.filter(s => s.picnum === Picnum.Spawn && s.lotag === 0 && s.hitag > 0).reduce((teams, spawn) => {
                    if (!teams[spawn.hitag]) teams[spawn.hitag] = 0;
                    teams[spawn.hitag]++;
                    return teams;
                }, {})
            },
            nduke: {
                flag: map.sprites.filter(s => s.picnum === Picnum.NDuke.Flag).length,
                teams: map.sprites.filter(s => s.picnum === Picnum.Spawn && s.lotag === 0 && s.hitag > 0).reduce((teams, spawn) => {
                    if (!teams[spawn.hitag]) teams[spawn.hitag] = 0;
                    teams[spawn.hitag]++;
                    return teams;
                }, {})
            }
        },
        items: {
            cards: map.sprites.filter(s => s.picnum === Picnum.Card).length,
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
        },
        effectors: Object.keys(EffectorTag).reduce((counters, tag) => {
            counters[tag] = map.sprites.filter(s => s.picnum === Picnum.Effector && s.lotag === EffectorTag[tag]).length;
            return counters;
        }, {}),
        sectors: Object.keys(SectorTag).reduce((counters, tag) => {
            counters[tag] = map.sectors.filter(s => s.lotag === SectorTag[tag]).length;
            return counters;
        }, {}),
        damagingFloor: map.sectors.some(s => Object.values(Picnum.DamagingFloorTextures).includes(s.floorpicnum))
    });

}

fs.mkdirSync("./bin", { recursive: true });

fs.writeFileSync("./bin/database.json", JSON.stringify(json, null, "\t"));
fs.writeFileSync("./bin/database.gzip", zlib.gzipSync(JSON.stringify(json)));