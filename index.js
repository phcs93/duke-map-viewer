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
    //const svg = document.getElementById("map-svg");
    document.getElementById("map-preview").innerHTML = null;
    const svg = MapToSVG(map, Globals.GRP);
    document.getElementById("map-preview").appendChild(svg);
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