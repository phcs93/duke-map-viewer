function Map (bytes, name) {

    const reader = new ByteReader(bytes);
    
    this.Name = name; 

    this.Version = reader.int32();
    this.X = reader.int32();
    this.Y = reader.int32();
    this.Z = reader.int32();
    this.A = reader.int16();
    this.S = reader.int16();

    this.Sectors = new Array(reader.uint16());

    for (let i = 0; i < this.Sectors.length; i++) {
        this.Sectors[i] = {
            wallptr: reader.int16(),
            wallnum: reader.int16(),
            ceilingz: reader.int32(),
            floorz: reader.int32(),
            ceilingstat: reader.int16(),
            floorstat: reader.int16(),
            ceilingpicnum: reader.int16(),
            ceilingheinum: reader.int16(),
            ceilingshade: reader.byte(),
            ceilingpal: reader.ubyte(),
            ceilingxpanning: reader.ubyte(),
            ceilingypanning: reader.ubyte(),
            floorpicnum: reader.int16(),
            floorheinum: reader.int16(),
            floorshade: reader.byte(),
            floorpal: reader.ubyte(),
            floorxpanning: reader.ubyte(),
            floorypanning: reader.ubyte(),
            visibility: reader.ubyte(),
            filler: reader.ubyte(),
            lotag: reader.int16(),
            hitag: reader.int16(),
            extra: reader.int16()
        };
    }

    this.Walls = new Array(reader.uint16());

    for (let i = 0; i < this.Walls.length; i++) {
        this.Walls[i] = {
            x: reader.int32(),
            y: reader.int32(),
            point2: reader.int16(),
            nextwall: reader.int16(),
            nextsector: reader.int16(),
            cstat: reader.int16(),
            picnum: reader.int16(),
            overpicnum: reader.int16(),
            shade: reader.byte(),
            pal: reader.ubyte(),
            xrepeat: reader.ubyte(),
            yrepeat: reader.ubyte(),
            xpanning: reader.ubyte(),
            ypanning: reader.ubyte(),
            lotag: reader.int16(),
            hitag: reader.int16(),
            extra: reader.int16()
        };
    }

    this.Sprites = new Array(reader.uint16());

    for (let i = 0; i < this.Sprites.length; i++) {
        this.Sprites[i] = {	
            x: reader.int32(),
            y: reader.int32(),
            z: reader.int32(),
            cstat: reader.int16(),
            picnum: reader.int16(),
            shade: reader.byte(),
            pal: reader.ubyte(),
            clipdist: reader.ubyte(),
            filler: reader.ubyte(),
            xrepeat: reader.ubyte(),
            yrepeat: reader.ubyte(),
            xoffset: reader.byte(),
            yoffset: reader.byte(),
            sectnum: reader.int16(),
            statnum: reader.int16(),
            ang: reader.int16(),
            owner: reader.int16(),
            xvel: reader.int16(),
            yvel: reader.int16(),
            zvel: reader.int16(),
            lotag: reader.int16(),
            hitag: reader.int16(),
            extra: reader.int16()
        };
    }

    this.Serialize = () => {

        const writer = new ByteWriter();        

        writer.int32(this.Version);
        writer.int32(this.X);
        writer.int32(this.Y);
        writer.int32(this.Z);
        writer.int16(this.A);
        writer.int16(this.S);

        writer.int16(this.Sectors.length);

        for (let i = 0; i < this.Sectors.length; i++) {
            writer.int16(this.Sectors[i].wallptr);
            writer.int16(this.Sectors[i].wallnum);
            writer.int32(this.Sectors[i].ceilingz);
            writer.int32(this.Sectors[i].floorz);
            writer.int16(this.Sectors[i].ceilingstat);
            writer.int16(this.Sectors[i].floorstat);
            writer.int16(this.Sectors[i].ceilingpicnum);
            writer.int16(this.Sectors[i].ceilingheinum);
            writer.byte(this.Sectors[i].ceilingshade);
            writer.byte(this.Sectors[i].ceilingpal);
            writer.byte(this.Sectors[i].ceilingxpanning);
            writer.byte(this.Sectors[i].ceilingypanning);
            writer.int16(this.Sectors[i].floorpicnum);
            writer.int16(this.Sectors[i].floorheinum);
            writer.byte(this.Sectors[i].floorshade);
            writer.byte(this.Sectors[i].floorpal);
            writer.byte(this.Sectors[i].floorxpanning);
            writer.byte(this.Sectors[i].floorypanning);
            writer.byte(this.Sectors[i].visibility);
            writer.byte(this.Sectors[i].filler);
            writer.int16(this.Sectors[i].lotag);
            writer.int16(this.Sectors[i].hitag);
            writer.int16(this.Sectors[i].extra);
        }

        writer.int16(this.Walls.length);

        for (let i = 0; i < this.Walls.length; i++) {
            writer.int32(this.Walls[i].x);
            writer.int32(this.Walls[i].y);
            writer.int16(this.Walls[i].point2);
            writer.int16(this.Walls[i].nextwall);
            writer.int16(this.Walls[i].nextsector);
            writer.int16(this.Walls[i].cstat);
            writer.int16(this.Walls[i].picnum);
            writer.int16(this.Walls[i].overpicnum);
            writer.byte(this.Walls[i].shade);
            writer.byte(this.Walls[i].pal);
            writer.byte(this.Walls[i].xrepeat);
            writer.byte(this.Walls[i].yrepeat);
            writer.byte(this.Walls[i].xpanning);
            writer.byte(this.Walls[i].ypanning);
            writer.int16(this.Walls[i].lotag);
            writer.int16(this.Walls[i].hitag);
            writer.int16(this.Walls[i].extra);
        }

        writer.int16(this.Sprites.length);

        for (let i = 0; i < this.Sprites.length; i++) {
            writer.int32(this.Sprites[i].x);
            writer.int32(this.Sprites[i].y);
            writer.int32(this.Sprites[i].z);
            writer.int16(this.Sprites[i].cstat);
            writer.int16(this.Sprites[i].picnum);
            writer.byte(this.Sprites[i].shade);
            writer.byte(this.Sprites[i].pal);
            writer.byte(this.Sprites[i].clipdist);
            writer.byte(this.Sprites[i].filler);
            writer.byte(this.Sprites[i].xrepeat);
            writer.byte(this.Sprites[i].yrepeat);
            writer.byte(this.Sprites[i].xoffset);
            writer.byte(this.Sprites[i].yoffset);
            writer.int16(this.Sprites[i].sectnum);
            writer.int16(this.Sprites[i].statnum);
            writer.int16(this.Sprites[i].ang);
            writer.int16(this.Sprites[i].owner);
            writer.int16(this.Sprites[i].xvel);
            writer.int16(this.Sprites[i].yvel);
            writer.int16(this.Sprites[i].zvel);
            writer.int16(this.Sprites[i].lotag);
            writer.int16(this.Sprites[i].hitag);
            writer.int16(this.Sprites[i].extra);
        }

        return new Uint8Array(writer.bytes);

    }

}

try {
    module.exports = Map;
} catch (e) {
    // ignore
}