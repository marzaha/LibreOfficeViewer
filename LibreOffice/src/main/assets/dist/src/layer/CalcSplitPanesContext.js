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
var cool;
(function (cool) {
    var CalcSplitPanesContext = /** @class */ (function (_super) {
        __extends(CalcSplitPanesContext, _super);
        function CalcSplitPanesContext() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        CalcSplitPanesContext.prototype._setDefaults = function () {
            this._part = this._docLayer.getSelectedPart();
            this._splitPos = new cool.Point(0, 0);
            this._splitCell = new cool.Point(0, 0);
        };
        CalcSplitPanesContext.prototype.setSplitCol = function (splitCol) {
            console.assert(typeof splitCol === 'number', 'invalid argument type');
            return this._splitCell.setX(splitCol);
        };
        CalcSplitPanesContext.prototype.setSplitRow = function (splitRow) {
            console.assert(typeof splitRow === 'number', 'invalid argument type');
            return this._splitCell.setY(splitRow);
        };
        /// Calculates the split position in (core-pixels) from the split-cell.
        CalcSplitPanesContext.prototype.setSplitPosFromCell = function (forceSplittersUpdate) {
            var newSplitPos = this._docLayer.sheetGeometry.getCellRect(this._splitCell.x, this._splitCell.y).min;
            // setSplitPos limits the split position based on the screen size and it fires 'splitposchanged' (if there is any change).
            // setSplitCellFromPos gets invoked on 'splitposchanged' to sync the split-cell with the position change if any.
            this.setSplitPos(newSplitPos.x, newSplitPos.y, forceSplittersUpdate);
            // It is possible that the split-position did not change due to screen size limits, so no 'splitposchanged' but
            // we still need to sync the split-cell.
            this.setSplitCellFromPos();
        };
        // Calculates the split-cell from the split position in (core-pixels).
        CalcSplitPanesContext.prototype.setSplitCellFromPos = function () {
            // This should not call setSplitPosFromCell() directly/indirectly.
            var newSplitCell = this._docLayer.sheetGeometry.getCellFromPos(this._splitPos, 'corepixels');
            // Send new state via uno commands if there is any change.
            if (!this._docLayer.dontSendSplitPosToCore) {
                this.setSplitCol(newSplitCell.x) && this._docLayer.sendSplitIndex(newSplitCell.x, true /*  isSplitCol */);
                this.setSplitRow(newSplitCell.y) && this._docLayer.sendSplitIndex(newSplitCell.y, false /* isSplitCol */);
            }
        };
        return CalcSplitPanesContext;
    }(cool.SplitPanesContext));
    cool.CalcSplitPanesContext = CalcSplitPanesContext;
})(cool || (cool = {}));
L.CalcSplitPanesContext = cool.CalcSplitPanesContext;
