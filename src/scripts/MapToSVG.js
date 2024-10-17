function MapToSVG(map, grp, svg) {

    // ===========================
    // fix wrong offsets from GRP (probably a mistake by 3DRealms)
    // ===========================

    // acid tile from DN3D
    grp.Tiles[202].animation.offsetX = 0;
    grp.Tiles[202].animation.offsetY = 0;

    // ===========================

    if (!svg) svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns", "http://www.w3.org/2000/svg");
    svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
    svg.classList.add("mouse");

    svg.innerHTML = "";

    const minX = Math.min(...map.Walls.map(w => w.x));
    const maxX = Math.max(...map.Walls.map(w => w.x));
    const minY = Math.min(...map.Walls.map(w => w.y));
    const maxY = Math.max(...map.Walls.map(w => w.y));

    const width = Math.abs(maxX - minX);
    const height = Math.abs(maxY - minY);

    svg.viewBox.baseVal.x = minX;
    svg.viewBox.baseVal.y = minY;
    svg.viewBox.baseVal.width = width;
    svg.viewBox.baseVal.height = height;

    const tiles = {};
    const patterns = [];
    const sectorPaths = [];
    const floorSprites = [];
    const cameraSprites = [];
    const itemSprites = [];

    const itemPicnums = Picnum.Items;
    const effectorPicnums = Object.values(Picnum.Effectors);

    // this function "caches" all tile and animation data for it to be reused by the <pattern> and <use> tags
    // every combination of [picnum + shade + swap + alternate] generates a separate entry in the cache
    // this reduces a lot of memory and makes a single loop for each animation
    const cacheTile = (picnum, shade, swap, alternate) => {
        
        // generate unique identifier for this tile combination
        const id = `${picnum}_${shade}_${swap}_${alternate}`;

        // get colors for this tile combination
        const colors = grp.GetColors(shade, swap, alternate);

        // add tile to cache if not already there
        if (!tiles[id]) {

            const animation = grp.Tiles[picnum].animation;

            // if tile has no animation
            if (!animation.frames) { 

                const tile = grp.Tiles[picnum].pixels.length > 0 ? grp.Tiles[picnum].pixels : [[255]];
                const dataURL = TileToCanvas(tile, colors).toDataURL();

                tiles[id] = `<image 
                    id="${id}" 
                    width="${tile.length}" 
                    height="${tile[0].length}" 
                    href="${dataURL}" 
                    preserveAspectRatio="none"
                />`;

            } else {

                // aproximate the animation speed as best as I can
                const speed = Math.pow(animation.speed * 3.5, 2) * animation.frames;            

                // get actuall index of pincum from array
                const orderedPicnums = Object.keys(grp.Tiles);

                // find the index of the first frame of the animation
                const rootIndex = orderedPicnums.findIndex(p => parseInt(p) === picnum);

                // store all tilesn from animation
                const animationTiles = [];

                // get tiles in order corresponding to animation type
                switch (animation.type) {
                    // get tiles twice, iterating from start to finish and from finish to start
                    case AnimationType.Oscilating: {
                        for (let i = rootIndex; i <= rootIndex + animation.frames; i++) {
                            animationTiles.push(grp.Tiles[orderedPicnums[i]]);                            
                        }
                        for (let i = rootIndex + animation.frames; i >= rootIndex; i--) {
                            animationTiles.push(grp.Tiles[orderedPicnums[i]]);      
                        }
                        break;
                    }
                    // iterate forwards
                    case AnimationType.Forward: {
                        for (let i = rootIndex; i <= rootIndex + animation.frames; i++) {
                            animationTiles.push(grp.Tiles[orderedPicnums[i]]);      
                        }
                        break;
                    }
                    // iterate backwards
                    case AnimationType.Backward: {
                        for (let i = rootIndex; i >= rootIndex - animation.frames; i--) {
                            animationTiles.push(grp.Tiles[orderedPicnums[i]]);      
                        }
                        break;
                    }
                }

                const images = [];                

                for (let i = 0; i < animationTiles.length; i++) {
                    const tile = animationTiles[i].pixels;
                    const dataUrl = TileToCanvas(tile, colors).toDataURL();
                    images.push(`
                        <image
                            id="${id}_${i}" 
                            width="${tile.length}" 
                            height="${tile[0].length}"
                            href="${dataUrl}" 
                            preserveAspectRatio="none"                            
                        />
                    `);
                }

                tiles[id] = `
                
                    ${images.join("")}

                    <use id="${id}" href="#${id}_0">
                        <animate
                            attributeName="href"
                            values="${images.map((_, i) => `#${id}_${i}`).join(";")}"
                            dur="${speed}ms"
                            calcMode="discrete"
                            repeatCount="indefinite"
                        />
                        <animate
                            attributeName="x"
                            values="${animationTiles.map(t => Math.round(Math.round(grp.Tiles[picnum].pixels.length/2)-(t.pixels.length/2)) + -t.animation.offsetX).join(";")}"
                            dur="${speed}ms"
                            calcMode="discrete"
                            repeatCount="indefinite"
                        />
                        <animate
                            attributeName="y"
                            values="${animationTiles.map(t => Math.round(Math.round(grp.Tiles[picnum].pixels[0].length/2)-(t.pixels[0].length/2)) + -t.animation.offsetY).join(";")}"
                            dur="${speed}ms"
                            calcMode="discrete"
                            repeatCount="indefinite"
                        />
                    </use>
                
                `;

            }

        }

    };
    
    // get floor texture angle of rotation and wheter it's X mirrored or not
    const getAngleAndMirrored = (swapxy, flipx, flipy) => {
        switch (true) {
            case (!swapxy && !flipx && !flipy): return { angle: 0, mirrored: false }
            case ( swapxy && !flipx &&  flipy): return { angle: 90, mirrored: false }
            case (!swapxy &&  flipx &&  flipy): return { angle: 180, mirrored: false }
            case ( swapxy &&  flipx && !flipy): return { angle: 270, mirrored: false }
            case (!swapxy &&  flipx && !flipy): return { angle: 0, mirrored: true }
            case ( swapxy &&  flipx &&  flipy): return { angle: 90, mirrored: true }
            case (!swapxy && !flipx &&  flipy): return { angle: 180, mirrored: true }
            case ( swapxy && !flipx && !flipy): return { angle: 270, mirrored: true }
        }
    }

    // sectors
    for (const i in map.Sectors) {

        const sector = map.Sectors[i];
        const tile = grp.Tiles[sector.floorpicnum].pixels;
        const picnum = sector.floorpicnum;
        const shade = sector.floorshade;
        const swap = sector.floorpal || null;
        const alternate = sector.lotag === 2 ? (sector.ceilingpicnum === 200 ? 1 : 0) : null;

        const smooth = sector.floorstat.hasBit(SectorCstat.DoubleSmooshiness);
        const swapxy = sector.floorstat.hasBit(SectorCstat.SwapXY);
        const flipx = sector.floorstat.hasBit(SectorCstat.FlipX);
        const flipy = sector.floorstat.hasBit(SectorCstat.FlipY);
        const relativity = sector.floorstat.hasBit(SectorCstat.AlignTextureToFirstWallOfSector);        

        const width = tile.length ? tile.length : 1;
        const height = tile[0] ? tile[0].length : 1;

        const w = width * (smooth ? 8 : 16);
        const h = height * (smooth ? 8 : 16);
        let panx = (sector.floorxpanning * w) / 255;
        let pany = (sector.floorypanning * h) / 255;
        let x = 0;
        let y = 0;

        let { angle, mirrored } = getAngleAndMirrored(swapxy, flipx, flipy);

        if (relativity) {
            const wall1 = map.Walls[sector.wallptr];
            const wall2 = map.Walls[wall1.point2];
            const a = Math.atan2(wall1.y - wall2.y, wall1.x - wall2.x) * (180 / Math.PI) - 180;            
            angle += a;
            x += -wall1.x;
            y += -wall1.y;            
        }

        // cache tile and animation data
        cacheTile(picnum, sector.floorshade, swap, alternate);

        const d = [];

        for (let w = sector.wallptr; w < sector.wallptr + sector.wallnum; w++) {

            // if wall index is the first OR previous point2 is smaller than previous index => MOVETO else LINETO
            if (w === sector.wallptr || map.Walls[w - 1].point2 < w - 1) {
                d.push(`M${map.Walls[w].x} ${map.Walls[w].y}`);
            } else {
                d.push(`L${map.Walls[w].x} ${map.Walls[w].y}`);
            }

        }

        const path = `
            <pattern id="${i}" width="${w}" height="${h}" patternUnits="userSpaceOnUse" patternTransform="
                rotate(${relativity ? `${angle},${-x}, ${-y}` : `${-angle}, 0, 0`})
                ${relativity ? `translate(${-x},${y})` : ""}
                ${mirrored ? `translate(${w},0) scale(-1,1)` : ""}                               
                ${relativity ? `` : `translate(0,${h}) scale(1,-1)`}
                translate(${-panx},${-pany})
            ">
                <use 
                    href="#${picnum}_${shade}_${swap}_${alternate}" 
                    transform="scale(${w / width},${h / height})"
                />
            </pattern>
            <path d="${d.join(" ")} Z" fill="url(#${i})" rule="evenodd" />
        `;

        sectorPaths.push({ z: sector.floorz, path: path });        

        // let width = 0;
        // let height = 0;
        // let x = 0;
        // let y = 0;
        // let a = 0;

        // if (!swapxy) {
        //     width = tile.length > 0 ? tile.length * (smooth ? 8 : 16) : 1;
        //     height = tile.length > 0 ? tile[0].length * (smooth ? 8 : 16) : 1;
        //     // x = -((sector.floorxpanning * width) / 255);
        //     // y = -((sector.floorypanning * height) / 255);
        //     // a = 0;
        // } else {
        //     width = tile.length > 0 ? tile[0].length * (smooth ? 8 : 16) : 1;
        //     height = tile.length > 0 ? tile.length * (smooth ? 8 : 16) : 1;
        //     // y = -((sector.floorxpanning * width) / 255);
        //     // x = -((sector.floorypanning * height) / 255);
        //     // a = 0;
        // }

        // if (relativity) {

        //     const wall1 = map.Walls[sector.wallptr];
        //     const wall2 = map.Walls[wall1.point2];
        //     a += Math.atan2(wall1.y - wall2.y, wall1.x - wall2.x) * (180 / Math.PI);
        //     if (swapxy) {
        //         x = wall1.y;
        //         y = wall1.x;
        //     } else {
        //         x = wall1.x;
        //         y = wall1.y;
        //     }

        // }

        //tile = tile.map(a => a.toReversed());

        // defs.push(`
        //     <defs>
        //         <pattern id="sector-index-${i}" width="${width}" height="${height}" x="${x}" y="${y}" patternTransform="rotate(${a})" patternUnits="userSpaceOnUse">
        //             <image id="sector-index-${i}-image" width="${width}" height="${height}" href="${dataURL}" />
        //         </pattern>
        //     </defs>
        // `);

        //     <pattern id="sprite-${index}-pattern" width="${w}" height="${h}" x="${x}" y="${y}" patternUnits="userSpaceOnUse">
        //         <use href="#${sprite.picnum}_${sprite.shade}_${swap}_${alternate}" transform="scale(${w / width},${h / height})" />
        //     </pattern>

    }

    // walls (ignore for now)
    // for (const wall of map.Walls) {
    //     const x1 = wall.x;
    //     const y1 = wall.y;
    //     const x2 = map.Walls[wall.point2].x;
    //     const y2 = map.Walls[wall.point2].y;
    //     const stroke = wall.nextwall === 65535 ? "white" : "red";
    //     const line = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="10" />`;
    // }

    // sprites
    for (let index = 0; index < map.Sprites.length; index++) {

        const sprite = map.Sprites[index];
        const tile = grp.Tiles[sprite.picnum].pixels;

        // don't render effectors
        if (effectorPicnums.includes(sprite.picnum)) continue;
        // don't render wall sprites
        if (sprite.cstat.hasBit(SpriteCstat.WallAligned)) continue;
        // don't render 0x0 sprites
        if (tile.length === 0) continue;

        const floor = sprite.cstat.hasBit(SpriteCstat.FloorAligned);
        const flipx = sprite.cstat.hasBit(SpriteCstat.FlippedX);
        const flipy = floor ? false : sprite.cstat.hasBit(SpriteCstat.FlippedY);
        const t1 = sprite.cstat.hasBit(SpriteCstat.Transluscence1);
        const t2 = sprite.cstat.hasBit(SpriteCstat.Transluscence2);
        const t0 = sprite.cstat.hasBit(SpriteCstat.Invisible);

        let swap = sprite.pal || null;
        const alternate = null; // TO-DO => what could this be used for?

        // items / spawns / flags
        if (!floor && itemPicnums.includes(sprite.picnum)) {

            // force palette swap on team spawns and flags based on hi-tag
            if (sprite.picnum === Picnum.Spawn || sprite.picnum === Picnum.ProDuke.Flag || sprite.picnum === Picnum.NDuke.Flag) {
                switch (sprite.hitag) {
                    case 1: swap = 9; break;
                    case 2: swap = 10; break;
                    case 3: swap = 11; break;
                    case 4: swap = 15; break;
                    default: swap = sprite.picnum === Picnum.ProDuke.Flag || sprite.picnum === Picnum.NDuke.Flag ? 12 : swap; break;
                }
            }

            // paint coop spawns with blue swap
            if (sprite.picnum === Picnum.Spawn && sprite.lotag === 1) {
                swap = 1;
            }

        }
        
        // cache tile and animation data
        cacheTile(sprite.picnum, sprite.shade, swap, alternate);

        const width = tile.length;
        const height = tile[0].length;

        const w = floor ? (width * 16) * (sprite.xrepeat / 64) : (width * 8);
        const h = floor ? (height * 16) * (sprite.yrepeat / 64) : (height * 8);
        const x = floor ? sprite.x - (w / 2) : sprite.x - (w / 2);
        const y = floor ? sprite.y - (h / 2) : sprite.y - h;
        const angle = floor ? (sprite.ang / 2048) * 360 + 90 : 0;
        const alpha = t0 ? 0.0 : (t2 ? 0.3 : (t1 ? 0.6 : 1.0));

        const element = `
            <use 
                href="#${sprite.picnum}_${sprite.shade}_${swap}_${alternate}"
                opacity="${alpha}"
                transform="                    
                    translate(${x},${y})                    
                    rotate(${angle} ${w/2} ${h/2})
                    ${flipx ? `translate(${w},0) scale(-1,1)` : ""}
                    ${flipy ? `translate(0,${h}) scale(1,-1)` : ""}     
                    scale(${w / width},${h / height})                                  
                "
            />
        `;

        switch (true) {
            case sprite.cstat.hasBit(SpriteCstat.FloorAligned): {
                floorSprites.push({ z: sprite.z, element: element });
                break;
            }
            case itemPicnums.includes(sprite.picnum): {
                itemSprites.push({ z: sprite.z, element: element });
                break;
            }
            default: {
                cameraSprites.push({ z: sprite.z, element: element });
                break;
            }
        }

    }

    const elements = [];

    elements.push(`
        <defs>
            ${Object.values(tiles).join("")}
            ${patterns.join("")}
        </defs>
    `);

    elements.push(...sectorPaths.sort((a, b) => b.z - a.z).map(p => p.path));
    elements.push(...floorSprites.sort((a, b) => b.z - a.z).map(s => s.element));
    elements.push(...cameraSprites.sort((a, b) => b.z - a.z).map(s => s.element));
    elements.push(...itemSprites.sort((a, b) => b.z - a.z).map(s => s.element));

    svg.insertAdjacentHTML("beforeend", elements.join(""));

    return svg;

}