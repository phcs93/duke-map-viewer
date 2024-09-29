function Art (bytes, name) {

    this.name = name;

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

    this.version = uint32();
    this.numtiles = uint32();
    this.localtilestart = uint32();
    this.localtileend = uint32();

    this.tiles = new Array(this.localtileend - this.localtilestart + 1);

    this.tilesizx = new Array(this.tiles.length);
    for (let i = 0; i < this.tilesizx.length; i++) {
        this.tilesizx[i] = uint16();
    }

    this.tilesizy = new Array(this.tiles.length);    
    for (let i = 0; i < this.tilesizy.length; i++) {
        this.tilesizy[i] = uint16();
    }

    this.animations = new Array(this.tiles.length);    
    for (let i = 0; i < this.animations.length; i++) {
        const animation = uint32();
        this.animations[i] = {
            frames: isolate(animation, 0, 5) & 0x3F, // uint6
            type: isolate(animation, 6, 7), // int2
            offsetX: isolate(animation, 8, 15), // int8
            offsetY: isolate(animation, 16, 23), // int8
            speed: isolate(animation, 24, 27) & 0x0F, // uint4
            unused: isolate(animation, 28, 31) // int4
        };
    }

    for (let i = 0; i < this.tiles.length; i++) {
        this.tiles[i] = [];
        for (let x = 0; x < this.tilesizx[i] ; x++) {
            this.tiles[i][x] = [];
            for (let y = 0; y < this.tilesizy[i]; y++) {
                this.tiles[i][x][y] = ubyte();
            }
        }
    }

    // prevent anything from being left behind
    this.remaining = bytes.slice(index);

    // revert back to byte array
    this.serialize = () => {

        const int16ToBytes = (i) => [i>>0,i>>8];
        const int32ToBytes = (i) => [i>>0,i>>8,i>>16,i>>24];
        const int64ToBytes = (i) => [i>>0,i>>8,i>>16,i>>24,i>>32,i>>40,i>>48,i>>56];

        const byteArray = [];

        byteArray.push(...int32ToBytes(this.version));
        byteArray.push(...int32ToBytes(this.numtiles));
        byteArray.push(...int32ToBytes(this.localtilestart));
        byteArray.push(...int32ToBytes(this.localtileend));
        
        for (let i = 0; i < this.tilesizx.length; i++) {
            byteArray.push(...int16ToBytes(this.tilesizx[i]));
        }

        for (let i = 0; i < this.tilesizy.length; i++) {
            byteArray.push(...int16ToBytes(this.tilesizy[i]));
        }        

        for (let i = 0; i < this.animations.length; i++) {
            let animation = 0;
            animation = attach(animation, 0, 5, this.animations[i].frames);
            animation = attach(animation, 6, 7, this.animations[i].type);
            animation = attach(animation, 8, 15, this.animations[i].offsetX);
            animation = attach(animation, 16, 23, this.animations[i].offsetY);
            animation = attach(animation, 24, 27, this.animations[i].speed);
            animation = attach(animation, 28, 31, this.animations[i].unused);
            byteArray.push(...int32ToBytes(animation));
        }

        for (let i = 0; i < this.tiles.length; i++) {
            for (let x = 0; x < this.tilesizx[i] ; x++) {
                for (let y = 0; y < this.tilesizy[i]; y++) {
                    byteArray.push(this.tiles[i][x][y]);
                }
            }
        }

        // add remaining bytes if any
        byteArray.push(...this.remaining);

        // convert to uint8array (not sure if necessary)
        return new Uint8Array(byteArray);

    };

}

try {
    module.exports = Art;
} catch (e) {
    // ignore
}