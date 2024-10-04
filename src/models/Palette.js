function Palette (bytes) {

    const reader = new ByteReader(bytes);

    this.Colors = new Array(256);

    for (let i = 0; i < this.Colors.length; i++) {
        this.Colors[i] = [
            (reader.uint8() * 255) / 63,
            (reader.uint8() * 255) / 63,
            (reader.uint8() * 255) / 63
        ];
    }

    this.Shades = new Array(reader.uint16());

    for (let i = 0; i < this.Shades.length; i++) {
        this.Shades[i] = new Array(256).fill(0).map(() => reader.uint8());
    }

    this.Transparency = new Array(256);

    for (let x = 0; x < this.Transparency.length; x++) {
        this.Transparency[x] = new Array(256);
        for (let y = 0; y < this.Transparency[x].length; y++) {
            this.Transparency[x][y] = reader.uint8();
        }
    }

    this.Remaining = reader.bytes.slice(reader.index);
    
    this.Serialize = () => {

        const writer = new ByteWriter();
        
        for (let i = 0; i < this.Colors.length; i++) {
            const color = this.Colors[i];
            writer.int8((color[0] * 63) / 255);
            writer.int8((color[1] * 63) / 255);
            writer.int8((color[2] * 63) / 255);
        }
       
        writer.int16(this.Shades.length)
       
        for (let i = 0; i < this.Shades.length; i++) {
            for (const shade of this.Shades[i]) {
                for (const index of shade) {
                    writer.int8(index);
                }
            }
        }

        writer.bytes.push(...this.Remaining);

        return writer.bytes;

    };

}

try { module.exports = Palette; } catch {}