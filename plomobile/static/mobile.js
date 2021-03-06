/**
 * Plomobile cliet side tune ups - when CSS is not enough
 */

/*global window, document, console*/

(function($) {
    "use strict";

    // http://opensourcehacker.com/2011/03/15/everyone-loves-and-hates-console-log/
    // Ignore console on platforms where it is not available
    if (typeof(window.console) == "undefined") { window.console = {}; window.console.log = window.console.warn = window.console.error = function(a) {}; }

    function endsWith(line, str) {
        var lastIndex = line.lastIndexOf(str);
        return (lastIndex != -1) && (lastIndex + str.length == line.length);
    }

    var mobilize = {

        // Have we run mobile layout client-side bootstrap
        areWeMobileYet : false,

        /**
         * Close all open header slides
         */
        closeSlides : function(callback) {
            $(".mobile-slide").slideUp("fast", function done() {
                $(".mobile-slide-button").removeClass("active");
                callback();
            });
        },

        /**
         * Open a named header slide, close others
         */
        openSlide : function(elem, button) {

            // Don't reopen if already open
            var alreadyVisible = false;

            if(elem.is(":visible")) {
                alreadyVisible = true;
            }

            function openAfterClose() {
                if(!alreadyVisible) {
                    elem.slideDown();
                    button.addClass("active");
                }
            }

            var anyVisible = $(".mobile-slide:visible").size() > 0;

            if(anyVisible) {
                this.closeSlides(openAfterClose);
            } else {
                openAfterClose();
            }
        },

        /**
         * Make elements "tile link" by applying a click handler which will take to the first <a>
         * target inside the element.
         *
         * This will make tiles take full horizontal width and have hint arrow that
         * the whole tile is clickable.
         *
         * Tile elements are usually expressed as <li><div></div><a></a> or similar notation and then you need
         * to feed <li> elements as the selector for this function.
         *
         * @param {Object} jQuery selector expression of tiles.
         *
         * @return {Object} jQuery selection object used for the manipulation
         */
        applyTileLinks : function(selector) {

            selector = $(selector);

            selector.click(function(e) {

                var $this = $(this);
                var a = $this.find("a"); // Get the primary link in this tile
                var elem = a.get(0);
                var target = $(e.target);



                // We clicked area in tile which is not link
                if(!target.attr("href")) {
                    e.preventDefault();
                    window.location = a.attr("href");
                    return false;
                } else {
                    // The clicked element was a link itself, let the native link handling take over
                    return true;
                }
            });

            selector.addClass("mobile-tile-link");

            return selector;
        },

        /**
         * Populate the left side of the menu
         *
         */
        createSections : function() {

            // Copy portal_tabs to mobile menu
            var target = $("#mobile-menu-entries");
            $("#portal-globalnav li").each(function() {
                var t = $(this).clone(false);
                t.appendTo(target);
            });

        },

        /**
         * Populate right side of the menu
         *
         */
        createQuickMenu : function() {

            // Move quick menu
            var target = $("#mobile-quick-link-entries");
            $(".globalnav #effect li").each(function() {
                var t = $(this).clone(false);
                t.appendTo(target);
            });


        },

        /**
         * Mangle HTML so that
         *
         * - portal tabs are moved to mobile menu
         *
         * - quick links are moved to mobile menu
         */
        createMenu : function() {

            var self = this;

            if(this.isThinClient()) {
                // Avoid Opera Mini issues
                // no client-side clickable elements
                return;
            }

            // Currently handled on the server-side
            // for thin client compatibilty
            // this.createSections();

            this.createQuickMenu();

            // Create switcher
            $("#mobile-menu-button").click(function(e) {
                if(!self.isThinClient()) {
                    e.preventDefault();
                }
                self.openSlide($("#mobile-slide-menu"), $("#mobile-menu-button"));
                return self.isThinClient();
            });

        },

        /**
         * Create mobile search slide menu.
         *
         * Move the actual #portal-searchbox inside the menu using jQuery.
         */
        createSearch : function() {
            var self = this;

            if(this.isThinClient()) {
                // Avoid Opera Mini issues
                // no client-side clickable elements
                return;
            }

            // Currently handled on the server-side
            // for thin client compability
            function moveSearchBox() {
                var e = $("#portal-searchbox");
                e.detach();
                e.appendTo("#mobile-slide-search");

                e.show(); // post CSS load enabling, to prevent page load flicker
            }
            //e.find("[name=SearchableText]").attr("type", "search");

            // Create switcher
            $("#mobile-search-button").click(function(e) {
                if(!self.isThinClient()) {
                    e.preventDefault();
                }
                self.openSlide($("#mobile-slide-search"), $("#mobile-search-button"));
                return self.isThinClient();
            });

            // No live search for mobile
            $("#LSResult").remove();

        },

        /**
         * Open menus based on the link anchor status.
         *
         * Opera Mini and other thin clients might not
         * correctly process the menu Javascript on the client side.
         * They, however, always process init Javascript.
         *
         * We set the fragment on menu open buttons.
         * This may or may not trigger reload in Opera Mini.
         * If the reload is triggered here we catch it and
         * open menus accordingly.
         */
        initMenus : function() {
            var fragment = window.location.hash;

            // note: we wouldn't need makeReloadCloseable hack if
            console.log("Frag:" + fragment);

            if(fragment == "#mobile-menu") {
                this.openSlide($("#mobile-slide-menu"), $("#mobile-menu-button"));
                $("#mobile-menu-button").attr("href", "#mobile-menu-closed");
            } else if(fragment == "#mobile-search") {
                this.openSlide($("#mobile-slide-search"), $("#mobile-search-button"));
                $("#mobile-search-button").attr("href", "#mobile-menu-closed");
            }
        },

        /**
         * Move "Next" to the end of the listing bar
         */
        fixListingBar : function() {

            $(".listingBar").each(function() {
                var $this = $(this);
                var a = $this.find(".next").detach();
                a.appendTo($this);
            });
        },

        /**
         * Used by news aggregator view
         *
         * Convert <dd> <dt> styles listing to mobile tile links.
         *
         */
        applyTileLinksOnPloneListing : function() {

            // Select raw folder listing and AT topic listing
            var itemBodies = $(".template-folder_listing #content-core dd, .template-atct_topic_view #content-core dd, .template-search .searchResults dd");

            var items = itemBodies.each(function() {
                var dd = $(this);
                var dt = dd.prev();
                var heading = dt.html();
                dt.remove();
                dd.prepend(heading);
            });

            // Tilefy news items
            if(items.size() > 0) {
                this.applyTileLinks(itemBodies);

                // Clean icons
                items.find("img").hide();
            }

        },

        /**
         * Apply tile links on the various parts of the site.
         */
        createTileLinkSections : function() {
            this.applyTileLinks(".portletItem, .portletFooter, .tileItem");
        },

        /**
         * Determine if we have loaded mobile.css thru CSS3 media query
         *
         * One trick: https://github.com/viljamis/detectMQ.js/blob/master/detectMQ.js but needs newer devices
         */
        isMobile : function() {

            // Query thru jQuery for maximum compatibility
            var color = $(document.body).css("backgroundColor");

            if(!color) {
                // The document body is missing explicit background color used to identify when mobile.css
                // kicks in
                return;
            }

            // Magic bg color set in mobile.css
            return (color.toLowerCase() == "rgb(255, 255, 254)");
        },

        /**
         * True if you cannot rely click etc. handlers to work.
         */
        isThinClient : function() {
            // http://my.opera.com/community/openweb/idopera/
            return window.opera && navigator.userAgent.indexOf("Mobi") > 0;
            //return true;
        },

        /**
         * Override Plone's default content icons behavior - never show icons on mobile
         */
        disableIcons : function() {
            $(document.body).removeClass("icons-on");
        },


        /**
         * Fix content images aligned to left or right edge
         */
        defloat : function(selector) {

            selector = $(selector);

            // Remove inline float styles
            selector.removeAttr("style");

            // Add special CSS to make it block
            selector.addClass("defloated");

            // Make surrounding <a> also a block
            selector.parent("a").attr("style", "display: block; margin: 0 auto; text-align: center");
        },


        /**
         * Don't allow image-left and image-right align on mobile body text
         */
        defloatImages : function() {
            this.defloat(".portaltype-feedfeederitem #content-core img, .template-document_view #content-core img");
        },

        defloatEventDetails : function() {
            this.defloat(".eventDetails");
        },

        /* In-page table of contents */
        defloatTOC : function() {
            this.defloat(".toc");
        },

        /**
          * Normally #content-core area in Plone contains page body text and
          * we add margins for it for better text readability.
          *
          * However if the content-core contains tile links those links need to
          * reach the full viewport area from left edge to right edge.
          *
          * We fix this situation by detecting tile links and then adding
          * a special CSS class on #content-core so this issue can be worked around in CSS.
          *
          */
        fixContentCoreWithTileLinks : function() {
            if($("#content-core .mobile-tile-link").size() > 0) {
                $("#content-core").addClass("content-core-tile-links");
            }
        },

        enableCarousels : function() {
            $(".image-portlet-carousel").show();
        },


        /**
         * On non-javascript clients (Opera Mini) the mobile menus and searches
         * are in the footer by default.
         *
         * Javascript enabled clients construct a clickable mobile menus
         * in the header on the page by moving bits of HTML around.
         *
         */
        relayout : function() {

            if(this.isThinClient()) {
                // Avoid Opera Mini issues
                // no client-side clickable elements
                return;
            }

            var header = $("#mobile-header");
            var footer = $("#mobile-footer");
            var menus = footer.children().detach();
            header.append(menus);

            $("#mobile-search-link").remove();
            $(".mobile-slide-button").show();

            // Activated by click
            $("#mobile-slide-menu").hide();
            $("#mobile-slide-search").hide();
        },

        /**
         * Mangle HTML on the client side so that it matches mobile layout.
         *
         * Do changes what we cannot achieve with pure CSS.
         *
         * - Move menus
         *
         * - Install mobile specific jQuery UI widgets
         *
         * NOTE: Currently some of the changes cannot be pulled back. If you shrink browser window and enlarge again
         * some content might be lost in the process.
         */
        mobilize : function() {

            console.log("mobilizestart");
            $(document).trigger("mobilizestart", [this]);

            if(this.areWeMobileYet) {
                return;
            }

            this.relayout();

            this.createMenu();
            this.createSearch();
            // this.createTileLinkSections();

            this.fixListingBar();
            this.applyTileLinksOnPloneListing();

            this.defloatImages();
            this.defloatEventDetails();
            this.defloatTOC();

            // this.copyLogo();
            this.enableCarousels();
            this.disableIcons();

            console.log("mobilizeend");
            $(document).trigger("mobilizeend", [this]);

            // Run this post mobilizeend as the
            // custom handler may insert its own tile links
            this.fixContentCoreWithTileLinks();

            this.initMenus();

            this.areWeMobileYet = true;
        },



        /**
         * Do mobile layout fixing or install resize handler on a desktop browser.
         *
         */
        boostrap : function() {

            var self = this;

            // Detect if we need to run mobile mangle and do it only once
            if(this.isMobile()) {
                this.mobilize();
            } else {
                console.log("Not a mobile when mobilize.bootstrap()");
            }

            // Also go mobile when browser window is shrinked
            // note that this is
            $(window).resize(function() {
                if(self.isMobile()) {
                    self.mobilize();
                }
            });
        }
    };

    // Export mobilize namespace
    window.mobilize = mobilize;

    $(document).ready($.proxy(mobilize.boostrap, mobilize));

})(jQuery);