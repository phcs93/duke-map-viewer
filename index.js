document.addEventListener("DOMContentLoaded", async () => {

    const database = JSON.parse(pako.ungzip(await (await fetch("bin/database.gzip")).arrayBuffer(), { to: "string" }));

    document.getElementById("maps").innerHTML = database.map(map => `
        <option value="${map.name}">${map.name}</option>
    `);

    document.getElementById("maps").onchange = async e => {
        await load(e.target.value);
    };

    async function load (name) {
        const bytes = await (await fetch(`res/maps/${name}.map`)).arrayBuffer();
        const map = new Map(new Uint8Array(bytes));
        render(map);
    }

    await load(document.getElementById("maps").value);

    // document.querySelector("input").onchange = e => {
    //     const reader = new FileReader();
    //     reader.onload = () => {
    //         const bytes = new Uint8Array(reader.result);
    //         const map = new Map(bytes);
    //         render(map);
    //     };
    //     reader.readAsArrayBuffer(e.target.files[0]);        
    // };    

});

function render (map) {

    console.log(map);

    const svg = document.querySelector("svg");

    svg.innerHTML = "";

    const minX = Math.min(...map.walls.map(w => w.x));
    const maxX = Math.max(...map.walls.map(w => w.x));
    const minY = Math.min(...map.walls.map(w => w.y));
    const maxY = Math.max(...map.walls.map(w => w.y));

    const width = maxX - minX;
    const height = maxY - minY;

    svg.viewBox.baseVal.x = minX;
    svg.viewBox.baseVal.y = minY;
    svg.viewBox.baseVal.width = width;
    svg.viewBox.baseVal.height = height;

    const strokeWidth = 0.001 * Math.max(width, height);

    const elements = [];

    for (const wall of map.walls) {
        const x1 = wall.x;
        const y1 = wall.y;
        const x2 = map.walls[wall.point2].x;
        const y2 = map.walls[wall.point2].y;
        const stroke = wall.nextwall === 65535 ? "white" : "red";
        const line = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
        elements.push(line);
    }

    for (const sprite of map.sprites) {
        if ((sprite.cstat & (2 << 4)) === (2 << 4) && (sprite.cstat & (2 << 5)) === 0) {
            const [jw, jh] = tilesJSON[sprite.picnum];
            const w = (jw * 16) * (sprite.xrepeat/64);
            const h = (jh * 16) * (sprite.yrepeat/64);
            const x = sprite.x - (w/2);
            const y = sprite.y - (h/2);
            const rect = `<rect x="${x}" y="${y}" width="${w}" height="${h}" stroke="purple" stroke-width="${strokeWidth}" fill="transparent" stroke-dasharray="20,20" />`;
            const line1 = `<line x1="${x}" y1="${y}" x2="${x+w}" y2="${y+h}" stroke="purple" stroke-width="${strokeWidth}" stroke-dasharray="20,20" />`;
            const line2 = `<line x1="${x}" y1="${y+h}" x2="${x+w}" y2="${y}" stroke="purple" stroke-width="${strokeWidth}" stroke-dasharray="20,20" />`;
            elements.push(rect);
            elements.push(line1);
            elements.push(line2);
        } else {
            const circle = `<circle cx="${sprite.x}" cy="${sprite.y}" r="${strokeWidth*2}" stroke="green" stroke-width="${strokeWidth}" fill="transparent" />`;
            elements.push(circle);
        }
        
    }

    svg.insertAdjacentHTML("beforeend", elements.join(""));

}