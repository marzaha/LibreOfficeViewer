/*
 * CRectangle extends CPolygon and creates a rectangle of given bounds.
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
var CRectangle = /** @class */ (function (_super) {
    __extends(CRectangle, _super);
    function CRectangle(bounds, options) {
        return _super.call(this, CRectangle.boundsToPointSet(bounds), options) || this;
    }
    CRectangle.prototype.setBounds = function (bounds) {
        this.setPointSet(CRectangle.boundsToPointSet(bounds));
    };
    CRectangle.boundsToPointSet = function (bounds) {
        if (!bounds.isValid()) {
            return new CPointSet();
        }
        return CPointSet.fromPointArray([bounds.getTopLeft(), bounds.getTopRight(), bounds.getBottomRight(), bounds.getBottomLeft(), bounds.getTopLeft()]);
    };
    return CRectangle;
}(CPolygon));
function getOptionsClone(baseOpts) {
    // TODO: implement polyfill for Object.assign() instead.
    var newOpt = {};
    for (var prop in baseOpts) {
        if (Object.prototype.hasOwnProperty.call(baseOpts, prop)) {
            newOpt[prop] = baseOpts[prop];
        }
    }
    return newOpt;
}
// CCellCursor is used for drawing of the self and view cell-cursor on the canvas.
var CCellCursor = /** @class */ (function (_super) {
    __extends(CCellCursor, _super);
    function CCellCursor(bounds, options) {
        var _this = _super.call(this, []) || this;
        _this.cursorWeight = 2;
        _this.borderPaths = [];
        if (options.weight != 1) {
            _this.cursorWeight = Math.round(options.weight);
            options.weight = 1;
        }
        _this.options = options;
        _this.options.lineJoin = 'miter';
        _this.options.lineCap = 'butt';
        _this.options.viewId = CPath.getViewId(options);
        _this.options.groupType = PathGroupType.CellCursor;
        _this.setBounds(bounds);
        return _this;
    }
    CCellCursor.prototype.setBounds = function (bounds) {
        var cellBounds = new cool.Bounds(bounds.min.subtract(new cool.Point(0.5, 0.5)), bounds.max.subtract(new cool.Point(0.5, 0.5)));
        // Compute bounds for border path.
        var boundsForBorder = [];
        for (var idx = 0; idx < this.cursorWeight; ++idx) {
            var pixels = idx; // device pixels from real cell-border.
            boundsForBorder.push(new cool.Bounds(cellBounds.min.add(new cool.Point(pixels, pixels)), cellBounds.max.subtract(new cool.Point(pixels, pixels))));
        }
        var boundsForContrastBorder = new cool.Bounds(cellBounds.min.add(new cool.Point(this.cursorWeight, this.cursorWeight)), cellBounds.max.subtract(new cool.Point(this.cursorWeight, this.cursorWeight)));
        if (this.borderPaths && this.innerContrastBorder) {
            console.assert(this.borderPaths.length === this.cursorWeight);
            // Update the border path.
            this.borderPaths.forEach(function (borderPath, index) {
                borderPath.setBounds(boundsForBorder[index]);
            });
            // Update constrast path
            this.innerContrastBorder.setBounds(boundsForContrastBorder);
        }
        else {
            for (var index = 0; index < this.cursorWeight; ++index) {
                var borderOpt = getOptionsClone(this.options);
                borderOpt.name += '-border-' + index;
                var borderPath = new CRectangle(boundsForBorder[index], borderOpt);
                this.borderPaths.push(borderPath);
                this.push(borderPath);
            }
            var contrastBorderOpt = getOptionsClone(this.options);
            contrastBorderOpt.name += '-contrast-border';
            contrastBorderOpt.color = 'white';
            this.innerContrastBorder = new CRectangle(boundsForContrastBorder, contrastBorderOpt);
            this.push(this.innerContrastBorder);
        }
    };
    // This method is needed to allow setting up of a popup which is needed for showing
    // other user's name in it when the CCellCursor is used for displaying view cell cursors.
    CCellCursor.prototype.bindPopup = function (content, options) {
        // forward to the innermost black border rectangle.
        console.assert(this.borderPaths && this.borderPaths.length, 'borders not setup yet!');
        return this.borderPaths[0].bindPopup(content, options);
    };
    return CCellCursor;
}(CPathGroup));
// CCellSelection is used for drawing of the self and view cell-range selections on the canvas.
var CCellSelection = /** @class */ (function (_super) {
    __extends(CCellSelection, _super);
    function CCellSelection(pointSet, options) {
        var _this = _super.call(this, []) || this;
        _this.selectionWeight = 2;
        _this.selectionWeight = Math.round(options.weight);
        options.weight = 1; // Selection has multiple paths each with weight 1.
        _this.options = options;
        _this.options.lineJoin = 'miter';
        _this.options.lineCap = 'butt';
        _this.options.viewId = CPath.getViewId(options);
        _this.options.groupType = PathGroupType.CellSelection;
        _this.setPointSet(pointSet);
        return _this;
    }
    // This method is used to create/update the internal CPaths with the correct positions and dimensions
    // using CPointSet data-structure.
    CCellSelection.prototype.setPointSet = function (pointSet) {
        var outerPointSet = pointSet;
        outerPointSet.applyOffset(new cool.Point(0.5, 0.5), false /* centroidSymmetry */, true /* preRound */);
        var borderPointSets = [];
        for (var idx = 0; idx < this.selectionWeight; ++idx) {
            var pixels = idx; // device pixels from real cell-border.
            var borderPset = outerPointSet.clone();
            borderPset.applyOffset(new cool.Point(-pixels, -pixels), true /* centroidSymmetry */, false /* preRound */);
            borderPointSets.push(borderPset);
        }
        var contrastBorderPointSet = outerPointSet.clone();
        contrastBorderPointSet.applyOffset(new cool.Point(-this.selectionWeight, -this.selectionWeight), true /* centroidSymmetry */, false /* preRound */);
        if (this.borderPaths && this.innerContrastBorder) {
            console.assert(this.borderPaths.length === this.selectionWeight);
            // Update the border path.
            this.borderPaths.forEach(function (borderPath, index) {
                borderPath.setPointSet(borderPointSets[index]);
            });
            this.innerContrastBorder.setPointSet(contrastBorderPointSet);
        }
        else {
            this.borderPaths = [];
            for (var index = 0; index < this.selectionWeight; ++index) {
                var borderOpt = getOptionsClone(this.options);
                borderOpt.fillColor = undefined;
                borderOpt.fillOpacity = undefined;
                borderOpt.fill = false;
                borderOpt.name += '-border-' + index;
                var borderPath = new CPolygon(borderPointSets[index], borderOpt);
                this.borderPaths.push(borderPath);
                this.push(borderPath);
            }
            var contrastBorderOpt = getOptionsClone(this.options);
            contrastBorderOpt.name += '-contrast-border';
            contrastBorderOpt.color = 'white';
            contrastBorderOpt.fill = true;
            this.innerContrastBorder = new CPolygon(contrastBorderPointSet, contrastBorderOpt);
            this.push(this.innerContrastBorder);
        }
    };
    CCellSelection.prototype.getBounds = function () {
        if (!this.borderPaths || !this.borderPaths.length)
            return new cool.Bounds(undefined);
        return this.borderPaths[0].getBounds();
    };
    CCellSelection.prototype.anyRingBoundContains = function (corePxPoint) {
        if (!this.borderPaths || !this.borderPaths.length)
            return false;
        return this.borderPaths[0].anyRingBoundContains(corePxPoint);
    };
    return CCellSelection;
}(CPathGroup));
