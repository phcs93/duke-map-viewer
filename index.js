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

        Globals.GRP = new GRP(new Uint8Array(await (await fetch(`res/grps/custom_duke3d.grp`)).arrayBuffer()));
        console.log(Globals.GRP);

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

async function renderMap(name) {
    const bytes = await (await fetch(`res/maps/${encodeURIComponent(name)}.map`)).arrayBuffer();
    const map = new Map(new Uint8Array(bytes));
    renderMapSVG(map);
}

function renderMapSVG(map) {

    console.log(map);

    const svg = document.querySelector("svg");

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

    const strokeWidth = 0.001 * Math.max(width, height);

    const elements = [];

    const paths = [];

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
        const path = `<path id="${i}" d="${d} Z" fill="url(#sector-index-${i})" rule="evenodd" />`;
        paths.push({ z: sector.floorz, path: path });

        const picnum = sector.floorpicnum;
        const tile = Globals.GRP.Tiles[picnum].pixels;
        const smooth = sector.floorstat.hasBit(SectorCstat.DoubleSmooshiness);
        let width = tile.length > 0 ? tile.length * (smooth ? 8 : 16) : 1;
        let height = tile.length > 0 ? tile[0].length * (smooth ? 8 : 16) : 1;
        const shade = sector.floorshade > 31 ? 31 : (sector.floorshade < 0 ? 0 : sector.floorshade);
        const swap = sector.floorpal || null;
        const alternate = sector.lotag === 2 ? (sector.ceilingpicnum === 200 ? 1 : 0) : null;
        const colors = Globals.GRP.GetColors(shade, swap, alternate);

        let swapxy = sector.floorstat.hasBit(SectorCstat.SwapXY);
        let flipx = sector.floorstat.hasBit(SectorCstat.FlipX);
        let flipy = sector.floorstat.hasBit(SectorCstat.FlipY);
        let relativity = sector.floorstat.hasBit(SectorCstat.AlignTextureToFirstWallOfSector);        

        let x = Math.lerp(0, width, sector.floorxpanning / 255);
        let y = Math.lerp(0, height, sector.floorypanning / 255);
        let a = 0;

        if (swapxy) {
            const backup = width;
            width = height;
            height = backup;
        }

        if (sector.floorstat.hasBit(SectorCstat.AlignTextureToFirstWallOfSector)) {
            const wall1 = map.Walls[sector.wallptr];
            const wall2 = map.Walls[wall1.point2];
            a += Math.atan2(wall1.y - wall2.y, wall1.x - wall2.x) * (180 / Math.PI);
            // TO-DO => this is a little off
            x += wall1.x;
            y += wall1.y;
        }

        const dataURL = floorTileToDataURL(tile, colors, null, swapxy, flipx, flipy, relativity);

        elements.push(`
            <defs>
                <pattern id="sector-index-${i}" width="${width}" height="${height}" x="${x}" y="${y}" patternTransform="rotate(${a})" patternUnits="userSpaceOnUse">
                    <image id="sector-index-${i}-image" width="${width}" height="${height}" href="${dataURL}" />
                </pattern>
            </defs>
        `);

    }

    elements.push(...paths.sort((a, b) => b.z - a.z).map(p => p.path));

    for (const wall of map.Walls) {
        const x1 = wall.x;
        const y1 = wall.y;
        const x2 = map.Walls[wall.point2].x;
        const y2 = map.Walls[wall.point2].y;
        const stroke = wall.nextwall === 65535 ? "white" : "red";
        const line = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
        //elements.push(line);
    }

    // TO-DO => make it render items after everything else
    for (const sprite of map.Sprites) {

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

        if (sprite.cstat.hasBit(SpriteCstat.FloorAligned)) {
            const tile = Globals.GRP.Tiles[sprite.picnum].pixels;
            const w = tile.length > 0 ? (tile.length * 16) * (sprite.xrepeat / 64) : 1;
            const h = tile.length > 0 ? (tile[0].length * 16) * (sprite.yrepeat / 64) : 1;
            const x = sprite.x - (w / 2);
            const y = sprite.y - (h / 2);
            const a = Math.lerp(0, 360, sprite.ang / 2048) + 90;
            const alpha = sprite.cstat.hasBit(SpriteCstat.Transluscence2) ? 100 : (sprite.cstat.hasBit(SpriteCstat.Transluscence1) ? 200 : 255);
            const colors = Globals.GRP.GetColors(0, null, null);
            const dataURL = tileToDataURL(tile, colors, alpha);
            const image = `<image id="sprite-${sprite.picnum}-image" width="${w}" height="${h}" x="${x}" y="${y}" href="${dataURL}" transform="rotate(${a} ${sprite.x} ${sprite.y})" />`;
            elements.push(image);

            // const rect = `<rect x="${x}" y="${y}" width="${w}" height="${h}" stroke="purple" stroke-width="${strokeWidth}" fill="transparent" stroke-dasharray="20,20" />`;
            // const line1 = `<line x1="${x}" y1="${y}" x2="${x + w}" y2="${y + h}" stroke="purple" stroke-width="${strokeWidth}" stroke-dasharray="20,20" />`;
            // const line2 = `<line x1="${x}" y1="${y + h}" x2="${x + w}" y2="${y}" stroke="purple" stroke-width="${strokeWidth}" stroke-dasharray="20,20" />`;
            // elements.push(rect);
            // elements.push(line1);
            // elements.push(line2);

        } else if (sprite.cstat.hasBit(SpriteCstat.WallAligned)) {
            // dont render wall sprites
        } else {
            //const circle = `<circle cx="${sprite.x}" cy="${sprite.y}" r="${strokeWidth * 2}" stroke="green" stroke-width="${strokeWidth}" fill="transparent" />`;
            if (itemPicnums.includes(sprite.picnum)) {
                const tile = Globals.GRP.Tiles[sprite.picnum].pixels;
                const w = tile.length > 0 ? tile.length * 8 : 1;
                const h = tile.length > 0 ? tile[0].length * 8 : 1;
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

                const colors = Globals.GRP.GetColors(0, swap, null);
                const dataURL = tileToDataURL(tile, colors);
                const image = `<image id="sprite-${sprite.picnum}-image" width="${w}" height="${h}" x="${x}" y="${y}" href="${dataURL}" />`;
                elements.push(image);
            }
        }

    }

    svg.insertAdjacentHTML("beforeend", elements.join(""));

}

