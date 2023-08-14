// OverlayTransform is used by CanvasOverlay to apply transformations
// to points/bounds before drawing is done.
// The reason why we cannot use canvasRenderingContext2D.transform() is it
// does not support coordinate values bigger than 2^24 - 1 and if we use it in this
// regime the renders will be incorrect. At least in Calc it is possible to have pixel
// coordinates greater than this limit at higher zooms near the bottom of the sheet.
var OverlayTransform = /** @class */ (function () {
    function OverlayTransform() {
        this.translationAmount = new cool.Point(0, 0);
        this.scaleAmount = new cool.Point(1, 1);
    }
    OverlayTransform.prototype.translate = function (x, y) {
        this.translationAmount.x = x;
        this.translationAmount.y = y;
    };
    OverlayTransform.prototype.scale = function (sx, sy) {
        this.scaleAmount.x = sx;
        this.scaleAmount.y = sy;
    };
    OverlayTransform.prototype.reset = function () {
        this.translationAmount.x = 0;
        this.translationAmount.y = 0;
        this.scaleAmount.x = 1;
        this.scaleAmount.y = 1;
    };
    OverlayTransform.prototype.applyToPoint = function (point) {
        // 'scale first then translation' model.
        return new cool.Point(point.x * this.scaleAmount.x - this.translationAmount.x, point.y * this.scaleAmount.y - this.translationAmount.y);
    };
    OverlayTransform.prototype.applyToBounds = function (bounds) {
        return new cool.Bounds(this.applyToPoint(bounds.min), this.applyToPoint(bounds.max));
    };
    return OverlayTransform;
}());
// This allows the overlay section to use multiple transformations to be applied
// one after the other on a point or bounds.
var TransformationsList = /** @class */ (function () {
    function TransformationsList() {
        this.list = [];
    }
    TransformationsList.prototype.add = function (tx) {
        this.list.push(tx);
    };
    TransformationsList.prototype.addNew = function (translate, scale) {
        var tx = new OverlayTransform();
        tx.translate(translate.x, translate.y);
        tx.scale(scale.x, scale.y);
        this.add(tx);
    };
    TransformationsList.prototype.reset = function () {
        this.list = [];
    };
    TransformationsList.prototype.applyToPoint = function (point) {
        var tPoint = point.clone();
        this.list.forEach(function (tx) {
            tPoint = tx.applyToPoint(tPoint);
        });
        return tPoint;
    };
    TransformationsList.prototype.applyToBounds = function (bounds) {
        var tBounds = bounds.clone();
        this.list.forEach(function (tx) {
            tBounds = tx.applyToBounds(tBounds);
        });
        return tBounds;
    };
    return TransformationsList;
}());
// CanvasOverlay handles CPath rendering and mouse events handling via overlay-section of the main canvas.
// where overlays like cell-cursors, cell-selections, edit-cursors are instances of CPath or its subclasses.
var CanvasOverlay = /** @class */ (function () {
    function CanvasOverlay(mapObject, canvasContext) {
        this.map = mapObject;
        this.ctx = canvasContext;
        this.tsManager = this.map.getTileSectionMgr();
        this.overlaySection = undefined;
        this.paths = new Map();
        this.transformList = new TransformationsList();
        this.updateCanvasBounds();
    }
    CanvasOverlay.prototype.onInitialize = function () {
        return;
    };
    CanvasOverlay.prototype.onResize = function () {
        this.paths.forEach(function (path) {
            path.onResize();
        });
        this.onDraw();
    };
    CanvasOverlay.prototype.onDraw = function () {
        // No need to "erase" previous drawings because tiles are draw first via its onDraw.
        this.draw();
    };
    CanvasOverlay.prototype.onMouseMove = function (position) {
        var mousePos = new cool.Point(position[0], position[1]);
        var overlaySectionBounds = this.bounds.clone();
        var splitPos = this.tsManager.getSplitPos();
        if (this.overlaySection.isCalcRTL()) {
            // Mirror the mouse position in overlay section coordinates.
            mousePos.x = overlaySectionBounds.max.x - overlaySectionBounds.min.x - mousePos.x;
        }
        // overlay section coordinates -> document coordinates
        if (mousePos.x > splitPos.x)
            mousePos.x += overlaySectionBounds.min.x;
        if (mousePos.y > splitPos.y)
            mousePos.y += overlaySectionBounds.min.y;
        this.paths.forEach(function (path) {
            var pathBounds = path.getBounds();
            if (!pathBounds.isValid())
                return;
            var mouseOverPath = pathBounds.contains(mousePos);
            if (mouseOverPath && !path.isUnderMouse()) {
                path.onMouseEnter(mousePos);
                path.setUnderMouse(true);
            }
            else if (!mouseOverPath && path.isUnderMouse()) {
                path.onMouseLeave(mousePos);
                path.setUnderMouse(false);
            }
        });
    };
    CanvasOverlay.prototype.setOverlaySection = function (overlaySection) {
        this.overlaySection = overlaySection;
    };
    CanvasOverlay.prototype.getTestDiv = function () {
        return this.overlaySection.getTestDiv();
    };
    CanvasOverlay.prototype.setPenOnOverlay = function () {
        this.overlaySection.containerObject.setPenPosition(this.overlaySection);
    };
    CanvasOverlay.prototype.initPath = function (path) {
        var pathId = path.getId();
        this.paths.set(pathId, path);
        path.setRenderer(this);
        this.setPenOnOverlay();
        path.updatePathAllPanes();
    };
    CanvasOverlay.prototype.initPathGroup = function (pathGroup) {
        pathGroup.forEach(function (path) {
            this.initPath(path);
        }.bind(this));
    };
    CanvasOverlay.prototype.removePath = function (path) {
        // This does not get called via onDraw, so ask section container to redraw everything.
        path.setDeleted();
        this.paths.delete(path.getId());
        this.overlaySection.containerObject.requestReDraw();
    };
    CanvasOverlay.prototype.removePathGroup = function (pathGroup) {
        pathGroup.forEach(function (path) {
            this.removePath(path);
        }.bind(this));
    };
    CanvasOverlay.prototype.updatePath = function (path, oldBounds) {
        this.redraw(path, oldBounds);
    };
    CanvasOverlay.prototype.updateStyle = function (path, oldBounds) {
        this.redraw(path, oldBounds);
    };
    CanvasOverlay.prototype.paintRegion = function (paintArea) {
        this.draw(paintArea);
    };
    CanvasOverlay.prototype.getSplitPanesContext = function () {
        return this.map.getSplitPanesContext();
    };
    CanvasOverlay.prototype.isVisible = function (path) {
        var pathBounds = path.getBounds();
        if (!pathBounds.isValid())
            return false;
        return this.intersectsVisible(pathBounds);
    };
    CanvasOverlay.prototype.intersectsVisible = function (queryBounds) {
        this.updateCanvasBounds();
        var spc = this.getSplitPanesContext();
        return spc ? spc.intersectsVisible(queryBounds) : this.bounds.intersects(queryBounds);
    };
    CanvasOverlay.renderOrderComparator = function (a, b) {
        if (a.viewId === -1 && b.viewId === -1) {
            // Both are 'own' / 'self' paths.
            // Both paths are part of the same group, use their zindex to break the tie.
            if (a.groupType === b.groupType)
                return a.zIndex - b.zIndex;
            return a.groupType - b.groupType;
        }
        else if (a.viewId === -1) {
            // a is an 'own' path and b is not => draw a on top of b.
            return 1;
        }
        else if (b.viewId === -1) {
            // b is an 'own' path and a is not => draw b on top of a.
            return -1;
        }
        // Both a and b belong to other views.
        if (a.viewId === b.viewId) {
            // Both belong to the same view.
            // Both paths are part of the same group, use their zindex to break the tie.
            if (a.groupType === b.groupType)
                return a.zIndex - b.zIndex;
            return a.groupType - b.groupType;
        }
        // a and b belong to different views.
        return a.viewId - b.viewId;
    };
    CanvasOverlay.prototype.draw = function (paintArea) {
        var _this = this;
        if (this.tsManager && this.tsManager.waitForTiles()) {
            // don't paint anything till tiles arrive for new zoom.
            return;
        }
        var orderedPaths = Array();
        this.paths.forEach(function (path) {
            orderedPaths.push(path);
        });
        // Sort them w.r.t. rendering order.
        orderedPaths.sort(CanvasOverlay.renderOrderComparator);
        orderedPaths.forEach(function (path) {
            if (_this.isVisible(path))
                path.updatePathAllPanes(paintArea);
        }, this);
    };
    CanvasOverlay.prototype.redraw = function (path, oldBounds) {
        if (this.tsManager && this.tsManager.waitForTiles()) {
            // don't paint anything till tiles arrive for new zoom.
            return;
        }
        if (!this.isVisible(path) && (!oldBounds.isValid() || !this.intersectsVisible(oldBounds)))
            return;
        // This does not get called via onDraw(ie, tiles aren't painted), so ask tileSection to "erase" by painting over.
        // Repainting the whole canvas is not necessary but finding the minimum area to paint over
        // is potentially expensive to compute (think of overlapped path objects).
        // TODO: We could repaint the area on the canvas occupied by all the visible path-objects
        // and paint tiles just for that, but need a more general version of _tilesSection.onDraw() and callees.
        this.overlaySection.containerObject.requestReDraw();
    };
    CanvasOverlay.prototype.updateCanvasBounds = function () {
        var viewBounds = this.map.getPixelBoundsCore();
        this.bounds = new cool.Bounds(new cool.Point(viewBounds.min.x, viewBounds.min.y), new cool.Point(viewBounds.max.x, viewBounds.max.y));
    };
    CanvasOverlay.prototype.getBounds = function () {
        this.updateCanvasBounds();
        return this.bounds;
    };
    // Applies canvas translation so that polygons/circles can be drawn using core-pixel coordinates.
    CanvasOverlay.prototype.ctStart = function (clipArea, paneBounds, fixed) {
        this.updateCanvasBounds();
        this.transformList.reset();
        this.ctx.save();
        if (!paneBounds)
            paneBounds = this.bounds.clone();
        var transform = new OverlayTransform();
        if (this.tsManager._inZoomAnim && !fixed) {
            // zoom-animation is in progress : so draw overlay on main canvas
            // at the current frame's zoom level.
            var splitPos = this.tsManager.getSplitPos();
            var scale = this.tsManager._zoomFrameScale;
            var pinchCenter = this.tsManager._newCenter;
            var center = paneBounds.min.clone();
            if (pinchCenter.x >= paneBounds.min.x && pinchCenter.x <= paneBounds.max.x)
                center.x = pinchCenter.x;
            if (pinchCenter.y >= paneBounds.min.y && pinchCenter.y <= paneBounds.max.y)
                center.y = pinchCenter.y;
            var leftMin = paneBounds.min.x < 0 ? -Infinity : 0;
            var topMin = paneBounds.min.y < 0 ? -Infinity : 0;
            // Compute the new top left in core pixels that ties with the origin of overlay canvas section.
            var newTopLeft = new cool.Point(Math.max(leftMin, -splitPos.x - 1 + (center.x - (center.x - paneBounds.min.x) / scale)), Math.max(topMin, -splitPos.y - 1 + (center.y - (center.y - paneBounds.min.y) / scale)));
            // Compute clip area which needs to be applied after setting the transformation.
            var clipTopLeft = new cool.Point(0, 0);
            // Original pane size.
            var paneSize = paneBounds.getSize();
            var clipSize = paneSize.clone();
            if (paneBounds.min.x || (!paneBounds.min.x && !splitPos.x)) {
                clipTopLeft.x = newTopLeft.x + splitPos.x;
                // Pane's "free" size will shrink(expand) as we zoom in(out)
                // respectively because fixed pane size expand(shrink).
                clipSize.x = (paneSize.x - splitPos.x * (scale - 1)) / scale;
            }
            if (paneBounds.min.y || (!paneBounds.min.y && !splitPos.y)) {
                clipTopLeft.y = newTopLeft.y + splitPos.y;
                // See comment regarding pane width above.
                clipSize.y = (paneSize.y - splitPos.y * (scale - 1)) / scale;
            }
            // Force clip area to the zoom frame area of the pane specified.
            clipArea = new cool.Bounds(clipTopLeft, clipTopLeft.add(clipSize));
            transform.scale(scale, scale);
            transform.translate(scale * newTopLeft.x, scale * newTopLeft.y);
        }
        else if (this.tsManager._inZoomAnim && fixed) {
            var scale = this.tsManager._zoomFrameScale;
            transform.scale(scale, scale);
            if (clipArea) {
                clipArea = new cool.Bounds(clipArea.min.divideBy(scale), clipArea.max.divideBy(scale));
            }
        }
        else {
            transform.translate(paneBounds.min.x ? this.bounds.min.x : 0, paneBounds.min.y ? this.bounds.min.y : 0);
        }
        this.transformList.add(transform);
        if (this.overlaySection.isCalcRTL()) {
            var sectionWidth = this.overlaySection.size[0];
            // Apply horizontal flip transformation.
            this.transformList.addNew(new cool.Point(-sectionWidth, 0), new cool.Point(-1, 1));
        }
        if (clipArea) {
            this.ctx.beginPath();
            clipArea = this.transformList.applyToBounds(clipArea);
            var clipSize = clipArea.getSize();
            this.ctx.rect(clipArea.min.x, clipArea.min.y, clipSize.x, clipSize.y);
            this.ctx.clip();
        }
    };
    // Undo the canvas translation done by ctStart().
    CanvasOverlay.prototype.ctEnd = function () {
        this.ctx.restore();
    };
    CanvasOverlay.prototype.updatePoly = function (path, closed, clipArea, paneBounds) {
        if (closed === void 0) { closed = false; }
        var i;
        var j;
        var len2;
        var part;
        var parts = path.getParts();
        var len = parts.length;
        if (!len)
            return;
        this.ctStart(clipArea, paneBounds, path.fixed);
        this.ctx.beginPath();
        for (i = 0; i < len; i++) {
            for (j = 0, len2 = parts[i].length; j < len2; j++) {
                part = this.transformList.applyToPoint(parts[i][j]);
                this.ctx[j ? 'lineTo' : 'moveTo'](part.x, part.y);
            }
            if (closed) {
                this.ctx.closePath();
            }
        }
        this.fillStroke(path);
        this.ctEnd();
    };
    CanvasOverlay.prototype.updateCircle = function (path, clipArea, paneBounds) {
        if (path.empty())
            return;
        this.ctStart(clipArea, paneBounds, path.fixed);
        var point = this.transformList.applyToPoint(path.point);
        var r = path.radius;
        var s = (path.radiusY || r) / r;
        if (s !== 1) {
            this.ctx.save();
            this.ctx.scale(1, s);
        }
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y / s, r, 0, Math.PI * 2, false);
        if (s !== 1) {
            this.ctx.restore();
        }
        this.fillStroke(path);
        this.ctEnd();
    };
    CanvasOverlay.prototype.fillStroke = function (path) {
        if (path.fill) {
            this.ctx.globalAlpha = path.fillOpacity;
            this.ctx.fillStyle = path.fillColor || path.color;
            this.ctx.fill(path.fillRule || 'evenodd');
        }
        if (path.stroke && path.weight !== 0) {
            this.ctx.globalAlpha = path.opacity;
            this.ctx.lineWidth = path.weight;
            this.ctx.strokeStyle = path.color;
            this.ctx.lineCap = path.lineCap;
            this.ctx.lineJoin = path.lineJoin;
            this.ctx.stroke();
        }
    };
    CanvasOverlay.prototype.bringToFront = function (path) {
        // TODO: Implement this.
    };
    CanvasOverlay.prototype.bringToBack = function (path) {
        // TODO: Implement this.
    };
    CanvasOverlay.prototype.getMap = function () {
        return this.map;
    };
    return CanvasOverlay;
}());
