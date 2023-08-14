/* (C) Collabora Productivity 2020, All Rights Reserved */
var brandProductName = 'Collabora Online';
var brandProductURL = 'https://www.collaboraoffice.com/';

var menuItems;
window.onload = function() {
	// wait until the menu (and particularly the document-header) actually exists
	function setLogo() {
		var logoHeader = document.getElementById('document-header');
		if (!logoHeader) {
			// the logo does not exist in the menu yet, re-try in 250ms
			setTimeout(setLogo, 250);
		} else {
			var logo = $('#document-header > div');
			logo.attr('title', brandProductName);
			logo.off('click').on('click', function() { window.open(brandProductURL, '_blank'); });

			menuItems = document.querySelectorAll('#main-menu > li > a');
		}
	}
	function setAboutImg() {
		var lk = document.getElementById('lokit-version');
		var aboutDialog = document.getElementById('about-dialog-info');
		if (!lk || !aboutDialog) {
			setTimeout(setAboutImg, 250);
		} else {
			lk = lk.parentNode;
			lk.insertAdjacentHTML('beforebegin', '<div style="margin-inline-end: auto;" id="lokit-extra"><span dir="ltr">built on&nbsp;<a href="javascript:void(window.open(\'http://col.la/lot\'));">a great technology base</a></span></div>');
		}
	}

	function addIntegratorSidebar() {
		var logoHeader = document.getElementById('document-header');
		if (!logoHeader) {
			// the logo does not exist in the menu yet, re-try in 250ms
			setTimeout(addIntegratorSidebar, 250);
		} else {
			if(document.body.hasAttribute('data-integratorSidebar')) {
				var closeButton = document.getElementById('closebuttonwrapper');
				var share = document.createElement('button');
				share.classList = 'icon-integrator-sidebar';
				share.id = 'icon-integrator-sidebar';
				share.setAttribute('aria-label',_('Share'));
				share.setAttribute('title',_('Share'));

				share.addEventListener('click', function() {
					L.Map.THIS.openShare();
				});
				closeButton.parentNode.insertBefore(share, closeButton);
			}
		}
   }


	setLogo();
	setAboutImg();
	addIntegratorSidebar();
}

/*a::first-letter"*/
document.onkeyup = function(e) {
	if (e.altKey && e.shiftKey) {
		console.log('alt + shift + f');
		menuItems.forEach(function(menuItem) {
			menuItem.style.setProperty('text-decoration', 'underline', 'important');
		});
	}
};
