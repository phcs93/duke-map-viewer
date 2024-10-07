function MapToSVG(map, grp, svg) {

    if (!svg) svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
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
    const animations = [];

    const itemPicnums = [
        Picnum.Spawn,
        Picnum.Card,
        ...Object.values(Picnum.Weapons),
        ...Object.values(Picnum.Ammo),
        ...Object.values(Picnum.Inventory),
        ...Object.values(Picnum.Health),
        Picnum.ProDuke.Flag,
        Picnum.NDuke.Flag
    ];

    const effectorPicnums = Object.values(Picnum.Effectors);

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

        const w = floor ? (tile.length * 16) * (sprite.xrepeat / 64) : (tile.length * 8);
        const h = floor ? (tile[0].length * 16) * (sprite.yrepeat / 64) : (tile[0].length * 8);
        const x = floor ? sprite.x - (w / 2) : sprite.x - (w / 2);
        const y = floor ? sprite.y - (h / 2) : sprite.y - h;
        const angle = floor ? (sprite.ang / 2048) * 360 + 90 : 0;
        const alpha = t0 ? 0.0 : (t2 ? 0.3 : (t1 ? 0.6 : 1.0));
        const shade = sprite.shade;
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

        // add tile to dictionary if not already there
        const id = `${sprite.picnum}#${sprite.shade}#${swap}#${alternate}`;
        if (!tiles[id]) {
            const colors = grp.GetColors(shade, swap, null);
            const dataURL = TileToCanvas(tile, colors).toDataURL();
            tiles[id] = `<image 
                id="${id}" 
                width="${tile.length}" 
                height="${tile[0].length}" 
                href="${dataURL}" 
                preserveAspectRatio="none"
            />`;
        }        

        // create pattern for rectangle (this is the only way to scale and translate)
        // TO-DO => check if it is possible to do this without a <pattern> since we don't need it to repeat here
        patterns.push(`
            <pattern id="sprite-${index}-pattern" width="${w}" height="${h}" x="${x}" y="${y}" patternUnits="userSpaceOnUse">
                <use xlink:href="#${id}" transform="scale(${w/tile.length},${h/tile[0].length})" />
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

        /*
            frames: isolate(animation, 0, 5) & 0x3F, // uint6
            type: isolate(animation, 6, 7), // int2
            offsetX: isolate(animation, 8, 15), // int8
            offsetY: isolate(animation, 16, 23), // int8
            speed: isolate(animation, 24, 27) & 0x0F, // uint4
            unused: isolate(animation, 28, 31) // int4
        */

        if (grp.Tiles[sprite.picnum].animation.type) {

            // const scriptContent = `
                
            //         function aaa${index}() {
            //             const image = document.getElementById("sprite-${index}");
            //             console.log(image);
            //         }
            //         setInterval(aaa${index}, 1000);
                
            // `;
            
            // const scriptElement = document.createElementNS("http://www.w3.org/2000/svg", "script");
            // scriptElement.setAttribute("type", "application/ecmascript");
            // scriptElement.textContent = scriptContent;
            // svg.appendChild(scriptElement);

        }

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
    //elements.push(...animations);

    svg.insertAdjacentHTML("beforeend", elements.join(""));

    return svg;

}