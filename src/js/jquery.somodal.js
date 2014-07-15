/*
 * SoModal 1.0.0
 * @author Shinbuntu <smonnot@solire.fr>
 * @license    CC by-nc http://creativecommons.org/licenses/by-nc/3.0/fr/
 */

/*
 * @name SoModal
 * @type jQuery
 * @requires jQuery v1.3
 * @author Shinbuntu <smonnot@solire.fr>
 * @version 1.0.0
 */
(function($)
{
    var soModal = {
        defaults: {
            classPrefix: 'soModalDefault',
            closeHTML: '<a title="Fermer" href="#"></a>',
            modalClasses: null,
            closeOnEscape: true,
            init: null,
            in: null,
            out: null
        },
        content: {
            body: ''
        },
        keepFocus: function(context) {
            if(context) {
                var allTabbableElements = context.find(this.tabbableElements);
                var firstTabbableElement = allTabbableElements[0];
                var lastTabbableElement = allTabbableElements[allTabbableElements.length - 1];
            }
            var keyListener = function(event) {
                var keyCode = event.which || event.keyCode; // Get the current keycode

                // If it is TAB
                if (keyCode === 9) {

                    // Prevent the default behavior
                    if (event.preventDefault) {
                        event.preventDefault();
                    } else {
                        event.returnValue = false;
                    }

                    // Move the focus to the first element that can be tabbed
                    firstTabbableElement.focus();
                }
            };
            
            lastTabbableElement.addEventListener('keydown', keyListener, false);
        },
        
        tabIndex: function(context, openContext) {
            $(this.tabbableElements).attr('tabIndex', !openContext ? 0 : -1)
            if(context) {
                var allTabbableElements = context.find(this.tabbableElements);
                allTabbableElements.attr('tabIndex', openContext ? 0 : -1)
            }
        },
        elems: {
            containerFixed: null,
            overlay: null,
            modal: null,
            close: null
        },
        tabbableElements: 'a[href], area[href], input:not([disabled]),' +
	'select:not([disabled]), textarea:not([disabled]),' +
	'button:not([disabled]), iframe, object, embed, *[tabindex],' +
	'*[contenteditable]',
        init: function(content, options, alreadyOpened) {
            //On fusionne les paramètres par défaut et les arguments
            this.options = $.extend({}, this.defaults, options);
            this.content.body = content;
            this.open(alreadyOpened);
            this.bindEvents();
        },
        unBindEvents: function() {
            $(window).off("resize", this.resize);
            $(document).off('keydown', this.keyDown);
        },
        bindEvents: function() {
            var soModalObject = this;
            
            // Au redimensionnement de la fenetre
            $(window).resize(this.resize);
            
            // Au clic sur le containerFixed
            this.elems.containerFixed.bind('click', function(e) {
                if (e.target == this) {
                    soModalObject.close();
                }
            })
            
            // Au clic sur le button close
            $('.' + this.options.classPrefix + 'Close').bind('click', function(e) {
                    soModalObject.close();
                    e.preventDefault();
            })
            
            // Touche echap
            $(document).keydown(this.keyDown);
            
            //Appel des fonctions onClosed
            this.elems.containerFixed.bind("DOMNodeRemoved",function(){
                soModalObject.elems.containerFixed.remove();
                soModalObject.elems.containerFixed = null;
                soModalObject.elems.modal = null;
                $(document).trigger('closed.so.modal');
            });
        },
        accessibility: function(open) {
            if(open) {
                this.keepFocus(this.elems.modal);
            }
            this.tabIndex(this.elems.modal, open);
        },
        open: function(alreadyOpened) {
            var soModalObject = this;
            
            // On crée l'overlay qu'on ajoute au body
            if(!this.elems.overlay) {
                this.elems.overlay = $('<div>')
                        .addClass('soModalOverlay')
                        .addClass(this.options.classPrefix + 'Overlay')
                        .addClass(this.options.classPrefix + 'OverlayInit');
            }
            
            this.elems.overlay.appendTo('body')
            // On crée un container que l'on ajoute au body
            this.elems.containerFixed = $('<div>').addClass('soModalContainerFixed');
            this.elems.containerFixed.appendTo('body')
            
            // On crée une div avec le contenu à afficher et on l'ajoute au container
            this.elems.modal = $('<div>')
                    .addClass('soModal')
                    .addClass(this.options.modalClasses)
                    .addClass(this.options.classPrefix + 'Modal');
            
            this.elems.modal.html(this.content.body);
            this.elems.modal.appendTo(this.elems.containerFixed);
            
            // On crée le bouton "fermer" si besoin
            if(this.options.closeHTML) {
                this.elems.close = $(this.options.closeHTML)
                        .addClass('soModalClose')
                        .addClass(this.options.classPrefix + 'Close');
                this.elems.close.appendTo(this.elems.modal);
            } else {
                this.elems.close = $('.' + this.options.classPrefix + 'Close');
            }
            
            // On enleve le scroll sur le body
            $('body').addClass('soModalOpen');
            
            // On calcule la taille est la position 
            this.updateSize();
            this.updatePosition();
            
            this.elems.modal.addClass(this.options.classPrefix + 'ModalInit');
            
            // Etat initial
            // On ajoute les classes d'effets et supprime nos classes init
            this.elems.overlay.delay(1).queue(function() {
                soModalObject.elems.overlay
                    .addClass(soModalObject.options.classPrefix + 'OverlayIn')
                    .removeClass(soModalObject.options.classPrefix + 'OverlayInit');
                soModalObject.elems.overlay.dequeue()
            })
            
            this.elems.modal.delay(1).queue(function() {
                soModalObject.elems.modal
                    .addClass(soModalObject.options.classPrefix + 'ModalIn')
                    .removeClass(soModalObject.options.classPrefix + 'ModalInit');
                soModalObject.elems.modal.dequeue()
            })
            
            
            if($.isFunction(this.options.init)) {
                // On appelle la function init
                this.options.init.call(this, this.elems.modal, this.elems.overlay, alreadyOpened);
            }
                        
            // Etat ouvert
            if($.isFunction(this.options.in)) {
                // On appelle la function in
                this.options.in.call(this, this.elems.modal, this.elems.overlay, alreadyOpened);
            }
            
            this.accessibility(true);
            
        },
        close: function(alreadyOpened) {
            var soModalObject = this;
            
            // Etat fermé
            // On supprime les classes d'effets
            this.elems.overlay.delay(1).queue(function() {
                soModalObject.elems.overlay
                    .addClass(soModalObject.options.classPrefix + 'OverlayOut')
                    .removeClass(soModalObject.options.classPrefix + 'OverlayIn');
                soModalObject.elems.overlay.dequeue();
            });
            
            this.elems.modal.delay(1).queue(function() {
                soModalObject.elems.modal
                    .addClass(soModalObject.options.classPrefix + 'ModalOut')
                    .removeClass(soModalObject.options.classPrefix + 'ModalIn');
                soModalObject.elems.modal.dequeue();
            });
            
            // On appelle la function out
            if($.isFunction(this.options.out)) {
                // call user provided method
                this.options.out.call(this, this.elems.modal, this.elems.overlay, alreadyOpened);
            } else {
                this.elems.overlay.remove();
                this.elems.modal.remove();
            }
            
            this.accessibility(false);
            
        },
        isOpen: function() {
            return this.elems.modal && this.elems.modal.length > 0
        },
        getDimensions: function () {
            var d = [$(window).width(), $(window).height()];
            return d;
        },
        updateSize: function() {
            // On recalcule la taille de l'overlay
            var windowSize = this.getDimensions();
            this.elems.overlay.css({width: windowSize[0], height: windowSize[1]});
            this.elems.modal.finalWidth = this.elems.modal.outerWidth(true);
            this.elems.modal.finalHeight = this.elems.modal.outerHeight(true);
        },
        updatePosition: function() {
            // On recalcule la position de la modal
            var windowSize = this.getDimensions();
            var top = Math.max(0, ((windowSize[1] - this.elems.modal.outerHeight(true)) / 2)) + "px";
            var left = Math.max(0, ((windowSize[0] - this.elems.modal.outerWidth(true)) / 2)) + "px";
            this.elems.modal.css("top", top);
            this.elems.modal.css("left", left);
            this.elems.modal.finalPosition = this.elems.modal.position();
        },
        keyDown: function(e) {
            var soModalObject = soModal;
            if (soModalObject.options.closeOnEscape
                    && e.keyCode
                    && e.keyCode === 27
                    ) {
                soModalObject.close();
                e.preventDefault();
            }
        },
        resize: function() {
            soModal.updateSize();
            soModal.updatePosition();
        }
    };
    
    if (!$.support.transition) {
        $.fn.transition = $.fn.animate;
    }

    $.soModal = {
        open: function(content, parameters) {
            if(soModal.isOpen()) {
                $(document).one('closed.so.modal', function() {
                    if(!soModal.isOpen()) {
                        soModal.init(content, parameters, true);
                    }
                });
                soModal.close(true);
                
            } else {
                soModal.init(content, parameters);
            }
        },
        close: function() {
            soModal.close();
        },
    };
})(jQuery);