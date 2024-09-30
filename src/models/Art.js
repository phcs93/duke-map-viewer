function Art (bytes, name) {

    this.Name = name;

    let index = 0; 

    const b = (n) => bytes[index++] << n;
    
    const byte = () => (b(0) << 24) >> 24;
    const int16 = () => b(0)|b(8);
    const int32 = () => b(0)|b(8)|b(16)|b(24);

    const ubyte = () => byte() & 0xFF;
    const uint16 = () => int16() & 0xFFFF;
    const uint32 = () => int32() & 0xFFFFFFFF;

    const isolate = (v, s, e) => (v >> s) & (1 << e - s + 1) - 1;
    const attach = (v, s, e, n) => (v & ~(((1 << (e - s + 1)) - 1) << s)) | ((n & ((1 << (e - s + 1)) - 1)) << s);

    this.Version = uint32();
    this.Length = uint32();
    this.Start = uint32();
    this.End = uint32();

    this.Tiles = new Array(this.End - this.Start + 1);

    // TO-DO => fix this fuckery
    for (let i = 0; i < this.Tiles.length; i++) {
        this.Tiles[i] = {
            pixels: null,
            animation: null
        };
    }

    for (let i = 0; i < this.Tiles.length; i++) {
        this.Tiles[i].pixels = new Array(uint16());
    }    

    for (let i = 0; i < this.Tiles.length; i++) {
        // TO-DO => fix this fuckery
        const sizey = uint16();
        for (let x = 0; x < this.Tiles[i].pixels.length; x++) {
            this.Tiles[i].pixels[x] = new Array(sizey);
        }
    }
 
    for (let i = 0; i < this.Tiles.length; i++) {
        const animation = uint32();
        this.Tiles[i].animation = {
            frames: isolate(animation, 0, 5) & 0x3F, // uint6
            type: isolate(animation, 6, 7), // int2
            offsetX: isolate(animation, 8, 15), // int8
            offsetY: isolate(animation, 16, 23), // int8
            speed: isolate(animation, 24, 27) & 0x0F, // uint4
            unused: isolate(animation, 28, 31) // int4
        };
    }

    for (let i = 0; i < this.Tiles.length; i++) {
        for (let x = 0; x < this.Tiles[i].pixels.length ; x++) {            
            for (let y = 0; y < this.Tiles[i].pixels[x].length; y++) {
                this.Tiles[i].pixels[x][y] = ubyte();
            }
        }
    }

    // prevent anything from being left behind
    this.Remaining = bytes.slice(index);

    // revert back to byte array
    this.Serialize = () => {

        const int16ToBytes = (i) => [i>>0,i>>8];
        const int32ToBytes = (i) => [i>>0,i>>8,i>>16,i>>24];

        const byteArray = [];

        byteArray.push(...int32ToBytes(this.Version));
        byteArray.push(...int32ToBytes(this.Numtiles));
        byteArray.push(...int32ToBytes(this.Start));
        byteArray.push(...int32ToBytes(this.End));
        
        for (let i = 0; i < this.Tiles.length; i++) {
            byteArray.push(...int16ToBytes(this.Tiles[i].pixels.length));
        }

        for (let i = 0; i < this.Tiles.length; i++) {
            byteArray.push(...int16ToBytes(this.Tiles[i].pixels.length > 0 ? this.Tiles[i].pixels[0].length : 0));
        }        

        for (let i = 0; i < this.Tiles.length; i++) {
            let animation = 0;
            animation = attach(animation, 0, 5, this.Tiles[i].animation.frames);
            animation = attach(animation, 6, 7, this.Tiles[i].animation.type);
            animation = attach(animation, 8, 15, this.Tiles[i].animation.offsetX);
            animation = attach(animation, 16, 23, this.Tiles[i].animation.offsetY);
            animation = attach(animation, 24, 27, this.Tiles[i].animation.speed);
            animation = attach(animation, 28, 31, this.Tiles[i].animation.unused);
            byteArray.push(...int32ToBytes(animation));
        }

        for (let i = 0; i < this.Tiles.length; i++) {
            for (let x = 0; x < this.Tiles[i].pixels.length ; x++) {
                for (let y = 0; y < this.Tiles[i].pixels[x].length; y++) {
                    byteArray.push(this.Tiles[i].pixels[x][y]);
                }
            }
        }

        // add remaining bytes if any
        byteArray.push(...this.Remaining);

        // convert to uint8array (not sure if necessary)
        return new Uint8Array(byteArray);

    };

}

try {
    module.exports = Art;
} catch (e) {
    // ignore
}