Globals = {};

document.addEventListener("DOMContentLoaded", async () => {

    const urlMapParam = new URLSearchParams(window.location.search).get("map");

    // run this here so the page at least shows something while the database is loading
    if (!urlMapParam) {
        document.getElementById("map-filter-page").dataset.visible = true;
        document.getElementById("map-details-page").dataset.visible = false;
    } else {
        document.getElementById("map-filter-page").dataset.visible = false;
        document.getElementById("map-details-page").dataset.visible = true;
    }

    const database = JSON.parse(pako.ungzip(await (await fetch("bin/database.gzip")).arrayBuffer(), { to: "string" }));

    if (!urlMapParam) {

        document.querySelector("table#maps-table > tbody").innerHTML = database.map(map => `
            <tr>
                <td class="text-center"><a href="res/maps/${encodeURIComponent(map.name)}.map" download><img style="width: 16px; height: 16px;" src="res/images/icons/download.svg" alt="download" title="download"></a></td>
                <td class="text-center"><a href="?map=${encodeURIComponent(map.name)}">${map.name}</a></td>
                <td class="text-right">${map.spawns || ""}</td>
                <td class="text-right">${map.coop || ""}</td>
                <td class="text-right">${map.width || ""}</td>
                <td class="text-right">${map.height || ""}</td>
                <td class="text-right">${map.depth || ""}</td>
                <td class="text-right">${map.items.weapons.pistol || ""}</td>
                <td class="text-right">${map.items.weapons.shotgun || ""}</td>
                <td class="text-right">${map.items.weapons.chaingun || ""}</td>
                <td class="text-right">${map.items.weapons.rpg || ""}</td>
                <td class="text-right">${(map.items.weapons.pipebomb + map.items.ammo.pipebomb) || ""}</td>
                <td class="text-right">${map.items.weapons.shrinker || ""}</td>
                <td class="text-right">${map.items.ammo.expander || ""}</td>
                <td class="text-right">${map.items.weapons.devastator || ""}</td>
                <td class="text-right">${map.items.weapons.freezer || ""}</td>
                <td class="text-right">${map.items.weapons.tripbomb || ""}</td>
                <td class="text-center">${map.damagingFloor ? "YES" : ""}</td>
            </tr>
        `).join("");

        // tr reference dictionary for better performance (based of index)
        const trs = Object.values(document.querySelectorAll("table#maps-table > tbody > tr")).reduce((trs, tr, i) => {
            trs[i] = tr;
            return trs;
        }, {});

        // "global" filters variable for better performance
        const filters = {};

        document.querySelectorAll(".filter").forEach(element => element.oninput = e => {

            switch (true) {
                case e.target.type === "text": {
                    filters[e.target.id] = e.target.value;
                    break;
                }
                case e.target.type === "number": {
                    filters[e.target.id] = parseInt(e.target.value);
                    break;
                }
            }

            for (const i in database) {

                const map = database[i];

                let visible = true;

                if (filters["name-filter"] && map.name.toLowerCase().indexOf(filters["name-filter"].toLowerCase()) < 0) {
                    visible = false;
                }

                if (filters["spawns-filter"] && map.spawns < filters["spawns-filter"]) {
                    visible = false;
                }

                trs[i].dataset.visible = visible;

            }

        });

    } else {

        // load grp/palette/lookup/arts for textures
        Globals.GRP = await loadGRP();
        Globals.Palette = new Palette(Globals.GRP.getFileBytes("PALETTE.DAT"));
        Globals.Lookup = new Lookup(Globals.GRP.getFileBytes("LOOKUP.DAT"));
        Globals.Arts = [];
        for (const file of Globals.GRP.files.filter(f => f.name.toUpperCase().endsWith(".ART"))) {
            const art = new Art(Globals.GRP.getFileBytes(file.name), file.name);
            Globals.Arts.push(art);
        }
        Globals.Arts.push(await loadProDukeART());
        Globals.Arts.push(await loadNDukeART());
        Globals.Arts = Globals.Arts.sort((a, b) => a.localtilestart - b.localtilestart);
        Globals.Tiles = Globals.Arts.reduce((tiles, art) => { 
            for (let i = 0; i < art.tiles.length; i++) {
                tiles[art.localtilestart + i] = art.tiles[i];
            }
            return tiles; 
        }, []);

        // database dictionary for better performance when changing maps
        const dictionary = database.reduce((dictionary, map) => {
            dictionary[map.name] = map;
            return dictionary;
        }, {});

        document.querySelector("select#map-select").innerHTML = database.map(map => `
            <option value="${map.name}" ${map.name === urlMapParam ? "selected" : ""}>${map.name}</option>
        `).join("");

        document.querySelector("select#map-select").onchange = e => {
            window.history.replaceState(null, null, `?map=${encodeURIComponent(e.target.value)}`);
            renderMap(e.target.value);
        };

        renderMap(urlMapParam);

    }



});

