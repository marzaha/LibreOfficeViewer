/*
 * CPolygon implements polygon vector layer (closed polyline with a fill inside).
 * This is used to draw overlays like cell-selections (self or views) with multi-selection support.
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
var CPolygon = /** @class */ (function (_super) {
    __extends(CPolygon, _super);
    function CPolygon(pointSet, options) {
        var _this = _super.call(this, pointSet, options) || this;
        if (options.fill === undefined)
            _this.fill = true;
        return _this;
    }
    CPolygon.prototype.getCenter = function () {
        var i;
        var j;
        var len;
        var p1;
        var p2;
        var f;
        var area;
        var x;
        var y;
        var points = this.rings[0];
        // polygon centroid algorithm; only uses the first ring if there are multiple
        area = x = y = 0;
        for (i = 0, len = points.length, j = len - 1; i < len; j = i++) {
            p1 = points[i];
            p2 = points[j];
            f = p1.y * p2.x - p2.y * p1.x;
            x += (p1.x + p2.x) * f;
            y += (p1.y + p2.y) * f;
            area += f * 3;
        }
        return new cool.Point(x / area, y / area);
    };
    CPolygon.prototype.updatePath = function (paintArea, paneBounds) {
        this.parts = this.rings;
        // remove last point in the rings/parts if it equals first one
        for (var i = 0, len = this.rings.length; i < len; i++) {
            var ring = this.rings[i];
            var ringlen = ring.length;
            if (ring.length >= 2 && ring[0].equals(ring[ringlen - 1])) {
                ring.pop();
            }
        }
        this.simplifyPoints();
        this.renderer.updatePoly(this, true /* closed? */, paintArea, paneBounds);
    };
    CPolygon.prototype.anyRingBoundContains = function (corePxPoint) {
        for (var i = 0; i < this.rings.length; ++i) {
            var ringBound = new cool.Bounds(undefined);
            var ring = this.rings[i];
            for (var pointIdx = 0; pointIdx < ring.length; ++pointIdx) {
                ringBound.extend(ring[pointIdx]);
            }
            if (ring.length && ringBound.contains(corePxPoint))
                return true;
        }
        return false;
    };
    return CPolygon;
}(CPolyline));
