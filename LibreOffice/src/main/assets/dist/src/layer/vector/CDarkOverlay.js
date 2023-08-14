/*
 * CDarkOverlay is used to render a dark overlay around an OLE object when selected
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
var Bounds = cool.Bounds;
var CDarkOverlay = /** @class */ (function (_super) {
    __extends(CDarkOverlay, _super);
    function CDarkOverlay(pointSet, options) {
        var _this = _super.call(this, []) || this;
        _this.rectangles = [];
        _this.options = options;
        _this.rectangles = _this.createRectangles(4);
        _this.setPointSet(pointSet);
        return _this;
    }
    CDarkOverlay.prototype.setPointSet = function (pointSet) {
        var points = pointSet.getPointArray();
        if (!points) {
            for (var i = 0; i < this.rectangles.length; i++) {
                this.rectangles[i].setBounds(new cool.Bounds(new cool.Point(0, 0), new cool.Point(0, 1)));
                this.push(this.rectangles[i]);
            }
            return;
        }
        var rectangleBounds = this.invertOleBounds(new cool.Bounds(points[0], points[2]));
        for (var i = 0; i < this.rectangles.length; i++) {
            this.rectangles[i].setBounds(rectangleBounds[i]);
            this.push(this.rectangles[i]);
        }
    };
    CDarkOverlay.prototype.invertOleBounds = function (oleBounds) {
        var rectanglesBounds = [];
        var minWidth = 0;
        var minHeight = 0;
        var fullWidth = 1000000;
        var fullHeight = 1000000;
        rectanglesBounds.push(new cool.Bounds(new cool.Point(minWidth, minHeight), new cool.Point(fullWidth, oleBounds.min.y)));
        rectanglesBounds.push(new cool.Bounds(new cool.Point(minWidth, oleBounds.min.y), oleBounds.getBottomLeft()));
        rectanglesBounds.push(new cool.Bounds(oleBounds.getTopRight(), new cool.Point(fullWidth, oleBounds.max.y)));
        rectanglesBounds.push(new cool.Bounds(new cool.Point(minWidth, oleBounds.max.y), new cool.Point(fullWidth, fullHeight)));
        return rectanglesBounds;
    };
    CDarkOverlay.prototype.createRectangles = function (quantity) {
        var rectangles = [];
        for (var i = 0; i < quantity; i++) {
            rectangles.push(new CRectangle(new cool.Bounds(new cool.Point(0, 0), new cool.Point(0, 1)), this.options));
        }
        return rectangles;
    };
    return CDarkOverlay;
}(CPathGroup));