async function loadGRP () {
    const bytes = await (await fetch(`res/grps/duke3d.grp`)).arrayBuffer();
    return new GRP(new Uint8Array(bytes));
}

async function loadProDukeART () {
    const bytes = await (await fetch(`res/tiles/produke.art`)).arrayBuffer();
    return new Art(new Uint8Array(bytes));
}

async function loadNDukeART () {
    const bytes = await (await fetch(`res/tiles/nduke.art`)).arrayBuffer();
    return new Art(new Uint8Array(bytes));
}

async function renderMap(name) {
    const bytes = await (await fetch(`res/maps/${encodeURIComponent(name)}.map`)).arrayBuffer();
    const map = new Map(new Uint8Array(bytes));
    renderMapSVG(map);
}

function renderMapSVG(map) {

    console.log(map);

    const svg = document.querySelector("svg");

    svg.innerHTML = "";

    const minX = Math.min(...map.walls.map(w => w.x));
    const maxX = Math.max(...map.walls.map(w => w.x));
    const minY = Math.min(...map.walls.map(w => w.y));
    const maxY = Math.max(...map.walls.map(w => w.y));

    const width = Math.abs(maxX - minX);
    const height = Math.abs(maxY - minY);

    svg.viewBox.baseVal.x = minX;
    svg.viewBox.baseVal.y = minY;
    svg.viewBox.baseVal.width = width;
    svg.viewBox.baseVal.height = height;

    const strokeWidth = 0.001 * Math.max(width, height);

    const elements = [];

    const paths = [];

    for (const i in map.sectors) {
        const sector = map.sectors[i];
        const walls = [];
        let first = true;
        let firstIndex = sector.wallptr;
        for (let w = sector.wallptr; w < sector.wallptr + sector.wallnum; w++) {
            walls.push({ wall: map.walls[w], type: first ? "M" : "L" });
            if (map.walls[w].point2 !== firstIndex) {
                first = false;
            } else {
                first = true;
                firstIndex = w + 1;
            }
        }
        const d = walls.map(w => `${(w.type)}${w.wall.x} ${w.wall.y}`).join(" ");
        const path = `<path id="${i}" d="${d} Z" fill="url(#sector-index-${i})" rule="evenodd" />`;
        paths.push({z: sector.floorz, path: path});
    }

    elements.push(...paths.sort((a,b) => b.z - a.z).map(p => p.path));

    for (const wall of map.walls) {
        const x1 = wall.x;
        const y1 = wall.y;
        const x2 = map.walls[wall.point2].x;
        const y2 = map.walls[wall.point2].y;
        const stroke = wall.nextwall === 65535 ? "white" : "red";
        const line = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
        //elements.push(line);
    }

    for (const sprite of map.sprites) {

        if (sprite.cstat.hasBit(SpriteCstat.FloorAligned)) {
            const tile = Globals.Tiles[sprite.picnum];
            const w = (tile.length * 16) * (sprite.xrepeat / 64);
            const h = (tile[0].length * 16) * (sprite.yrepeat / 64);
            const x = sprite.x - (w / 2);
            const y = sprite.y - (h / 2);
            const a = Math.lerp(0, 360, sprite.ang / 2048) + 90;
            // const rect = `<rect x="${x}" y="${y}" width="${w}" height="${h}" stroke="purple" stroke-width="${strokeWidth}" fill="transparent" stroke-dasharray="20,20" />`;
            // const line1 = `<line x1="${x}" y1="${y}" x2="${x + w}" y2="${y + h}" stroke="purple" stroke-width="${strokeWidth}" stroke-dasharray="20,20" />`;
            // const line2 = `<line x1="${x}" y1="${y + h}" x2="${x + w}" y2="${y}" stroke="purple" stroke-width="${strokeWidth}" stroke-dasharray="20,20" />`;
            // elements.push(rect);
            // elements.push(line1);
            // elements.push(line2);

            const alpha = sprite.cstat.hasBit(SpriteCstat.Transluscence2) ? 100 : (sprite.cstat.hasBit(SpriteCstat.Transluscence1) ? 200 : 255);
            const colors = getColors(0, null, null);
            const dataURL = tileToDataURL(tile, colors, alpha);
            const image = `<image id="sprite-${sprite.picnum}-image" width="${w}" height="${h}" x="${x}" y="${y}" href="${dataURL}" transform="rotate(${a} ${sprite.x} ${sprite.y})" />`;
            elements.push(image);
        } else {
            //const circle = `<circle cx="${sprite.x}" cy="${sprite.y}" r="${strokeWidth * 2}" stroke="green" stroke-width="${strokeWidth}" fill="transparent" />`;
            if (isItem(sprite.picnum)) {
                const tile = Globals.Tiles[sprite.picnum];
                const w = tile.length * 8;
                const h = tile[0].length * 8;
                const x = sprite.x - (w / 2);
                const y = sprite.y - h;

                let swap = sprite.pal || null;

                // team spawn points and flags
                if (sprite.picnum === Picnum.Spawn || sprite.picnum === Picnum.ProDuke.Flag || sprite.picnum === Picnum.NDuke.Flag) {
                    switch (sprite.hitag) {
                        case 1: swap = 9; break;
                        case 2: swap = 10; break;
                        case 3: swap = 11; break;
                        case 4: swap = 15; break;
                        default: swap = sprite.picnum === Picnum.ProDuke.Flag || sprite.picnum === Picnum.NDuke.Flag ? 12 : swap; break;
                    }                    
                }

                // coop spawns
                if (sprite.picnum === Picnum.Spawn && sprite.lotag === 1) {
                    swap = 1;
                }

                const colors = getColors(0, swap, null);
                const dataURL = tileToDataURL(tile, colors);
                const image = `<image id="sprite-${sprite.picnum}-image" width="${w}" height="${h}" x="${x}" y="${y}" href="${dataURL}" />`;
                elements.push(image);
            }
        }

    }

    for (const i in map.sectors) {

        const sector = map.sectors[i];        
        const picnum = sector.floorpicnum;
        const tile = Globals.Tiles[picnum];
        const smooth = sector.floorstat & 8;
        const width = tile.length * (smooth ? 8 : 16);
        const height = tile[0].length * (smooth ? 8 : 16);
        const shade = sector.floorshade > 31 ? 31 : (sector.floorshade < 0 ? 0 : sector.floorshade);
        const swap = sector.floorpal || null;
        const alternate = sector.lotag === 2 ? (sector.ceilingpicnum === 200 ? 1 : 0) : null;
        const colors = getColors(shade, swap, alternate);
        const dataURL = tileToDataURL(tile, colors);

        elements.push(`
            <defs>
                <pattern id="sector-index-${i}" patternUnits="userSpaceOnUse" width="${width}" height="${height}">
                    <image id="sector-index-${i}-image" width="${width}" height="${height}" href="${dataURL}" />
                </pattern>
            </defs>
        `);

    }

    svg.insertAdjacentHTML("beforeend", elements.join(""));

}

