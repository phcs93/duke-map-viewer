function ByteWriter (bytes) {

    this.bytes = bytes || [];

    this.int8 = (v) => this.bytes.push(v);
    this.int16 = (v) => this.bytes.push(...[v>>0,v>>8]);
    this.int32 = (v) => this.bytes.push(...[v>>0,v>>8,v>>16,v>>24]);

}

try { module.exports = ByteWriter; } catch {}