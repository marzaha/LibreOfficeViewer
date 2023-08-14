/*
 * CSplitterLine is a CRectangle to be used to show the splits when there are freeze-panes.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var CSplitterLine = /** @class */ (function (_super) {
    __extends(CSplitterLine, _super);
    function CSplitterLine(map, options) {
        var _this = _super.call(this, new cool.Bounds(undefined), options) || this;
        _this.isHoriz = true; // splitter divides X axis (vertical line) ?
        _this.fixed = true;
        _this.stroke = false;
        _this.fill = true;
        _this.opacity = 0;
        // Splitters should always be behind other overlays.
        _this.zIndex = -Infinity;
        if (options.isHoriz !== undefined)
            _this.isHoriz = options.isHoriz;
        _this.map = map;
        // preserve original opacity.
        _this.origOpacity = _this.fillOpacity;
        _this.onChange();
        return _this;
    }
    CSplitterLine.prototype.onResize = function () {
        this.onChange();
    };
    CSplitterLine.prototype.onPositionChange = function () {
        this.onChange();
    };
    CSplitterLine.prototype.onChange = function () {
        var newBounds = this.computeBounds();
        this.fillOpacity = this.inactive ? 0 : this.origOpacity;
        this.setBounds(newBounds);
    };
    CSplitterLine.prototype.computeBounds = function () {
        var docLayer = this.map._docLayer;
        var mapSize = this.map.getPixelBoundsCore().getSize();
        mapSize.round();
        var splitPos = docLayer._painter.getSplitPos();
        splitPos.round();
        // For making splitlines appear symmetric w.r.t. headers/grid.
        var thickup = Math.ceil(this.thickness / 2) + app.dpiScale;
        var thickdown = Math.ceil(this.thickness / 2);
        // Let the lines be long enough so as to cover the map area at the
        // highest possible zoom level. This makes splitter's
        // zoom animation easier.
        var maxZoom = this.map.zoomToFactor(this.map.options.maxZoom);
        var start = new cool.Point(this.isHoriz ? splitPos.x - thickup : 0, this.isHoriz ? 0 : splitPos.y - thickup);
        var end = new cool.Point(this.isHoriz ? splitPos.x + thickdown : mapSize.x * maxZoom, this.isHoriz ? mapSize.y * maxZoom : splitPos.y + thickdown)
            ._round();
        this.inactive = this.isHoriz ? !splitPos.x : !splitPos.y;
        return new cool.Bounds(start, end);
    };
    return CSplitterLine;
}(CRectangle));
