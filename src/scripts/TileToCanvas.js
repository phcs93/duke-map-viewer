function TileToCanvas (tile, colors, canvas) {

    if (!canvas) canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    const empty = tile.length === 0;
    if (empty) tile = [[255]];

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
            data.data[i * 4 + 3] = index === 255 ? (empty ? 255 : 0) : 255;
            
        }
    }

    context.putImageData(data, 0, 0);

    return canvas;

}