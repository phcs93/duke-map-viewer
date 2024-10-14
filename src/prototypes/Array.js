Object.defineProperty(Array.prototype, "transpose", {
    enumerable: false,
    writable: false,
    configurable: false,
    value: function () { // TO-DO => refactor this

        const numRows = this.length;
        const numCols = this[0].length;
        const result = [];
    
        for (let col = 0; col < numCols; col++) {
            const newRow = [];
            for (let row = numRows - 1; row >= 0; row--) {
                newRow.push(this[row][col]);
            }
            result.push(newRow);
        }
    
        return result;

    }
});