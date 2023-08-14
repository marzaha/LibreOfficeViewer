var cool;
(function (cool) {
    /// Point represents a point with x and y coordinates.
    var Point = /** @class */ (function () {
        function Point(x, y, round) {
            if (round === void 0) { round = false; }
            this.x = (round ? Math.round(x) : x);
            this.y = (round ? Math.round(y) : y);
        }
        Point.parse = function (pointString) {
            if (typeof pointString !== 'string') {
                console.error('invalid point string');
                return undefined;
            }
            var pointParts = pointString.match(/\d+/g);
            if (pointParts === null || pointParts.length < 2) {
                console.error('incomplete point');
                return undefined;
            }
            return new Point(parseInt(pointParts[0]), parseInt(pointParts[1]));
        };
        Point.prototype.clone = function () {
            return new Point(this.x, this.y);
        };
        /// non-destructive, returns a new point
        Point.prototype.add = function (point) {
            return this.clone()._add(Point.toPoint(point));
        };
        // destructive, used directly for performance in situations where it's safe to modify existing point
        Point.prototype._add = function (point) {
            this.x += point.x;
            this.y += point.y;
            return this;
        };
        Point.prototype.subtract = function (point) {
            return this.clone()._subtract(Point.toPoint(point));
        };
        Point.prototype._subtract = function (point) {
            this.x -= point.x;
            this.y -= point.y;
            return this;
        };
        Point.prototype.divideBy = function (num) {
            return this.clone()._divideBy(num);
        };
        Point.prototype._divideBy = function (num) {
            this.x /= num;
            this.y /= num;
            return this;
        };
        Point.prototype.multiplyBy = function (num) {
            return this.clone()._multiplyBy(num);
        };
        Point.prototype._multiplyBy = function (num) {
            this.x *= num;
            this.y *= num;
            return this;
        };
        Point.prototype.round = function () {
            return this.clone()._round();
        };
        Point.prototype._round = function () {
            this.x = Math.round(this.x);
            this.y = Math.round(this.y);
            return this;
        };
        Point.prototype.floor = function () {
            return this.clone()._floor();
        };
        Point.prototype._floor = function () {
            this.x = Math.floor(this.x);
            this.y = Math.floor(this.y);
            return this;
        };
        Point.prototype.ceil = function () {
            return this.clone()._ceil();
        };
        Point.prototype._ceil = function () {
            this.x = Math.ceil(this.x);
            this.y = Math.ceil(this.y);
            return this;
        };
        Point.prototype.distanceTo = function (point) {
            point = Point.toPoint(point);
            var x = point.x - this.x;
            var y = point.y - this.y;
            return Math.sqrt(x * x + y * y);
        };
        Point.prototype.equals = function (point) {
            point = Point.toPoint(point);
            // Proper ieee 754 equality comparison.
            return Math.abs(point.x - this.x) < Number.EPSILON &&
                Math.abs(point.y - this.y) < Number.EPSILON;
        };
        Point.prototype.contains = function (point) {
            point = Point.toPoint(point);
            return Math.abs(point.x) <= Math.abs(this.x) &&
                Math.abs(point.y) <= Math.abs(this.y);
        };
        Point.prototype.assign = function (point) {
            var xChanged = this.setX(point.x);
            var yChanged = this.setY(point.y);
            return xChanged || yChanged;
        };
        Point.prototype.setX = function (x) {
            if (x === this.x) {
                return false;
            }
            this.x = x;
            return true;
        };
        Point.prototype.setY = function (y) {
            if (y === this.y) {
                return false;
            }
            this.y = y;
            return true;
        };
        Point.prototype.toString = function () {
            return 'Point(' +
                Point.formatNum(this.x) + ', ' +
                Point.formatNum(this.y) + ')';
        };
        Point.toPoint = function (x, y, round) {
            if (x instanceof Point) {
                return x;
            }
            if (Array.isArray(x)) {
                var arr = x;
                return new Point(arr[0], arr[1]);
            }
            if (x === undefined || x === null) {
                return undefined;
            }
            // Detect L.Point like objects such as CPoint.
            if (Object.prototype.hasOwnProperty.call(x, 'x')
                && Object.prototype.hasOwnProperty.call(x, 'y')) {
                x = x;
                return new Point(x.x, x.y);
            }
            x = x;
            return new Point(x, y, round);
        };
        Point.formatNum = function (num) {
            var pow = Math.pow(10, 5);
            return Math.round(num * pow) / pow;
        };
        return Point;
    }());
    cool.Point = Point;
})(cool || (cool = {}));
L.Point = cool.Point;
L.point = cool.Point.toPoint;
