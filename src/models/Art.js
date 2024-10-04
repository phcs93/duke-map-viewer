function Art (bytes, name) {

    this.Name = name;

    const reader = new ByteReader(bytes);

    // TO-DO => figure out if there is a simpler way to do this (check xduke source code)
    const isolate = (v, s, e) => (v >> s) & (1 << e - s + 1) - 1;
    const attach = (v, s, e, n) => (v & ~(((1 << (e - s + 1)) - 1) << s)) | ((n & ((1 << (e - s + 1)) - 1)) << s);

    this.Version = reader.uint32();
    this.Length = reader.uint32();
    this.Start = reader.uint32();
    this.End = reader.uint32();

    const numtiles = this.End - this.Start + 1;

    this.Tiles = new Array(numtiles);

    for (let i = 0; i < numtiles; i++) this.Tiles[i] = {};

    const sizex = [];

    for (let i = 0; i < numtiles; i++) sizex.push(reader.uint16()); 

    const sizey = [];
    
    for (let i = 0; i < numtiles; i++) sizey.push(reader.uint16());
 
    for (let i = 0; i < numtiles; i++) {
        const animation = reader.uint32();
        this.Tiles[i].animation = {
            frames: isolate(animation, 0, 5) & 0x3F, // uint6
            type: isolate(animation, 6, 7), // int2
            offsetX: isolate(animation, 8, 15), // int8
            offsetY: isolate(animation, 16, 23), // int8
            speed: isolate(animation, 24, 27) & 0x0F, // uint4
            unused: isolate(animation, 28, 31) // int4
        };
    }

    for (let i = 0; i < numtiles; i++) {
        this.Tiles[i].pixels = [];
        for (let x = 0; x < sizex[i] ; x++) {
            this.Tiles[i].pixels[x] = [];
            for (let y = 0; y < sizey[i]; y++) {
                this.Tiles[i].pixels[x][y] = reader.uint8();
            }
        }
    }

    this.Remaining = reader.bytes.slice(reader.index);

    this.Serialize = () => {

        const writer = new ByteWriter();

        writer.int32(this.Version);
        writer.int32(this.Numtiles);
        writer.int32(this.Start);
        writer.int32(this.End);
        
        for (let i = 0; i < numtiles; i++) {
            writer.int16(this.Tiles[i].pixels.length);
        }

        for (let i = 0; i < numtiles; i++) {
            writer.int16(this.Tiles[i].pixels.length > 0 ? this.Tiles[i].pixels[0].length : 0);
        }        

        for (let i = 0; i < numtiles; i++) {
            let animation = 0;
            animation = attach(animation, 0, 5, this.Tiles[i].animation.frames);
            animation = attach(animation, 6, 7, this.Tiles[i].animation.type);
            animation = attach(animation, 8, 15, this.Tiles[i].animation.offsetX);
            animation = attach(animation, 16, 23, this.Tiles[i].animation.offsetY);
            animation = attach(animation, 24, 27, this.Tiles[i].animation.speed);
            animation = attach(animation, 28, 31, this.Tiles[i].animation.unused);
            writer.int32(animation);
        }

        for (let i = 0; i < numtiles; i++) {
            for (let x = 0; x < this.Tiles[i].pixels.length ; x++) {
                for (let y = 0; y < this.Tiles[i].pixels[x].length; y++) {
                    writer.int8(this.Tiles[i].pixels[x][y]);
                }
            }
        }

        writer.bytes.push(...this.Remaining);

        return writer.bytes;

    };

}

try { module.exports = Art; } catch {}