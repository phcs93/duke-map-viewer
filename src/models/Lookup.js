function Lookup (bytes) {

    const reader = new ByteReader(bytes);

    this.Swaps = new Array(reader.uint8());

    for (let i = 0; i < this.Swaps.length; i++) {        
        this.Swaps[i] = {
            index: reader.uint8(),
            table: new Array(256).fill(0).map(() => reader.uint8())
        };
    }

    this.Alternates = new Array((reader.bytes.length - reader.index) / (256*3));

    for (let i = 0; i < this.Alternates.length; i++) {        
        this.Alternates[i] = new Array(256).fill(0).map(() => [
            (reader.uint8() * 255) / 63,
            (reader.uint8() * 255) / 63,
            (reader.uint8() * 255) / 63
        ]);   
    }

    this.Remaining = reader.bytes.slice(reader.index);

    this.Serialize = () => {

        const writer = new ByteWriter();

        writer.int8(this.Swaps.length);
        
        for (let i = 0; i < this.Swaps.length; i++) {        
            writer.int8(this.Swaps[i].index);
            for (const index of this.Swaps[i].table) {
                writer.int8(index);
            }
        }

        for (let i = 0; i < this.Alternates.length; i++) {
            const alternate = this.Alternates[i];
            for (const color of alternate) {
                writer.int8((color[0] * 63) / 255);
                writer.int8((color[1] * 63) / 255);
                writer.int8((color[2] * 63) / 255);
            }
        }

        writer.bytes.push(...this.Remaining);

        return writer.bytes;

    };

}

try { module.exports = Lookup; } catch {}