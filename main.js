const fs = require("fs");
const zlib = require("zlib");
const Map = require("./src/models/map.js");

const Picnum = {
    Effector: 1,
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
    },    
    ProDuke: {
        Flag: 5888
    },
    DamagingFloorTextures: {
        FloorSlime: 200,
        HurtRail: 859,
        FloorPlasma: 1082,
        PurpleLava: 4240
    }
};

const EffectorTags = {
    Pivot: 1,
    Earthquake: 2,
    RandomLightsAfterShotOut: 3,
    RandomLights: 4,
    HomingTurret: 5,
    SubwayEngine: 6,
    Teleporter: 7,
    OpenDoorRoomLights: 8,
    CloseDoorRoomLights: 9,
    DoorAutoClose: 10,
    SwingingDoorHinge: 11,
    LightSwitch: 12,
    Explosive: 13,
    SubwayCar: 14,
    SlidingDoor: 15,
    RotateReactorSector: 16,
    TransportElevator: 17,
    IncrementalSectorRaiseFall: 18,
    CeilingFallsFromExplosion: 19,
    StretchingShrinkingSector: 20,
    FloorRiseCeilingDrop: 21,
    TeethDoor: 22,
    OneWayTeleporterExit: 23,
    ConveyorBelt: 24,
    Piston: 25,
    Escalator: 26,
    DemoCamera: 27,
    LightningBolt: 28,
    FloatingSector: 29,
    TwoWayTrain: 30,
    RaiseLowerFloor: 31,
    RaiseLowerCeiling: 32,
    EarthquakeDebris: 33,
    AlternativeConveyorBelt: 34,
    Drill: 35,
    AutomaticShooter: 36,
    FloorOverFloor0: 40,
    FloorOverFloor1: 41,
    FloorOverFloor2: 42,
    FloorOverFloor3: 43,
    FloorOverFloor4: 44,
    FloorOverFloor5: 45,
    AdjustWall: 128,
    Fireworks1: 130,
    Fireworks2: 131
};

const SectorTags = {
    AboveWaterSector: 1,
    BelowWaterSector: 2,
    Boss2RoamSector: 3,
    StarTrekDoor: 9,
    TransportElevator: 15,
    ElevatorPlatformDown: 16,
    ElevatorPlatformUp: 17,
    ElevatorDown: 18,
    ElevatorUp: 19,
    CeilingDoor: 20,
    FloorDoor: 21,
    SplitDoor: 22,
    SwingingDoor: 23,
    Reserved: 24,
    SlidingDoor: 25,
    SplitStarTrekDoor: 26,
    StretchingShrinkingSector: 27,
    FloorRiseCeilingDrop: 28,
    TeethDoor: 29,
    RotateRiseSector: 30,
    TwoWayTrain: 31,
    OneTimeSound: 10000,
    SecretPlace: 32767,
    EndOfLevelWithMessage: 65534,
    EndOfLevel: 65535
}

const json = [];

for (const file of fs.readdirSync("./res/maps")) {

    const bytes = fs.readFileSync(`./res/maps/${file}`);

    const map = new Map(bytes);

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
            }
        },
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
        },
        effectors: Object.keys(EffectorTags).reduce((counters, tag) => {
            counters[tag] = map.sprites.filter(s => s.picnum === Picnum.Effector && s.lotag === EffectorTags[tag]).length;
            return counters;
        }, {}),
        sectors: Object.keys(SectorTags).reduce((counters, tag) => {
            counters[tag] = map.sectors.filter(s => s.lotag === SectorTags[tag]).length;
            return counters;
        }, {}),
        damagingFloor: map.sectors.some(s => Object.values(Picnum.DamagingFloorTextures).includes(s.floorpicnum))
    });

}

fs.mkdirSync("./bin", { recursive: true });

fs.writeFileSync("./bin/database.json", JSON.stringify(json, null, "\t"));
fs.writeFileSync("./bin/database.gzip", zlib.gzipSync(JSON.stringify(json)));