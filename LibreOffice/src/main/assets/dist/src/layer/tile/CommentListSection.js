/* See CanvasSectionContainer.ts for explanations. */
L.Map.include({
    insertComment: function () {
        var avatar = undefined;
        var author = this.getViewName(this._docLayer._viewId);
        if (author in this._viewInfoByUserName) {
            avatar = this._viewInfoByUserName[author].userextrainfo.avatar;
        }
        this._docLayer.newAnnotation({
            text: '',
            textrange: '',
            author: author,
            dateTime: new Date().toDateString(),
            id: 'new',
            avatar: avatar
        });
    },
    showResolvedComments: function (on) {
        var unoCommand = '.uno:ShowResolvedAnnotations';
        this.sendUnoCommand(unoCommand);
        app.sectionContainer.getSectionWithName(L.CSections.CommentList.name).setViewResolved(on);
        this.uiManager.setSavedState('ShowResolved', on ? true : false);
    }
});
app.definitions.CommentSection = /** @class */ (function () {
    function CommentSection() {
        this.context = null;
        this.myTopLeft = null;
        this.documentTopLeft = null;
        this.containerObject = null;
        this.dpiScale = null;
        this.name = L.CSections.CommentList.name;
        this.backgroundColor = app.sectionContainer.clearColor;
        this.borderColor = null;
        this.boundToSection = null;
        this.anchor = new Array(0);
        this.documentObject = false;
        this.position = [0, 0];
        this.isCollapsed = false;
        this.size = [0, 0];
        this.expand = ['bottom'];
        this.isLocated = false;
        this.showSection = true;
        this.processingOrder = L.CSections.CommentList.processingOrder;
        this.drawingOrder = L.CSections.CommentList.drawingOrder;
        this.zIndex = L.CSections.CommentList.zIndex;
        this.interactable = false;
        this.sectionProperties = {};
        this.map = L.Map.THIS;
        this.anchor = ['top', 'right'];
        this.sectionProperties.docLayer = this.map._docLayer;
        this.sectionProperties.commentList = new Array(0);
        this.sectionProperties.selectedComment = null;
        this.sectionProperties.arrow = null;
        this.sectionProperties.initialLayoutData = null;
        this.sectionProperties.showResolved = null;
        this.sectionProperties.marginY = 10 * app.dpiScale;
        this.sectionProperties.offset = 5 * app.dpiScale;
        this.sectionProperties.layoutTimer = null;
        this.sectionProperties.width = Math.round(1 * app.dpiScale); // Configurable variable.
        this.sectionProperties.scrollAnnotation = null; // For impress, when 1 or more comments exist.
        this.idIndexMap = new Map();
    }
    CommentSection.prototype.onInitialize = function () {
        this.setExpanded();
        this.map.on('RedlineAccept', this.onRedlineAccept, this);
        this.map.on('RedlineReject', this.onRedlineReject, this);
        this.map.on('updateparts', this.showHideComments, this);
        this.map.on('AnnotationScrollUp', this.onAnnotationScrollUp, this);
        this.map.on('AnnotationScrollDown', this.onAnnotationScrollDown, this);
        this.map.on('commandstatechanged', function (event) {
            if (event.commandName === '.uno:ShowResolvedAnnotations')
                this.setViewResolved(event.state === 'true');
        }, this);
        this.map.on('zoomend', function () {
            this.map.fire('mobilewizardpopupclose');
            this.checkCollapseState();
            this.layout(true);
        }, this);
        this.backgroundColor = this.containerObject.getClearColor();
        this.initializeContextMenus();
        if (window.mode.isMobile()) {
            this.showSection = false;
            this.size[0] = 0;
        }
        // For setting some css styles.
        if (app.file.fileBasedView && window.mode.isMobile()) {
            this.map.uiManager.mobileWizard._hideSlideSorter();
        }
    };
    CommentSection.prototype.checkCollapseState = function () {
        if (this.shouldCollapse())
            this.setCollapsed();
        else
            this.setExpanded();
    };
    CommentSection.prototype.findNextPartWithComment = function (currentPart) {
        for (var i = 0; i < this.sectionProperties.commentList.length; i++) {
            if (this.sectionProperties.commentList[i].sectionProperties.partIndex > currentPart) {
                return this.sectionProperties.commentList[i].sectionProperties.partIndex;
            }
        }
        return -1;
    };
    CommentSection.prototype.findPreviousPartWithComment = function (currentPart) {
        for (var i = this.sectionProperties.commentList.length - 1; i > -1; i--) {
            if (this.sectionProperties.commentList[i].sectionProperties.partIndex < currentPart) {
                return this.sectionProperties.commentList[i].sectionProperties.partIndex;
            }
        }
        return -1;
    };
    CommentSection.prototype.onAnnotationScrollDown = function () {
        var index = this.findNextPartWithComment(this.sectionProperties.docLayer._selectedPart);
        if (index >= 0) {
            this.map.setPart(index);
        }
    };
    CommentSection.prototype.onAnnotationScrollUp = function () {
        var index = this.findPreviousPartWithComment(this.sectionProperties.docLayer._selectedPart);
        if (index >= 0) {
            this.map.setPart(index);
        }
    };
    CommentSection.prototype.hideCommentListPanel = function () {
        if (this.size[0] !== 0) {
            this.size[0] = 0;
            this.containerObject.reNewAllSections(true);
            this.sectionProperties.docLayer._syncTileContainerSize();
            app.sectionContainer.requestReDraw();
        }
    };
    CommentSection.prototype.showCommentListPanel = function () {
        if (this.size[0] !== this.sectionProperties.width) {
            this.size[0] = this.sectionProperties.width;
            this.containerObject.reNewAllSections(true);
            this.sectionProperties.docLayer._syncTileContainerSize();
            app.sectionContainer.requestReDraw();
        }
    };
    CommentSection.prototype.checkSize = function () {
        // When there is no comment || file is a spreadsheet || view type is mobile, we set this section's size to [0, 0].
        if (this.sectionProperties.docLayer._docType === 'spreadsheet' || window.mode.isMobile() || this.sectionProperties.commentList.length === 0) {
            if (this.sectionProperties.docLayer._docType === 'presentation' && this.sectionProperties.scrollAnnotation) {
                this.map.removeControl(this.sectionProperties.scrollAnnotation);
                this.sectionProperties.scrollAnnotation = null;
            }
            this.hideCommentListPanel();
        }
        else if (this.sectionProperties.docLayer._docType === 'presentation') { // If there are comments but none of them are on the selected part.
            if (!this.sectionProperties.scrollAnnotation) {
                this.sectionProperties.scrollAnnotation = L.control.scrollannotation();
                this.sectionProperties.scrollAnnotation.addTo(this.map);
            }
            var hide = true;
            for (var i = 0; i < this.sectionProperties.commentList.length; i++) {
                var comment = this.sectionProperties.commentList[i];
                if (comment.sectionProperties.partIndex === this.sectionProperties.docLayer._selectedPart) {
                    hide = false;
                    break;
                }
            }
            if (hide) {
                this.hideCommentListPanel();
            }
            else {
                this.showCommentListPanel();
            }
        }
        else {
            this.showCommentListPanel();
        }
    };
    CommentSection.prototype.setCollapsed = function () {
        if (this.sectionProperties.docLayer._docType === 'spreadsheet')
            return;
        this.isCollapsed = true;
        this.removeHighlighters();
        this.unselect();
        for (var i = 0; i < this.sectionProperties.commentList.length; i++) {
            if (this.sectionProperties.commentList[i].sectionProperties.data.id !== 'new')
                this.sectionProperties.commentList[i].setCollapsed();
        }
        if (window.mode.isMobile()
            || this.sectionProperties.docLayer._docType === 'spreadsheet'
            || this.sectionProperties.commentList.length === 0)
            return;
    };
    CommentSection.prototype.setExpanded = function () {
        this.isCollapsed = false;
        this.removeHighlighters();
        for (var i = 0; i < this.sectionProperties.commentList.length; i++) {
            this.sectionProperties.commentList[i].setExpanded();
        }
        if (window.mode.isMobile()
            || this.sectionProperties.docLayer._docType === 'spreadsheet'
            || this.sectionProperties.commentList.length === 0)
            return;
    };
    CommentSection.prototype.shouldCollapse = function () {
        if (!this.containerObject.getDocumentAnchorSection())
            return false;
        var commentWidth = 300;
        var availableSpace = this.containerObject.getDocumentAnchorSection().size[0] - app.file.size.pixels[0];
        return availableSpace < commentWidth * 2;
    };
    CommentSection.prototype.hideAllComments = function () {
        for (var i = 0; i < this.sectionProperties.commentList.length; i++) {
            this.sectionProperties.commentList[i].hide();
            var part = this.sectionProperties.docLayer._selectedPart;
            if (this.sectionProperties.docLayer._docType === 'spreadsheet') {
                // Change drawing order so they don't prevent each other from being shown.
                if (parseInt(this.sectionProperties.commentList[i].sectionProperties.data.tab) === part) {
                    this.sectionProperties.commentList[i].drawingOrder = 2;
                }
                else {
                    this.sectionProperties.commentList[i].drawingOrder = 1;
                }
            }
        }
        this.containerObject.applyDrawingOrders();
    };
    CommentSection.prototype.createCommentStructureWriter = function (menuStructure, threadOnly) {
        var rootComment, lastChild, comment;
        var commentList = this.sectionProperties.commentList;
        var showResolved = this.sectionProperties.showResolved;
        if (threadOnly) {
            if (!threadOnly.sectionProperties.data.trackchange && threadOnly.sectionProperties.data.parent !== '0')
                threadOnly = commentList[this.getIndexOf(threadOnly.sectionProperties.data.parent)];
        }
        for (var i = 0; i < commentList.length; i++) {
            if (commentList[i].sectionProperties.data.parent === '0' || commentList[i].sectionProperties.data.trackchange) {
                lastChild = this.getLastChildIndexOf(commentList[i].sectionProperties.data.id);
                var commentThread = [];
                while (true) {
                    comment = {
                        id: 'comment' + commentList[lastChild].sectionProperties.data.id,
                        enable: true,
                        data: commentList[lastChild].sectionProperties.data,
                        type: 'comment',
                        text: commentList[lastChild].sectionProperties.data.text,
                        annotation: commentList[lastChild],
                        children: []
                    };
                    if (showResolved || comment.data.resolved !== 'true') {
                        commentThread.unshift(comment);
                    }
                    if (commentList[lastChild].sectionProperties.data.parent === '0' || commentList[lastChild].sectionProperties.data.trackchange)
                        break;
                    lastChild = this.getIndexOf(commentList[lastChild].sectionProperties.data.parent);
                }
                if (commentThread.length > 0) {
                    rootComment = {
                        id: commentThread[0].id,
                        enable: true,
                        data: commentThread[0].data,
                        type: 'rootcomment',
                        text: commentThread[0].data.text,
                        annotation: commentThread[0].annotation,
                        children: commentThread
                    };
                    var matchingThread = threadOnly && threadOnly.sectionProperties.data.id === commentThread[0].data.id;
                    if (matchingThread)
                        menuStructure['children'] = commentThread;
                    else if (!threadOnly)
                        menuStructure['children'].push(rootComment);
                }
            }
        }
    };
    CommentSection.prototype.createCommentStructureImpress = function (menuStructure, threadOnly) {
        var rootComment;
        for (var i in this.sectionProperties.commentList) {
            var matchingThread = !threadOnly || (threadOnly && threadOnly.sectionProperties.data.id === this.sectionProperties.commentList[i].sectionProperties.data.id);
            if (matchingThread && (this.sectionProperties.commentList[i].sectionProperties.partIndex === this.sectionProperties.docLayer._selectedPart || app.file.fileBasedView)) {
                rootComment = {
                    id: 'comment' + this.sectionProperties.commentList[i].sectionProperties.data.id,
                    enable: true,
                    data: this.sectionProperties.commentList[i].sectionProperties.data,
                    type: threadOnly ? 'comment' : 'rootcomment',
                    text: this.sectionProperties.commentList[i].sectionProperties.data.text,
                    annotation: this.sectionProperties.commentList[i],
                    children: []
                };
                menuStructure['children'].push(rootComment);
            }
        }
    };
    CommentSection.prototype.createCommentStructureCalc = function (menuStructure, threadOnly) {
        var rootComment;
        var commentList = this.sectionProperties.commentList;
        var selectedTab = this.sectionProperties.docLayer._selectedPart;
        for (var i = 0; i < commentList.length; i++) {
            var matchingThread = !threadOnly || (threadOnly && threadOnly.sectionProperties.data.id === commentList[i].sectionProperties.data.id);
            if (parseInt(commentList[i].sectionProperties.data.tab) === selectedTab && matchingThread) {
                rootComment = {
                    id: 'comment' + commentList[i].sectionProperties.data.id,
                    enable: true,
                    data: commentList[i].sectionProperties.data,
                    type: threadOnly ? 'comment' : 'rootcomment',
                    text: commentList[i].sectionProperties.data.text,
                    annotation: commentList[i],
                    children: []
                };
                menuStructure['children'].push(rootComment);
            }
        }
    };
    // threadOnly - takes annotation indicating which thread will be generated
    CommentSection.prototype.createCommentStructure = function (menuStructure, threadOnly) {
        if (this.sectionProperties.docLayer._docType === 'text') {
            this.createCommentStructureWriter(menuStructure, threadOnly);
        }
        else if (this.sectionProperties.docLayer._docType === 'presentation' || this.sectionProperties.docLayer._docType === 'drawing') {
            this.createCommentStructureImpress(menuStructure, threadOnly);
        }
        else if (this.sectionProperties.docLayer._docType === 'spreadsheet') {
            this.createCommentStructureCalc(menuStructure, threadOnly);
        }
    };
    CommentSection.prototype.newAnnotationVex = function (comment, addCommentFn, isMod) {
        var commentData = comment.sectionProperties.data;
        var dialog = vex.dialog.open({
            contentClassName: 'vex-has-inputs',
            message: '',
            input: [
                '<textarea name="comment" id="new-mobile-comment-input-area" class="cool-annotation-textarea" required>' + (commentData.text && isMod ? commentData.text : '') + '</textarea>'
            ].join(''),
            buttons: [
                $.extend({}, vex.dialog.buttons.YES, { text: _('Save') }),
                $.extend({}, vex.dialog.buttons.NO, { text: _('Cancel') })
            ],
            callback: function (data) {
                if (data) {
                    var annotation = comment;
                    annotation.sectionProperties.data.text = data.comment;
                    comment.text = data.comment;
                    addCommentFn.call(annotation, annotation, comment);
                    if (!isMod)
                        this.containerObject.removeSection(annotation);
                }
                else {
                    this.cancel(comment);
                }
            }.bind(this)
        });
        var tagTd = 'td', empty = '', tagDiv = 'div';
        var author = L.DomUtil.create('table', 'cool-annotation-table');
        var tbody = L.DomUtil.create('tbody', empty, author);
        var tr = L.DomUtil.create('tr', empty, tbody);
        var tdImg = L.DomUtil.create(tagTd, 'cool-annotation-img', tr);
        var tdAuthor = L.DomUtil.create(tagTd, 'cool-annotation-author', tr);
        var imgAuthor = L.DomUtil.create('img', 'avatar-img', tdImg);
        imgAuthor.setAttribute('src', L.LOUtil.getImageURL('user.svg'));
        imgAuthor.setAttribute('width', 32);
        imgAuthor.setAttribute('height', 32);
        var authorAvatarImg = imgAuthor;
        var contentAuthor = L.DomUtil.create(tagDiv, 'cool-annotation-content-author', tdAuthor);
        var contentDate = L.DomUtil.create(tagDiv, 'cool-annotation-date', tdAuthor);
        $(contentAuthor).text(commentData.author);
        $(authorAvatarImg).attr('src', commentData.avatar);
        var user = this.map.getViewId(commentData.author);
        if (user >= 0) {
            var color = L.LOUtil.rgbToHex(this.map.getViewColor(user));
            $(authorAvatarImg).css('border-color', color);
        }
        if (commentData.dateTime) {
            var d = new Date(commentData.dateTime.replace(/,.*/, 'Z'));
            var dateOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
            $(contentDate).text(isNaN(d.getTime()) ? comment.dateTime : d.toLocaleDateString(String.locale, dateOptions));
        }
        dialog.contentEl.insertBefore(author, dialog.contentEl.childNodes[0]);
        $(dialog.contentEl).find('textarea').focus();
    };
    CommentSection.prototype.hightlightComment = function (comment) {
        this.removeHighlighters();
        var commentList = this.sectionProperties.commentList;
        var lastChild = this.getLastChildIndexOf(comment.sectionProperties.data.id);
        while (true && lastChild >= 0) {
            commentList[lastChild].highlight();
            if (commentList[lastChild].sectionProperties.data.parent === '0')
                break;
            lastChild = this.getIndexOf(commentList[lastChild].sectionProperties.data.parent);
        }
    };
    CommentSection.prototype.removeHighlighters = function () {
        var commentList = this.sectionProperties.commentList;
        for (var i = 0; i < commentList.length; i++) {
            if (commentList[i].sectionProperties.isHighlighted) {
                commentList[i].removeHighlight();
            }
        }
    };
    CommentSection.prototype.removeItem = function (id) {
        var annotation;
        for (var i = 0; i < this.sectionProperties.commentList.length; i++) {
            annotation = this.sectionProperties.commentList[i];
            if (annotation.sectionProperties.data.id === id) {
                this.containerObject.removeSection(annotation.name);
                this.sectionProperties.commentList.splice(i, 1);
                this.updateIdIndexMap();
                break;
            }
        }
        this.checkSize();
    };
    CommentSection.prototype.click = function (annotation) {
        this.select(annotation);
    };
    CommentSection.prototype.save = function (annotation) {
        var comment;
        if (annotation.sectionProperties.data.id === 'new') {
            comment = {
                Text: {
                    type: 'string',
                    value: annotation.sectionProperties.data.text
                },
                Author: {
                    type: 'string',
                    value: annotation.sectionProperties.data.author
                }
            };
            if (app.file.fileBasedView) {
                this.map.setPart(this.sectionProperties.docLayer._selectedPart, false);
                this.map.sendUnoCommand('.uno:InsertAnnotation', comment);
                this.map.setPart(0, false);
            }
            else {
                this.map.sendUnoCommand('.uno:InsertAnnotation', comment);
            }
            this.removeItem(annotation.sectionProperties.data.id);
        }
        else if (annotation.sectionProperties.data.trackchange) {
            comment = {
                ChangeTrackingId: {
                    type: 'long',
                    value: annotation.sectionProperties.data.index
                },
                Text: {
                    type: 'string',
                    value: annotation.sectionProperties.data.text
                }
            };
            this.map.sendUnoCommand('.uno:CommentChangeTracking', comment);
        }
        else {
            comment = {
                Id: {
                    type: 'string',
                    value: annotation.sectionProperties.data.id
                },
                Text: {
                    type: 'string',
                    value: annotation.sectionProperties.data.text
                }
            };
            this.map.sendUnoCommand('.uno:EditAnnotation', comment);
        }
        this.unselect();
        this.map.focus();
    };
    CommentSection.prototype.reply = function (annotation) {
        if (window.mode.isMobile() || window.mode.isTablet()) {
            var avatar = undefined;
            var author = this.map.getViewName(this.sectionProperties.docLayer._viewId);
            if (author in this.map._viewInfoByUserName) {
                avatar = this.map._viewInfoByUserName[author].userextrainfo.avatar;
            }
            if (this.sectionProperties.docLayer._docType === 'presentation' || this.sectionProperties.docLayer._docType === 'drawing') {
                this.newAnnotationVex(annotation, annotation.onReplyClick, /* isMod */ false);
            }
            else {
                var replyAnnotation = {
                    text: '',
                    textrange: '',
                    author: author,
                    dateTime: new Date().toDateString(),
                    id: annotation.sectionProperties.data.id,
                    avatar: avatar,
                    parent: annotation.sectionProperties.data.parent,
                    anchorPos: [annotation.sectionProperties.data.anchorPos[0], annotation.sectionProperties.data.anchorPos[1]],
                };
                var replyAnnotationSection = new app.definitions.Comment(replyAnnotation, replyAnnotation.id === 'new' ? { noMenu: true } : {}, this);
                replyAnnotationSection.name += '-reply';
                this.newAnnotationVex(replyAnnotationSection, annotation.onReplyClick, /* isMod */ false);
            }
        }
        else {
            this.unselect();
            annotation.reply();
            this.select(annotation);
            annotation.focus();
            if (this.isCollapsed)
                this.map.fire('mobilewizardpopupresize');
        }
    };
    CommentSection.prototype.modify = function (annotation) {
        var newAnnotationInCollapsedMode = this.isCollapsed && annotation.isCollapsed;
        if (window.mode.isMobile() || window.mode.isTablet() || newAnnotationInCollapsedMode) {
            this.newAnnotationVex(annotation, function (annotation) {
                this.save(annotation);
            }.bind(this), /* isMod */ true);
        }
        else {
            this.unselect();
            annotation.edit();
            this.select(annotation);
            annotation.focus();
            if (this.isCollapsed)
                this.map.fire('mobilewizardpopupresize');
        }
    };
    CommentSection.prototype.select = function (annotation) {
        if (annotation && annotation !== this.sectionProperties.selectedComment) {
            // Select the root comment
            var idx = this.getRootIndexOf(annotation.sectionProperties.data.id);
            if (this.sectionProperties.selectedComment && $(this.sectionProperties.selectedComment.sectionProperties.container).hasClass('annotation-active'))
                $(this.sectionProperties.selectedComment.sectionProperties.container).removeClass('annotation-active');
            this.sectionProperties.selectedComment = this.sectionProperties.commentList[idx];
            if (this.sectionProperties.selectedComment && !$(this.sectionProperties.selectedComment.sectionProperties.container).hasClass('annotation-active')) {
                $(this.sectionProperties.selectedComment.sectionProperties.container).addClass('annotation-active');
                if (this.sectionProperties.docLayer._docType === 'text') {
                    // check it is visible in the screen and not a new comment
                    var id = this.sectionProperties.selectedComment.sectionProperties.data.id;
                    var position = this.sectionProperties.selectedComment.getPosition();
                    if (id.indexOf('new') < 0 && !this.isInViewPort(this.sectionProperties.selectedComment) && position[1] !== 0) {
                        this.map.scrollTop(position[1] < 0 ? 0 : position[1]);
                    }
                }
            }
            this.update();
            if (!window.mode.isMobile() && annotation.isCollapsed && this.sectionProperties.docLayer._docType !== 'spreadsheet')
                this.openMobileWizardPopup(annotation);
        }
    };
    CommentSection.prototype.isInViewPort = function (annotation) {
        var rect = annotation.sectionProperties.container.getBoundingClientRect();
        var scrollSection = app.sectionContainer.getSectionWithName(L.CSections.Scroll.name);
        var screenTop = scrollSection.containerObject.getDocumentTopLeft()[1];
        var screenBottom = screenTop + (window.innerHeight || document.documentElement.clientHeight);
        var position = annotation.getPosition();
        var annotationTop = position[1];
        var annotationBottom = position[1] + rect.bottom - rect.top;
        return (screenTop <= annotationTop &&
            screenBottom >= annotationBottom);
    };
    CommentSection.prototype.unselect = function () {
        if (this.sectionProperties.selectedComment) {
            if (this.sectionProperties.selectedComment && $(this.sectionProperties.selectedComment.sectionProperties.container).hasClass('annotation-active'))
                $(this.sectionProperties.selectedComment.sectionProperties.container).removeClass('annotation-active');
            if (this.sectionProperties.docLayer._docType === 'spreadsheet')
                this.sectionProperties.selectedComment.hide();
            this.sectionProperties.selectedComment = null;
            this.update();
        }
    };
    CommentSection.prototype.saveReply = function (annotation) {
        var comment = {
            Id: {
                type: 'string',
                value: annotation.sectionProperties.data.id
            },
            Text: {
                type: 'string',
                value: annotation.sectionProperties.data.reply
            }
        };
        if (this.sectionProperties.docLayer._docType === 'text' || this.sectionProperties.docLayer._docType === 'spreadsheet')
            this.map.sendUnoCommand('.uno:ReplyComment', comment);
        else if (this.sectionProperties.docLayer._docType === 'presentation')
            this.map.sendUnoCommand('.uno:ReplyToAnnotation', comment);
        this.unselect();
        this.map.focus();
    };
    CommentSection.prototype.cancel = function (annotation) {
        if (annotation.sectionProperties.data.id === 'new') {
            this.removeItem(annotation.sectionProperties.data.id);
        }
        if (this.sectionProperties.selectedComment === annotation) {
            this.unselect();
        }
        else {
            this.update();
        }
        this.map.focus();
    };
    CommentSection.prototype.onRedlineAccept = function (e) {
        var command = {
            AcceptTrackedChange: {
                type: 'unsigned short',
                value: e.id.substring('change-'.length)
            }
        };
        this.map.sendUnoCommand('.uno:AcceptTrackedChange', command);
        this.unselect();
        this.map.focus();
    };
    CommentSection.prototype.onRedlineReject = function (e) {
        var command = {
            RejectTrackedChange: {
                type: 'unsigned short',
                value: e.id.substring('change-'.length)
            }
        };
        this.map.sendUnoCommand('.uno:RejectTrackedChange', command);
        this.unselect();
        this.map.focus();
    };
    CommentSection.prototype.remove = function (id) {
        var comment = {
            Id: {
                type: 'string',
                value: id
            }
        };
        if (app.file.fileBasedView) // We have to set the part from which the comment will be removed as selected part before the process.
            this.map.setPart(this.sectionProperties.docLayer._selectedPart, false);
        if (this.sectionProperties.docLayer._docType === 'text')
            this.map.sendUnoCommand('.uno:DeleteComment', comment);
        else if (this.sectionProperties.docLayer._docType === 'presentation' || this.sectionProperties.docLayer._docType === 'drawing')
            this.map.sendUnoCommand('.uno:DeleteAnnotation', comment);
        else if (this.sectionProperties.docLayer._docType === 'spreadsheet')
            this.map.sendUnoCommand('.uno:DeleteNote', comment);
        if (app.file.fileBasedView)
            this.map.setPart(0, false);
        this.unselect();
        this.map.focus();
    };
    CommentSection.prototype.removeThread = function (id) {
        var comment = {
            Id: {
                type: 'string',
                value: id
            }
        };
        this.map.sendUnoCommand('.uno:DeleteCommentThread', comment);
        this.unselect();
        this.map.focus();
    };
    CommentSection.prototype.resolve = function (annotation) {
        var comment = {
            Id: {
                type: 'string',
                value: annotation.sectionProperties.data.id
            }
        };
        this.map.sendUnoCommand('.uno:ResolveComment', comment);
    };
    CommentSection.prototype.resolveThread = function (annotation) {
        var comment = {
            Id: {
                type: 'string',
                value: annotation.sectionProperties.data.id
            }
        };
        this.map.sendUnoCommand('.uno:ResolveCommentThread', comment);
    };
    CommentSection.prototype.getIndexOf = function (id) {
        var index = this.idIndexMap.get(id);
        return (index === undefined) ? -1 : index;
    };
    CommentSection.prototype.isThreadResolved = function (annotation) {
        var lastChild = this.getLastChildIndexOf(annotation.sectionProperties.data.id);
        while (this.sectionProperties.commentList[lastChild].sectionProperties.data.parent !== '0') {
            if (this.sectionProperties.commentList[lastChild].sectionProperties.data.resolved === 'false')
                return false;
            lastChild = this.getIndexOf(this.sectionProperties.commentList[lastChild].sectionProperties.data.parent);
        }
        if (this.sectionProperties.commentList[lastChild].sectionProperties.data.resolved === 'false')
            return false;
        return true;
    };
    CommentSection.prototype.initializeContextMenus = function () {
        var docLayer = this.sectionProperties.docLayer;
        L.installContextMenu({
            selector: '.cool-annotation-menu',
            trigger: 'none',
            className: 'cool-font',
            build: function ($trigger) {
                return {
                    items: {
                        modify: {
                            name: _('Modify'),
                            callback: function (key, options) {
                                this.modify.call(this, options.$trigger[0].annotation);
                            }.bind(this)
                        },
                        reply: (docLayer._docType !== 'text' && docLayer._docType !== 'presentation') ? undefined : {
                            name: _('Reply'),
                            callback: function (key, options) {
                                this.reply.call(this, options.$trigger[0].annotation);
                            }.bind(this)
                        },
                        remove: {
                            name: _('Remove'),
                            callback: function (key, options) {
                                this.remove.call(this, options.$trigger[0].annotation.sectionProperties.data.id);
                            }.bind(this)
                        },
                        removeThread: docLayer._docType !== 'text' || $trigger[0].isRoot === true ? undefined : {
                            name: _('Remove Thread'),
                            callback: function (key, options) {
                                this.removeThread.call(this, options.$trigger[0].annotation.sectionProperties.data.id);
                            }.bind(this)
                        },
                        resolve: docLayer._docType !== 'text' ? undefined : {
                            name: $trigger[0].annotation.sectionProperties.data.resolved === 'false' ? _('Resolve') : _('Unresolve'),
                            callback: function (key, options) {
                                this.resolve.call(this, options.$trigger[0].annotation);
                            }.bind(this)
                        },
                        resolveThread: docLayer._docType !== 'text' || $trigger[0].isRoot === true ? undefined : {
                            name: this.isThreadResolved($trigger[0].annotation) ? _('Unresolve Thread') : _('Resolve Thread'),
                            callback: function (key, options) {
                                this.resolveThread.call(this, options.$trigger[0].annotation);
                            }.bind(this)
                        }
                    },
                };
            }.bind(this),
            events: {
                show: function (options) {
                    options.$trigger[0].annotation.sectionProperties.contextMenu = true;
                },
                hide: function (options) {
                    options.$trigger[0].annotation.sectionProperties.contextMenu = false;
                }
            }
        });
        L.installContextMenu({
            selector: '.cool-annotation-menu-redline',
            trigger: 'none',
            className: 'cool-font',
            items: {
                modify: {
                    name: _('Comment'),
                    callback: function (key, options) {
                        this.modify.call(this, options.$trigger[0].annotation);
                    }.bind(this)
                }
            },
            events: {
                show: function (options) {
                    options.$trigger[0].annotation.sectionProperties.contextMenu = true;
                },
                hide: function (options) {
                    options.$trigger[0].annotation.sectionProperties.contextMenu = false;
                }
            }
        });
    };
    CommentSection.prototype.onResize = function () {
        this.checkCollapseState();
        this.update();
        // When window is resized, it may mean that comment wizard is closed. So we hide the highlights.
        this.removeHighlighters();
        this.containerObject.requestReDraw();
    };
    CommentSection.prototype.onDraw = function () {
        return;
    };
    CommentSection.prototype.onMouseMove = function (point, dragDistance, e) {
        return;
    };
    CommentSection.prototype.onNewDocumentTopLeft = function () {
        if (this.sectionProperties.docLayer._docType === 'spreadsheet') {
            if (this.sectionProperties.selectedComment)
                this.sectionProperties.selectedComment.hide();
        }
        this.update();
    };
    CommentSection.prototype.showHideComments = function () {
        for (var i = 0; i < this.sectionProperties.commentList.length; i++) {
            this.showHideComment(this.sectionProperties.commentList[i]);
        }
    };
    CommentSection.prototype.showHideComment = function (annotation) {
        // This manually shows/hides comments
        if (!this.sectionProperties.showResolved && this.sectionProperties.docLayer._docType === 'text') {
            if (annotation.isContainerVisible() && annotation.sectionProperties.data.resolved === 'true') {
                if (this.sectionProperties.selectedComment == annotation) {
                    this.unselect();
                }
                annotation.hide();
                annotation.update();
            }
            else if (!annotation.isContainerVisible() && annotation.sectionProperties.data.resolved === 'false') {
                annotation.show();
                annotation.update();
            }
            this.update();
        }
        else if (this.sectionProperties.docLayer._docType === 'presentation' || this.sectionProperties.docLayer._docType === 'drawing') {
            if (annotation.sectionProperties.partIndex === this.sectionProperties.docLayer._selectedPart || app.file.fileBasedView) {
                if (!annotation.isContainerVisible()) {
                    annotation.show();
                    annotation.update();
                    this.update();
                }
            }
            else {
                annotation.hide();
                annotation.update();
                this.update();
            }
        }
    };
    CommentSection.prototype.add = function (comment, mobileReply) {
        if (mobileReply === void 0) { mobileReply = false; }
        var annotation = new app.definitions.Comment(comment, comment.id === 'new' ? { noMenu: true } : {}, this);
        if (mobileReply)
            annotation.name += '-reply'; // Section name.
        if (comment.parent && comment.parent > '0') {
            var parentIdx = this.getIndexOf(comment.parent);
            if (!this.containerObject.addSection(annotation))
                return;
            this.sectionProperties.commentList.splice(parentIdx + 1, 0, annotation);
            this.updateIdIndexMap();
            this.updateResolvedState(annotation);
            this.showHideComment(annotation);
        }
        else {
            if (!this.containerObject.addSection(annotation))
                return;
            this.sectionProperties.commentList.push(annotation);
        }
        this.orderCommentList();
        this.checkSize();
        if (this.isCollapsed)
            annotation.setCollapsed();
        // check if we are the author
        // then select it so it does not get lost in a long list of comments and replies.
        var authorName = this.map.getViewName(this.sectionProperties.docLayer._viewId);
        var newComment = annotation.sectionProperties.data.id === 'new';
        if (!newComment && (authorName === annotation.sectionProperties.data.author)) {
            this.unselect();
            this.select(annotation);
        }
        return annotation;
    };
    CommentSection.prototype.adjustRedLine = function (redline) {
        // All sane values ?
        if (!redline.textRange) {
            console.warn('Redline received has invalid textRange');
            return false;
        }
        // transform change tracking index into an id
        redline.id = 'change-' + redline.index;
        redline.anchorPos = this.stringToRectangles(redline.textRange)[0];
        redline.anchorPix = this.numberArrayToCorePixFromTwips(redline.anchorPos, 0, 2);
        redline.trackchange = true;
        redline.text = redline.comment;
        var rectangles = L.PolyUtil.rectanglesToPolygons(L.LOUtil.stringToRectangles(redline.textRange), this.sectionProperties.docLayer);
        if (rectangles.length > 0) {
            redline.textSelected = L.polygon(rectangles, {
                pointerEvents: 'all',
                interactive: false,
                fillOpacity: 0,
                opacity: 0
            });
            redline.textSelected.addEventParent(this.map);
            redline.textSelected.on('click', function () {
                this.selectById(redline.id);
            }, this);
        }
        return true;
    };
    CommentSection.prototype.getComment = function (id) {
        var index = this.getIndexOf(id);
        return index == -1 ? null : this.sectionProperties.commentList[index];
    };
    // Adjust parent-child relationship, if required, after `comment` is added
    CommentSection.prototype.adjustParentAdd = function (comment) {
        if (comment.parent && comment.parent > '0') {
            var parentIdx = this.getIndexOf(comment.parent);
            if (parentIdx === -1) {
                console.warn('adjustParentAdd: No parent comment to attach received comment to. ' +
                    'Parent comment ID sought is :' + comment.parent + ' for current comment with ID : ' + comment.id);
                return;
            }
            if (this.sectionProperties.commentList[parentIdx + 1] && this.sectionProperties.commentList[parentIdx + 1].sectionProperties.data.parent === this.sectionProperties.commentList[parentIdx].sectionProperties.data.id) {
                this.sectionProperties.commentList[parentIdx + 1].sectionProperties.data.parent = comment.id;
            }
        }
    };
    // Adjust parent-child relationship, if required, after `comment` is removed
    CommentSection.prototype.adjustParentRemove = function (comment) {
        var newId = '0';
        var parentIdx = this.getIndexOf(comment.sectionProperties.data.parent);
        if (parentIdx >= 0) {
            newId = this.sectionProperties.commentList[parentIdx].sectionProperties.data.id;
        }
        var currentIdx = this.getIndexOf(comment.sectionProperties.data.id);
        if (this.sectionProperties.commentList[currentIdx + 1] && this.sectionProperties.commentList[currentIdx].parentOf(this.sectionProperties.commentList[currentIdx + 1])) {
            this.sectionProperties.commentList[currentIdx + 1].sectionProperties.data.parent = newId;
        }
    };
    CommentSection.prototype.onACKComment = function (obj) {
        var id;
        var changetrack = obj.redline ? true : false;
        var dataroot = changetrack ? 'redline' : 'comment';
        if (changetrack) {
            obj.redline.id = 'change-' + obj.redline.index;
        }
        var action = changetrack ? obj.redline.action : obj.comment.action;
        if (changetrack && obj.redline.author in this.map._viewInfoByUserName) {
            obj.redline.avatar = this.map._viewInfoByUserName[obj.redline.author].userextrainfo.avatar;
        }
        else if (!changetrack && obj.comment.author in this.map._viewInfoByUserName) {
            obj.comment.avatar = this.map._viewInfoByUserName[obj.comment.author].userextrainfo.avatar;
        }
        if (window.mode.isMobile()) {
            var annotation = this.sectionProperties.commentList[this.getRootIndexOf(obj[dataroot].id)];
            if (!annotation)
                annotation = this.sectionProperties.commentList[this.getRootIndexOf(obj[dataroot].parent)]; //this is required for reload after reply in writer
        }
        if (action === 'Add') {
            if (changetrack) {
                if (!this.adjustRedLine(obj.redline)) {
                    // something wrong in this redline
                    return;
                }
                this.add(obj.redline);
            }
            else {
                this.adjustComment(obj.comment);
                this.adjustParentAdd(obj.comment);
                this.add(obj.comment);
            }
            if (this.sectionProperties.selectedComment && !this.sectionProperties.selectedComment.isEdit()) {
                this.map.focus();
            }
            annotation = this.sectionProperties.commentList[this.getRootIndexOf(obj[dataroot].id)];
            if (!window.mode.isMobile()) {
                this.update();
                var newAnnotation = this.sectionProperties.commentList[this.getIndexOf(obj[dataroot].id)];
                if (newAnnotation.sectionProperties.data.parent !== '0' && this.isCollapsed)
                    this.openMobileWizardPopup(annotation);
            }
        }
        else if (action === 'Remove') {
            if (window.mode.isMobile() && obj[dataroot].id === annotation.sectionProperties.data.id) {
                var child = this.sectionProperties.commentList[this.getIndexOf(obj[dataroot].id) + 1];
                if (child && child.sectionProperties.data.parent === annotation.sectionProperties.data.id)
                    annotation = child;
                else
                    annotation = undefined;
            }
            id = obj[dataroot].id;
            var removed = this.getComment(id);
            if (removed) {
                var parent = this.sectionProperties.commentList[this.getRootIndexOf(removed.sectionProperties.data.id)];
                this.adjustParentRemove(removed);
                this.removeItem(id);
                if (this.sectionProperties.selectedComment === removed) {
                    this.unselect();
                }
                else {
                    this.update();
                }
                if (!window.mode.isMobile() && this.isCollapsed) {
                    this.openMobileWizardPopup(parent);
                }
            }
        }
        else if (action === 'Modify') {
            id = obj[dataroot].id;
            var modified = this.getComment(id);
            if (modified) {
                var modifiedObj;
                if (changetrack) {
                    if (!this.adjustRedLine(obj.redline)) {
                        // something wrong in this redline
                        return;
                    }
                    modifiedObj = obj.redline;
                }
                else {
                    this.adjustComment(obj.comment);
                    modifiedObj = obj.comment;
                }
                modified.setData(modifiedObj);
                modified.update();
                this.update();
                if (!window.mode.isMobile() && this.isCollapsed && this.sectionProperties.selectedComment) {
                    var parent = this.sectionProperties.commentList[this.getRootIndexOf(modified.sectionProperties.data.id)];
                    this.openMobileWizardPopup(parent);
                }
            }
        }
        else if (action === 'Resolve') {
            id = obj[dataroot].id;
            var resolved = this.getComment(id);
            if (resolved) {
                var parent = this.sectionProperties.commentList[this.getRootIndexOf(resolved.sectionProperties.data.id)];
                var resolvedObj;
                if (changetrack) {
                    if (!this.adjustRedLine(obj.redline)) {
                        // something wrong in this redline
                        return;
                    }
                    resolvedObj = obj.redline;
                }
                else {
                    this.adjustComment(obj.comment);
                    resolvedObj = obj.comment;
                }
                resolved.setData(resolvedObj);
                resolved.update();
                this.showHideComment(resolved);
                this.update();
                if (!window.mode.isMobile() && this.isCollapsed) {
                    this.openMobileWizardPopup(parent);
                }
            }
        }
        if (window.mode.isMobile()) {
            var shouldOpenWizard = false;
            var wePerformedAction = obj.comment.author === this.map.getViewName(this.sectionProperties.docLayer._viewId);
            if (window.commentWizard || (action === 'Add' && wePerformedAction))
                shouldOpenWizard = true;
            if (shouldOpenWizard) {
                this.sectionProperties.docLayer._openCommentWizard(annotation);
            }
        }
    };
    CommentSection.prototype.selectById = function (commentId) {
        var idx = this.getRootIndexOf(commentId);
        var annotation = this.sectionProperties.commentList[idx];
        var justOpened = annotation !== this.sectionProperties.selectedComment;
        this.sectionProperties.selectedComment = annotation;
        this.update();
        if (justOpened && !window.mode.isMobile() && annotation.isCollapsed &&
            this.sectionProperties.docLayer._docType !== 'spreadsheet') {
            this.openMobileWizardPopup(annotation);
        }
    };
    CommentSection.prototype.stringToRectangles = function (str) {
        var matches = str.match(/\d+/g);
        var rectangles = [];
        if (matches !== null) {
            for (var i = 0; i < matches.length; i += 4) {
                rectangles.push([parseInt(matches[i]), parseInt(matches[i + 1]), parseInt(matches[i + 2]), parseInt(matches[i + 3])]);
            }
        }
        return rectangles;
    };
    CommentSection.prototype.onPartChange = function () {
        for (var i = 0; i < this.sectionProperties.commentList.length; i++) {
            this.showHideComment(this.sectionProperties.commentList[i]);
        }
        if (this.sectionProperties.selectedComment)
            this.sectionProperties.selectedComment.onCancelClick(null);
        this.checkSize();
    };
    // This converts the specified number of values into core pixels from twips.
    // Returns a new array with the length of specified numbers.
    CommentSection.prototype.numberArrayToCorePixFromTwips = function (numberArray, startIndex, length) {
        if (startIndex === void 0) { startIndex = 0; }
        if (length === void 0) { length = null; }
        if (!length)
            length = numberArray.length;
        if (startIndex < 0)
            startIndex = 0;
        if (length < 0)
            length = 0;
        if (startIndex + length > numberArray.length)
            length = numberArray.length - startIndex;
        var result = new Array(length);
        var ratio = (app.tile.size.pixels[0] / app.tile.size.twips[0]);
        for (var i = startIndex; i < length; i++) {
            result[i] = Math.round(numberArray[i] * ratio);
        }
        return result;
    };
    // In file based view, we need to move comments to their part's position.
    // Because all parts are drawn on the screen. Core side doesn't have this feature.
    // Core side sends the information in part coordinates.
    // When a coordinate like [0, 0] is inside 2nd part for example, that coordinate should correspond to a value like (just guessing) [0, 45646].
    // See that y value is different. Because there is 1st part above the 2nd one in the view.
    // We will add their part's position to comment's variables.
    // When we are saving their position, we will remove the additions before sending the information.
    CommentSection.prototype.adjustCommentFileBasedView = function (comment) {
        // Below calculations are the same with the ones we do while drawing tiles in fileBasedView.
        var partHeightTwips = this.sectionProperties.docLayer._partHeightTwips + this.sectionProperties.docLayer._spaceBetweenParts;
        var index = this.sectionProperties.docLayer._partHashes.indexOf(String(comment.parthash));
        var yAddition = index * partHeightTwips;
        comment.yAddition = yAddition; // We'll use this while we save the new position of the comment.
        comment.trackchange = false;
        comment.rectangles = this.stringToRectangles(comment.textRange || comment.anchorPos || comment.rectangle); // Simple array of point arrays [x1, y1, x2, y2].
        comment.rectangles[0][1] += yAddition; // There is only one rectangle for our case.
        comment.rectanglesOriginal = this.stringToRectangles(comment.textRange || comment.anchorPos || comment.rectangle); // This unmodified version will be kept for re-calculations.
        comment.rectanglesOriginal[0][1] += yAddition;
        comment.anchorPos = this.stringToRectangles(comment.anchorPos || comment.rectangle)[0];
        comment.anchorPos[1] += yAddition;
        if (comment.rectangle) {
            comment.rectangle = this.stringToRectangles(comment.rectangle)[0]; // This is the position of the marker.
            comment.rectangle[1] += yAddition;
        }
        comment.anchorPix = this.numberArrayToCorePixFromTwips(comment.anchorPos, 0, 2);
        comment.parthash = comment.parthash ? comment.parthash : null;
        var viewId = this.map.getViewId(comment.author);
        var color = viewId >= 0 ? L.LOUtil.rgbToHex(this.map.getViewColor(viewId)) : '#43ACE8';
        comment.color = color;
    };
    // Normally, a comment's position information is the same with the desktop version.
    // So we can use it directly.
    CommentSection.prototype.adjustCommentNormal = function (comment) {
        comment.trackchange = false;
        comment.rectangles = this.stringToRectangles(comment.textRange || comment.anchorPos || comment.rectangle || comment.cellPos); // Simple array of point arrays [x1, y1, x2, y2].
        comment.rectanglesOriginal = this.stringToRectangles(comment.textRange || comment.anchorPos || comment.rectangle || comment.cellPos); // This unmodified version will be kept for re-calculations.
        comment.anchorPos = this.stringToRectangles(comment.anchorPos || comment.rectangle || comment.cellPos)[0];
        comment.anchorPix = this.numberArrayToCorePixFromTwips(comment.anchorPos, 0, 2);
        comment.parthash = comment.parthash ? comment.parthash : null;
        comment.tab = (comment.tab || comment.tab === 0) ? comment.tab : null;
        if (comment.rectangle) {
            comment.rectangle = this.stringToRectangles(comment.rectangle)[0]; // This is the position of the marker (Impress & Draw).
        }
        else if (comment.cellPos) {
            comment.cellPos = this.stringToRectangles(comment.cellPos)[0]; // Calc.
        }
        var viewId = this.map.getViewId(comment.author);
        var color = viewId >= 0 ? L.LOUtil.rgbToHex(this.map.getViewColor(viewId)) : '#43ACE8';
        comment.color = color;
    };
    CommentSection.prototype.adjustComment = function (comment) {
        if (!app.file.fileBasedView)
            this.adjustCommentNormal(comment);
        else
            this.adjustCommentFileBasedView(comment);
    };
    CommentSection.prototype.getScaleFactor = function () {
        var scaleFactor = 1.0 / this.map.getZoomScale(this.map.options.zoom, this.map.getZoom());
        if (scaleFactor < 0.4)
            scaleFactor = 0.4;
        else if (scaleFactor < 0.6)
            scaleFactor = 0.6 - (0.6 - scaleFactor) / 2.0;
        else if (scaleFactor < 0.8)
            scaleFactor = 0.8;
        else if (scaleFactor <= 2)
            scaleFactor = 1;
        else if (scaleFactor > 2) {
            scaleFactor = 1 + (scaleFactor - 1) / 10.0;
            if (scaleFactor > 1.5)
                scaleFactor = 1.5;
        }
        return scaleFactor;
    };
    // Returns the last comment id of comment thread containing the given id
    CommentSection.prototype.getLastChildIndexOf = function (id) {
        var index = this.getIndexOf(id);
        if (index < 0)
            return undefined;
        for (var idx = index + 1; idx < this.sectionProperties.commentList.length && this.sectionProperties.commentList[idx].sectionProperties.data.parent === this.sectionProperties.commentList[idx - 1].sectionProperties.data.id; idx++) {
            index = idx;
        }
        return index;
    };
    CommentSection.prototype.updateScaling = function () {
        if (window.mode.isDesktop() || this.sectionProperties.commentList.length === 0)
            return;
        var contentWrapperClassName, menuClassName;
        if (this.sectionProperties.commentList[0].sectionProperties.data.trackchange) {
            contentWrapperClassName = '.cool-annotation-redline-content-wrapper';
            menuClassName = '.cool-annotation-menu-redline';
        }
        else {
            contentWrapperClassName = '.cool-annotation-content-wrapper';
            menuClassName = '.cool-annotation-menu';
        }
        var initNeeded = (this.sectionProperties.initialLayoutData === null);
        var contentWrapperClass = $(contentWrapperClassName);
        if (initNeeded) {
            var contentAuthor = $('.cool-annotation-content-author');
            var dateClass = $('.cool-annotation-date');
            this.sectionProperties.initialLayoutData = {
                wrapperWidth: parseInt(contentWrapperClass.css('width')),
                wrapperFontSize: parseInt(contentWrapperClass.css('font-size')),
                authorContentHeight: parseInt(contentAuthor.css('height')),
                dateFontSize: parseInt(dateClass.css('font-size')),
            };
        }
        var menuClass = $(menuClassName);
        if ((this.sectionProperties.initialLayoutData.menuWidth === undefined) && menuClass.length > 0) {
            this.sectionProperties.initialLayoutData.menuWidth = parseInt(menuClass.css('width'));
            this.sectionProperties.initialLayoutData.menuHeight = parseInt(menuClass.css('height'));
        }
        var scaleFactor = this.getScaleFactor();
        var idx;
        if (this.sectionProperties.selectedComment) {
            var selectIndexFirst = this.getRootIndexOf(this.sectionProperties.selectedComment.sectionProperties.data.id);
            var selectIndexLast = this.getLastChildIndexOf(this.sectionProperties.selectedComment.sectionProperties.data.id);
            for (idx = 0; idx < this.sectionProperties.commentList.length; idx++) {
                if (idx < selectIndexFirst || idx > selectIndexLast) {
                    this.sectionProperties.commentList[idx].updateScaling(scaleFactor, this.sectionProperties.initialLayoutData);
                }
                else {
                    this.sectionProperties.commentList[idx].updateScaling(1, this.sectionProperties.initialLayoutData);
                }
            }
        }
        else {
            for (idx = 0; idx < this.sectionProperties.commentList.length; idx++) {
                this.sectionProperties.commentList[idx].updateScaling(scaleFactor, this.sectionProperties.initialLayoutData);
            }
        }
    };
    CommentSection.prototype.twipsToCorePixels = function (twips) {
        return [twips.x / this.sectionProperties.docLayer._tileWidthTwips * this.sectionProperties.docLayer._tileSize, twips.y / this.sectionProperties.docLayer._tileHeightTwips * this.sectionProperties.docLayer._tileSize];
    };
    // If the file type is presentation or drawing then we shall check the selected part in order to hide comments from other parts.
    // But if file is in fileBasedView, then we will not hide any comments from not-selected/viewed parts.
    CommentSection.prototype.mustCheckSelectedPart = function () {
        return (this.sectionProperties.docLayer._docType === 'presentation' || this.sectionProperties.docLayer._docType === 'drawing') && !app.file.fileBasedView;
    };
    CommentSection.prototype.layoutUp = function (subList, actualPosition, lastY) {
        var height;
        for (var i = 0; i < subList.length; i++) {
            height = subList[i].sectionProperties.container.getBoundingClientRect().height;
            lastY = subList[i].sectionProperties.data.anchorPix[1] + height < lastY ? subList[i].sectionProperties.data.anchorPix[1] : lastY - height;
            (new L.PosAnimation()).run(subList[i].sectionProperties.container, { x: Math.round(actualPosition[0] / app.dpiScale), y: Math.round(lastY / app.dpiScale) });
            subList[i].show();
        }
        return lastY;
    };
    CommentSection.prototype.loopUp = function (startIndex, x, startY) {
        var tmpIdx = 0;
        var checkSelectedPart = this.mustCheckSelectedPart();
        startY -= this.sectionProperties.marginY;
        // Pass over all comments present
        for (var i = startIndex; i > -1;) {
            var subList = [];
            tmpIdx = i;
            do {
                this.sectionProperties.commentList[tmpIdx].sectionProperties.data.anchorPix = this.numberArrayToCorePixFromTwips(this.sectionProperties.commentList[tmpIdx].sectionProperties.data.anchorPos, 0, 2);
                this.sectionProperties.commentList[tmpIdx].sectionProperties.data.anchorPix[1] -= this.documentTopLeft[1];
                // Add this item to the list of comments.
                if (this.sectionProperties.commentList[tmpIdx].sectionProperties.data.resolved !== 'true' || this.sectionProperties.showResolved) {
                    if (!checkSelectedPart || this.sectionProperties.docLayer._selectedPart === this.sectionProperties.commentList[tmpIdx].sectionProperties.partIndex)
                        subList.push(this.sectionProperties.commentList[tmpIdx]);
                }
                tmpIdx = tmpIdx - 1;
                // Continue this loop, until we reach the last item, or an item which is not a direct descendant of the previous item.
            } while (tmpIdx > -1 && this.sectionProperties.commentList[tmpIdx].sectionProperties.data.parent === this.sectionProperties.commentList[tmpIdx + 1].sectionProperties.data.id);
            if (subList.length > 0) {
                startY = this.layoutUp(subList, [x, subList[0].sectionProperties.data.anchorPix[1]], startY);
                i = i - subList.length;
            }
            else {
                i = tmpIdx;
            }
            startY -= this.sectionProperties.marginY;
        }
        return startY;
    };
    CommentSection.prototype.layoutDown = function (subList, actualPosition, lastY) {
        var selectedComment = subList[0] === this.sectionProperties.selectedComment;
        for (var i = 0; i < subList.length; i++) {
            lastY = subList[i].sectionProperties.data.anchorPix[1] > lastY ? subList[i].sectionProperties.data.anchorPix[1] : lastY;
            var isRTL = document.documentElement.dir === 'rtl';
            if (selectedComment && !this.sectionProperties.selectedComment.isCollapsed)
                (new L.PosAnimation()).run(subList[i].sectionProperties.container, { x: Math.round(actualPosition[0] / app.dpiScale) - 60 * (isRTL ? -1 : 1), y: Math.round(lastY / app.dpiScale) });
            else
                (new L.PosAnimation()).run(subList[i].sectionProperties.container, { x: Math.round(actualPosition[0] / app.dpiScale), y: Math.round(lastY / app.dpiScale) });
            lastY += (subList[i].sectionProperties.container.getBoundingClientRect().height * app.dpiScale);
            if (!subList[i].isEdit())
                subList[i].show();
        }
        return lastY;
    };
    CommentSection.prototype.loopDown = function (startIndex, x, startY) {
        var tmpIdx = 0;
        var checkSelectedPart = this.mustCheckSelectedPart();
        // Pass over all comments present
        for (var i = startIndex; i < this.sectionProperties.commentList.length;) {
            var subList = [];
            tmpIdx = i;
            do {
                this.sectionProperties.commentList[tmpIdx].sectionProperties.data.anchorPix = this.numberArrayToCorePixFromTwips(this.sectionProperties.commentList[tmpIdx].sectionProperties.data.anchorPos, 0, 2);
                this.sectionProperties.commentList[tmpIdx].sectionProperties.data.anchorPix[1] -= this.documentTopLeft[1];
                // Add this item to the list of comments.
                if (this.sectionProperties.commentList[tmpIdx].sectionProperties.data.resolved !== 'true' || this.sectionProperties.showResolved) {
                    if (!checkSelectedPart || this.sectionProperties.docLayer._selectedPart === this.sectionProperties.commentList[tmpIdx].sectionProperties.partIndex)
                        subList.push(this.sectionProperties.commentList[tmpIdx]);
                }
                tmpIdx = tmpIdx + 1;
                // Continue this loop, until we reach the last item, or an item which is not a direct descendant of the previous item.
            } while (tmpIdx < this.sectionProperties.commentList.length && this.sectionProperties.commentList[tmpIdx].sectionProperties.data.parent === this.sectionProperties.commentList[tmpIdx - 1].sectionProperties.data.id);
            if (subList.length > 0) {
                startY = this.layoutDown(subList, [x, subList[0].sectionProperties.data.anchorPix[1]], startY);
                i = i + subList.length;
            }
            else {
                i = tmpIdx;
            }
            startY += this.sectionProperties.marginY;
        }
        return startY;
    };
    CommentSection.prototype.hideArrow = function () {
        if (this.sectionProperties.arrow) {
            document.getElementById('document-container').removeChild(this.sectionProperties.arrow);
            this.sectionProperties.arrow = null;
        }
    };
    CommentSection.prototype.showArrow = function (startPoint, endPoint) {
        var anchorSection = this.containerObject.getDocumentAnchorSection();
        startPoint[0] -= anchorSection.myTopLeft[0] + this.documentTopLeft[0];
        startPoint[1] -= anchorSection.myTopLeft[1] + this.documentTopLeft[1];
        endPoint[1] -= anchorSection.myTopLeft[1] + this.documentTopLeft[1];
        startPoint[0] = Math.floor(startPoint[0] / app.dpiScale);
        startPoint[1] = Math.floor(startPoint[1] / app.dpiScale);
        endPoint[0] = Math.floor(endPoint[0] / app.dpiScale);
        endPoint[1] = Math.floor(endPoint[1] / app.dpiScale);
        if (this.sectionProperties.arrow !== null) {
            var line = document.getElementById('comment-arrow-line');
            line.setAttribute('x1', String(startPoint[0]));
            line.setAttribute('y1', String(startPoint[1]));
            line.setAttribute('x2', String(endPoint[0]));
            line.setAttribute('y2', String(endPoint[1]));
        }
        else {
            var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('version', '1.1');
            svg.style.zIndex = '9';
            svg.id = 'comment-arrow-container';
            svg.style.position = 'absolute';
            svg.style.top = svg.style.left = svg.style.right = svg.style.bottom = '0';
            svg.setAttribute('width', String(this.context.canvas.width));
            svg.setAttribute('height', String(this.context.canvas.height));
            var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.id = 'comment-arrow-line';
            line.setAttribute('x1', String(startPoint[0]));
            line.setAttribute('y1', String(startPoint[1]));
            line.setAttribute('x2', String(endPoint[0]));
            line.setAttribute('y2', String(endPoint[1]));
            line.setAttribute('stroke', 'darkblue');
            line.setAttribute('stroke-width', '1');
            svg.appendChild(line);
            document.getElementById('document-container').appendChild(svg);
            this.sectionProperties.arrow = svg;
        }
    };
    CommentSection.prototype.doLayout = function () {
        if (window.mode.isMobile() || this.sectionProperties.docLayer._docType === 'spreadsheet') {
            if (this.sectionProperties.commentList.length > 0)
                this.orderCommentList();
            return; // No adjustments for Calc, since only one comment can be shown at a time and that comment is shown at its belonging cell.
        }
        if (this.sectionProperties.commentList.length > 0) {
            this.orderCommentList();
            this.updateScaling();
            var isRTL = document.documentElement.dir === 'rtl';
            var topRight = [this.myTopLeft[0], this.myTopLeft[1] + this.sectionProperties.marginY - this.documentTopLeft[1]];
            var yOrigin = null;
            var selectedIndex = null;
            var x = isRTL ? 0 : topRight[0];
            var commentWidth = this.isCollapsed ? 70 : 300;
            var availableSpace = this.containerObject.getDocumentAnchorSection().size[0] - app.file.size.pixels[0];
            if (availableSpace > commentWidth) {
                if (isRTL)
                    x = Math.round((this.containerObject.getDocumentAnchorSection().size[0] - app.file.size.pixels[0]) * 0.5) - this.containerObject.getDocumentAnchorSection().size[0];
                else
                    x = topRight[0] - Math.round((this.containerObject.getDocumentAnchorSection().size[0] - app.file.size.pixels[0]) * 0.5);
            }
            else if (isRTL)
                x = -this.containerObject.getDocumentAnchorSection().size[0];
            else
                x -= commentWidth;
            if (this.sectionProperties.selectedComment) {
                selectedIndex = this.getRootIndexOf(this.sectionProperties.selectedComment.sectionProperties.data.id);
                this.sectionProperties.commentList[selectedIndex].sectionProperties.data.anchorPix = this.numberArrayToCorePixFromTwips(this.sectionProperties.commentList[selectedIndex].sectionProperties.data.anchorPos, 0, 2);
                this.sectionProperties.commentList[selectedIndex].sectionProperties.data.anchorPix[1];
                yOrigin = this.sectionProperties.commentList[selectedIndex].sectionProperties.data.anchorPix[1] - this.documentTopLeft[1];
                var tempCrd = this.sectionProperties.commentList[selectedIndex].sectionProperties.data.anchorPix;
                var resolved = this.sectionProperties.commentList[selectedIndex].sectionProperties.data.resolved;
                if (!resolved || resolved === 'false' || this.sectionProperties.showResolved) {
                    var posX = isRTL ? (this.containerObject.getDocumentAnchorSection().size[0] + x + 15) : x;
                    this.showArrow([tempCrd[0], tempCrd[1]], [posX, tempCrd[1]]);
                }
            }
            else {
                this.hideArrow();
                app.sectionContainer.requestReDraw();
            }
            var lastY = 0;
            if (selectedIndex) {
                this.loopUp(selectedIndex - 1, x, yOrigin);
                lastY = this.loopDown(selectedIndex, x, yOrigin);
            }
            else {
                lastY = this.loopDown(0, x, topRight[1]);
            }
        }
        lastY += this.containerObject.documentTopLeft[1];
        if (lastY > app.file.size.pixels[1])
            app.view.size.pixels[1] = lastY;
        else
            app.view.size.pixels[1] = app.file.size.pixels[1];
    };
    CommentSection.prototype.layout = function (zoom) {
        if (zoom === void 0) { zoom = null; }
        if (zoom)
            this.doLayout();
        else if (!this.sectionProperties.layoutTimer) {
            this.sectionProperties.layoutTimer = setTimeout(function () {
                delete this.sectionProperties.layoutTimer;
                this.doLayout();
            }.bind(this), 10 /* ms */);
        } // else - avoid excessive re-layout
    };
    CommentSection.prototype.update = function () {
        this.updateReplyCount();
        this.layout();
    };
    CommentSection.prototype.openMobileWizardPopup = function (annotation) {
        if (!annotation) {
            this.map.fire('mobilewizardpopupclose');
            return;
        }
        var commentsData = this.map._docLayer.getCommentWizardStructure(undefined, annotation); // thread only
        if (commentsData.children.length) {
            commentsData.popupParent = annotation.sectionProperties.container.id;
            this.map.fire('mobilewizardpopup', { data: commentsData });
        }
        else {
            this.map.fire('mobilewizardpopupclose');
        }
    };
    CommentSection.prototype.updateReplyCount = function () {
        for (var i = 0; i < this.sectionProperties.commentList.length; i++) {
            var comment = this.sectionProperties.commentList[i];
            var replyCount = 0;
            for (var j = 0; j < this.sectionProperties.commentList.length; j++) {
                var anotherComment = this.sectionProperties.commentList[j];
                if (this.getRootIndexOf(anotherComment.sectionProperties.data.id) === i
                    && anotherComment.sectionProperties.data.resolved !== 'true')
                    replyCount++;
            }
            if (replyCount > 1) {
                comment.sectionProperties.replyCountNode.innerText = replyCount;
                comment.sectionProperties.replyCountNode.style.display = '';
            }
            else {
                comment.sectionProperties.replyCountNode.innerText = '';
                comment.sectionProperties.replyCountNode.style.display = 'none';
            }
        }
    };
    // Returns the root comment index of given id
    CommentSection.prototype.getRootIndexOf = function (id) {
        var index = this.getIndexOf(id);
        for (var idx = index - 1; idx >= 0 &&
            this.sectionProperties.commentList[idx] &&
            this.sectionProperties.commentList[idx + 1] &&
            this.sectionProperties.commentList[idx].sectionProperties.data.id === this.sectionProperties.commentList[idx + 1].sectionProperties.data.parent; idx--) {
            index = idx;
        }
        return index;
    };
    CommentSection.prototype.setViewResolved = function (state) {
        this.sectionProperties.showResolved = state;
        for (var idx = 0; idx < this.sectionProperties.commentList.length; idx++) {
            if (this.sectionProperties.commentList[idx].sectionProperties.data.resolved === 'true') {
                if (state == false) {
                    if (this.sectionProperties.selectedComment == this.sectionProperties.commentList[idx]) {
                        this.unselect();
                    }
                    this.sectionProperties.commentList[idx].hide();
                }
                else {
                    this.sectionProperties.commentList[idx].show();
                }
            }
            this.sectionProperties.commentList[idx].update();
        }
        this.update();
    };
    CommentSection.prototype.updateResolvedState = function (comment) {
        var threadIndexFirst = this.getRootIndexOf(comment.sectionProperties.data.id);
        if (this.sectionProperties.commentList[threadIndexFirst].sectionProperties.data.resolved !== comment.sectionProperties.data.resolved) {
            comment.sectionProperties.data.resolved = this.sectionProperties.commentList[threadIndexFirst].sectionProperties.data.resolved;
            comment.update();
            this.update();
        }
    };
    CommentSection.prototype.orderCommentList = function () {
        this.sectionProperties.commentList.sort(function (a, b) {
            return Math.abs(a.sectionProperties.data.anchorPos[1]) - Math.abs(b.sectionProperties.data.anchorPos[1]) ||
                Math.abs(a.sectionProperties.data.anchorPos[0]) - Math.abs(b.sectionProperties.data.anchorPos[0]);
        });
        // idIndexMap is now invalid, update it.
        this.updateIdIndexMap();
    };
    CommentSection.prototype.updateIdIndexMap = function () {
        this.idIndexMap.clear();
        var commentList = this.sectionProperties.commentList;
        for (var idx = 0; idx < commentList.length; idx++) {
            var comment = commentList[idx];
            console.assert(comment.sectionProperties && comment.sectionProperties.data, 'no sectionProperties.data!');
            this.idIndexMap.set(comment.sectionProperties.data.id, idx);
        }
    };
    CommentSection.prototype.turnIntoAList = function (commentList) {
        var newArray;
        if (!Array.isArray(commentList)) {
            newArray = new Array(0);
            for (var prop in commentList) {
                if (Object.prototype.hasOwnProperty.call(commentList, prop)) {
                    newArray.push(commentList[prop]);
                }
            }
        }
        else {
            newArray = commentList;
        }
        return newArray;
    };
    CommentSection.prototype.importComments = function (commentList) {
        var comment;
        this.clearList();
        commentList = this.turnIntoAList(commentList);
        if (commentList.length > 0) {
            for (var i = 0; i < commentList.length; i++) {
                comment = commentList[i];
                this.adjustComment(comment);
                if (comment.author in this.map._viewInfoByUserName) {
                    comment.avatar = this.map._viewInfoByUserName[comment.author].userextrainfo.avatar;
                }
                var commentSection = new app.definitions.Comment(comment, {}, this);
                if (!this.containerObject.addSection(commentSection))
                    continue;
                this.sectionProperties.commentList.push(commentSection);
                this.idIndexMap.set(commentSection.sectionProperties.data.id, i);
                this.updateResolvedState(this.sectionProperties.commentList[i]);
            }
            this.orderCommentList();
            this.checkSize();
            this.update();
        }
        if (this.sectionProperties.docLayer._docType === 'spreadsheet')
            this.hideAllComments(); // Apply drawing orders.
    };
    // Accepts redlines/changes comments.
    CommentSection.prototype.importChanges = function (changesList) {
        var changeComment;
        this.clearChanges();
        changesList = this.turnIntoAList(changesList);
        if (changesList.length > 0) {
            for (var i = 0; i < changesList.length; i++) {
                changeComment = changesList[i];
                if (!this.adjustRedLine(changeComment))
                    // something wrong in this redline, skip this one
                    continue;
                if (changeComment.author in this.map._viewInfoByUserName) {
                    changeComment.avatar = this.map._viewInfoByUserName[changeComment.author].userextrainfo.avatar;
                }
                var commentSection = new app.definitions.Comment(changeComment, {}, this);
                if (!this.containerObject.addSection(commentSection))
                    continue;
                this.sectionProperties.commentList.push(commentSection);
            }
            this.orderCommentList();
            this.checkSize();
            this.update();
        }
        if (this.sectionProperties.docLayer._docType === 'spreadsheet')
            this.hideAllComments(); // Apply drawing orders.
    };
    // Remove redline comments.
    CommentSection.prototype.clearChanges = function () {
        this.containerObject.pauseDrawing();
        for (var i = this.sectionProperties.commentList.length - 1; i > -1; i--) {
            if (this.sectionProperties.commentList[i].sectionProperties.data.trackchange) {
                this.containerObject.removeSection(this.sectionProperties.commentList[i].name);
                this.sectionProperties.commentList.splice(i, 1);
            }
        }
        this.updateIdIndexMap();
        this.containerObject.resumeDrawing();
        this.sectionProperties.selectedComment = null;
        this.checkSize();
    };
    // Remove only text comments from the document (excluding change tracking comments)
    CommentSection.prototype.clearList = function () {
        this.containerObject.pauseDrawing();
        for (var i = this.sectionProperties.commentList.length - 1; i > -1; i--) {
            if (!this.sectionProperties.commentList[i].sectionProperties.data.trackchange) {
                this.containerObject.removeSection(this.sectionProperties.commentList[i].name);
                this.sectionProperties.commentList.splice(i, 1);
            }
        }
        this.updateIdIndexMap();
        this.containerObject.resumeDrawing();
        this.sectionProperties.selectedComment = null;
        this.checkSize();
    };
    CommentSection.prototype.onCommentsDataUpdate = function () {
        for (var i = this.sectionProperties.commentList.length - 1; i > -1; i--) {
            var comment = this.sectionProperties.commentList[i];
            if (!comment.valid) {
                comment.sectionProperties.commentListSection.removeItem(comment.sectionProperties.data.id);
            }
            comment.onCommentDataUpdate();
        }
    };
    CommentSection.prototype.onMouseUp = function () { return; };
    CommentSection.prototype.onMouseDown = function () { return; };
    CommentSection.prototype.onMouseEnter = function () { return; };
    CommentSection.prototype.onMouseLeave = function () { return; };
    CommentSection.prototype.onMouseWheel = function () { return; };
    CommentSection.prototype.onClick = function () { return; };
    CommentSection.prototype.onDoubleClick = function () { return; };
    CommentSection.prototype.onContextMenu = function () { return; };
    CommentSection.prototype.onLongPress = function () { return; };
    CommentSection.prototype.onMultiTouchStart = function () { return; };
    CommentSection.prototype.onMultiTouchMove = function () { return; };
    CommentSection.prototype.onMultiTouchEnd = function () { return; };
    return CommentSection;
}());