function getColors (shade, swap, alternate) {
    const palette = Globals.Palette;
    const lookup = Globals.Lookup;
    const swaps = Globals.Lookup.swaps.reduce((d, s) => { d[s.index] = s; return d; }, {});
    let colors = alternate !== null ? lookup.alternates[alternate] : palette.colors;
    if (swap != null) colors = colors.map((c, i) => colors[swaps[swap].table[i]]);
    return colors.map((c, i) => colors[palette.shades[shade][i]]);
}

function tileToDataURL (tile, colors, alpha) {

    const canvas = document.createElement("canvas");
    canvas.width = tile.length;
    canvas.height = tile[0].length;
    const context = canvas.getContext("2d");

    const data = context.createImageData(tile.length, tile[0].length);

    // iterate the Y axis first because the tiles are stored in the opposite coordinate system than the screen memory is stored
    for (let y = 0; y < tile[0].length; y++) {
        for (let x = 0; x < tile.length; x++) {
            const index = tile[x][y];
            const color = colors[index];
            const i = x + y * tile.length;
            data.data[i * 4 + 0] = color[0];
            data.data[i * 4 + 1] = color[1];
            data.data[i * 4 + 2] = color[2];
            data.data[i * 4 + 3] = index === 255 ? 0 : (alpha ? alpha : 255);
        }
    }

    context.putImageData(data, 0, 0);    

    return canvas.toDataURL();

}

const isItem = (picnum) => [
    Picnum.Spawn,
    Picnum.Card,
    ...Object.values(Picnum.Weapons),
    ...Object.values(Picnum.Ammo),
    ...Object.values(Picnum.Inventory),
    ...Object.values(Picnum.Health),
    Picnum.ProDuke.Flag,
    Picnum.NDuke.Flag
].includes(picnum);