var cool;
(function (cool) {
    function PointConstruct(x, y, round) {
        return new L.Point(x, y, round);
    }
    function toPoint(x, y, round) {
        return L.point(x, y, round);
    }
    /// Bounds represents a rectangular area on the screen.
    var Bounds = /** @class */ (function () {
        function Bounds(a, b) {
            if (!a)
                return;
            var points = b ? [a, b] : a;
            for (var i = 0, len = points.length; i < len; i++) {
                this.extend(points[i]);
            }
        }
        Bounds.parse = function (rectString) {
            if (typeof rectString !== 'string') {
                console.error('invalid input type, expected string');
                return undefined;
            }
            var rectParts = rectString.match(/\d+/g);
            if (rectParts === null || rectParts.length < 4) {
                console.error('incomplete rectangle');
                return undefined;
            }
            var refPoint1 = PointConstruct(parseInt(rectParts[0]), parseInt(rectParts[1]));
            var offset = PointConstruct(parseInt(rectParts[2]), parseInt(rectParts[3]));
            var refPoint2 = refPoint1.add(offset);
            return new Bounds(refPoint1, refPoint2);
        };
        Bounds.parseArray = function (rectListString) {
            if (typeof rectListString !== 'string') {
                console.error('invalid input type, expected string');
                return undefined;
            }
            var parts = rectListString.match(/\d+/g);
            if (parts === null || parts.length < 4) {
                return [];
            }
            var rectangles = [];
            for (var i = 0; (i + 3) < parts.length; i += 4) {
                var refPoint1 = PointConstruct(parseInt(parts[i]), parseInt(parts[i + 1]));
                var offset = PointConstruct(parseInt(parts[i + 2]), parseInt(parts[i + 3]));
                var refPoint2 = refPoint1.add(offset);
                rectangles.push(new Bounds(refPoint1, refPoint2));
            }
            return rectangles;
        };
        // extend the bounds to contain the given point
        Bounds.prototype.extend = function (pointSrc) {
            var point = toPoint(pointSrc);
            if (!this.min && !this.max) {
                this.min = point.clone();
                this.max = point.clone();
            }
            else {
                this.min.x = Math.min(point.x, this.min.x);
                this.max.x = Math.max(point.x, this.max.x);
                this.min.y = Math.min(point.y, this.min.y);
                this.max.y = Math.max(point.y, this.max.y);
            }
            return this;
        };
        Bounds.prototype.clone = function () {
            return new Bounds(this.min, this.max);
        };
        Bounds.prototype.getCenter = function (round) {
            return PointConstruct((this.min.x + this.max.x) / 2, (this.min.y + this.max.y) / 2, round);
        };
        Bounds.prototype.round = function () {
            this.min.x = Math.round(this.min.x);
            this.min.y = Math.round(this.min.y);
            this.max.x = Math.round(this.max.x);
            this.max.y = Math.round(this.max.y);
        };
        Bounds.prototype.getBottomLeft = function () {
            return PointConstruct(this.min.x, this.max.y);
        };
        Bounds.prototype.getTopRight = function () {
            return PointConstruct(this.max.x, this.min.y);
        };
        Bounds.prototype.getTopLeft = function () {
            return PointConstruct(this.min.x, this.min.y);
        };
        Bounds.prototype.getBottomRight = function () {
            return PointConstruct(this.max.x, this.max.y);
        };
        Bounds.prototype.getSize = function () {
            return this.max.subtract(this.min);
        };
        Bounds.prototype.contains = function (obj) {
            var min, max;
            var bounds;
            var point;
            if (Array.isArray(obj) || obj instanceof L.Point) {
                point = toPoint(obj);
            }
            else {
                bounds = Bounds.toBounds(obj);
            }
            if (bounds) {
                min = bounds.min;
                max = bounds.max;
            }
            else {
                min = max = point;
            }
            return (min.x >= this.min.x) &&
                (max.x <= this.max.x) &&
                (min.y >= this.min.y) &&
                (max.y <= this.max.y);
        };
        Bounds.prototype.intersects = function (boundsSrc) {
            var bounds = Bounds.toBounds(boundsSrc);
            var min = this.min;
            var max = this.max;
            var min2 = bounds.min;
            var max2 = bounds.max;
            var xIntersects = (max2.x >= min.x) && (min2.x <= max.x);
            var yIntersects = (max2.y >= min.y) && (min2.y <= max.y);
            return xIntersects && yIntersects;
        };
        // non-destructive, returns a new Bounds
        Bounds.prototype.add = function (point) {
            return this.clone()._add(point);
        };
        // destructive, used directly for performance in situations where it's safe to modify existing Bounds
        Bounds.prototype._add = function (point) {
            this.min._add(point);
            this.max._add(point);
            return this;
        };
        Bounds.prototype.getPointArray = function () {
            return [
                this.getBottomLeft(), this.getBottomRight(),
                this.getTopLeft(), this.getTopRight()
            ];
        };
        Bounds.prototype.toString = function () {
            return '[' +
                this.min.toString() + ', ' +
                this.max.toString() + ']';
        };
        Bounds.prototype.isValid = function () {
            return !!(this.min && this.max);
        };
        Bounds.prototype.intersectsAny = function (boundsArray) {
            for (var i = 0; i < boundsArray.length; ++i) {
                if (boundsArray[i].intersects(this)) {
                    return true;
                }
            }
            return false;
        };
        Bounds.prototype.clampX = function (x) {
            return Math.max(this.min.x, Math.min(this.max.x, x));
        };
        Bounds.prototype.clampY = function (y) {
            return Math.max(this.min.y, Math.min(this.max.y, y));
        };
        Bounds.prototype.clamp = function (obj) {
            if (obj instanceof L.Point) {
                return PointConstruct(this.clampX(obj.x), this.clampY(obj.y));
            }
            if (obj instanceof Bounds) {
                return new Bounds(PointConstruct(this.clampX(obj.min.x), this.clampY(obj.min.y)), PointConstruct(this.clampX(obj.max.x), this.clampY(obj.max.y)));
            }
            console.error('invalid argument type');
        };
        Bounds.prototype.equals = function (bounds) {
            return this.min.equals(bounds.min) && this.max.equals(bounds.max);
        };
        Bounds.prototype.toRectangle = function () {
            return [
                this.min.x, this.min.y,
                this.max.x - this.min.x,
                this.max.y - this.min.y
            ];
        };
        Bounds.prototype.toCoreString = function () {
            return this.min.x + ', ' + this.min.y + ', ' + (this.max.x - this.min.x) + ', ' + (this.max.y - this.min.y);
        };
        Bounds.toBounds = function (a, b) {
            if (!a || a instanceof Bounds) {
                return a;
            }
            return new Bounds(a, b);
        };
        return Bounds;
    }());
    cool.Bounds = Bounds;
})(cool || (cool = {}));
L.Bounds = cool.Bounds;
L.bounds = cool.Bounds.toBounds;
