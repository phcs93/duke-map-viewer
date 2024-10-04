Globals = {};

document.addEventListener("DOMContentLoaded", async () => {

    const urlMapParam = new URLSearchParams(window.location.search).get("map");

    // toggle pages
    if (!urlMapParam) {
        document.getElementById("map-filter-page").dataset.visible = true;
        document.getElementById("map-details-page").dataset.visible = false;
    } else {
        document.getElementById("map-filter-page").dataset.visible = false;
        document.getElementById("map-details-page").dataset.visible = true;
    }

    // load compressed maps database (for listing and filtering)
    Globals.Database = JSON.parse(pako.ungzip(await (await fetch("bin/database.gzip")).arrayBuffer(), { to: "string" })).reduce((dictionary, map) => {
        dictionary[map.name] = map;
        return dictionary;
    }, {});
    console.log(Globals.Database);

    // load custom grp (for map rendering)    
    Globals.GRP = new GRP(new Uint8Array(await (await fetch(`bin/custom_duke3d.grp`)).arrayBuffer()));    
    // throw away file bytes from GRP after serialization to reduce memory consuption
    Globals.GRP.Files = [];  
    console.log(Globals.GRP);

    // ================================================
    // map filter page 
    // ================================================

    // build map table
    document.querySelector("table#maps-table > tbody").innerHTML = Object.values(Globals.Database).map(map => `
        <tr data-map-name="${map.name}">
            <td class="text-center"><a href="bin/maps/${encodeURIComponent(map.name)}.map" download><img style="width: 16px; height: 16px;" src="res/images/icons/download.svg" alt="download" title="download"></a></td>
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
            <td class="text-right">${map.items.inventory.medkit || ""}</td>
            <td class="text-right">${map.items.inventory.armor || ""}</td>
            <td class="text-right">${map.items.inventory.steroids || ""}</td>
            <td class="text-right">${map.items.inventory.scuba || ""}</td>
            <td class="text-right">${map.items.inventory.jetpack || ""}</td>
            <td class="text-right">${map.items.inventory.nightvision || ""}</td>
            <td class="text-right">${map.items.inventory.boots || ""}</td>
            <td class="text-right">${map.items.inventory.holoduke || ""}</td>
            <td class="text-right">${map.items.health.small || ""}</td>
            <td class="text-right">${map.items.health.medium || ""}</td>
            <td class="text-right">${map.items.health.atomic || ""}</td>
            <td class="text-center">${map.damagingFloor ? "YES" : ""}</td>
        </tr>
    `).join("");

    // tr reference dictionary for better performance (based of index)
    const trs = Object.values(document.querySelectorAll("table#maps-table > tbody > tr")).reduce((trs, tr) => {
        trs[tr.dataset.mapName] = tr;
        return trs;
    }, {});

    // "global" filters variable for better performance
    const filters = {};

    // perform filtering when a filter changes
    document.querySelectorAll(".filter").forEach(element => element.onchange = e => {

        switch (true) {
            case e.target.type === "text": {
                filters[e.target.id] = e.target.value;
                break;
            }
            case e.target.type === "number": {
                filters[e.target.id] = parseInt(e.target.value);
                break;
            }
            case e.target.tagName.toLowerCase() === "select": {
                filters[e.target.id] = e.target.value;
                break;
            }
        }

        for (const i in Globals.Database) {

            const map = Globals.Database[i];

            let visible = true;

            if (filters["name-filter"] && map.name.toLowerCase().indexOf(filters["name-filter"].toLowerCase()) < 0) {
                visible = false;
            }

            if (filters["min-spawns-filter"] && map.spawns < filters["min-spawns-filter"]) visible = false;
            if (filters["max-spawns-filter"] && map.spawns > filters["max-spawns-filter"]) visible = false;
            if (filters["min-coop-filter"] && map.coop < filters["min-coop-filter"]) visible = false;
            if (filters["max-coop-filter"] && map.coop > filters["max-coop-filter"]) visible = false;
            if (filters["min-width-filter"] && map.width < filters["min-width-filter"]) visible = false;
            if (filters["max-width-filter"] && map.width > filters["max-width-filter"]) visible = false;
            if (filters["min-height-filter"] && map.height < filters["min-height-filter"]) visible = false;
            if (filters["max-height-filter"] && map.height > filters["max-height-filter"]) visible = false;
            if (filters["min-depth-filter"] && map.depth < filters["min-depth-filter"]) visible = false;
            if (filters["max-depth-filter"] && map.depth > filters["max-depth-filter"]) visible = false;
            if (filters["min-pistol-filter"] && map.items.weapons.pistol < filters["min-pistol-filter"]) visible = false;
            if (filters["max-pistol-filter"] && map.items.weapons.pistol > filters["max-pistol-filter"]) visible = false;
            if (filters["min-shotgun-filter"] && map.items.weapons.shotgun < filters["min-shotgun-filter"]) visible = false;
            if (filters["max-shotgun-filter"] && map.items.weapons.shotgun > filters["max-shotgun-filter"]) visible = false;
            if (filters["min-chaingun-filter"] && map.items.weapons.chaingun < filters["min-chaingun-filter"]) visible = false;
            if (filters["max-chaingun-filter"] && map.items.weapons.chaingun > filters["max-chaingun-filter"]) visible = false;
            if (filters["min-rpg-filter"] && map.items.weapons.rpg < filters["min-rpg-filter"]) visible = false;
            if (filters["max-rpg-filter"] && map.items.weapons.rpg > filters["max-rpg-filter"]) visible = false;
            if (filters["min-pipebomb-filter"] && map.items.weapons.pipebomb < filters["min-pipebomb-filter"]) visible = false;
            if (filters["max-pipebomb-filter"] && map.items.weapons.pipebomb > filters["max-pipebomb-filter"]) visible = false;
            if (filters["min-shrinker-filter"] && map.items.weapons.shrinker < filters["min-shrinker-filter"]) visible = false;
            if (filters["max-shrinker-filter"] && map.items.weapons.shrinker > filters["max-shrinker-filter"]) visible = false;
            if (filters["min-expander-filter"] && map.items.ammo.expander < filters["min-expander-filter"]) visible = false;
            if (filters["max-expander-filter"] && map.items.ammo.expander > filters["max-expander-filter"]) visible = false;
            if (filters["min-devastator-filter"] && map.items.weapons.devastator < filters["min-devastator-filter"]) visible = false;
            if (filters["max-devastator-filter"] && map.items.weapons.devastator > filters["max-devastator-filter"]) visible = false;
            if (filters["min-freezer-filter"] && map.items.weapons.freezer < filters["min-freezer-filter"]) visible = false;
            if (filters["max-freezer-filter"] && map.items.weapons.freezer > filters["max-freezer-filter"]) visible = false;
            if (filters["min-tripbomb-filter"] && map.items.weapons.tripbomb < filters["min-tripbomb-filter"]) visible = false;
            if (filters["max-tripbomb-filter"] && map.items.weapons.tripbomb > filters["max-tripbomb-filter"]) visible = false;
            if (filters["min-medkit-filter"] && map.items.inventory.medkit < filters["min-medkit-filter"]) visible = false;
            if (filters["max-medkit-filter"] && map.items.inventory.medkit > filters["max-medkit-filter"]) visible = false;
            if (filters["min-armor-filter"] && map.items.inventory.armor < filters["min-armor-filter"]) visible = false;
            if (filters["max-armor-filter"] && map.items.inventory.armor > filters["max-armor-filter"]) visible = false;
            if (filters["min-steroids-filter"] && map.items.inventory.steroids < filters["min-steroids-filter"]) visible = false;
            if (filters["max-steroids-filter"] && map.items.inventory.steroids > filters["max-steroids-filter"]) visible = false;
            if (filters["min-scuba-filter"] && map.items.inventory.scuba < filters["min-scuba-filter"]) visible = false;
            if (filters["max-scuba-filter"] && map.items.inventory.scuba > filters["max-scuba-filter"]) visible = false;
            if (filters["min-jetpack-filter"] && map.items.inventory.jetpack < filters["min-jetpack-filter"]) visible = false;
            if (filters["max-jetpack-filter"] && map.items.inventory.jetpack > filters["max-jetpack-filter"]) visible = false;
            if (filters["min-nightvision-filter"] && map.items.inventory.nightvision < filters["min-nightvision-filter"]) visible = false;
            if (filters["max-nightvision-filter"] && map.items.inventory.nightvision > filters["max-nightvision-filter"]) visible = false;
            if (filters["min-boots-filter"] && map.items.inventory.boots < filters["min-boots-filter"]) visible = false;
            if (filters["max-boots-filter"] && map.items.inventory.boots > filters["max-boots-filter"]) visible = false;
            if (filters["min-holoduke-filter"] && map.items.inventory.holoduke < filters["min-holoduke-filter"]) visible = false;
            if (filters["max-holoduke-filter"] && map.items.inventory.holoduke > filters["max-holoduke-filter"]) visible = false;
            if (filters["min-small-health-filter"] && map.items.health.small < filters["min-small-health-filter"]) visible = false;
            if (filters["max-small-health-filter"] && map.items.health.small > filters["max-small-health-filter"]) visible = false;
            if (filters["min-medium-health-filter"] && map.items.health.medium < filters["min-medium-health-filter"]) visible = false;
            if (filters["max-medium-health-filter"] && map.items.health.medium > filters["max-medium-health-filter"]) visible = false;
            if (filters["min-atomic-health-filter"] && map.items.health.atomic < filters["min-atomic-health-filter"]) visible = false;
            if (filters["max-atomic-health-filter"] && map.items.health.atomic > filters["max-atomic-health-filter"]) visible = false;

            if (filters["damaging-filter"] && map.damagingFloor !== (filters["damaging-filter"] === "YES")) visible = false;

            trs[i].dataset.visible = visible;

        }

    });

    // intercept map link click => change page layout to map details
    document.querySelectorAll("table#maps-table > tbody > tr > td > a").forEach(a => a.onclick = e => {
        e.preventDefault();   
        const mapName = `${e.target.innerText}.map`  ;
        window.history.replaceState(null, null, `?map=${encodeURIComponent(mapName)}`);
        document.getElementById("map-filter-page").dataset.visible = false;
        document.getElementById("map-details-page").dataset.visible = true;
        document.querySelector("select#map-select").value = mapName.replace(".map", "");
        renderMap(mapName);
    });

    // ================================================
    // map details page
    // ================================================

    // build maps dropdown (for better browing on details page)
    document.querySelector("select#map-select").innerHTML = Object.values(Globals.Database).map(map => `
        <option value="${map.name}" ${map.name === urlMapParam ? "selected" : ""}>${map.name}</option>
    `).join("");

    // render the map when the dropdown value changes and replace url param
    document.querySelector("select#map-select").onchange = e => {
        window.history.replaceState(null, null, `?map=${encodeURIComponent(e.target.value)}.map`);
        renderMap(e.target.value + ".map");
    };

    // render map if page was already loaded with a map param
    if (urlMapParam) {
        document.querySelector("select#map-select").value = urlMapParam.replace(".map", "");
        renderMap(urlMapParam);
    }

});

