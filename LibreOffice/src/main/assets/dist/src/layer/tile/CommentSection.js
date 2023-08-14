/* See CanvasSectionContainer.ts for explanations. */
app.definitions.Comment = /** @class */ (function () {
    function Comment(data, options, commentListSectionPointer) {
        this.context = null;
        this.myTopLeft = [0, 0];
        this.documentTopLeft = null;
        this.containerObject = null;
        this.dpiScale = null;
        this.name = L.CSections.Comment.name;
        this.backgroundColor = '';
        this.backgroundOpacity = 1; // Valid when backgroundColor is valid.
        this.borderColor = null;
        this.boundToSection = null;
        this.anchor = new Array(0);
        this.documentObject = true;
        this.position = [0, 0];
        this.size = new Array(0);
        this.expand = new Array(0);
        this.isLocated = false;
        this.showSection = true;
        this.processingOrder = L.CSections.Comment.processingOrder;
        this.drawingOrder = L.CSections.Comment.drawingOrder;
        this.zIndex = L.CSections.Comment.zIndex;
        this.interactable = true;
        this.sectionProperties = {};
        this.valid = true;
        this.pendingInit = true;
        this.isCollapsed = false;
        this.map = L.Map.THIS;
        if (!options)
            options = {};
        this.sectionProperties.commentListSection = commentListSectionPointer;
        this.sectionProperties.docLayer = this.map._docLayer;
        this.sectionProperties.selectedAreaPoint = null;
        this.sectionProperties.cellCursorPoint = null;
        this.sectionProperties.draggingStarted = false;
        this.sectionProperties.dragStartPosition = null;
        this.sectionProperties.minWidth = options.minWidth ? options.minWidth : 160;
        this.sectionProperties.maxHeight = options.maxHeight ? options.maxHeight : 50;
        this.sectionProperties.imgSize = options.imgSize ? options.imgSize : [32, 32];
        this.sectionProperties.margin = options.margin ? options.margin : [40, 40];
        this.sectionProperties.noMenu = options.noMenu ? options.noMenu : false;
        this.sectionProperties.data = data;
        this.sectionProperties.annotationMarker = null;
        this.sectionProperties.wrapper = null;
        this.sectionProperties.collapsed = null;
        this.sectionProperties.container = null;
        this.sectionProperties.author = null;
        this.sectionProperties.resolvedTextElement = null;
        this.sectionProperties.authorAvatarImg = null;
        this.sectionProperties.authorCollapsedAvatarImg = null;
        this.sectionProperties.authorAvatartdImg = null;
        this.sectionProperties.contentAuthor = null;
        this.sectionProperties.contentDate = null;
        this.sectionProperties.acceptButton = null;
        this.sectionProperties.rejectButton = null;
        this.sectionProperties.menu = null;
        this.sectionProperties.captionNode = null;
        this.sectionProperties.captionText = null;
        this.sectionProperties.contentNode = null;
        this.sectionProperties.nodeModify = null;
        this.sectionProperties.nodeModifyText = null;
        this.sectionProperties.contentText = null;
        this.sectionProperties.nodeReply = null;
        this.sectionProperties.nodeReplyText = null;
        this.sectionProperties.contextMenu = false;
        this.sectionProperties.highlightedTextColor = '#777777'; // Writer.
        this.sectionProperties.usedTextColor = this.sectionProperties.data.color; // Writer.
        this.sectionProperties.showSelectedCoordinate = true; // Writer.
        if (this.sectionProperties.docLayer._docType === 'presentation' || this.sectionProperties.docLayer._docType === 'drawing') {
            this.sectionProperties.parthash = this.sectionProperties.data.parthash;
            this.sectionProperties.partIndex = this.sectionProperties.docLayer._partHashes.indexOf(String(this.sectionProperties.parthash));
        }
        this.sectionProperties.isHighlighted = false;
        this.name = data.id === 'new' ? 'new comment' : 'comment ' + data.id;
        this.sectionProperties.isRemoved = false;
    }
    // Comments import can be costly if the document has a lot of them. If they are all imported/initialized
    // when online gets comments message from core, the initial doc render is delayed. To avoid that we do
    // lazy import of each comment when it needs to be shown (based on its coordinates).
    Comment.prototype.doPendingInitializationInView = function (force) {
        if (force === void 0) { force = false; }
        if (!this.pendingInit)
            return;
        if (!force && !this.convertRectanglesToCoreCoordinates())
            return;
        var button = L.DomUtil.create('div', 'annotation-btns-container', this.sectionProperties.nodeModify);
        L.DomEvent.on(this.sectionProperties.nodeModifyText, 'blur', this.onLostFocus, this);
        L.DomEvent.on(this.sectionProperties.nodeReplyText, 'blur', this.onLostFocusReply, this);
        this.createButton(button, 'annotation-cancel-' + this.sectionProperties.data.id, 'annotation-button button-secondary', _('Cancel'), this.onCancelClick);
        this.createButton(button, 'annotation-save-' + this.sectionProperties.data.id, 'annotation-button button-primary', _('Save'), this.onSaveComment);
        button = L.DomUtil.create('div', '', this.sectionProperties.nodeReply);
        this.createButton(button, 'annotation-cancel-reply-' + this.sectionProperties.data.id, 'annotation-button button-secondary', _('Cancel'), this.onCancelClick);
        this.createButton(button, 'annotation-reply-' + this.sectionProperties.data.id, 'annotation-button button-primary', _('Reply'), this.onReplyClick);
        L.DomEvent.disableScrollPropagation(this.sectionProperties.container);
        this.sectionProperties.container.style.visibility = 'hidden';
        this.sectionProperties.nodeModify.style.display = 'none';
        this.sectionProperties.nodeReply.style.display = 'none';
        var events = ['click', 'dblclick', 'mousedown', 'mouseup', 'mouseover', 'mouseout', 'keydown', 'keypress', 'keyup', 'touchstart', 'touchmove', 'touchend'];
        L.DomEvent.on(this.sectionProperties.container, 'click', this.onMouseClick, this);
        L.DomEvent.on(this.sectionProperties.container, 'keydown', this.onEscKey, this);
        for (var it = 0; it < events.length; it++) {
            L.DomEvent.on(this.sectionProperties.container, events[it], L.DomEvent.stopPropagation, this);
        }
        L.DomEvent.on(this.sectionProperties.container, 'touchstart', function (e) {
            if (e && e.touches.length > 1) {
                L.DomEvent.preventDefault(e);
            }
        }, this);
        if (window.mode.isDesktop()) {
            L.DomEvent.on(this.sectionProperties.container, {
                mousewheel: this.map.scrollHandler._onWheelScroll,
                MozMousePixelScroll: L.DomEvent.preventDefault
            }, this.map.scrollHandler);
        }
        this.update();
        this.pendingInit = false;
    };
    Comment.prototype.onInitialize = function () {
        this.createContainerAndWrapper();
        this.createAuthorTable();
        if (this.sectionProperties.data.trackchange && !this.map.isPermissionReadOnly()) {
            this.createTrackChangeButtons();
        }
        if (this.sectionProperties.noMenu !== true && (this.map.isPermissionEditForComments() || this.map.isPermissionEdit())) {
            this.createMenu();
        }
        if (this.sectionProperties.data.trackchange) {
            this.sectionProperties.captionNode = L.DomUtil.create('div', 'cool-annotation-caption', this.sectionProperties.wrapper);
            this.sectionProperties.captionText = L.DomUtil.create('div', '', this.sectionProperties.captionNode);
        }
        this.sectionProperties.contentNode = L.DomUtil.create('div', 'cool-annotation-content cool-dont-break', this.sectionProperties.wrapper);
        this.sectionProperties.contentNode.id = 'annotation-content-area-' + this.sectionProperties.data.id;
        this.sectionProperties.nodeModify = L.DomUtil.create('div', 'cool-annotation-edit' + ' modify-annotation', this.sectionProperties.wrapper);
        this.sectionProperties.nodeModifyText = L.DomUtil.create('textarea', 'cool-annotation-textarea', this.sectionProperties.nodeModify);
        this.sectionProperties.nodeModifyText.id = 'annotation-modify-textarea-' + this.sectionProperties.data.id;
        this.sectionProperties.contentText = L.DomUtil.create('div', '', this.sectionProperties.contentNode);
        this.sectionProperties.nodeReply = L.DomUtil.create('div', 'cool-annotation-edit' + ' reply-annotation', this.sectionProperties.wrapper);
        this.sectionProperties.nodeReplyText = L.DomUtil.create('textarea', 'cool-annotation-textarea', this.sectionProperties.nodeReply);
        this.sectionProperties.nodeReplyText.id = 'annotation-reply-textarea-' + this.sectionProperties.data.id;
        this.sectionProperties.container.style.visibility = 'hidden';
        this.doPendingInitializationInView();
        this.setExpanded();
    };
    Comment.prototype.createContainerAndWrapper = function () {
        var isRTL = document.documentElement.dir === 'rtl';
        this.sectionProperties.container = L.DomUtil.create('div', 'cool-annotation' + (isRTL ? ' rtl' : ''));
        this.sectionProperties.container.id = 'comment-container-' + this.sectionProperties.data.id;
        var mobileClass = window.mode.isMobile() ? ' wizard-comment-box' : '';
        if (this.sectionProperties.data.trackchange) {
            this.sectionProperties.wrapper = L.DomUtil.create('div', 'cool-annotation-redline-content-wrapper' + mobileClass, this.sectionProperties.container);
        }
        else {
            this.sectionProperties.wrapper = L.DomUtil.create('div', 'cool-annotation-content-wrapper' + mobileClass, this.sectionProperties.container);
        }
        this.sectionProperties.collapsed = L.DomUtil.create('div', 'cool-annotation-collapsed', this.sectionProperties.container);
        document.getElementById('document-container').appendChild(this.sectionProperties.container);
    };
    Comment.prototype.createAuthorTable = function () {
        this.sectionProperties.author = L.DomUtil.create('table', 'cool-annotation-table', this.sectionProperties.wrapper);
        var tbody = L.DomUtil.create('tbody', '', this.sectionProperties.author);
        var rowResolved = L.DomUtil.create('tr', '', tbody);
        var tdResolved = L.DomUtil.create('td', 'cool-annotation-resolved', rowResolved);
        var pResolved = L.DomUtil.create('div', 'cool-annotation-content-resolved', tdResolved);
        this.sectionProperties.resolvedTextElement = pResolved;
        this.updateResolvedField(this.sectionProperties.data.resolved);
        var tr = L.DomUtil.create('tr', '', tbody);
        this.sectionProperties.authorRow = tr;
        tr.id = 'author table row ' + this.sectionProperties.data.id;
        var tdImg = L.DomUtil.create('td', 'cool-annotation-img', tr);
        var tdAuthor = L.DomUtil.create('td', 'cool-annotation-author', tr);
        var imgAuthor = L.DomUtil.create('img', 'avatar-img', tdImg);
        imgAuthor.setAttribute('src', L.LOUtil.getImageURL('user.svg'));
        imgAuthor.setAttribute('width', this.sectionProperties.imgSize[0]);
        imgAuthor.setAttribute('height', this.sectionProperties.imgSize[1]);
        imgAuthor.onerror = function () { imgAuthor.setAttribute('src', L.LOUtil.getImageURL('user.svg')); };
        var imgCollapsedAuthor = L.DomUtil.create('img', 'avatar-img', this.sectionProperties.collapsed);
        imgCollapsedAuthor.setAttribute('src', L.LOUtil.getImageURL('user.svg'));
        imgCollapsedAuthor.setAttribute('width', this.sectionProperties.imgSize[0]);
        imgCollapsedAuthor.setAttribute('height', this.sectionProperties.imgSize[1]);
        imgCollapsedAuthor.onerror = function () { imgCollapsedAuthor.setAttribute('src', L.LOUtil.getImageURL('user.svg')); };
        this.sectionProperties.replyCountNode = L.DomUtil.create('div', 'cool-annotation-reply-count-collapsed', this.sectionProperties.collapsed);
        this.sectionProperties.replyCountNode.style.display = 'none';
        this.sectionProperties.authorAvatarImg = imgAuthor;
        this.sectionProperties.authorCollapsedAvatarImg = imgCollapsedAuthor;
        this.sectionProperties.authorAvatartdImg = tdImg;
        this.sectionProperties.contentAuthor = L.DomUtil.create('div', 'cool-annotation-content-author', tdAuthor);
        this.sectionProperties.contentDate = L.DomUtil.create('div', 'cool-annotation-date', tdAuthor);
    };
    Comment.prototype.createMenu = function () {
        var tdMenu = L.DomUtil.create('td', 'cool-annotation-menubar', this.sectionProperties.authorRow);
        this.sectionProperties.menu = L.DomUtil.create('div', this.sectionProperties.data.trackchange ? 'cool-annotation-menu-redline' : 'cool-annotation-menu', tdMenu);
        this.sectionProperties.menu.id = 'comment-annotation-menu-' + this.sectionProperties.data.id;
        this.sectionProperties.menu.onclick = this.menuOnMouseClick.bind(this);
        var divMenuTooltipText = _('Open menu');
        this.sectionProperties.menu.dataset.title = divMenuTooltipText;
        this.sectionProperties.menu.setAttribute('aria-label', divMenuTooltipText);
        this.sectionProperties.menu.annotation = this;
    };
    Comment.prototype.setData = function (data) {
        this.sectionProperties.data = data;
    };
    Comment.prototype.createTrackChangeButtons = function () {
        var tdAccept = L.DomUtil.create('td', 'cool-annotation-menubar', this.sectionProperties.authorRow);
        var acceptButton = this.sectionProperties.acceptButton = L.DomUtil.create('button', 'cool-redline-accept-button', tdAccept);
        var tdReject = L.DomUtil.create('td', 'cool-annotation-menubar', this.sectionProperties.authorRow);
        var rejectButton = this.sectionProperties.rejectButton = L.DomUtil.create('button', 'cool-redline-reject-button', tdReject);
        acceptButton.dataset.title = _('Accept change');
        acceptButton.setAttribute('aria-label', _('Accept change'));
        L.DomEvent.on(acceptButton, 'click', function () {
            this.map.fire('RedlineAccept', { id: this.sectionProperties.data.id });
        }, this);
        rejectButton.dataset.title = _('Reject change');
        rejectButton.setAttribute('aria-label', _('Reject change'));
        L.DomEvent.on(rejectButton, 'click', function () {
            this.map.fire('RedlineReject', { id: this.sectionProperties.data.id });
        }, this);
    };
    Comment.prototype.createButton = function (container, id, cssClass, value, handler) {
        var button = L.DomUtil.create('input', cssClass, container);
        button.id = id;
        button.type = 'button';
        button.value = value;
        L.DomEvent.on(button, 'mousedown', L.DomEvent.preventDefault);
        L.DomEvent.on(button, 'click', handler, this);
    };
    Comment.prototype.parentOf = function (comment) {
        return this.sectionProperties.data.id === comment.sectionProperties.data.parent;
    };
    Comment.prototype.updateResolvedField = function (state) {
        this.sectionProperties.resolvedTextElement.innerText = state === 'true' ? _('Resolved') : '';
    };
    Comment.prototype.updateContent = function () {
        this.sectionProperties.contentText.innerText = this.sectionProperties.data.text ? this.sectionProperties.data.text : '';
        // Get the escaped HTML out and find for possible, useful links
        var linkedText = Autolinker.link(this.sectionProperties.contentText.outerHTML);
        // Set the property of text field directly. This is insecure otherwise because it doesn't escape the input
        // But we have already escaped the input before and only thing we are adding on top of that is Autolinker
        // generated text.
        this.sectionProperties.contentText.innerHTML = linkedText;
        // Original unlinked text
        this.sectionProperties.contentText.origText = this.sectionProperties.data.text ? this.sectionProperties.data.text : '';
        this.sectionProperties.nodeModifyText.textContent = this.sectionProperties.data.text ? this.sectionProperties.data.text : '';
        this.sectionProperties.contentAuthor.innerText = this.sectionProperties.data.author;
        this.updateResolvedField(this.sectionProperties.data.resolved);
        if (this.sectionProperties.data.avatar) {
            this.sectionProperties.authorAvatarImg.setAttribute('src', this.sectionProperties.data.avatar);
            this.sectionProperties.authorCollapsedAvatarImg.setAttribute('src', this.sectionProperties.data.avatar);
        }
        else {
            $(this.sectionProperties.authorAvatarImg).css('padding-top', '4px');
        }
        var user = this.map.getViewId(this.sectionProperties.data.author);
        if (user >= 0) {
            var color = L.LOUtil.rgbToHex(this.map.getViewColor(user));
            this.sectionProperties.authorAvatartdImg.style.borderColor = color;
        }
        var d = new Date(this.sectionProperties.data.dateTime.replace(/,.*/, 'Z'));
        var dateOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
        this.sectionProperties.contentDate.innerText = isNaN(d.getTime()) ? this.sectionProperties.data.dateTime : d.toLocaleDateString(String.locale, dateOptions);
        if (this.sectionProperties.data.trackchange) {
            this.sectionProperties.captionText.innerText = this.sectionProperties.data.description;
        }
    };
    Comment.prototype.updateLayout = function () {
        var style = this.sectionProperties.wrapper.style;
        style.width = '';
        style.whiteSpace = 'nowrap';
        style.whiteSpace = '';
    };
    Comment.prototype.setPositionAndSize = function () {
        var rectangles = this.sectionProperties.data.rectanglesOriginal;
        if (rectangles && this.sectionProperties.docLayer._docType === 'text') {
            var xMin = Infinity, yMin = Infinity, xMax = 0, yMax = 0;
            for (var i = 0; i < rectangles.length; i++) {
                if (rectangles[i][0] < xMin)
                    xMin = rectangles[i][0];
                if (rectangles[i][1] < yMin)
                    yMin = rectangles[i][1];
                if (rectangles[i][0] + rectangles[i][2] > xMax)
                    xMax = rectangles[i][0] + rectangles[i][2];
                if (rectangles[i][1] + rectangles[i][3] > yMax)
                    yMax = rectangles[i][1] + rectangles[i][3];
            }
            // Rectangles are in twips. Convert them to core pixels.
            var ratio = (app.tile.size.pixels[0] / app.tile.size.twips[0]);
            xMin = Math.round(xMin * ratio);
            yMin = Math.round(yMin * ratio);
            xMax = Math.round(xMax * ratio);
            yMax = Math.round(yMax * ratio);
            this.setPosition(xMin, yMin); // This function is added by section container.
            this.size = [xMax - xMin, yMax - yMin];
            if (this.size[0] < 5)
                this.size[0] = 5;
        }
        else if (this.sectionProperties.data.cellPos && this.sectionProperties.docLayer._docType === 'spreadsheet') {
            var ratio = (app.tile.size.pixels[0] / app.tile.size.twips[0]);
            var sizeX = this.sectionProperties.data.cellPos[2];
            this.size = [Math.round(sizeX * ratio), Math.round(this.sectionProperties.data.cellPos[3] * ratio)];
            var startX = this.sectionProperties.data.cellPos[0];
            if (this.isCalcRTL()) { // Mirroring is done in setPosition
                startX += sizeX; // but adjust for width of the cell.
            }
            this.showSection = true;
            var position = [Math.round(this.sectionProperties.data.cellPos[0] * ratio), Math.round(this.sectionProperties.data.cellPos[1] * ratio)];
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
        }
        else if (this.sectionProperties.docLayer._docType === 'presentation' || this.sectionProperties.docLayer._docType === 'drawing') {
            var ratio = (app.tile.size.pixels[0] / app.tile.size.twips[0]);
            this.size = [Math.round(this.sectionProperties.imgSize[0] * app.dpiScale), Math.round(this.sectionProperties.imgSize[1] * app.dpiScale)];
            this.setPosition(Math.round(this.sectionProperties.data.rectangle[0] * ratio), Math.round(this.sectionProperties.data.rectangle[1] * ratio));
        }
    };
    Comment.prototype.removeHighlight = function () {
        if (this.sectionProperties.docLayer._docType === 'text') {
            this.sectionProperties.usedTextColor = this.sectionProperties.data.color;
            this.sectionProperties.isHighlighted = false;
        }
        else if (this.sectionProperties.docLayer._docType === 'spreadsheet') {
            this.backgroundColor = null;
            this.backgroundOpacity = 1;
        }
    };
    Comment.prototype.highlight = function () {
        if (this.sectionProperties.docLayer._docType === 'text') {
            this.sectionProperties.usedTextColor = this.sectionProperties.highlightedTextColor;
            var x = Math.round(this.position[0] / app.dpiScale);
            var y = Math.round(this.position[1] / app.dpiScale);
            this.containerObject.getSectionWithName(L.CSections.Scroll.name).onScrollTo({ x: x, y: y });
        }
        else if (this.sectionProperties.docLayer._docType === 'spreadsheet') {
            this.backgroundColor = '#777777'; //background: rgba(119, 119, 119, 0.25);
            this.backgroundOpacity = 0.25;
            var x = Math.round(this.position[0] / app.dpiScale);
            var y = Math.round(this.position[1] / app.dpiScale);
            this.containerObject.getSectionWithName(L.CSections.Scroll.name).onScrollTo({ x: x, y: y });
        }
        else if (this.sectionProperties.docLayer._docType === 'presentation' || this.sectionProperties.docLayer._docType === 'drawing') {
            var x = Math.round(this.position[0] / app.dpiScale);
            var y = Math.round(this.position[1] / app.dpiScale);
            this.containerObject.getSectionWithName(L.CSections.Scroll.name).onScrollTo({ x: x, y: y });
        }
        this.containerObject.requestReDraw();
        this.sectionProperties.isHighlighted = true;
    };
    Comment.doesRectIntersectView = function (pos, size, viewContext) {
        var paneBoundsList = viewContext.paneBoundsList;
        var endPos = [pos[0] + size[0], pos[1] + size[1]];
        for (var i = 0; i < paneBoundsList.length; ++i) {
            var paneBounds = paneBoundsList[i];
            var rectInvisible = (endPos[0] < paneBounds.min.x || endPos[1] < paneBounds.min.y ||
                pos[0] > paneBounds.max.x || pos[1] > paneBounds.max.y);
            if (!rectInvisible)
                return true;
        }
        return false;
    };
    // This is for svg elements that will be bound to document-container.
    // This also returns whether any rectangle has an intersection with the visible area/panes.
    Comment.prototype.convertRectanglesToCoreCoordinates = function () {
        var rectangles = this.sectionProperties.data.rectangles;
        var originals = this.sectionProperties.data.rectanglesOriginal;
        var viewContext = this.map.getTileSectionMgr()._paintContext();
        var intersectsVisibleArea = false;
        var ratio = (app.tile.size.pixels[0] / app.tile.size.twips[0]);
        var pos, size;
        if (rectangles) {
            var documentAnchorSection = this.containerObject.getDocumentAnchorSection();
            var diff = [documentAnchorSection.myTopLeft[0] - this.documentTopLeft[0], documentAnchorSection.myTopLeft[1] - this.documentTopLeft[1]];
            for (var i = 0; i < rectangles.length; i++) {
                pos = [
                    Math.round(originals[i][0] * ratio),
                    Math.round(originals[i][1] * ratio)
                ];
                size = [
                    Math.round(originals[i][2] * ratio),
                    Math.round(originals[i][3] * ratio)
                ];
                if (!intersectsVisibleArea && Comment.doesRectIntersectView(pos, size, viewContext))
                    intersectsVisibleArea = true;
                rectangles[i][0] = pos[0] + diff[0];
                rectangles[i][1] = pos[1] + diff[1];
                rectangles[i][2] = size[0];
                rectangles[i][3] = size[1];
            }
        }
        else if (this.sectionProperties.data.trackchange && this.sectionProperties.data.anchorPos) {
            // For redline comments there are no 'rectangles' or 'rectangleOriginal' properties in sectionProperties.data
            // So use the comment rectangle stored in anchorPos (in display? twips).
            pos = this.getPosition();
            size = this.getSize();
            intersectsVisibleArea = Comment.doesRectIntersectView(pos, size, viewContext);
        }
        return intersectsVisibleArea;
    };
    Comment.prototype.getPosition = function () {
        // For redline comments there are no 'rectangles' or 'rectangleOriginal' properties in sectionProperties.data
        // So use the comment rectangle stored in anchorPos (in display? twips).
        if (this.sectionProperties.data.trackchange && this.sectionProperties.data.anchorPos) {
            var ratio = (app.tile.size.pixels[0] / app.tile.size.twips[0]);
            var anchorPos = this.sectionProperties.data.anchorPos;
            return [
                Math.round(anchorPos[0] * ratio),
                Math.round(anchorPos[1] * ratio)
            ];
        }
        else {
            return this.position;
        }
    };
    Comment.prototype.getSize = function () {
        // For redline comments there are no 'rectangles' or 'rectangleOriginal' properties in sectionProperties.data
        // So use the comment rectangle stored in anchorPos (in display? twips).
        if (this.sectionProperties.data.trackchange && this.sectionProperties.data.anchorPos) {
            var ratio = (app.tile.size.pixels[0] / app.tile.size.twips[0]);
            var anchorPos = this.sectionProperties.data.anchorPos;
            return [
                Math.round(anchorPos[2] * ratio),
                Math.round(anchorPos[3] * ratio)
            ];
        }
        else {
            return this.size;
        }
    };
    Comment.prototype.updatePosition = function () {
        this.convertRectanglesToCoreCoordinates();
        this.setPositionAndSize();
    };
    Comment.prototype.updateAnnotationMarker = function () {
        // Make sure to place the markers only for presentations and draw documents
        if (this.sectionProperties.docLayer._docType !== 'presentation' && this.sectionProperties.docLayer._docType !== 'drawing')
            return;
        if (this.sectionProperties.data == null)
            return;
        if (this.sectionProperties.annotationMarker === null) {
            this.sectionProperties.annotationMarker = L.marker(new L.LatLng(0, 0), {
                icon: L.divIcon({
                    className: 'annotation-marker',
                    iconSize: null
                }),
                draggable: true
            });
            if (this.sectionProperties.docLayer._partHashes[this.sectionProperties.docLayer._selectedPart] === this.sectionProperties.data.parthash || app.file.fileBasedView)
                this.map.addLayer(this.sectionProperties.annotationMarker);
        }
        if (this.sectionProperties.data.rectangle != null) {
            this.sectionProperties.annotationMarker.setLatLng(this.sectionProperties.docLayer._twipsToLatLng(new L.Point(this.sectionProperties.data.rectangle[0], this.sectionProperties.data.rectangle[1])));
            this.sectionProperties.annotationMarker.on('dragstart drag dragend', this.onMarkerDrag, this);
            //this.sectionProperties.annotationMarker.on('click', this.onMarkerClick, this);
        }
    };
    Comment.prototype.isContainerVisible = function () {
        return (this.sectionProperties.container.style && this.sectionProperties.container.style.visibility === '');
    };
    Comment.prototype.updateScaling = function (scaleFactor, initialLayoutData) {
        if (window.mode.isDesktop())
            return;
        this.doPendingInitializationInView();
        var wrapperWidth = Math.round(initialLayoutData.wrapperWidth * scaleFactor);
        this.sectionProperties.wrapper.style.width = wrapperWidth + 'px';
        var wrapperFontSize = Math.round(initialLayoutData.wrapperFontSize * scaleFactor);
        this.sectionProperties.wrapper.style.fontSize = wrapperFontSize + 'px';
        var contentAuthorHeight = Math.round(initialLayoutData.authorContentHeight * scaleFactor);
        this.sectionProperties.contentAuthor.style.height = contentAuthorHeight + 'px';
        var dateFontSize = Math.round(initialLayoutData.dateFontSize * scaleFactor);
        this.sectionProperties.contentDate.style.fontSize = dateFontSize + 'px';
        if (this.sectionProperties.menu) {
            var menuWidth = Math.round(initialLayoutData.menuWidth * scaleFactor);
            this.sectionProperties.menu.style.width = menuWidth + 'px';
            var menuHeight = Math.round(initialLayoutData.menuHeight * scaleFactor);
            this.sectionProperties.menu.style.height = menuHeight + 'px';
            if (this.sectionProperties.acceptButton) {
                this.sectionProperties.acceptButton.style.width = menuWidth + 'px';
                this.sectionProperties.acceptButton.style.height = menuHeight + 'px';
            }
            if (this.sectionProperties.rejectButton) {
                this.sectionProperties.rejectButton.style.width = menuWidth + 'px';
                this.sectionProperties.rejectButton.style.height = menuHeight + 'px';
            }
        }
        var authorImageWidth = Math.round(this.sectionProperties.imgSize[0] * scaleFactor);
        var authorImageHeight = Math.round(this.sectionProperties.imgSize[1] * scaleFactor);
        this.sectionProperties.authorAvatarImg.setAttribute('width', authorImageWidth);
        this.sectionProperties.authorAvatarImg.setAttribute('height', authorImageHeight);
        this.sectionProperties.authorCollapsedAvatarImg.setAttribute('width', authorImageWidth);
        this.sectionProperties.authorCollapsedAvatarImg.setAttribute('height', authorImageHeight);
    };
    Comment.prototype.update = function () {
        this.updateContent();
        this.updateLayout();
        this.updatePosition();
        this.updateAnnotationMarker();
    };
    Comment.prototype.showMarker = function () {
        if (this.sectionProperties.annotationMarker != null) {
            this.map.addLayer(this.sectionProperties.annotationMarker);
        }
    };
    Comment.prototype.hideMarker = function () {
        if (this.sectionProperties.annotationMarker != null) {
            this.map.removeLayer(this.sectionProperties.annotationMarker);
        }
    };
    Comment.prototype.show = function () {
        this.doPendingInitializationInView(true /* force */);
        this.showMarker();
        // On mobile, container shouldn't be 'document-container', but it is 'document-container' on initialization. So we hide the comment until comment wizard is opened.
        if (window.mode.isMobile() && this.sectionProperties.container.parentElement === document.getElementById('document-container'))
            this.sectionProperties.container.style.visibility = 'hidden';
        else
            this.sectionProperties.container.style.visibility = '';
        this.sectionProperties.contentNode.style.display = '';
        this.sectionProperties.nodeModify.style.display = 'none';
        this.sectionProperties.nodeReply.style.display = 'none';
        this.sectionProperties.showSelectedCoordinate = true; // Writer.
        if (this.sectionProperties.docLayer._docType === 'spreadsheet' && !window.mode.isMobile()) {
            var ratio = (app.tile.size.pixels[0] / app.tile.size.twips[0]);
            var originalSize = [Math.round((this.sectionProperties.data.cellPos[2]) * ratio), Math.round((this.sectionProperties.data.cellPos[3]) * ratio)];
            var commentWidth = parseFloat(getComputedStyle(this.sectionProperties.container).width) * app.dpiScale;
            var startX = this.isCalcRTL() ? this.myTopLeft[0] - commentWidth : this.myTopLeft[0] + originalSize[0] - 3;
            var pos = [Math.round(startX / app.dpiScale), Math.round(this.myTopLeft[1] / app.dpiScale)];
            this.sectionProperties.container.style.transform = 'translate3d(' + pos[0] + 'px, ' + pos[1] + 'px, 0px)';
            this.sectionProperties.commentListSection.selectedComment = this;
        }
    };
    Comment.prototype.hide = function () {
        if (this.sectionProperties.data.id === 'new') {
            this.sectionProperties.commentListSection.removeItem(this.sectionProperties.data.id);
            return;
        }
        this.sectionProperties.container.style.visibility = 'hidden';
        //this.sectionProperties.contentNode.style.display = 'none';
        this.sectionProperties.nodeModify.style.display = 'none';
        this.sectionProperties.nodeReply.style.display = 'none';
        this.sectionProperties.showSelectedCoordinate = false; // Writer.
        if (this.sectionProperties.docLayer._docType === 'spreadsheet' && this.sectionProperties.commentListSection.sectionProperties.selectedComment === this)
            this.sectionProperties.commentListSection.sectionProperties.selectedComment = null;
        this.hideMarker();
    };
    Comment.prototype.menuOnMouseClick = function (e) {
        $(this.sectionProperties.menu).contextMenu();
        L.DomEvent.stopPropagation(e);
    };
    Comment.prototype.onMouseClick = function (e) {
        if ((window.mode.isMobile() || window.mode.isTablet())
            && this.map.getDocType() == 'spreadsheet'
            && !this.map.uiManager.mobileWizard.isOpen()) {
            this.hide();
        }
        L.DomEvent.stopPropagation(e);
        this.sectionProperties.commentListSection.click(this);
    };
    Comment.prototype.onEscKey = function (e) {
        if (window.mode.isDesktop()) {
            if (e.keyCode === 27) {
                this.onCancelClick(e);
            }
        }
    };
    Comment.prototype.onReplyClick = function (e) {
        L.DomEvent.stopPropagation(e);
        if (window.mode.isMobile() || window.mode.isTablet()) {
            this.sectionProperties.data.reply = this.sectionProperties.data.text;
            this.sectionProperties.commentListSection.saveReply(this);
        }
        else {
            this.sectionProperties.data.reply = this.sectionProperties.nodeReplyText.value;
            // Assigning an empty string to .innerHTML property in some browsers will convert it to 'null'
            // While in browsers like Chrome and Firefox, a null value is automatically converted to ''
            // Better to assign '' here instead of null to keep the behavior same for all
            this.sectionProperties.nodeReplyText.value = '';
            this.show();
            this.sectionProperties.commentListSection.saveReply(this);
        }
    };
    Comment.prototype.onCancelClick = function (e) {
        if (e)
            L.DomEvent.stopPropagation(e);
        this.sectionProperties.nodeModifyText.value = this.sectionProperties.contentText.origText;
        this.sectionProperties.nodeReplyText.value = '';
        if (this.sectionProperties.docLayer._docType !== 'spreadsheet')
            this.show();
        this.sectionProperties.commentListSection.cancel(this);
    };
    Comment.prototype.onSaveComment = function (e) {
        L.DomEvent.stopPropagation(e);
        this.sectionProperties.data.text = this.sectionProperties.nodeModifyText.value;
        this.updateContent();
        this.show();
        this.sectionProperties.commentListSection.save(this);
    };
    Comment.prototype.onLostFocus = function (e) {
        if (!this.sectionProperties.isRemoved) {
            $(this.sectionProperties.container).removeClass('annotation-active reply-annotation-container modify-annotation-container');
            if (this.sectionProperties.contentText.origText !== this.sectionProperties.nodeModifyText.value) {
                this.onSaveComment(e);
            }
            else {
                if (!this.containerObject.testing) // eslint-disable-line no-lonely-if
                    this.onCancelClick(e);
                else {
                    var insertButton = document.getElementById('menu-insertcomment');
                    if (insertButton) {
                        if (window.getComputedStyle(insertButton).display === 'none') {
                            this.onCancelClick(e);
                        }
                    }
                }
            }
        }
        app.view.commentHasFocus = false;
    };
    Comment.prototype.onLostFocusReply = function (e) {
        if (this.sectionProperties.nodeReplyText.value !== '') {
            this.onReplyClick(e);
        }
        else {
            this.sectionProperties.nodeReply.style.display = 'none';
        }
        app.view.commentHasFocus = false;
    };
    Comment.prototype.focus = function () {
        this.sectionProperties.container.classList.add('annotation-active');
        this.sectionProperties.nodeModifyText.focus();
        this.sectionProperties.nodeReplyText.focus();
        app.view.commentHasFocus = true;
    };
    Comment.prototype.reply = function () {
        this.sectionProperties.container.classList.add('reply-annotation-container');
        this.sectionProperties.container.style.visibility = '';
        this.sectionProperties.contentNode.style.display = '';
        this.sectionProperties.nodeModify.style.display = 'none';
        this.sectionProperties.nodeReply.style.display = '';
        return this;
    };
    Comment.prototype.edit = function () {
        this.doPendingInitializationInView(true /* force */);
        this.sectionProperties.container.classList.add('modify-annotation-container');
        this.sectionProperties.nodeModify.style.display = '';
        this.sectionProperties.nodeReply.style.display = 'none';
        this.sectionProperties.container.style.visibility = '';
        this.sectionProperties.contentNode.style.display = 'none';
        return this;
    };
    Comment.prototype.isEdit = function () {
        return (this.sectionProperties.nodeModify && this.sectionProperties.nodeModify.style.display !== 'none') ||
            (this.sectionProperties.nodeReply && this.sectionProperties.nodeReply.style.display !== 'none');
    };
    Comment.prototype.sendAnnotationPositionChange = function (newPosition) {
        if (app.file.fileBasedView) {
            this.map.setPart(this.sectionProperties.docLayer._selectedPart, false);
            newPosition.y -= this.sectionProperties.data.yAddition;
        }
        var comment = {
            Id: {
                type: 'string',
                value: this.sectionProperties.data.id
            },
            PositionX: {
                type: 'int32',
                value: newPosition.x
            },
            PositionY: {
                type: 'int32',
                value: newPosition.y
            }
        };
        this.map.sendUnoCommand('.uno:EditAnnotation', comment);
        if (app.file.fileBasedView)
            this.map.setPart(0, false);
    };
    Comment.prototype.onMarkerDrag = function (event) {
        if (this.sectionProperties.annotationMarker == null)
            return;
        if (event.type === 'dragend') {
            var pointTwip = this.sectionProperties.docLayer._latLngToTwips(this.sectionProperties.annotationMarker.getLatLng());
            this.sendAnnotationPositionChange(pointTwip);
        }
    };
    Comment.prototype.isDisplayed = function () {
        return (this.sectionProperties.container.style && this.sectionProperties.container.style.visibility === '');
    };
    Comment.prototype.onResize = function () {
        this.updatePosition();
    };
    Comment.prototype.doesRectangleContainPoint = function (rectangle, point) {
        if (point[0] >= rectangle[0] && point[0] <= rectangle[0] + rectangle[2]) {
            if (point[1] >= rectangle[1] && point[1] <= rectangle[1] + rectangle[3]) {
                return true;
            }
        }
        return false;
    };
    Comment.prototype.onClick = function (point, e) {
        if (this.sectionProperties.docLayer._docType === 'text') {
            var rectangles = this.sectionProperties.data.rectangles;
            point[0] = point[0] + this.myTopLeft[0];
            point[1] = point[1] + this.myTopLeft[1];
            if (rectangles) { // A text file.
                for (var i = 0; i < rectangles.length; i++) {
                    if (this.doesRectangleContainPoint(rectangles[i], point)) {
                        this.sectionProperties.commentListSection.selectById(this.sectionProperties.data.id);
                        e.stopPropagation();
                        this.stopPropagating();
                    }
                }
            }
        }
        else if (this.sectionProperties.docLayer._docType === 'presentation' || this.sectionProperties.docLayer._docType === 'drawing') {
            this.sectionProperties.commentListSection.selectById(this.sectionProperties.data.id);
            e.stopPropagation();
            this.stopPropagating();
        }
    };
    Comment.prototype.onDraw = function () {
        if (this.sectionProperties.docLayer._docType === 'text' && this.sectionProperties.showSelectedCoordinate) {
            var rectangles = this.sectionProperties.data.rectangles;
            if (rectangles) {
                this.context.fillStyle = this.sectionProperties.usedTextColor;
                this.context.globalAlpha = 0.25;
                for (var i = 0; i < this.sectionProperties.data.rectangles.length; i++) {
                    var x = rectangles[i][0] - this.myTopLeft[0];
                    var y = rectangles[i][1] - this.myTopLeft[1];
                    var w = rectangles[i][2] > 3 ? rectangles[i][2] : 3;
                    var h = rectangles[i][3];
                    this.context.fillRect(x, y, w, h);
                }
                this.context.globalAlpha = 1;
            }
        }
    };
    Comment.prototype.onMouseMove = function (point, dragDistance, e) {
        return;
    };
    Comment.prototype.onMouseUp = function (point, e) {
        // Hammer.js doesn't fire onClick event after touchEnd event.
        // CanvasSectionContainer fires the onClick event. But since Hammer.js is used for map, it disables the onClick for SectionContainer.
        // We will use this event as click event on touch devices, until we remove Hammer.js (then this code will be removed from here).
        // Control.ColumnHeader.js file is not affected by this situation, because map element (so Hammer.js) doesn't cover headers.
        if (!this.containerObject.draggingSomething && window.mode.isMobile() || window.mode.isTablet()) {
            if (this.sectionProperties.docLayer._docType === 'presentataion' || this.sectionProperties.docLayer._docType === 'drawing')
                this.sectionProperties.docLayer._openCommentWizard(this);
            this.onMouseEnter();
            this.onClick(point, e);
        }
    };
    Comment.prototype.onMouseDown = function (point, e) {
        return;
    };
    Comment.prototype.calcContinueWithMouseEvent = function () {
        if (this.sectionProperties.docLayer._docType === 'spreadsheet') {
            var conditions = !this.isEdit();
            if (conditions) {
                var sc = this.sectionProperties.commentListSection.sectionProperties.selectedComment;
                if (sc)
                    conditions = sc.sectionProperties.data.id !== 'new';
            }
            return conditions;
        }
        else {
            return false;
        }
    };
    Comment.prototype.onMouseEnter = function () {
        if (this.calcContinueWithMouseEvent()) {
            // When mouse is above this section, comment's HTML element will be shown.
            // If mouse pointer goes to HTML element, onMouseLeave event shouldn't be fired.
            // But mouse pointer will have left the borders of this section and onMouseLeave event will be fired.
            // Let's do it properly, when mouse is above this section, we will make this section's size bigger and onMouseLeave event will not be fired.
            if (parseInt(this.sectionProperties.data.tab) === this.sectionProperties.docLayer._selectedPart) {
                var sc = this.sectionProperties.commentListSection.sectionProperties.selectedComment;
                if (sc) {
                    if (!sc.isEdit())
                        sc.hide();
                    else
                        return; // Another comment is being edited. Return.
                }
                var containerWidth = this.sectionProperties.container.getBoundingClientRect().width;
                var ratio = (app.tile.size.pixels[0] / app.tile.size.twips[0]);
                this.size = [Math.round((this.sectionProperties.data.cellPos[2]) * ratio + containerWidth), Math.round((this.sectionProperties.data.cellPos[3]) * ratio)];
                this.sectionProperties.commentListSection.selectById(this.sectionProperties.data.id);
                this.show();
            }
        }
    };
    Comment.prototype.onMouseLeave = function (point) {
        if (this.calcContinueWithMouseEvent()) {
            if (parseInt(this.sectionProperties.data.tab) === this.sectionProperties.docLayer._selectedPart) {
                // Revert the changes we did on "onMouseEnter" event.
                var ratio = (app.tile.size.pixels[0] / app.tile.size.twips[0]);
                this.size = [Math.round((this.sectionProperties.data.cellPos[2]) * ratio), Math.round((this.sectionProperties.data.cellPos[3]) * ratio)];
                if (point) {
                    this.hide();
                }
            }
        }
    };
    Comment.prototype.onNewDocumentTopLeft = function () {
        this.doPendingInitializationInView();
        this.updatePosition();
    };
    Comment.prototype.onCommentDataUpdate = function () {
        this.doPendingInitializationInView();
        this.updatePosition();
    };
    Comment.prototype.onRemove = function () {
        this.sectionProperties.isRemoved = true;
        if (this.sectionProperties.commentListSection.sectionProperties.selectedComment === this)
            this.sectionProperties.commentListSection.sectionProperties.selectedComment = null;
        this.sectionProperties.commentListSection.hideArrow();
        var container = this.sectionProperties.container;
        if (container && container.parentElement) {
            this.hideMarker();
            var c = 0;
            while (c < 10) {
                try {
                    container.parentElement.removeChild(container);
                    break;
                }
                catch (e) {
                    c++;
                }
            }
        }
    };
    Comment.prototype.onMouseWheel = function () { return; };
    Comment.prototype.onDoubleClick = function () { return; };
    Comment.prototype.onContextMenu = function () { return; };
    Comment.prototype.onLongPress = function () { return; };
    Comment.prototype.onMultiTouchStart = function () { return; };
    Comment.prototype.onMultiTouchMove = function () { return; };
    Comment.prototype.onMultiTouchEnd = function () { return; };
    Comment.prototype.setCollapsed = function () {
        this.isCollapsed = true;
        var isRootComment = this.sectionProperties.docLayer._docType !== 'text' || this.sectionProperties.data.parent === '0';
        if (isRootComment || this.sectionProperties.data.trackchange)
            this.sectionProperties.collapsed.style.display = '';
        else
            this.sectionProperties.collapsed.style.display = 'none';
        this.sectionProperties.wrapper.style.display = 'none';
    };
    Comment.prototype.setExpanded = function () {
        this.isCollapsed = false;
        this.sectionProperties.collapsed.style.display = 'none';
        this.sectionProperties.wrapper.style.display = '';
    };
    return Comment;
}());
