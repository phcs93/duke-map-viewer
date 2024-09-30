function ByteReader (bytes) {

    this.bytes = bytes;
    this.index = 0;

    const b = (n) => this.bytes[this.index++] << n;

    this.byte = () => (b(0) << 24) >> 24;
    this.int16 = () => b(0)|b(8);
    this.int32 = () => b(0)|b(8)|b(16)|b(24);

    this.ubyte = () => this.byte() & 0xFF;
    this.uint16 = () => this.int16() & 0xFFFF;
    this.uint32 = () => this.int32() & 0xFFFFFFFF;

}

try {
    module.exports = ByteReader;
} catch (e) {
    // ignore
}