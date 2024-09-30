function Lookup (bytes) {

    let index = 0; 

    const b = (n) => bytes[index++] << n;
    
    const byte = () => (b(0) << 24) >> 24;
    const int16 = () => b(0)|b(8);
    const int32 = () => b(0)|b(8)|b(16)|b(24);

    const ubyte = () => byte() & 0xFF;
    const uint16 = () => int16() & 0xFFFF;
    const uint32 = () => int32() & 0xFFFFFFFF;

    this.Swaps = new Array(ubyte());

    for (let i = 0; i < this.Swaps.length; i++) {        
        this.Swaps[i] = {
            index: ubyte(),
            table: new Array(256).fill(0).map(() => ubyte())
        };
    }

    this.Alternates = new Array((bytes.length - index) / (256*3));

    for (let i = 0; i < this.Alternates.length; i++) {        
        this.Alternates[i] = new Array(256).fill(0).map(() => [
            Math.lerp(0, 255, ubyte() / 64),
            Math.lerp(0, 255, ubyte() / 64),
            Math.lerp(0, 255, ubyte() / 64)
        ]);   
    }

    // prevent anything from being left behind
    this.Remaining = bytes.slice(index);

    // revert back to byte array
    this.Serialize = () => {

        const int16ToBytes = (i) => [i>>0,i>>8];
        const int32ToBytes = (i) => [i>>0,i>>8,i>>16,i>>24];

        const byteArray = [];        
        
        byteArray.push(this.Swaps.length);
        
        for (let i = 0; i < this.Swaps.length; i++) {        
            byteArray.push(this.Swaps[i].index);
            byteArray.push(...this.Swaps[i].table);
        }

        for (let i = 0; i < this.Alternates.length; i++) {
            const alternate = this.Alternates[i];
            for (const color of alternate) {
                const r = Math.lerp(0, 64, color[0] / 255);
                const g = Math.lerp(0, 64, color[1] / 255);
                const b = Math.lerp(0, 64, color[2] / 255);
                byteArray.push(...[r,g,b]);
            }
        }

        // add remaining bytes if any
        byteArray.push(...this.Remaining);

        // convert to uint8array (not sure if necessary)
        return new Uint8Array(byteArray);

    };

}

try {
    module.exports = Lookup;
} catch (e) {
    // ignore
}