Object.defineProperty(Number.prototype, "hasBit", {
    enumerable: false,
    writable: false,
    configurable: false,
    value: function (bit) { return (this & (1 << bit)) === (1 << bit); }
});