/* See CanvasSectionContainer.ts for explanations. */
app.definitions.AutoFillMarkerSection = /** @class */ (function () {
    function AutoFillMarkerSection() {
        this.context = null;
        this.myTopLeft = null;
        this.documentTopLeft = null;
        this.containerObject = null;
        this.dpiScale = null;
        this.name = L.CSections.AutoFillMarker.name;
        this.backgroundColor = 'black';
        this.borderColor = null;
        this.boundToSection = null;
        this.anchor = new Array(0);
        this.documentObject = true;
        this.position = new Array(0);
        this.size = new Array(0);
        this.expand = new Array(0);
        this.isLocated = false;
        this.showSection = true;
        this.processingOrder = L.CSections.AutoFillMarker.processingOrder;
        this.drawingOrder = L.CSections.AutoFillMarker.drawingOrder;
        this.zIndex = L.CSections.AutoFillMarker.zIndex;
        this.interactable = true;
        this.sectionProperties = {};
        this.cursorBorderWidth = 2;
        this.selectionBorderWidth = 1;
        this.map = L.Map.THIS;
        this.sectionProperties.docLayer = this.map._docLayer;
        this.sectionProperties.selectedAreaPoint = null;
        this.sectionProperties.cellCursorPoint = null;
        this.sectionProperties.inMouseDown = false;
        this.sectionProperties.draggingStarted = false;
        this.sectionProperties.dragStartPosition = null;
        this.sectionProperties.mapPane = (document.querySelectorAll('.leaflet-map-pane')[0]);
        var cursorStyle = getComputedStyle(this.sectionProperties.docLayer._cursorDataDiv);
        var selectionStyle = getComputedStyle(this.sectionProperties.docLayer._selectionsDataDiv);
        var cursorColor = cursorStyle.getPropertyValue('border-top-color');
        this.backgroundColor = cursorColor ? cursorColor : this.backgroundColor;
        this.cursorBorderWidth = Math.round(window.devicePixelRatio * parseInt(cursorStyle.getPropertyValue('border-top-width')));
        this.selectionBorderWidth = Math.round(window.devicePixelRatio * parseInt(selectionStyle.getPropertyValue('border-top-width')));
    }
    AutoFillMarkerSection.prototype.onInitialize = function () {
        if (window.mode.isDesktop()) {
            this.size = [Math.round(8 * app.dpiScale), Math.round(8 * app.dpiScale)];
        }
        else {
            this.size = [Math.round(16 * app.dpiScale), Math.round(16 * app.dpiScale)];
        }
    };
    AutoFillMarkerSection.prototype.onResize = function () {
        return;
    };
    AutoFillMarkerSection.prototype.setMarkerPosition = function () {
        var center = 0;
        if (!window.mode.isDesktop() && this.map._docLayer._cellCursorPixels) {
            center = this.map._docLayer._cellCursorPixels.getWidth() * 0.5;
        }
        var position = [0, 0];
        this.showSection = true;
        if (this.sectionProperties.selectedAreaPoint !== null)
            position = [this.sectionProperties.selectedAreaPoint[0] - center, this.sectionProperties.selectedAreaPoint[1]];
        else if (this.sectionProperties.cellCursorPoint !== null)
            position = [this.sectionProperties.cellCursorPoint[0] - center, this.sectionProperties.cellCursorPoint[1]];
        else
            this.showSection = false;
        // At this point, position is calculated without taking splitter into account.
        var splitPosCore = { x: 0, y: 0 };
        if (this.map._docLayer.getSplitPanesContext())
            splitPosCore = this.map._docLayer.getSplitPanesContext().getSplitPos();
        splitPosCore.x *= app.dpiScale;
        splitPosCore.y *= app.dpiScale;
        if (position[0] <= splitPosCore.x)
            position[0] += this.documentTopLeft[0];
        else if (position[0] - this.documentTopLeft[0] <= splitPosCore.x)
            this.showSection = false;
        if (position[1] <= splitPosCore.y)
            position[1] += this.documentTopLeft[1];
        else if (position[1] - this.documentTopLeft[1] <= splitPosCore.y)
            this.showSection = false;
        this.setPosition(position[0], position[1]);
    };
    // Give bottom right position of selected area, in core pixels. Call with null parameter when auto fill marker is not visible.
    AutoFillMarkerSection.prototype.calculatePositionViaCellSelection = function (point) {
        if (point === null) {
            this.sectionProperties.selectedAreaPoint = null;
        }
        else {
            var translation = window.mode.isDesktop() ?
                [this.size[0], this.size[1]] :
                [Math.floor(this.size[0] * 0.5), Math.floor(this.size[1] * 0.5)];
            this.sectionProperties.selectedAreaPoint = [point[0] - translation[0], point[1] - translation[1]];
        }
        this.setMarkerPosition();
    };
    // Give bottom right position of cell cursor, in core pixels. Call with null parameter when auto fill marker is not visible.
    AutoFillMarkerSection.prototype.calculatePositionViaCellCursor = function (point) {
        if (point === null) {
            this.sectionProperties.cellCursorPoint = null;
        }
        else {
            var translation = window.mode.isDesktop() ?
                [this.size[0], this.size[1]] :
                [Math.floor(this.size[0] * 0.5), Math.floor(this.size[1] * 0.5)];
            this.sectionProperties.cellCursorPoint = [point[0] - translation[0], point[1] - translation[1]];
        }
        this.setMarkerPosition();
    };
    // This is for enhancing contrast of the marker with the background
    // similar to what we have for cell cursors.
    AutoFillMarkerSection.prototype.drawWhiteOuterBorders = function () {
        var _this = this;
        this.context.strokeStyle = 'white';
        this.context.lineCap = 'square';
        this.context.lineWidth = 1;
        var desktop = window.mode.isDesktop();
        var translation = desktop ?
            [this.size[0], this.size[1]] :
            [Math.floor(this.size[0] * 0.5), Math.floor(this.size[1] * 0.5)];
        var adjustForRTL = this.isCalcRTL();
        var transformX = function (xcoord) {
            return adjustForRTL ? _this.size[0] - xcoord : xcoord;
        };
        this.context.beginPath();
        this.context.moveTo(transformX(-0.5), -0.5);
        var borderWidth = this.sectionProperties.selectedAreaPoint ? this.selectionBorderWidth : this.cursorBorderWidth;
        this.context.lineTo(transformX(this.size[0] - 0.5 - (desktop ? borderWidth : 0)), -0.5);
        this.context.stroke();
        if (!desktop) {
            this.context.beginPath();
            this.context.moveTo(transformX(this.size[0] - 0.5 - (desktop ? borderWidth : 0)), -0.5);
            this.context.lineTo(transformX(this.size[0] - 0.5 - (desktop ? borderWidth : 0)), translation[1] - 0.5 - borderWidth);
            this.context.stroke();
        }
        this.context.beginPath();
        this.context.moveTo(transformX(-0.5), -0.5);
        this.context.lineTo(transformX(-0.5), translation[1] - 0.5 - borderWidth);
        this.context.stroke();
    };
    AutoFillMarkerSection.prototype.onDraw = function () {
        this.drawWhiteOuterBorders();
    };
    AutoFillMarkerSection.prototype.onMouseMove = function (point, dragDistance, e) {
        if (window.mode.isDesktop())
            return;
        if (dragDistance === null || !this.sectionProperties.docLayer._cellAutoFillAreaPixels)
            return; // No dragging or no event handling or auto fill marker is not visible.
        var pos;
        if (!this.sectionProperties.draggingStarted) { // Is it first move?
            this.sectionProperties.draggingStarted = true;
            this.sectionProperties.dragStartPosition = this.sectionProperties.docLayer._cellAutoFillAreaPixels.getCenter();
            pos = new L.Point(this.sectionProperties.dragStartPosition[0], this.sectionProperties.dragStartPosition[1]);
            pos = this.sectionProperties.docLayer._corePixelsToTwips(pos);
            this.sectionProperties.docLayer._postMouseEvent('buttondown', pos.x, pos.y, 1, 1, 0);
        }
        point[0] = this.sectionProperties.dragStartPosition[0] + dragDistance[0];
        point[1] = this.sectionProperties.dragStartPosition[1] + dragDistance[1];
        pos = this.sectionProperties.docLayer._corePixelsToTwips(new L.Point(point[0], point[1]));
        this.sectionProperties.docLayer._postMouseEvent('move', pos.x, pos.y, 1, 1, 0);
        this.map.scrollingIsHandled = true;
        this.stopPropagating(); // Stop propagating to sections.
        e.stopPropagation(); // Stop native event.
    };
    AutoFillMarkerSection.prototype.onMouseUp = function (point, e) {
        if (this.sectionProperties.draggingStarted) {
            this.sectionProperties.draggingStarted = false;
            point[0] += this.myTopLeft[0] + this.size[0] * 0.5;
            point[1] += this.myTopLeft[1] + this.size[1] * 0.5;
            var pos = this.sectionProperties.docLayer._corePixelsToTwips(new L.Point(point[0], point[1]));
            this.sectionProperties.docLayer._postMouseEvent('buttonup', pos.x, pos.y, 1, 1, 0);
        }
        this.map.scrollingIsHandled = false;
        this.stopPropagating();
        e.stopPropagation();
        window.IgnorePanning = false;
    };
    AutoFillMarkerSection.prototype.onMouseDown = function (point, e) {
        if (window.mode.isDesktop()) {
            if (this.sectionProperties.inMouseDown)
                return;
            this.sectionProperties.inMouseDown = true;
            // revert coordinates to global and fire event again with position in the center
            var canvasClientRect = this.containerObject.canvas.getBoundingClientRect();
            point[0] = this.myTopLeft[0] / app.dpiScale + this.size[0] * 0.5 + 1 + canvasClientRect.left;
            point[1] = this.myTopLeft[1] / app.dpiScale + this.size[1] * 0.5 + 1 + canvasClientRect.top;
            var newPoint = {
                clientX: point[0],
                clientY: point[1],
            };
            var newEvent = this.sectionProperties.docLayer._createNewMouseEvent('mousedown', newPoint);
            this.sectionProperties.mapPane.dispatchEvent(newEvent);
        }
        // Just to be safe. We don't need this, but it makes no harm.
        this.stopPropagating();
        e.stopPropagation();
        window.IgnorePanning = true; // We'll keep this until we have consistent sections and remove map element.
        this.sectionProperties.inMouseDown = false;
    };
    AutoFillMarkerSection.prototype.onMouseEnter = function () {
        this.sectionProperties.mapPane.style.cursor = 'crosshair';
    };
    AutoFillMarkerSection.prototype.onMouseLeave = function () {
        this.sectionProperties.mapPane.style.cursor = 'default';
    };
    AutoFillMarkerSection.prototype.onNewDocumentTopLeft = function () {
        this.setMarkerPosition();
    };
    AutoFillMarkerSection.prototype.onMouseWheel = function () { return; };
    AutoFillMarkerSection.prototype.onClick = function () { return; };
    AutoFillMarkerSection.prototype.onDoubleClick = function () { return; };
    AutoFillMarkerSection.prototype.onContextMenu = function () { return; };
    AutoFillMarkerSection.prototype.onLongPress = function () { return; };
    AutoFillMarkerSection.prototype.onMultiTouchStart = function () { return; };
    AutoFillMarkerSection.prototype.onMultiTouchMove = function () { return; };
    AutoFillMarkerSection.prototype.onMultiTouchEnd = function () { return; };
    return AutoFillMarkerSection;
}());
