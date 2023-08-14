var cool;
(function (cool) {
    /**
     * Transformation is an utility class to perform simple point transformations through a 2d-matrix.
     */
    var Transformation = /** @class */ (function () {
        function Transformation(a, b, c, d) {
            this.a = a;
            this.b = b;
            this.c = c;
            this.d = d;
        }
        Transformation.prototype.transform = function (point, scale) {
            return this._transform(point.clone(), scale);
        };
        // destructive transform (faster)
        Transformation.prototype._transform = function (point, scale) {
            scale = scale || 1;
            point.x = scale * (this.a * point.x + this.b);
            point.y = scale * (this.c * point.y + this.d);
            return point;
        };
        Transformation.prototype.untransform = function (point, scale) {
            scale = scale || 1;
            return new cool.Point((point.x / scale - this.b) / this.a, (point.y / scale - this.d) / this.c);
        };
        return Transformation;
    }());
    cool.Transformation = Transformation;
})(cool || (cool = {}));
L.Transformation = cool.Transformation;