function backToFilter(e) {
    e.preventDefault();   
    window.history.replaceState(null, null, "?");
    document.getElementById("map-filter-page").dataset.visible = true;
    document.getElementById("map-details-page").dataset.visible = false;
    // clear svg to reduce memory consuption
    document.querySelector("svg").innerHTML = "";
}

async function renderMap(name) {
    const bytes = await (await fetch(`bin/maps/${encodeURIComponent(name)}`)).arrayBuffer();
    const map = new Map(new Uint8Array(bytes), name);
    renderMapDetails(name);
    renderMapSVG(map);    
}

function renderMapDetails(name) {

    // download link button
    document.querySelector("a.download-link").href = `bin/maps/${name}`;

    const map = Globals.Database[name.replace(".map", "")];

    // details
    document.querySelector(`label.detail[data-field="spawns"]`).dataset.value = map.spawns;
    document.querySelector(`label.detail[data-field="coop"]`).dataset.value = map.coop;
    document.querySelector(`label.detail[data-field="width"]`).dataset.value = map.width;
    document.querySelector(`label.detail[data-field="height"]`).dataset.value = map.height;
    document.querySelector(`label.detail[data-field="depth"]`).dataset.value = map.depth;
    document.querySelector(`label.detail[data-field="damaging-floor"]`).dataset.value = map.damagingFloor ? "YES" : "NO";

    // weapons
    document.querySelector(`label.detail[data-field="pistol"]`).dataset.value = map.items.weapons.pistol;
    document.querySelector(`label.detail[data-field="shotgun"]`).dataset.value = map.items.weapons.shotgun;
    document.querySelector(`label.detail[data-field="chaingun"]`).dataset.value = map.items.weapons.chaingun;
    document.querySelector(`label.detail[data-field="rpg"]`).dataset.value = map.items.weapons.rpg;
    document.querySelector(`label.detail[data-field="pipebomb"]`).dataset.value = map.items.weapons.pipebomb;
    document.querySelector(`label.detail[data-field="shrinker"]`).dataset.value = map.items.weapons.shrinker;
    document.querySelector(`label.detail[data-field="devastator"]`).dataset.value = map.items.weapons.devastator;
    document.querySelector(`label.detail[data-field="freezer"]`).dataset.value = map.items.weapons.freezer;
    document.querySelector(`label.detail[data-field="tripbomb"]`).dataset.value = map.items.weapons.tripbomb;

    // ammo
    document.querySelector(`label.detail[data-field="pistol-ammo"]`).dataset.value = map.items.ammo.pistol;
    document.querySelector(`label.detail[data-field="shotgun-ammo"]`).dataset.value = map.items.ammo.shotgun;
    document.querySelector(`label.detail[data-field="chaingun-ammo"]`).dataset.value = map.items.ammo.chaingun;
    document.querySelector(`label.detail[data-field="rpg-ammo"]`).dataset.value = map.items.ammo.rpg;
    document.querySelector(`label.detail[data-field="pipebomb-ammo"]`).dataset.value = map.items.ammo.pipebomb;
    document.querySelector(`label.detail[data-field="shrinker-ammo"]`).dataset.value = map.items.ammo.shrinker;
    document.querySelector(`label.detail[data-field="expander-ammo"]`).dataset.value = map.items.ammo.expander;
    document.querySelector(`label.detail[data-field="devastator-ammo"]`).dataset.value = map.items.ammo.devastator;
    document.querySelector(`label.detail[data-field="freezer-ammo"]`).dataset.value = map.items.ammo.freezer;

    // inventory
    document.querySelector(`label.detail[data-field="medkit"]`).dataset.value = map.items.inventory.medkit;
    document.querySelector(`label.detail[data-field="armor"]`).dataset.value = map.items.inventory.armor;
    document.querySelector(`label.detail[data-field="steroids"]`).dataset.value = map.items.inventory.steroids;
    document.querySelector(`label.detail[data-field="scuba"]`).dataset.value = map.items.inventory.scuba;
    document.querySelector(`label.detail[data-field="jetpack"]`).dataset.value = map.items.inventory.jetpack;
    document.querySelector(`label.detail[data-field="nightvision"]`).dataset.value = map.items.inventory.nightvision;
    document.querySelector(`label.detail[data-field="boots"]`).dataset.value = map.items.inventory.boots;
    document.querySelector(`label.detail[data-field="holoduke"]`).dataset.value = map.items.inventory.holoduke;

    // health
    document.querySelector(`label.detail[data-field="small-health"]`).dataset.value = map.items.health.small;
    document.querySelector(`label.detail[data-field="medium-health"]`).dataset.value = map.items.health.medium;
    document.querySelector(`label.detail[data-field="atomic-health"]`).dataset.value = map.items.health.atomic;

    // sector effectors
    for (const effector of Object.keys(map.effectors)) {
        document.querySelector(`label.detail[data-field="SE${effector}"]`).dataset.value = map.effectors[effector];
    }

    // sector lo-tags
    for (const sector of Object.keys(map.sectors)) {
        document.querySelector(`label.detail[data-field="LOTAG${sector}"]`).dataset.value = map.sectors[sector];
    }


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

    const elements = [];

    const paths = [];

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

    // walls
    for (const wall of map.Walls) {
        const x1 = wall.x;
        const y1 = wall.y;
        const x2 = map.Walls[wall.point2].x;
        const y2 = map.Walls[wall.point2].y;
        const stroke = wall.nextwall === 65535 ? "white" : "red";
        const line = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="10" />`;
        //elements.push(line);
    }

    const floorSprites = [];
    const itemSprites = [];

    // sprites
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
            const image = `<image preserveAspectRatio="none" id="sprite-${sprite.picnum}-image" width="${w}" height="${h}" x="${x}" y="${y}" href="${dataURL}" transform="rotate(${a} ${sprite.x} ${sprite.y})" />`;
            floorSprites.push(image);

            // const rect = `<rect x="${x}" y="${y}" width="${w}" height="${h}" stroke="purple" stroke-width="10" fill="transparent" stroke-dasharray="20,20" />`;
            // const line1 = `<line x1="${x}" y1="${y}" x2="${x + w}" y2="${y + h}" stroke="purple" stroke-width="10" stroke-dasharray="20,20" />`;
            // const line2 = `<line x1="${x}" y1="${y + h}" x2="${x + w}" y2="${y}" stroke="purple" stroke-width="10" stroke-dasharray="20,20" />`;
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
                itemSprites.push(image);
            }

        }

    }

    elements.push(...floorSprites);
    elements.push(...itemSprites);

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