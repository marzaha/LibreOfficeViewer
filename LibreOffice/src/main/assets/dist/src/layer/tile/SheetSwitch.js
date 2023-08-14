var cool;
(function (cool) {
    // SheetSwitchViewRestore is used to store the last view position of a sheet
    // before a sheet switch so that when the user switches back to previously used
    // sheets we can restore the last scroll position of that sheet.
    var SheetSwitchViewRestore = /** @class */ (function () {
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        function SheetSwitchViewRestore(map) {
            this.map = map;
            this.docLayer = this.map._docLayer;
            this.centerOfSheet = new Map();
            this.mayRestore = false;
            this.restorePart = -1;
            this.setPartRecvd = false;
        }
        SheetSwitchViewRestore.prototype.save = function (toPart) {
            this.centerOfSheet.set(this.docLayer._selectedPart, this.map.getCenter());
            this.mayRestore = this.centerOfSheet.has(toPart);
            this.restorePart = this.mayRestore ? toPart : -1;
            this.setPartRecvd = false;
        };
        SheetSwitchViewRestore.prototype.gotSetPart = function (part) {
            this.setPartRecvd = (part === this.restorePart);
        };
        // This resets the flags but not the center map.
        SheetSwitchViewRestore.prototype.reset = function () {
            this.restorePart = -1;
            this.mayRestore = false;
        };
        SheetSwitchViewRestore.prototype.restoreView = function () {
            var center = this.centerOfSheet.get(this.restorePart);
            if (center === undefined) {
                this.reset();
                return;
            }
            this.map._resetView(center, this.map._zoom);
            // Keep restoring view for every cell-cursor messages until we get this
            // call after receiving cell-cursor msg after setpart incoming msg.
            // Because it is guaranteed that cell-cursor messages belong to the new part
            // after setpart(incoming) msg.
            if (this.setPartRecvd)
                this.reset();
        };
        // This should be called to restore sheet's last scroll position if necessary and
        // returns whether the map should scroll to current cursor.
        SheetSwitchViewRestore.prototype.tryRestore = function (duplicateCursor, currentPart) {
            var shouldScrollToCursor = false;
            var attemptRestore = (this.mayRestore && currentPart === this.restorePart);
            if (attemptRestore) {
                if (this.setPartRecvd && duplicateCursor)
                    this.reset();
                if (!this.setPartRecvd)
                    this.restoreView();
            }
            if ((!attemptRestore || this.setPartRecvd) && !duplicateCursor)
                shouldScrollToCursor = true;
            return shouldScrollToCursor;
        };
        return SheetSwitchViewRestore;
    }());
    cool.SheetSwitchViewRestore = SheetSwitchViewRestore;
})(cool || (cool = {}));
L.SheetSwitchViewRestore = cool.SheetSwitchViewRestore;
