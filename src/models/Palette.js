function Palette (bytes) {

    let index = 0; 

    const b = (n) => bytes[index++] << n;
    
    const byte = () => (b(0) << 24) >> 24;
    const int16 = () => b(0)|b(8);
    const int32 = () => b(0)|b(8)|b(16)|b(24);

    const ubyte = () => byte() & 0xFF;
    const uint16 = () => int16() & 0xFFFF;
    const uint32 = () => int32() & 0xFFFFFFFF;

    this.Colors = new Array(256);

    for (let i = 0; i < this.Colors.length; i++) {
        // scale from 0...64 to 0...256 (DOS was limited)
        const r = Math.lerp(0, 255, ubyte() / 64);
        const g = Math.lerp(0, 255, ubyte() / 64);
        const b = Math.lerp(0, 255, ubyte() / 64);
        this.Colors[i] = [r, g, b];
    }

    this.Shades = new Array(uint16());

    for (let i = 0; i < this.Shades.length; i++) {
        this.Shades[i] = new Array(256).fill(0).map(() => ubyte());
    }

    // this.Transparency = new Array(256).fill(new Array(256));

    // for (let x = 0; x < this.Transparency.length; x++) {
    //     for (let y = 0; y < this.Transparency[x].length; y++) {
    //         this.Transparency[x][y] = byte();
    //     }
    // }

    // prevent anything from being left behind
    this.Remaining = bytes.slice(index);

    // revert back to byte array
    this.Serialize = () => {

        const int16ToBytes = (i) => [i>>0,i>>8];
        const int32ToBytes = (i) => [i>>0,i>>8,i>>16,i>>24];

        const byteArray = [];
        
        for (let i = 0; i < this.Colors.length; i++) {
            const color = this.Colors[i];
            const r = Math.lerp(0, 64, color[0] / 255);
            const g = Math.lerp(0, 64, color[1] / 255);
            const b = Math.lerp(0, 64, color[2] / 255);
            byteArray.push(...[r,g,b]);
        }
       
        byteArray.push(...int16ToBytes(this.Shades.length));
       
        for (let i = 0; i < this.Shades.length; i++) {
            byteArray.push(...this.Shades[i]);
        }

        // add remaining bytes if any
        byteArray.push(...this.Remaining);

        // convert to uint8array (not sure if necessary)
        return new Uint8Array(byteArray);

    };

}

try {
    module.exports = Palette;
} catch (e) {
    // ignore
}