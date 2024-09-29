// svg mouse support by phcs93
document.addEventListener("DOMContentLoaded", () => {

    // zoom with scroll
    document.body.addEventListener("wheel", event => {

        const svg = event.target.closest("svg.mouse");

        if (svg) {

            //event.preventDefault();

            // set the scaling factor (and make sure it's at least 10%)
            let scale = event.deltaY / 1000;
            scale = Math.abs(scale) < .1 ? .1 * event.deltaY / Math.abs(event.deltaY) : scale;

            // get point in SVG space
            let pt = new DOMPoint(event.clientX, event.clientY);
            pt = pt.matrixTransform(svg.getScreenCTM().inverse());

            // get viewbox transform
            let [x, y, width, height] = svg.getAttribute('viewBox').split(' ').map(Number);

            // get pt.x as a proportion of width and pt.y as proportion of height
            let [xPropW, yPropH] = [(pt.x - x) / width, (pt.y - y) / height];

            // calc new width and height, new x2, y2 (using proportions and new width and height)
            let [width2, height2] = [width + width * scale, height + height * scale];
            let x2 = pt.x - xPropW * width2;
            let y2 = pt.y - yPropH * height2;

            svg.setAttribute('viewBox', `${x2} ${y2} ${width2} ${height2}`);

        }

    });

    // pan with click and drag (get origin)
    document.body.addEventListener("mousedown", event => {

        const svg = event.target.closest("svg.mouse");

        if (svg) {
            const point = getPointFromEvent(svg, event);
            svg.dataset.originX = point.x;
            svg.dataset.originY = point.y;
        }

    });

    // pan with click and drag (perform movement)
    document.body.addEventListener("mousemove", event => {

        const svg = event.target.closest("svg.mouse");

        if (svg) {
                 
            if (event.buttons !== 1) return;

            event.preventDefault();

            var pointerOrigin = {
                x: svg.dataset.originX,
                y: svg.dataset.originY
            };

            var pointerPosition = getPointFromEvent(svg, event);

            svg.viewBox.baseVal.x -= (pointerPosition.x - pointerOrigin.x);
            svg.viewBox.baseVal.y -= (pointerPosition.y - pointerOrigin.y);

        }

    });

    function getPointFromEvent(svg, event) {
        var point = svg.createSVGPoint();
        point.x = event.clientX;
        point.y = event.clientY;
        var invertedSVGMatrix = svg.getScreenCTM().inverse();
        return point.matrixTransform(invertedSVGMatrix);
    }

});