function Map (bytes) {

    let index = 0; 

    const b = (n) => bytes[index++] << n;
    const byte = () => b(0);
    const int16 = () => b(0)|b(8);
    const int32 = () => b(0)|b(8)|b(16)|b(24);
    const int64 = () => b(0)|b(8)|b(16)|b(24)|b(32)|b(40)|b(48)|b(56);

    this.version = int32();
    this.x = int32();
    this.y = int32();
    this.z = int32();
    this.a = int16();
    this.s = int16();

    this.sectors = new Array(int16());

    for (let i = 0; i < this.sectors.length; i++) {
        this.sectors[i] = {
            wallptr: int16(),
            wallnum: int16(),
            ceilingz: int32(),
            floorz: int32(),
            ceilingstat: int16(),
            floorstat: int16(),
            ceilingpicnum: int16(),
            ceilingheinum: int16(),
            ceilingshade: byte(),
            ceilingpal: byte(),
            ceilingxpanning: byte(),
            ceilingypanning: byte(),
            floorpicnum: int16(),
            floorheinum: int16(),
            floorshade: byte(),
            floorpal: byte(),
            floorxpanning: byte(),
            floorypanning: byte(),
            visibility: byte(),
            filler: byte(),
            lotag: int16(),
            hitag: int16(),
            extra: int16()
        };
    }

    this.walls = new Array(int16());

    for (let i = 0; i < this.walls.length; i++) {
        this.walls[i] = {
            x: int32(),
            y: int32(),
            point2: int16(),
            nextwall: int16(),
            nextsector: int16(),
            cstat: int16(),
            picnum: int16(),
            overpicnum: int16(),
            shade: byte(),
            pal: byte(),
            xrepeat: byte(),
            yrepeat: byte(),
            xpanning: byte(),
            ypanning: byte(),
            lotag: int16(),
            hitag: int16(),
            extra: int16()
        };
    }

    this.sprites = new Array(int16());

    for (let i = 0; i < this.sprites.length; i++) {
        this.sprites[i] = {	
            x: int32(),
            y: int32(),
            z: int32(),
            cstat: int16(),
            picnum: int16(),
            shade: byte(),
            pal: byte(),
            clipdist: byte(),
            filler: byte(),
            xrepeat: byte(),
            yrepeat: byte(),
            xoffset: byte(),
            yoffset: byte(),
            sectnum: int16(),
            statnum: int16(),
            ang: int16(),
            owner: int16(),
            xvel: int16(),
            yvel: int16(),
            zvel: int16(),
            lotag: int16(),
            hitag: int16(),
            extra: int16()
        };
    }

}