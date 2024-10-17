function GRP (bytes) {

    const reader = new ByteReader(bytes);

    this.Signature = new Array(12).fill(0).map(() => String.fromCharCode(reader.int8())).join("");

    this.Files = new Array(reader.uint32());

    for (let i = 0; i < this.Files.length; i++) {
        this.Files[i] = {
            name: new Array(12).fill(0).map(() => String.fromCharCode(reader.int8())).join("").replace(/\x00/g, ""),
            size: reader.uint32(),
            bytes: []
        }
    }

    this.Palette = null;
    this.Lookup = null;
    this.Arts = [];
    this.Maps = [];

    for (let i = 0; i < this.Files.length; i++) {
        this.Files[i].bytes = reader.bytes.slice(reader.index, reader.index + this.Files[i].size);
        reader.index += this.Files[i].size;
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

    this.Remaining = reader.bytes.slice(reader.index);

    this.Serialize = () => {

        const writer = new ByteWriter();

        writer.bytes.push(...this.Signature.split("").map(c => c.charCodeAt(0)));

        writer.int32(this.Files.length);

        for (let i = 0; i < this.Files.length; i++) {            ;
            writer.bytes.push(...this.Files[i].name.split("").reduce((a, c, p) => { a[p] = c.charCodeAt(0); return a; }, new Array(12).fill(0)));
            writer.int32(this.Files[i].size);
        }

        for (let i = 0; i < this.Files.length; i++) { 
            switch (true) {
                case this.Files[i].name.toUpperCase() === "PALETTE.DAT": writer.bytes.push(...this.Palette.Serialize()); break;
                case this.Files[i].name.toUpperCase() === "LOOKUP.DAT": writer.bytes.push(...this.Lookup.Serialize()); break;
                case this.Files[i].name.toUpperCase().endsWith(".ART"): {
                    const artBytes = this.Arts.filter(art => art.Name.toUpperCase() === this.Files[i].name.toUpperCase())[0].Serialize();
                    for (const b of artBytes) writer.bytes.push(b);
                    break;
                }
                case this.Files[i].name.toUpperCase().endsWith(".MAP"): {
                    const mapBytes = this.Maps.filter(map => map.Name.toUpperCase() === this.Files[i].name.toUpperCase())[0].Serialize(); 
                    for (const b of mapBytes) writer.bytes.push(b);
                    break;
                }
                default: {
                    const fileBytes = this.Files[i].bytes; 
                    for (const b of fileBytes) writer.bytes.push(b);
                    break;
                }
            }
        }

        writer.bytes.push(...this.Remaining);

        return writer.bytes;


    };

    this.GetColors = (shade, swap, alternate) => {
        if (shade > this.Palette.Shades.length - 1) shade = this.Palette.Shades.length - 1;
        if (shade < 0) shade = 0;
        if (swap < 0 || swap > this.Lookup.Swaps.length - 1) swap = null;
        const swaps = this.Lookup.Swaps.reduce((d, s) => { d[s.index] = s; return d; }, {});
        let colors = alternate !== null ? this.Lookup.Alternates[alternate] : this.Palette.Colors;
        if (swap != null) colors = colors.map((c, i) => colors[swaps[swap].table[i]]);
        return colors.map((c, i) => colors[this.Palette.Shades[shade][i]]);
    }

}

try { module.exports = GRP; } catch {}