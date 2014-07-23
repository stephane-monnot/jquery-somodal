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
            overflowY: 'auto', // 'scroll' / 'auto'
            modalClasses: null,
            closeOnEscape: true,
            afterShow: null,
            beforeShow: null,
            afterHide: null,
            beforeHide: null,
            init: function(modal, overlay, alreadyOpened) {
                modal.css({opacity: 0});
                if (!alreadyOpened) {
                    overlay.css({opacity: 0});
                }
            },
            in: function(modal, overlay, alreadyOpened) {
                if (!alreadyOpened) {
                    overlay.transition({opacity: 0.8}, '', '', function() {
                        modal.transition({opacity: 1});
                    });
                } else {
                    modal.transition({opacity: 1});
                }
            },
            out: function(modal, overlay, hasNextModal) {
                if (!hasNextModal) {
                    modal.transition({opacity: 0});
                    overlay.transition({opacity: 0});
                } else {
                    modal.transition({opacity: 0});
                }
            }
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
        nbTransitionRemaining: 0,
        state: null,
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
                $('body').removeClass('soModalOpen');
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
            if(!alreadyOpened) {
                this.elems.overlay = $('<div>')
                        .addClass('soModalOverlay')
                        .addClass(this.options.classPrefix + 'Overlay')
                        .addClass(this.options.classPrefix + 'OverlayInit');
            }
            
            this.elems.overlay.appendTo('body')
            // On crée un container que l'on ajoute au body
            this.elems.containerFixed = $('<div>').addClass('soModalContainerFixed')
                    .css({overflowY: this.options.overflowY});
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
            
            /*
             * On definie notre propre function de transition pour la modal et
             * l'overlay afin de se servir du callback des transitions pour 
             * detecter la fin de toutes les animations
             */
            var soModalTransition = function(properties, duration, easing, callback2) {
                if (typeof duration === 'function') {
                    callback2 = duration;
                    duration = undefined;
                }
                if (typeof easing === 'function') {
                    callback2 = easing;
                    easing = undefined;
                }
                if (typeof properties.complete !== 'undefined') {
                    callback2 = properties.complete;
                    delete properties.complete;
                }
                soModalObject.nbTransitionRemaining++;
                callback = function() {
                    if($.isFunction(callback2)) {
                        callback2.apply(this);
                    };
                    soModalObject.nbTransitionRemaining--;
                    // Si toutes les transitions ont été faites
                    if(soModalObject.nbTransitionRemaining == 0) {
                        // On appelle la function afterShow ou afterHide
                        if((soModalObject.state == 'in' || soModalObject.state == null) 
                            && $.isFunction(soModalObject.options.afterShow)
                        ) {
                            soModalObject.options.afterShow.call(
                                soModalObject, 
                                soModalObject.elems.modal, 
                                soModalObject.elems.overlay, 
                                alreadyOpened
                            );
                        } else if(soModalObject.state == 'out') {
                            if($.isFunction(soModalObject.options.afterHide)) {
                                soModalObject.options.afterHide.call(
                                    soModalObject, 
                                    soModalObject.elems.modal, 
                                    soModalObject.elems.overlay, 
                                    alreadyOpened
                                );
                            }
                            soModalObject.elems.overlay.remove();
                            soModalObject.elems.modal.remove();
                            soModalObject.state = null;
                        }
                    }
                }

                $(this).transit(properties, duration, easing, callback);
            }
            
            this.elems.modal.transition = soModalTransition;
            this.elems.overlay.transition = soModalTransition;
            
            /*
             * Etat initial (INIT)
             */ 
            
            this.state = 'init';
            
            // On ajoute nos classes init
            this.elems.modal.addClass(this.options.classPrefix + 'ModalInit');
            this.elems.overlay.addClass(this.options.classPrefix + 'OverlayInit');
            
            if($.isFunction(this.options.init)) {
                // On appelle la function init
                this.options.init.call(this, this.elems.modal, this.elems.overlay, alreadyOpened);
            }
            
            // On appelle la function beforeShow
            if($.isFunction(this.options.beforeShow)) {
                this.options.beforeShow.call(this, this.elems.modal, this.elems.overlay, alreadyOpened);
            }
            
            /*
             * Etat ouvert (IN)
             */ 
            
            this.state = 'in';
            
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
            
            if($.isFunction(this.options.in)) {
                // On appelle la function in
                this.options.in.call(this, this.elems.modal, this.elems.overlay, alreadyOpened);
            }
            
            // Si aucune transition definie
            if(soModalObject.nbTransitionRemaining == 0) {
                // On appelle la function afterShow
                if($.isFunction(this.options.afterShow)) {
                    this.options.afterShow.call(this, this.elems.modal, this.elems.overlay, alreadyOpened);
                }
            }
                        
            this.accessibility(true);
            
        },
        close: function(hasNextModal) {
            var soModalObject = this;
            
            // On appelle la function beforeHide
            if($.isFunction(this.options.beforeHide)) {
                this.options.beforeHide.call(this, this.elems.modal, this.elems.overlay, hasNextModal);
            }
            
            /*
             * Etat fermé
             */ 
            
            this.state = 'out';
            
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
                this.options.out.call(this, this.elems.modal, this.elems.overlay, hasNextModal);
            }
            
            // Si aucune transition definie
            if(soModalObject.nbTransitionRemaining == 0) {
                // On appelle la function afterHide
                if($.isFunction(this.options.afterHide)) {
                    this.options.afterHide.call(this, this.elems.modal, this.elems.overlay, hasNextModal);
                }
                this.elems.overlay.remove();
                this.elems.modal.remove();
                this.state = null;
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
        $.fn.transit = $.fn.animate;
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