var cool;
(function (cool) {
    /**
     * Used to parse and store the .unoSheetGeometry data that allows fast lookups between
     * different units. See @GeometryUnit
     */
    var SheetGeometry = /** @class */ (function () {
        function SheetGeometry(sheetGeomJSON, tileWidthTwips, tileHeightTwips, tileSizePixels, part) {
            // Remove the unnecessary checks only after SheetGeometry client code has moved to TS.
            if (typeof sheetGeomJSON !== 'object' ||
                typeof tileWidthTwips !== 'number' ||
                typeof tileHeightTwips !== 'number' ||
                typeof tileSizePixels !== 'number' ||
                typeof part !== 'number') {
                console.error('Incorrect constructor argument types or missing required arguments');
                return;
            }
            this._part = -1;
            this._columns = new SheetDimension();
            this._rows = new SheetDimension();
            this._unoCommand = '.uno:SheetGeometryData';
            // Set various unit conversion info early on because on update() call below, these info are needed.
            this.setTileGeometryData(tileWidthTwips, tileHeightTwips, tileSizePixels, false /* update position info ?*/);
            this.update(sheetGeomJSON, /* checkCompleteness */ true, part);
        }
        SheetGeometry.prototype.update = function (sheetGeomJSON, checkCompleteness, part) {
            if (!this._testValidity(sheetGeomJSON, checkCompleteness)) {
                return false;
            }
            var updateOK = true;
            if (sheetGeomJSON.columns) {
                if (!this._columns.update(sheetGeomJSON.columns)) {
                    console.error(this._unoCommand + ': columns update failed.');
                    updateOK = false;
                }
            }
            if (sheetGeomJSON.rows) {
                if (!this._rows.update(sheetGeomJSON.rows)) {
                    console.error(this._unoCommand + ': rows update failed.');
                    updateOK = false;
                }
            }
            if (updateOK) {
                console.assert(typeof part === 'number', 'part must be a number');
                if (part !== this._part) {
                    this._part = part;
                }
            }
            this._columns.setMaxIndex(+sheetGeomJSON.maxtiledcolumn);
            this._rows.setMaxIndex(+sheetGeomJSON.maxtiledrow);
            return updateOK;
        };
        SheetGeometry.prototype.setTileGeometryData = function (tileWidthTwips, tileHeightTwips, tileSizePixels, updatePositions) {
            this._columns.setTileGeometryData(tileWidthTwips, tileSizePixels, updatePositions);
            this._rows.setTileGeometryData(tileHeightTwips, tileSizePixels, updatePositions);
        };
        SheetGeometry.prototype.setViewArea = function (topLeftTwipsPoint, sizeTwips) {
            if (!(topLeftTwipsPoint instanceof L.Point) || !(sizeTwips instanceof L.Point)) {
                console.error('invalid argument types');
                return false;
            }
            var left = topLeftTwipsPoint.x;
            var top = topLeftTwipsPoint.y;
            var right = left + sizeTwips.x;
            var bottom = top + sizeTwips.y;
            this._columns.setViewLimits(left, right);
            this._rows.setViewLimits(top, bottom);
            return true;
        };
        SheetGeometry.prototype.getPart = function () {
            return this._part;
        };
        SheetGeometry.prototype.getColumnsGeometry = function () {
            return this._columns;
        };
        SheetGeometry.prototype.getRowsGeometry = function () {
            return this._rows;
        };
        // returns an object with keys 'start' and 'end' indicating the
        // column range in the current view area.
        SheetGeometry.prototype.getViewColumnRange = function () {
            return this._columns.getViewElementRange();
        };
        // returns an object with keys 'start' and 'end' indicating the
        // row range in the current view area.
        SheetGeometry.prototype.getViewRowRange = function () {
            return this._rows.getViewElementRange();
        };
        SheetGeometry.prototype.getViewCellRange = function () {
            return {
                columnrange: this.getViewColumnRange(),
                rowrange: this.getViewRowRange()
            };
        };
        // Returns an object with the following fields:
        // rowIndex should be zero based.
        // 'startpos' (start position of the row in core pixels), 'size' (row size in core pixels).
        // Note: All these fields are computed by assuming zero sizes for hidden/filtered rows.
        SheetGeometry.prototype.getRowData = function (rowIndex) {
            return this._rows.getElementData(rowIndex);
        };
        SheetGeometry.prototype.getColumnGroupLevels = function () {
            return this._columns.getGroupLevels();
        };
        SheetGeometry.prototype.getRowGroupLevels = function () {
            return this._rows.getGroupLevels();
        };
        SheetGeometry.prototype.getColumnGroupsDataInView = function () {
            return this._columns.getGroupsDataInView();
        };
        SheetGeometry.prototype.getRowGroupsDataInView = function () {
            return this._rows.getGroupsDataInView();
        };
        // accepts a point in display twips coordinates at current zoom
        // and returns the equivalent point in display-twips at the given zoom.
        SheetGeometry.prototype.getTileTwipsAtZoom = function (point, zoomScale) {
            if (!(point instanceof L.Point)) {
                console.error('Bad argument type, expected L.Point');
                return point;
            }
            return new L.Point(this._columns.getTileTwipsAtZoom(point.x, zoomScale), this._rows.getTileTwipsAtZoom(point.y, zoomScale));
        };
        // accepts a point in core-pixel coordinates at current zoom
        // and returns the equivalent point in core-pixels at the given zoomScale.
        SheetGeometry.prototype.getCorePixelsAtZoom = function (point, zoomScale) {
            if (!(point instanceof L.Point)) {
                console.error('Bad argument type, expected L.Point');
                return point;
            }
            return new L.Point(this._columns.getCorePixelsAtZoom(point.x, zoomScale), this._rows.getCorePixelsAtZoom(point.y, zoomScale));
        };
        // accepts a point in core-pixel coordinates at *given* zoomScale
        // and returns the equivalent point in core-pixels at the current zoom.
        SheetGeometry.prototype.getCorePixelsFromZoom = function (point, zoomScale) {
            if (!(point instanceof L.Point)) {
                console.error('Bad argument type, expected L.Point');
                return point;
            }
            return new L.Point(this._columns.getCorePixelsFromZoom(point.x, zoomScale), this._rows.getCorePixelsFromZoom(point.y, zoomScale));
        };
        // accepts a point in print twips coordinates and returns the equivalent point
        // in tile-twips.
        SheetGeometry.prototype.getTileTwipsPointFromPrint = function (point) {
            if (!(point instanceof L.Point)) {
                console.error('Bad argument type, expected L.Point');
                return point;
            }
            return new L.Point(this._columns.getTileTwipsPosFromPrint(point.x), this._rows.getTileTwipsPosFromPrint(point.y));
        };
        // accepts a point in tile-twips coordinates and returns the equivalent point
        // in print-twips.
        SheetGeometry.prototype.getPrintTwipsPointFromTile = function (point) {
            if (!(point instanceof L.Point)) {
                console.error('Bad argument type, expected L.Point');
                return point;
            }
            return new L.Point(this._columns.getPrintTwipsPosFromTile(point.x), this._rows.getPrintTwipsPosFromTile(point.y));
        };
        // accepts a rectangle in print twips coordinates and returns the equivalent rectangle
        // in tile-twips aligned to the cells.
        SheetGeometry.prototype.getTileTwipsSheetAreaFromPrint = function (rectangle) {
            if (!(rectangle instanceof L.Bounds)) {
                console.error('Bad argument type, expected L.Bounds');
                return rectangle;
            }
            var topLeft = rectangle.getTopLeft();
            var bottomRight = rectangle.getBottomRight();
            var horizBounds = this._columns.getTileTwipsRangeFromPrint(topLeft.x, bottomRight.x);
            var vertBounds = this._rows.getTileTwipsRangeFromPrint(topLeft.y, bottomRight.y);
            topLeft = new L.Point(horizBounds.startpos, vertBounds.startpos);
            bottomRight = new L.Point(horizBounds.endpos, vertBounds.endpos);
            return new L.Bounds(topLeft, bottomRight);
        };
        // Returns full sheet size as L.Point in the given unit.
        // unit must be one of 'corepixels', 'tiletwips', 'printtwips'
        SheetGeometry.prototype.getSize = function (unit) {
            return new L.Point(this._columns.getSize(unit), this._rows.getSize(unit));
        };
        // Returns the core pixel position/size of the requested cell at a specified zoom.
        SheetGeometry.prototype.getCellRect = function (columnIndex, rowIndex, zoomScale) {
            var horizPosSize = this._columns.getElementData(columnIndex, zoomScale);
            var vertPosSize = this._rows.getElementData(rowIndex, zoomScale);
            var topLeft = new L.Point(horizPosSize.startpos, vertPosSize.startpos);
            var size = new L.Point(horizPosSize.size, vertPosSize.size);
            return new L.Bounds(topLeft, topLeft.add(size));
        };
        SheetGeometry.prototype.getCellFromPos = function (pos, unit) {
            console.assert(pos instanceof L.Point);
            return new L.Point(this._columns.getIndexFromPos(pos.x, unit), this._rows.getIndexFromPos(pos.y, unit));
        };
        // Returns the start position of the column containing posX in the specified unit.
        // unit must be one of 'corepixels', 'tiletwips', 'printtwips'
        SheetGeometry.prototype.getSnapDocPosX = function (posX, unit) {
            return this._columns.getSnapPos(posX, unit);
        };
        // Returns the start position of the row containing posY in the specified unit.
        // unit must be one of 'corepixels', 'tiletwips', 'printtwips'
        SheetGeometry.prototype.getSnapDocPosY = function (posY, unit) {
            return this._rows.getSnapPos(posY, unit);
        };
        SheetGeometry.prototype._testValidity = function (sheetGeomJSON, checkCompleteness) {
            if (!sheetGeomJSON.commandName) {
                console.error(this._unoCommand + ' response has no property named "commandName".');
                return false;
            }
            if (sheetGeomJSON.commandName !== this._unoCommand) {
                console.error('JSON response has wrong commandName: ' +
                    sheetGeomJSON.commandName + ' expected: ' +
                    this._unoCommand);
                return false;
            }
            if (typeof sheetGeomJSON.maxtiledcolumn !== 'string' ||
                !/^\d+$/.test(sheetGeomJSON.maxtiledcolumn)) {
                console.error('JSON is missing/unreadable maxtiledcolumn property');
                return false;
            }
            if (typeof sheetGeomJSON.maxtiledrow !== 'string' ||
                !/^\d+$/.test(sheetGeomJSON.maxtiledrow)) {
                console.error('JSON is missing/unreadable maxtiledrow property');
                return false;
            }
            if (checkCompleteness) {
                if (!sheetGeomJSON.rows || !sheetGeomJSON.columns) {
                    console.error(this._unoCommand + ' response is incomplete.');
                    return false;
                }
                if (typeof sheetGeomJSON.rows !== 'object' ||
                    typeof sheetGeomJSON.columns !== 'object') {
                    console.error(this._unoCommand + ' response has invalid rows/columns children.');
                    return false;
                }
                var expectedFields = ['sizes', 'hidden', 'filtered'];
                for (var idx = 0; idx < expectedFields.length; idx++) {
                    var fieldName = expectedFields[idx];
                    var encodingForCols = SheetGeometry.getDimensionDataField(sheetGeomJSON.columns, fieldName);
                    var encodingForRows = SheetGeometry.getDimensionDataField(sheetGeomJSON.rows, fieldName);
                    // Don't accept empty string or any other types.
                    if (typeof encodingForRows !== 'string' || !encodingForRows) {
                        console.error(this._unoCommand + ' response has invalid value for rows.' +
                            fieldName);
                        return false;
                    }
                    // Don't accept empty string or any other types.
                    if (typeof encodingForCols !== 'string' || !encodingForCols) {
                        console.error(this._unoCommand + ' response has invalid value for columns.' +
                            fieldName);
                        return false;
                    }
                }
            }
            return true;
        };
        SheetGeometry.getDimensionDataField = function (dimData, fieldName) {
            switch (fieldName) {
                case 'sizes':
                    return dimData.sizes;
                case 'hidden':
                    return dimData.hidden;
                case 'filtered':
                    return dimData.filtered;
                case 'groups':
                    return dimData.groups;
                default:
                    return undefined;
            }
        };
        return SheetGeometry;
    }());
    cool.SheetGeometry = SheetGeometry;
    // Used to represent/query geometry data about either rows or columns.
    var SheetDimension = /** @class */ (function () {
        function SheetDimension() {
            this._sizes = new SpanList();
            this._hidden = new BoolSpanList();
            this._filtered = new BoolSpanList();
            this._outlines = new DimensionOutlines();
            // This is used to store the span-list of sizes
            // with hidden/filtered elements set to zero size.
            // This needs to be updated whenever
            // this._sizes/this._hidden/this._filtered are modified.
            this._visibleSizes = undefined;
        }
        SheetDimension.prototype.update = function (jsonObject) {
            if (typeof jsonObject !== 'object') {
                return false;
            }
            var regenerateVisibleSizes = false;
            var loadsOK = true;
            if (jsonObject.sizes !== undefined) {
                loadsOK = this._sizes.load(jsonObject.sizes);
                regenerateVisibleSizes = true;
            }
            if (jsonObject.hidden !== undefined) {
                var thisLoadOK = this._hidden.load(jsonObject.hidden);
                loadsOK = loadsOK && thisLoadOK;
                regenerateVisibleSizes = true;
            }
            if (jsonObject.filtered !== undefined) {
                thisLoadOK = this._filtered.load(jsonObject.filtered);
                loadsOK = loadsOK && thisLoadOK;
                regenerateVisibleSizes = true;
            }
            if (jsonObject.groups !== undefined) {
                thisLoadOK = this._outlines.load(jsonObject.groups);
                loadsOK = loadsOK && thisLoadOK;
            }
            if (loadsOK && regenerateVisibleSizes) {
                this._updateVisible();
            }
            return loadsOK;
        };
        SheetDimension.prototype.setMaxIndex = function (maxIndex) {
            this._maxIndex = maxIndex;
        };
        SheetDimension.prototype.setTileGeometryData = function (tileSizeTwips, tileSizePixels, updatePositions) {
            if (updatePositions === void 0) { updatePositions = true; }
            // Avoid position re-computations if no change in Zoom/dpiScale.
            if (this._tileSizeTwips === tileSizeTwips &&
                this._tileSizePixels === tileSizePixels) {
                return;
            }
            this._tileSizeTwips = tileSizeTwips;
            this._tileSizePixels = tileSizePixels;
            // number of core-pixels in the tile is the same as the number of device pixels used to render the tile.
            this._coreZoomFactor = this._tileSizePixels * 15.0 / this._tileSizeTwips;
            this._twipsPerCorePixel = this._tileSizeTwips / this._tileSizePixels;
            if (updatePositions) {
                // We need to compute positions data for every zoom change.
                this._updatePositions();
            }
        };
        SheetDimension.prototype._updateVisible = function () {
            var invisibleSpanList = this._hidden.union(this._filtered); // this._hidden is not modified.
            this._visibleSizes = this._sizes.applyZeroValues(invisibleSpanList); // this._sizes is not modified.
            this._updatePositions();
        };
        SheetDimension.prototype._updatePositions = function () {
            var posCorePx = 0; // position in core pixels.
            var posPrintTwips = 0;
            this._visibleSizes.addCustomDataForEachSpan(function (index, size, /* size in twips of one element in the span */ spanLength /* #elements in the span */) {
                // Important: rounding needs to be done in core pixels to match core.
                var sizeCorePxOne = Math.floor(size / this._twipsPerCorePixel);
                posCorePx += (sizeCorePxOne * spanLength);
                // position in core-pixel aligned twips.
                var posTileTwips = Math.floor(posCorePx * this._twipsPerCorePixel);
                posPrintTwips += (size * spanLength);
                var customData = {
                    sizecore: sizeCorePxOne,
                    poscorepx: posCorePx,
                    postiletwips: posTileTwips,
                    posprinttwips: posPrintTwips
                };
                return customData;
            }.bind(this));
        };
        // returns the element pos/size in core pixels by default.
        SheetDimension.prototype.getElementData = function (index, zoomScale) {
            if (zoomScale !== undefined) {
                var startpos = 0;
                var size = 0;
                this._visibleSizes.forEachSpanInRange(0, index, function (spanData) {
                    var count = spanData.end - spanData.start + 1;
                    var sizeOneCorePx = Math.floor(spanData.size * zoomScale / 15.0);
                    if (index > spanData.end) {
                        startpos += (sizeOneCorePx * count);
                    }
                    else if (index >= spanData.start && index <= spanData.end) {
                        // final span
                        startpos += (sizeOneCorePx * (index - spanData.start));
                        size = sizeOneCorePx;
                    }
                });
                return {
                    startpos: startpos,
                    size: size
                };
            }
            var span = this._visibleSizes.getSpanDataByIndex(index);
            if (span === undefined) {
                return undefined;
            }
            return this._getElementDataFromSpanByIndex(index, span);
        };
        SheetDimension.prototype.getElementDataAny = function (index, unitName) {
            var span = this._visibleSizes.getSpanDataByIndex(index);
            if (span === undefined) {
                return undefined;
            }
            return this._getElementDataAnyFromSpanByIndex(index, span, unitName);
        };
        // returns element pos/size in core pixels by default.
        SheetDimension.prototype._getElementDataFromSpanByIndex = function (index, span) {
            return this._getElementDataAnyFromSpanByIndex(index, span, 'corepixels');
        };
        // returns element pos/size in the requested unit.
        SheetDimension.prototype._getElementDataAnyFromSpanByIndex = function (index, span, unitName) {
            if (span === undefined || index < span.start || span.end < index) {
                return undefined;
            }
            if (unitName !== 'corepixels' &&
                unitName !== 'tiletwips' && unitName !== 'printtwips') {
                console.error('unsupported unitName: ' + unitName);
                return undefined;
            }
            var numSizes = span.end - index + 1;
            var inPixels = unitName === 'corepixels';
            if (inPixels) {
                return {
                    startpos: (span.data.poscorepx - span.data.sizecore * numSizes),
                    size: span.data.sizecore
                };
            }
            if (unitName === 'printtwips') {
                return {
                    startpos: (span.data.posprinttwips - span.size * numSizes),
                    size: span.size
                };
            }
            // unitName is 'tiletwips'
            // It is very important to calculate this from core pixel units to mirror the core calculations.
            var twipsPerCorePixel = this._twipsPerCorePixel;
            return {
                startpos: Math.floor((span.data.poscorepx - span.data.sizecore * numSizes) * twipsPerCorePixel),
                size: Math.floor(span.data.sizecore * twipsPerCorePixel)
            };
        };
        SheetDimension.prototype.forEachInRange = function (start, end, callback) {
            this._visibleSizes.forEachSpanInRange(start, end, function (span) {
                var first = Math.max(span.start, start);
                var last = Math.min(span.end, end);
                for (var index = first; index <= last; ++index) {
                    callback(index, this._getElementDataFromSpanByIndex(index, span));
                }
            }.bind(this));
        };
        // callback with a position and index for each grid line in this pixel range
        SheetDimension.prototype.forEachInCorePixelRange = function (startPix, endPix, callback) {
            this._visibleSizes.forEachSpan(function (spanData) {
                // do we overlap ?
                var spanFirstCorePx = spanData.data.poscorepx -
                    (spanData.data.sizecore * (spanData.end - spanData.start + 1));
                if (spanFirstCorePx < endPix && spanData.data.poscorepx > startPix) {
                    var firstCorePx = Math.max(spanFirstCorePx, startPix + spanData.data.sizecore -
                        ((startPix - spanFirstCorePx) % spanData.data.sizecore));
                    var lastCorePx = Math.min(endPix, spanData.data.poscorepx);
                    var index = spanData.start + Math.floor((firstCorePx - spanFirstCorePx) / spanData.data.sizecore);
                    for (var pos = firstCorePx; pos <= lastCorePx; pos += spanData.data.sizecore) {
                        callback(pos, index);
                        index += 1;
                    }
                }
            });
        };
        // computes element index from tile-twips position and returns
        // an object with this index and the span data.
        SheetDimension.prototype._getSpanAndIndexFromTileTwipsPos = function (pos) {
            var result = {};
            var span = this._visibleSizes.getSpanDataByCustomDataField(pos, 'postiletwips');
            result.span = span;
            if (span === undefined) {
                // enforce limits.
                result.index = (pos >= 0) ? this._maxIndex : 0;
                result.span = this._visibleSizes.getSpanDataByIndex(result.index);
                return result;
            }
            var elementCount = span.end - span.start + 1;
            var posStart = ((span.data.poscorepx - span.data.sizecore * elementCount) * this._twipsPerCorePixel);
            var posEnd = span.data.postiletwips;
            var sizeOne = (posEnd - posStart) / elementCount;
            // always round down as relativeIndex is zero-based.
            var relativeIndex = Math.floor((pos - posStart) / sizeOne);
            result.index = span.start + relativeIndex;
            return result;
        };
        // computes element index from tile-twips position.
        SheetDimension.prototype._getIndexFromTileTwipsPos = function (pos) {
            return this._getSpanAndIndexFromTileTwipsPos(pos).index;
        };
        // computes element index from print twips position and returns
        // an object with this index and the span data.
        SheetDimension.prototype._getSpanAndIndexFromPrintTwipsPos = function (pos) {
            var result = {};
            var span = this._visibleSizes.getSpanDataByCustomDataField(pos, 'posprinttwips');
            result.span = span;
            if (span === undefined) {
                // enforce limits.
                result.index = (pos >= 0) ? this._maxIndex : 0;
                result.span = this._visibleSizes.getSpanDataByIndex(result.index);
                return result;
            }
            var elementCount = span.end - span.start + 1;
            var posStart = (span.data.posprinttwips - span.size * elementCount);
            var sizeOne = span.size;
            // always round down as relativeIndex is zero-based.
            var relativeIndex = Math.floor((pos - posStart) / sizeOne);
            result.index = span.start + relativeIndex;
            return result;
        };
        SheetDimension.prototype.setViewLimits = function (startPosTileTwips, endPosTileTwips) {
            this._viewStartIndex = Math.max(0, this._getIndexFromTileTwipsPos(startPosTileTwips));
            this._viewEndIndex = Math.min(this._maxIndex, this._getIndexFromTileTwipsPos(endPosTileTwips));
        };
        SheetDimension.prototype.getViewElementRange = function () {
            return {
                start: this._viewStartIndex,
                end: this._viewEndIndex
            };
        };
        SheetDimension.prototype.getGroupLevels = function () {
            return this._outlines.getLevels();
        };
        SheetDimension.prototype.getGroupsDataInView = function () {
            var groupsData = [];
            var levels = this._outlines.getLevels();
            if (!levels) {
                return groupsData;
            }
            this._outlines.forEachGroupInRange(this._viewStartIndex, this._viewEndIndex, function (levelIdx, groupIdx, start, end, hidden) {
                var startElementData = this.getElementData(start);
                var endElementData = this.getElementData(end);
                groupsData.push({
                    level: (levelIdx + 1).toString(),
                    index: groupIdx.toString(),
                    startPos: startElementData.startpos.toString(),
                    endPos: (endElementData.startpos + endElementData.size).toString(),
                    hidden: hidden ? '1' : '0'
                });
            }.bind(this));
            return groupsData;
        };
        SheetDimension.prototype.getMaxIndex = function () {
            return this._maxIndex;
        };
        // Accepts a position in display twips at current zoom and returns corresponding
        // display twips position at the given zoomScale.
        SheetDimension.prototype.getTileTwipsAtZoom = function (posTT, zoomScale) {
            if (typeof posTT !== 'number' || typeof zoomScale !== 'number') {
                console.error('Wrong argument types');
                return;
            }
            var posPT = this.getPrintTwipsPosFromTile(posTT);
            return this.getTileTwipsPosFromPrint(posPT, zoomScale);
        };
        // Accepts a position in core-pixels at current zoom and returns corresponding
        // core-pixels position at the given zoomScale.
        SheetDimension.prototype.getCorePixelsAtZoom = function (posCP, zoomScale) {
            if (typeof posCP !== 'number' || typeof zoomScale !== 'number') {
                console.error('Wrong argument types');
                return;
            }
            var posCPZ = 0; // Position in core-pixels at zoomScale.
            var posCPRem = posCP; // Unconverted core-pixels position at current zoom.
            this._visibleSizes.forEachSpan(function (span) {
                var elementCount = span.end - span.start + 1;
                var sizeOneCP = span.data.sizecore;
                var sizeOneCPZ = Math.floor(span.size / 15.0 * zoomScale);
                var sizeCP = sizeOneCP * elementCount;
                var sizeCPZ = sizeOneCPZ * elementCount;
                if (posCPRem < sizeOneCP) {
                    // Done converting. FIXME: make this callback return false to end the forEachSpan when done.
                    return;
                }
                if (posCPRem >= sizeCP) {
                    // Whole span can be converted.
                    posCPRem -= sizeCP;
                    posCPZ += sizeCPZ;
                    return;
                }
                // Only part of the span can be converted.
                // sizeOneCP <= posCPRem < sizeCP.
                var elems = Math.floor(posCPRem / sizeOneCP);
                posCPRem -= (elems * sizeOneCP);
                posCPZ += (elems * sizeOneCPZ);
            });
            return posCPZ + (posCPRem * zoomScale / this._coreZoomFactor);
        };
        // Accepts a position in core-pixels at *given* zoomScale and returns corresponding
        // core-pixels position at the current zoom.
        SheetDimension.prototype.getCorePixelsFromZoom = function (posCPZ, zoomScale) {
            if (typeof posCPZ !== 'number' || typeof zoomScale !== 'number') {
                console.error('Wrong argument types');
                return;
            }
            var posCP = 0; // Position in core-pixels at current zoom.
            var posCPZRem = posCPZ; // Unconverted core-pixels position at zoomScale.
            this._visibleSizes.forEachSpan(function (span) {
                var elementCount = span.end - span.start + 1;
                var sizeOneCP = span.data.sizecore;
                var sizeOneCPZ = Math.floor(span.size / 15.0 * zoomScale);
                var sizeCP = sizeOneCP * elementCount;
                var sizeCPZ = sizeOneCPZ * elementCount;
                if (posCPZRem < sizeOneCPZ) {
                    // Done converting.
                    return;
                }
                if (posCPZRem >= sizeCPZ) {
                    // Whole span can be converted.
                    posCPZRem -= sizeCPZ;
                    posCP += sizeCP;
                    return;
                }
                // Only part of the span can be converted.
                // sizeOneCPZ <= posCPZRem < sizeCPZ.
                var elems = Math.floor(posCPZRem / sizeOneCPZ);
                posCPZRem -= (elems * sizeOneCPZ);
                posCP += (elems * sizeOneCP);
            });
            return posCP + (posCPZRem * this._coreZoomFactor / zoomScale);
        };
        // Accepts a position in print twips and returns the corresponding position in tile twips.
        SheetDimension.prototype.getTileTwipsPosFromPrint = function (posPT, zoomScale) {
            if (typeof posPT !== 'number') {
                console.error('Wrong argument type');
                return;
            }
            if (typeof zoomScale === 'number') {
                var posTT = 0;
                var posPTInc = 0;
                this._visibleSizes.forEachSpan(function (spanData) {
                    var count = spanData.end - spanData.start + 1;
                    var sizeSpanPT = spanData.size * count;
                    var sizeOneCorePx = Math.floor(spanData.size * zoomScale / 15.0);
                    var sizeSpanTT = Math.floor(sizeOneCorePx * count * 15 / zoomScale);
                    if (posPTInc >= posPT) {
                        return;
                    }
                    if (posPTInc + sizeSpanPT < posPT) {
                        // add whole span.
                        posPTInc += sizeSpanPT;
                        posTT += sizeSpanTT;
                        return;
                    }
                    // final span
                    var remainingPT = posPT - posPTInc;
                    var elemCountFinalSpan = Math.floor(remainingPT / spanData.size);
                    var extra = remainingPT - (elemCountFinalSpan * spanData.size);
                    posTT += (Math.floor(elemCountFinalSpan * sizeSpanTT / count) + extra);
                    posPTInc = posPT;
                });
                return posTT;
            }
            var element = this._getSpanAndIndexFromPrintTwipsPos(posPT);
            var elementDataTT = this._getElementDataAnyFromSpanByIndex(element.index, element.span, 'tiletwips');
            var elementDataPT = this._getElementDataAnyFromSpanByIndex(element.index, element.span, 'printtwips');
            var offset = posPT - elementDataPT.startpos;
            console.assert(offset >= 0, 'offset should not be negative');
            // Preserve any offset from the matching column/row start position.
            return elementDataTT.startpos + offset;
        };
        // Accepts a position in tile twips and returns the corresponding position in print twips.
        SheetDimension.prototype.getPrintTwipsPosFromTile = function (posTT) {
            if (typeof posTT !== 'number') {
                console.error('Wrong argument type');
                return;
            }
            var element = this._getSpanAndIndexFromTileTwipsPos(posTT);
            var elementDataTT = this._getElementDataAnyFromSpanByIndex(element.index, element.span, 'tiletwips');
            var elementDataPT = this._getElementDataAnyFromSpanByIndex(element.index, element.span, 'printtwips');
            var offset = posTT - elementDataTT.startpos;
            console.assert(offset >= 0, 'offset should not be negative');
            // Preserve any offset from the matching column/row start position.
            return elementDataPT.startpos + offset;
        };
        // Accepts a start and end positions in print twips, and returns the
        // corresponding positions in tile twips, by first computing the element range.
        SheetDimension.prototype.getTileTwipsRangeFromPrint = function (posStartPT, posEndPT) {
            var startElement = this._getSpanAndIndexFromPrintTwipsPos(posStartPT);
            var startData = this._getElementDataAnyFromSpanByIndex(startElement.index, startElement.span, 'tiletwips');
            if (posStartPT === posEndPT) {
                // range is hidden, send a minimal sized tile-twips range.
                // Set the size = twips equivalent of 1 core pixel,
                // to imitate what core does when it sends cursor/ranges in tile-twips coordinates.
                var rangeSize = Math.floor(this._twipsPerCorePixel);
                return {
                    startpos: startData.startpos,
                    endpos: startData.startpos + rangeSize
                };
            }
            var endElement = this._getSpanAndIndexFromPrintTwipsPos(posEndPT);
            var endData = this._getElementDataAnyFromSpanByIndex(endElement.index, endElement.span, 'tiletwips');
            var startPos = startData.startpos;
            var endPos = endData.startpos + endData.size;
            if (endPos < startPos) {
                endPos = startPos;
            }
            return {
                startpos: startPos,
                endpos: endPos
            };
        };
        SheetDimension.prototype.getSize = function (unit) {
            var posSize = this.getElementDataAny(this._maxIndex, unit);
            if (!posSize) {
                return undefined;
            }
            return posSize.startpos + posSize.size;
        };
        SheetDimension.prototype.isUnitSupported = function (unitName) {
            return (unitName === 'corepixels' ||
                unitName === 'tiletwips' ||
                unitName === 'printtwips');
        };
        SheetDimension.prototype.getSnapPos = function (pos, unit) {
            console.assert(typeof pos === 'number', 'pos is not a number');
            console.assert(this.isUnitSupported(unit), 'unit: ' + unit + ' is not supported');
            var origUnit = unit;
            if (unit === 'corepixels') {
                pos = pos * this._twipsPerCorePixel;
                unit = 'tiletwips';
            }
            console.assert(unit === 'tiletwips' || unit === 'printtwips', 'wrong unit assumption');
            var result = (unit === 'tiletwips') ?
                this._getSpanAndIndexFromTileTwipsPos(pos) :
                this._getSpanAndIndexFromPrintTwipsPos(pos);
            return this._getElementDataAnyFromSpanByIndex(result.index, result.span, origUnit).startpos;
        };
        SheetDimension.prototype.getIndexFromPos = function (pos, unit) {
            console.assert(typeof pos === 'number', 'pos is not a number');
            console.assert(this.isUnitSupported(unit), 'unit: ' + unit + ' is not supported');
            if (unit === 'corepixels') {
                pos = pos * this._twipsPerCorePixel;
                unit = 'tiletwips';
            }
            console.assert(unit === 'tiletwips' || unit === 'printtwips', 'wrong unit assumption');
            var result = (unit === 'tiletwips') ?
                this._getSpanAndIndexFromTileTwipsPos(pos) :
                this._getSpanAndIndexFromPrintTwipsPos(pos);
            return result.index;
        };
        return SheetDimension;
    }());
    cool.SheetDimension = SheetDimension;
    var SpanList = /** @class */ (function () {
        function SpanList(encoding) {
            // spans are objects with keys: 'index' and 'value'.
            // 'index' holds the last element of the span.
            // Optionally custom data of a span can be added
            // under the key 'data' via addCustomDataForEachSpan.
            this._spanlist = [];
            if (typeof encoding !== 'string') {
                return;
            }
            this.load(encoding);
        }
        SpanList.prototype.load = function (encoding) {
            if (typeof encoding !== 'string') {
                return false;
            }
            var result = parseSpanListEncoding(encoding, false /* boolean value ? */);
            if (result === undefined) {
                return false;
            }
            this._spanlist = result.spanlist;
            return true;
        };
        // Runs in O(#spans in 'this' + #spans in 'other')
        SpanList.prototype.applyZeroValues = function (other) {
            if (!(other instanceof BoolSpanList)) {
                return undefined;
            }
            // Ensure both spanlists have the same total range.
            if (this._spanlist[this._spanlist.length - 1].index !== other._spanlist[other._spanlist.length - 1]) {
                return undefined;
            }
            var maxElement = this._spanlist[this._spanlist.length - 1].index;
            var result = new SpanList();
            var thisIdx = 0;
            var otherIdx = 0;
            var zeroBit = other._startBit;
            var resultValue = zeroBit ? 0 : this._spanlist[thisIdx].value;
            while (thisIdx < this._spanlist.length && otherIdx < other._spanlist.length) {
                // end elements of the current spans of 'this' and 'other'.
                var thisElement = this._spanlist[thisIdx].index;
                var otherElement = other._spanlist[otherIdx];
                var lastElement = otherElement;
                if (thisElement < otherElement) {
                    lastElement = thisElement;
                    ++thisIdx;
                }
                else if (otherElement < thisElement) {
                    zeroBit = !zeroBit;
                    ++otherIdx;
                }
                else { // both elements are equal.
                    zeroBit = !zeroBit;
                    ++thisIdx;
                    ++otherIdx;
                }
                var nextResultValue = resultValue;
                if (thisIdx < this._spanlist.length) {
                    nextResultValue = zeroBit ? 0 : this._spanlist[thisIdx].value;
                }
                if (resultValue != nextResultValue || lastElement >= maxElement) {
                    // In the result spanlist a new span start from lastElement+1
                    // or reached the maximum possible element.
                    result._spanlist.push({ index: lastElement, value: resultValue });
                    resultValue = nextResultValue;
                }
            }
            return result;
        };
        SpanList.prototype.addCustomDataForEachSpan = function (getCustomDataCallback) {
            if (typeof getCustomDataCallback != 'function') {
                return;
            }
            var prevIndex = -1;
            this._spanlist.forEach(function (span) {
                span.data = getCustomDataCallback(span.index, span.value, span.index - prevIndex);
                prevIndex = span.index;
            });
        };
        SpanList.prototype.getSpanDataByIndex = function (index) {
            if (typeof index != 'number') {
                return undefined;
            }
            var spanid = this._searchByIndex(index);
            if (spanid == -1) {
                return undefined;
            }
            return this._getSpanData(spanid);
        };
        SpanList.prototype.getSpanDataByCustomDataField = function (value, fieldName) {
            if (typeof value != 'number' || typeof fieldName != 'string' || !fieldName) {
                return undefined;
            }
            var spanid = this._searchByCustomDataField(value, fieldName);
            if (spanid == -1) {
                return undefined;
            }
            return this._getSpanData(spanid);
        };
        SpanList.prototype.forEachSpanInRange = function (start, end, callback) {
            if (typeof start != 'number' || typeof end != 'number' ||
                typeof callback != 'function' || start > end) {
                return;
            }
            var startId = this._searchByIndex(start);
            var endId = this._searchByIndex(end);
            if (startId == -1 || endId == -1) {
                return;
            }
            for (var id = startId; id <= endId; ++id) {
                callback(this._getSpanData(id));
            }
        };
        SpanList.prototype.forEachSpan = function (callback) {
            for (var id = 0; id < this._spanlist.length; ++id) {
                callback(this._getSpanData(id));
            }
        };
        SpanList.prototype._getSpanData = function (spanid) {
            // TODO: Check if data is changed by the callers. If not, return the pointer instead.
            var span = this._spanlist[spanid];
            var clone = {
                index: span.index,
                value: span.value,
                data: span.data,
                start: spanid > 0 ? this._spanlist[spanid - 1].index + 1 : 0,
                end: span.index,
                size: span.value
            };
            return clone;
        };
        SpanList.prototype._searchByIndex = function (index) {
            return binarySearch(this._spanlist, index, function directionProvider(testIndex, prevSpan, curSpan) {
                var spanStart = prevSpan ?
                    prevSpan.index + 1 : 0;
                var spanEnd = curSpan.index;
                return (testIndex < spanStart) ? -1 :
                    (spanEnd < testIndex) ? 1 : 0;
            });
        };
        SpanList.prototype._searchByCustomDataField = function (value, fieldName) {
            // All custom searchable data values are assumed to start
            // from 0 at the start of first span and are in non-decreasing order.
            return binarySearch(this._spanlist, value, function directionProvider(testValue, prevSpan, curSpan, nextSpan) {
                var valueStart = prevSpan ?
                    prevSpan.data[fieldName] : 0;
                var valueEnd = curSpan.data[fieldName] - (nextSpan ? 1 : 0);
                if (valueStart === undefined || valueEnd === undefined) {
                    // fieldName not present in the 'data' property.
                    return -1;
                }
                return (testValue < valueStart) ? -1 :
                    (valueEnd < testValue) ? 1 : 0;
            }, true /* find the first match in case of duplicates */);
            // About the last argument: duplicates can happen, for instance if the
            // custom field represents positions, and there are spans with zero sizes (hidden/filtered).
        };
        return SpanList;
    }());
    var BoolSpanList = /** @class */ (function () {
        function BoolSpanList(encoding) {
            // list of spans, each span represented by the end index.
            this._spanlist = [];
            this._startBit = false;
            if (typeof encoding !== 'string') {
                return;
            }
            this.load(encoding);
        }
        BoolSpanList.prototype.load = function (encoding) {
            if (typeof encoding !== 'string') {
                return false;
            }
            var result = parseSpanListEncoding(encoding, true /* boolean value ? */);
            if (result === undefined) {
                return false;
            }
            this._spanlist = result.spanlist;
            this._startBit = result.startBit;
            return true;
        };
        // Runs in O(#spans in 'this' + #spans in 'other')
        BoolSpanList.prototype.union = function (other) {
            if (!(other instanceof BoolSpanList)) {
                return undefined;
            }
            // Ensure both spanlists have the same total range.
            if (this._spanlist[this._spanlist.length - 1] !== other._spanlist[other._spanlist.length - 1]) {
                return undefined;
            }
            var maxElement = this._spanlist[this._spanlist.length - 1];
            var result = new BoolSpanList();
            var thisBit = this._startBit;
            var otherBit = other._startBit;
            var resultBit = thisBit || otherBit;
            result._startBit = resultBit;
            var thisIdx = 0;
            var otherIdx = 0;
            while (thisIdx < this._spanlist.length && otherIdx < other._spanlist.length) {
                // end elements of the current spans of 'this' and 'other'.
                var thisElement = this._spanlist[thisIdx];
                var otherElement = other._spanlist[otherIdx];
                var lastElement = otherElement;
                if (thisElement < otherElement) {
                    lastElement = thisElement;
                    thisBit = !thisBit;
                    ++thisIdx;
                }
                else if (otherElement < thisElement) {
                    otherBit = !otherBit;
                    ++otherIdx;
                }
                else { // both elements are equal.
                    thisBit = !thisBit;
                    otherBit = !otherBit;
                    ++thisIdx;
                    ++otherIdx;
                }
                var nextResultBit = (thisBit || otherBit);
                if (resultBit != nextResultBit || lastElement >= maxElement) {
                    // In the result spanlist a new span start from lastElement+1
                    // or reached the maximum possible element.
                    result._spanlist.push(lastElement);
                    resultBit = nextResultBit;
                }
            }
            return result;
        };
        return BoolSpanList;
    }());
    function parseSpanListEncoding(encoding, booleanValue) {
        var spanlist = [];
        var boolspanlist = [];
        var splits = encoding.split(' ');
        if (splits.length < 2) {
            return undefined;
        }
        var startBitInt = 0;
        if (booleanValue) {
            var parts = splits[0].split(':');
            if (parts.length != 2) {
                return undefined;
            }
            startBitInt = parseInt(parts[0]);
            var first = parseInt(parts[1]);
            if (isNaN(startBitInt) || isNaN(first)) {
                return undefined;
            }
            boolspanlist.push(first);
        }
        var startBit = Boolean(startBitInt);
        for (var idx = 0; idx < splits.length - 1; ++idx) {
            if (booleanValue) {
                if (!idx) {
                    continue;
                }
                var entry = parseInt(splits[idx]);
                if (isNaN(entry)) {
                    return undefined;
                }
                boolspanlist.push(entry);
                continue;
            }
            var spanParts = splits[idx].split(':');
            if (spanParts.length != 2) {
                return undefined;
            }
            var span = {
                index: parseInt(spanParts[1]),
                value: parseInt(spanParts[0])
            };
            if (isNaN(span.index) || isNaN(span.value)) {
                return undefined;
            }
            spanlist.push(span);
        }
        if (booleanValue) {
            return {
                spanlist: boolspanlist,
                startBit: startBit
            };
        }
        return { spanlist: spanlist };
    }
    var DimensionOutlines = /** @class */ (function () {
        function DimensionOutlines(encoding) {
            this._outlines = [];
            if (typeof encoding !== 'string') {
                return;
            }
            this.load(encoding);
        }
        DimensionOutlines.prototype.load = function (encoding) {
            if (typeof encoding !== 'string') {
                return false;
            }
            var levels = encoding.split(' ');
            if (levels.length < 2) {
                // No outline.
                this._outlines = [];
                return true;
            }
            var outlines = [];
            for (var levelIdx = 0; levelIdx < levels.length - 1; ++levelIdx) {
                var collectionSplits = levels[levelIdx].split(',');
                var collections = [];
                if (collectionSplits.length < 2) {
                    return false;
                }
                for (var collIdx = 0; collIdx < collectionSplits.length - 1; ++collIdx) {
                    var entrySplits = collectionSplits[collIdx].split(':');
                    if (entrySplits.length < 4) {
                        return false;
                    }
                    var olineEntry = {
                        start: parseInt(entrySplits[0]),
                        end: parseInt(entrySplits[1]),
                        hidden: parseInt(entrySplits[2]),
                        visible: parseInt(entrySplits[3])
                    };
                    if (isNaN(olineEntry.start) || isNaN(olineEntry.end) ||
                        isNaN(olineEntry.hidden) || isNaN(olineEntry.visible)) {
                        return false;
                    }
                    // correct the 'end' attribute.
                    olineEntry.end += (olineEntry.start - 1);
                    collections.push(olineEntry);
                }
                outlines.push(collections);
            }
            this._outlines = outlines;
            return true;
        };
        DimensionOutlines.prototype.getLevels = function () {
            return this._outlines.length;
        };
        // Calls 'callback' for all groups in all levels that have an intersection with
        // the inclusive element range [start, end].
        // 'callback' is called with these parameters :
        // (levelIdx, groupIdx, groupStart, groupEnd, groupHidden).
        DimensionOutlines.prototype.forEachGroupInRange = function (start, end, callback) {
            if (typeof start != 'number' || typeof end != 'number' || typeof callback != 'function') {
                return;
            }
            if (!this._outlines.length || start > end) {
                return;
            }
            // Search direction provider for binarySearch().
            // Here we want to find the first group after or intersects elementIdx.
            // return value : 0 for match, -1 for "try previous entries", +1 for "try next entries".
            var directionProvider = function (elementIdx, prevGroup, curGroup /*, nextGroup*/) {
                var direction = (elementIdx < curGroup.start) ? -1 :
                    (curGroup.end < elementIdx) ? 1 : 0;
                if (direction >= 0) {
                    return direction;
                }
                // If curGroup is the first one, or elementidx is after prevGroup's end, then it is a match.
                if (!prevGroup || (prevGroup.end < elementIdx)) {
                    return 0;
                }
                return -1;
            };
            for (var levelIdx = this._outlines.length - 1; levelIdx >= 0; --levelIdx) {
                var groupsInLevel = this._outlines[levelIdx];
                // Find the first group after or that intersects 'start'.
                var startGroupIdx = binarySearch(groupsInLevel, start, directionProvider);
                if (startGroupIdx == -1) {
                    // All groups at this level are before 'start'.
                    continue;
                }
                var startGroup = groupsInLevel[startGroupIdx];
                if (end < startGroup.start) {
                    // No group at this level intersects the range [start, end].
                    continue;
                }
                for (var groupIdx = startGroupIdx; groupIdx < groupsInLevel.length; ++groupIdx) {
                    var group = groupsInLevel[groupIdx];
                    if (end < group.start) {
                        continue;
                    }
                    callback(levelIdx, groupIdx, group.start, group.end, group.hidden);
                }
            }
        };
        return DimensionOutlines;
    }());
    cool.DimensionOutlines = DimensionOutlines;
    function binarySearch(array, key, directionProvider, firstMatch) {
        if (firstMatch === void 0) { firstMatch = false; }
        if (!Array.isArray(array) || !array.length) {
            return -1;
        }
        if (typeof directionProvider != 'function') {
            directionProvider = function (key, prevvalue, testvalue) {
                return (key === testvalue) ? 0 :
                    (key < testvalue) ? -1 : 1;
            };
        }
        firstMatch = (firstMatch === true);
        var start = 0;
        var end = array.length - 1;
        // Bound checks and early exit.
        var startDir = directionProvider(key, undefined, array[0], array[1]);
        if (startDir <= 0) {
            return startDir;
        }
        var endDir = directionProvider(key, array[end - 1], array[end]);
        if (endDir >= 0) {
            if (endDir === 1) {
                return -1;
            }
            return firstMatch ? _findFirstMatch(array, key, directionProvider, end) : end;
        }
        var mid = -1;
        while (start <= end) {
            mid = Math.round((start + end) / 2);
            var direction = directionProvider(key, array[mid - 1], array[mid], array[mid + 1]);
            if (direction == 0) {
                break;
            }
            if (direction == -1) {
                end = mid - 1;
            }
            else {
                start = mid + 1;
            }
        }
        return (start > end) ? -1 :
            firstMatch ? _findFirstMatch(array, key, directionProvider, mid) : mid;
    }
    // Helper function for binarySearch().
    function _findFirstMatch(array, key, directionProvider, randomMatchingIndex) {
        if (randomMatchingIndex === 0) {
            return 0;
        }
        var index = randomMatchingIndex - 1;
        while (index >= 0 && directionProvider(key, array[index - 1], array[index], array[index + 1]) == 0) {
            --index;
        }
        return index + 1;
    }
})(cool || (cool = {}));
L.SheetGeometry = cool.SheetGeometry;
