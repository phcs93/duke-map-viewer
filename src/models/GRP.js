function GRP (bytes) {

    let index = 0; 

    const b = (n) => bytes[index++] << n;
    
    const byte = () => (b(0) << 24) >> 24;
    const int16 = () => b(0)|b(8);
    const int32 = () => b(0)|b(8)|b(16)|b(24);

    const ubyte = () => byte() & 0xFF;
    const uint16 = () => int16() & 0xFFFF;
    const uint32 = () => int32() & 0xFFFFFFFF;

    this.Signature = new Array(12).fill(0).map(() => String.fromCharCode(byte())).join("");

    this.Files = new Array(uint32());

    for (let i = 0; i < this.Files.length; i++) {
        this.Files[i] = {
            name: new Array(12).fill(0).map(() => String.fromCharCode(byte())).join("").replace(/\x00/g, ""),
            size: uint32(),
            bytes: []
        }
    }

    this.Palette = null;
    this.Lookup = null;
    this.Arts = [];
    this.Maps = [];

    for (let i = 0; i < this.Files.length; i++) {
        this.Files[i].bytes = bytes.slice(index, index + this.Files[i].size);
        index += this.Files[i].size;
        switch (true) {
            case this.Files[i].name === "PALETTE.DAT": this.Palette = new Palette(this.Files[i].bytes); break;
            case this.Files[i].name === "LOOKUP.DAT": this.Lookup = new Lookup(this.Files[i].bytes); break;
            case this.Files[i].name.endsWith(".ART"): this.Arts.push(new Art(this.Files[i].bytes, this.Files[i].name)); break;
            case this.Files[i].name.endsWith(".MAP"): this.Maps.push(new Map(this.Files[i].bytes, this.Files[i].name)); break;
        }
    }

    this.Arts = this.Arts.sort((a, b) => a.Start - b.Start);

    this.Tiles = this.Arts.reduce((tiles, art) => { 
        for (let i = 0; i < art.Tiles.length; i++) {
            tiles[art.Start + i] = art.Tiles[i];
        }
        return tiles; 
    }, []);

    this.Remaining = bytes.slice(index);

    this.Serialize = () => {

        const int16ToBytes = (i) => [i>>0,i>>8];
        const int32ToBytes = (i) => [i>>0,i>>8,i>>16,i>>24];

        const byteArray = [];

        byteArray.push(...this.Signature.split("").map(c => c.charCodeAt(0)));

        byteArray.push(...int32ToBytes(this.Files.length));

        for (let i = 0; i < this.Files.length; i++) {            ;
            byteArray.push(...this.Files[i].name.split("").reduce((a, c, p) => { a[p] = c.charCodeAt(0); return a; }, new Array(12).fill(0)));
            byteArray.push(...int32ToBytes(this.Files[i].size));
        }

        for (let i = 0; i < this.Files.length; i++) { 
            switch (true) {
                case this.Files[i].name.toUpperCase() === "PALETTE.DAT": byteArray.push(...this.Palette.Serialize()); break;
                case this.Files[i].name.toUpperCase() === "LOOKUP.DAT": byteArray.push(...this.Lookup.Serialize()); break;
                case this.Files[i].name.toUpperCase().endsWith(".ART"): {
                    const artBytes = this.Arts.filter(art => art.Name.toUpperCase() === this.Files[i].name.toUpperCase())[0].Serialize();
                    for (const b of artBytes) byteArray.push(b);
                    break;
                }
                case this.Files[i].name.toUpperCase().endsWith(".MAP"): {
                    const mapBytes = this.Maps.filter(map => map.Name.toUpperCase() === this.Files[i].name.toUpperCase())[0].Serialize(); 
                    for (const b of mapBytes) byteArray.push(b);
                    break;
                }
                default: {
                    const fileBytes = this.Files[i].bytes; 
                    for (const b of fileBytes) byteArray.push(b);
                    break;
                }
            }
        }

        // add remaining bytes if any
        byteArray.push(...this.Remaining);

        // convert to uint8array (not sure if necessary)
        return new Uint8Array(byteArray);

    };

    this.GetColors = (shade, swap, alternate) => {
        const swaps = this.Lookup.Swaps.reduce((d, s) => { d[s.index] = s; return d; }, {});
        let colors = alternate !== null ? this.Lookup.Alternates[alternate] : this.Palette.Colors;
        if (swap != null) colors = colors.map((c, i) => colors[swaps[swap].table[i]]);
        return colors.map((c, i) => colors[this.Palette.Shades[shade][i]]);
    }

}

try {
    module.exports = GRP;
} catch (e) {
    // ignore
}