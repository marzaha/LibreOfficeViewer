/*
 * CPointSet is a recursive datastructure used to represent a set of points connected by lines.
 * This is used by CPolyline and hence CPolygon classes to represent set of disconnected/disjoint
 * open/closed polygons respectively.
 */
var CPointSet = /** @class */ (function () {
    function CPointSet() {
    }
    CPointSet.fromPointArray = function (array) {
        var ps = new CPointSet();
        ps.points = array;
        return ps;
    };
    CPointSet.fromSetArray = function (array) {
        var ps = new CPointSet();
        ps.pointSets = array;
        return ps;
    };
    CPointSet.fromBounds = function (bounds) {
        var ps = new CPointSet();
        ps.points = [
            bounds.getTopLeft(),
            bounds.getTopRight(),
            bounds.getBottomRight(),
            bounds.getBottomLeft()
        ];
        return ps;
    };
    CPointSet.prototype.isFlat = function () {
        return this.points !== undefined;
    };
    CPointSet.prototype.empty = function () {
        return ((this.points === undefined && this.pointSets === undefined) ||
            (this.pointSets === undefined && this.points.length == 0));
    };
    CPointSet.prototype.getPointArray = function () {
        return this.points;
    };
    CPointSet.prototype.getSetArray = function () {
        return this.pointSets;
    };
    CPointSet.prototype.setPointArray = function (array) {
        this.points = array;
        this.pointSets = undefined;
    };
    CPointSet.prototype.setSetArray = function (array) {
        this.points = undefined;
        this.pointSets = array;
    };
    // This is used in CCellSelection to draw multiple polygons based on a "inner" point-set
    // where we need to apply an additive offset to each point in the pointSet w.r.t each polygon's centroid.
    CPointSet.prototype.applyOffset = function (offset, centroidSymmetry, preRound) {
        if (centroidSymmetry === void 0) { centroidSymmetry = false; }
        if (preRound === void 0) { preRound = true; }
        CPointSet.applyOffsetImpl(this, offset, centroidSymmetry, preRound);
    };
    CPointSet.prototype.clone = function () {
        return CPointSet.cloneImpl(this);
    };
    CPointSet.cloneImpl = function (source) {
        var newPointSet = new CPointSet();
        if (source.points) {
            newPointSet.points = [];
            source.points.forEach(function (point) {
                newPointSet.points.push(point.clone());
            });
        }
        else if (source.pointSets) {
            newPointSet.pointSets = [];
            source.pointSets.forEach(function (childPointSet) {
                var clonedChild = CPointSet.cloneImpl(childPointSet);
                newPointSet.pointSets.push(clonedChild);
            });
        }
        return newPointSet;
    };
    CPointSet.applyOffsetImpl = function (pointSet, offset, centroidSymmetry, preRound) {
        if (pointSet.empty())
            return;
        if (pointSet.isFlat()) {
            var refPoint_1 = new cool.Point(Infinity, Infinity);
            if (centroidSymmetry) {
                refPoint_1.x = 0;
                refPoint_1.y = 0;
                // Compute centroid for this set of points.
                pointSet.points.forEach(function (point) {
                    refPoint_1._add(point);
                });
                refPoint_1._divideBy(pointSet.points.length);
            }
            pointSet.points.forEach(function (point, index) {
                if (preRound)
                    pointSet.points[index]._round();
                if (point.x < refPoint_1.x)
                    pointSet.points[index].x -= offset.x;
                else
                    pointSet.points[index].x += offset.x;
                if (point.y < refPoint_1.y)
                    pointSet.points[index].y -= offset.y;
                else
                    pointSet.points[index].y += offset.y;
            });
            return;
        }
        // not flat so recurse.
        pointSet.pointSets.forEach(function (childPointSet) {
            CPointSet.applyOffsetImpl(childPointSet, offset, centroidSymmetry, preRound);
        });
    };
    return CPointSet;
}());