function tileToDataURL(tile, colors, alpha) {

    const empty = tile.length === 0;
    if (empty) tile = [[255]];

    const canvas = document.createElement("canvas");
    canvas.width = tile.length;
    canvas.height = tile[0].length;
    const context = canvas.getContext("2d");

    const data = context.createImageData(canvas.width, canvas.height);

    // iterate the Y axis first because the tiles are stored in the opposite coordinate system than the screen memory is stored
    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const index = tile[x][y];
            const color = colors[index];
            const i = x + y * tile.length;
            data.data[i * 4 + 0] = color[0];
            data.data[i * 4 + 1] = color[1];
            data.data[i * 4 + 2] = color[2];
            data.data[i * 4 + 3] = index === 255 ? (empty ? 255 : 0) : (alpha ? alpha : 255);
        }
    }

    context.putImageData(data, 0, 0);

    return canvas.toDataURL();

}

// build engine reads floor textures in a fucked way
function floorTileToDataURL(tile, colors, alpha, swapxy, flipx, flipy, relativity) {

    const empty = tile.length === 0;
    if (empty) tile = [[255]];

    const sxy = () => tile = tile.transpose().toReversed();  
    const fx = () => tile = tile.map(a => a.toReversed());
    const fy = () => tile = tile.toReversed();

    fx();

    if (!relativity) {

        if (!swapxy && !flipx && !flipy) { // 0
            // nothing
        } else if (swapxy && !flipx && flipy) { // 90
            sxy(); fy();
        } else if (!swapxy && flipx && flipy) { // 180
            fx(); fy();
        } else if (swapxy && flipx && !flipy) { // 270
            sxy(); fx();
        } else if (!swapxy && flipx && !flipy) { // 0 m
            fy();
        } else if (swapxy && flipx && flipy) { // 90 m
            sxy(); fx(); fy();
        } else if (!swapxy && !flipx && flipy) { // 180 m
            fx();
        } else if (swapxy && !flipx && !flipy) { // 270 m
            sxy();
        }

    } else {

        if (!swapxy && !flipx && !flipy) { // 0
            fy();
        } else if (swapxy && !flipx && flipy) { // 90
            sxy();
        } else if (!swapxy && flipx && flipy) { // 180
            fx();
        } else if (swapxy && flipx && !flipy) { // 270
            sxy();
            fx();
            fy();
        } else if (!swapxy && flipx && !flipy) { // 0 m
            // nothing
        } else if (swapxy && flipx && flipy) { // 90 m
            sxy();
            fx();
        } else if (!swapxy && !flipx && flipy) { // 180 m
            fx();
            fy();
        } else if (swapxy && !flipx && !flipy) { // 270 m
            sxy();
            fy();
        }

    }

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = tile.length;
    canvas.height = tile[0].length;
    data = context.createImageData(canvas.width, canvas.height);

    for (let x = 0; x < canvas.width; x++) {
        for (let y = 0; y < canvas.height; y++) {            
            const index = tile[x][y];
            const color = colors[index];
            const i = x + y * tile.length;
            data.data[i * 4 + 0] = color[0];
            data.data[i * 4 + 1] = color[1];
            data.data[i * 4 + 2] = color[2];
            data.data[i * 4 + 3] = index === 255 ? (empty ? 255 : 0) : (alpha ? alpha : 255);
        }
    }


    context.putImageData(data, 0, 0);

    return canvas.toDataURL();

}