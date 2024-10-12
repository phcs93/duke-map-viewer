function MapToSVG(map, grp, svg) {

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
    const sizes = {};
    const patterns = [];
    const sectorPaths = [];
    const floorSprites = [];
    const cameraSprites = [];
    const itemSprites = [];
    const animations = [];

    const itemPicnums = Picnum.Items;
    const effectorPicnums = Object.values(Picnum.Effectors);

    // this "caches" all tile and animation data for it to be used by the <pattern> tags, reducing a lot of memory
    // every combination of [picnum + shade + swap + alternate] generates a separate entry in the cache
    // this also returns the width and height of the tile (considering animation offsets)
    const cacheTileAndAnimation = (picnum, shade, swap, alternate) => {
        
        // generate unique identifier for this tile combination
        const id = `${picnum}_${shade}_${swap}_${alternate}`;

        // get colors for this tile combination
        const colors = grp.GetColors(shade, swap, null);

        // add tile to cache if not already there
        if (!tiles[id]) {

            const animation = grp.Tiles[picnum].animation;

            // if tile has no animation
            if (!animation.frames) { 

                const tile = grp.Tiles[picnum].pixels;                
                const dataURL = TileToCanvas(tile, colors).toDataURL();

                tiles[id] = `<image 
                    id="${id}" 
                    width="${tile.length}" 
                    height="${tile[0].length}" 
                    href="${dataURL}" 
                    preserveAspectRatio="none"
                />`;

                sizes[id] = {
                    width: tile.length,
                    height: tile[0].length
                };

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

                // get max width and height of animation frames
                const maxWidth = Math.max(...animationTiles.map(t => t.pixels.length));
                const maxHeight = Math.max(...animationTiles.map(t => t.pixels[0].length));

                // get max x and y animation offsets (positive and negative)
                const maxPositiveOffsetX = Math.max(0, ...animationTiles.filter(t => t.animation.offsetX >= 0).map(t => t.animation.offsetX));
                const maxPositiveOffsetY = Math.max(0, ...animationTiles.filter(t => t.animation.offsetY >= 0).map(t => t.animation.offsetY));
                const maxNegativeOffsetX = Math.abs(Math.min(0, ...animationTiles.filter(t => t.animation.offsetX <= 0).map(t => t.animation.offsetX)));
                const maxNegativeOffsetY = Math.abs(Math.min(0, ...animationTiles.filter(t => t.animation.offsetY <= 0).map(t => t.animation.offsetY)));

                // sum everything to determine sprite size (ensure that width and height are even numbers)
                const width = ((maxWidth + maxPositiveOffsetX + maxNegativeOffsetX) | 1) + 1;
                const height = ((maxHeight + maxPositiveOffsetY + maxNegativeOffsetY) | 1) + 1;

                const images = [];                

                for (let i = 0; i < animationTiles.length; i++) {
                    const animation = animationTiles[i].animation;
                    const offsetX = Math.round((width - animationTiles[i].pixels.length) / 2) + -animation.offsetX;
                    const offsetY = Math.round((height - animationTiles[i].pixels[0].length) / 2) + -animation.offsetY;
                    const tile = animationTiles[i].pixels.offset("x", offsetX, 255).offset("y", offsetY, 255);
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
                            repeatCount="indefinite"
                        />
                    </use>
                
                `;

                sizes[id] = {
                    width: width,
                    height: height
                };

            }

        }

        // return cached tile infomation (width and height)
        return sizes[id];

    };

    // sectors
    for (const i in map.Sectors) {

        const sector = map.Sectors[i];

        const walls = [];
        let first = true;
        let firstIndex = sector.wallptr;
        for (let w = sector.wallptr; w < sector.wallptr + sector.wallnum; w++) {
            walls.push({ wall: map.Walls[w], type: first ? "M" : "L" });
            if (map.Walls[w].point2 !== firstIndex) {
                first = false;
            } else {
                first = true;
                firstIndex = w + 1;
            }
        }
        const d = walls.map(w => `${(w.type)}${w.wall.x} ${w.wall.y}`).join(" ");
        //const path = `<path id="${i}" d="${d} Z" fill="url(#sector-index-${i})" rule="evenodd" />`;
        const path = `<path id="${i}" d="${d} Z" fill="#555555" rule="evenodd" />`;
        sectorPaths.push({ z: sector.floorz, path: path });

        const picnum = sector.floorpicnum;
        let tile = grp.Tiles[picnum].pixels;

        const shade = sector.floorshade > 31 ? 31 : (sector.floorshade < 0 ? 0 : sector.floorshade);
        const swap = sector.floorpal || null;
        const alternate = sector.lotag === 2 ? (sector.ceilingpicnum === 200 ? 1 : 0) : null;
        const colors = grp.GetColors(shade, swap, alternate);

        const smooth = sector.floorstat.hasBit(SectorCstat.DoubleSmooshiness);
        const swapxy = sector.floorstat.hasBit(SectorCstat.SwapXY);
        const flipx = sector.floorstat.hasBit(SectorCstat.FlipX);
        const flipy = sector.floorstat.hasBit(SectorCstat.FlipY);
        const relativity = sector.floorstat.hasBit(SectorCstat.AlignTextureToFirstWallOfSector);

        let width = 0;
        let height = 0;
        let x = 0;
        let y = 0;
        let a = 0;

        if (!swapxy) {
            width = tile.length > 0 ? tile.length * (smooth ? 8 : 16) : 1;
            height = tile.length > 0 ? tile[0].length * (smooth ? 8 : 16) : 1;
            // x = -((sector.floorxpanning * width) / 255);
            // y = -((sector.floorypanning * height) / 255);
            // a = 0;
        } else {
            width = tile.length > 0 ? tile[0].length * (smooth ? 8 : 16) : 1;
            height = tile.length > 0 ? tile.length * (smooth ? 8 : 16) : 1;
            // y = -((sector.floorxpanning * width) / 255);
            // x = -((sector.floorypanning * height) / 255);
            // a = 0;
        }

        if (relativity) {

            const wall1 = map.Walls[sector.wallptr];
            const wall2 = map.Walls[wall1.point2];
            a += Math.atan2(wall1.y - wall2.y, wall1.x - wall2.x) * (180 / Math.PI);
            if (swapxy) {
                x = wall1.y;
                y = wall1.x;
            } else {
                x = wall1.x;
                y = wall1.y;
            }
        }

        tile = tile.map(a => a.toReversed());
        const dataURL = TileToCanvas(tile, colors, null).toDataURL();

        // defs.push(`
        //     <defs>
        //         <pattern id="sector-index-${i}" width="${width}" height="${height}" x="${x}" y="${y}" patternTransform="rotate(${a})" patternUnits="userSpaceOnUse">
        //             <image id="sector-index-${i}-image" width="${width}" height="${height}" href="${dataURL}" />
        //         </pattern>
        //     </defs>
        // `);

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
        const {width, height} = cacheTileAndAnimation(sprite.picnum, sprite.shade, swap, alternate);        

        const w = floor ? (width * 16) * (sprite.xrepeat / 64) : (width * 8);
        const h = floor ? (height * 16) * (sprite.yrepeat / 64) : (height * 8);
        const x = floor ? sprite.x - (w / 2) : sprite.x - (w / 2);
        const y = floor ? sprite.y - (h / 2) : sprite.y - h;
        const angle = floor ? (sprite.ang / 2048) * 360 + 90 : 0;
        const alpha = t0 ? 0.0 : (t2 ? 0.3 : (t1 ? 0.6 : 1.0));

        // create pattern for rectangle (this is the only way to scale and translate)
        // TO-DO => check if it is possible to do this without a <pattern> since we don't need it to repeat here
        patterns.push(`
            <pattern id="sprite-${index}-pattern" width="${w}" height="${h}" x="${x}" y="${y}" patternUnits="userSpaceOnUse">
                <use href="#${sprite.picnum}_${sprite.shade}_${swap}_${alternate}" transform="scale(${w / width},${h / height})" />
            </pattern>
        `);

        const image = `
            <rect          
                width="${w}" 
                height="${h}" 
                x="${x}" 
                y="${y}" 
                fill="url(#sprite-${index}-pattern)"
                opacity="${alpha}"
                transform="                
                    rotate(${angle} ${sprite.x} ${sprite.y})     
                    ${flipx ? `translate(${x * 2 + w},0) scale(-1,1)` : ""}
                    ${flipy ? `translate(0,${y * 2 + h}) scale(1,-1)` : ""}
                "
            />
        `;

        switch (true) {
            case sprite.cstat.hasBit(SpriteCstat.FloorAligned): {
                floorSprites.push({ z: sprite.z, image: image });
                break;
            }
            case itemPicnums.includes(sprite.picnum): {
                itemSprites.push({ z: sprite.z, image: image });
                break;
            }
            default: {
                cameraSprites.push({ z: sprite.z, image: image });
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
    elements.push(...floorSprites.sort((a, b) => b.z - a.z).map(s => s.image));
    elements.push(...cameraSprites.sort((a, b) => b.z - a.z).map(s => s.image));
    elements.push(...itemSprites.sort((a, b) => b.z - a.z).map(s => s.image));

    svg.insertAdjacentHTML("beforeend", elements.join(""));

    return svg;

}