/**
 * <nowiki>
 * Automatically watchlists every page you edit for a user-definable duration
 * (you can still pick a different time using the dropdown, though). Pages
 * already on your watchlist are disregarded.
 * 
 * Tested in Vector, Monobook and Timeless. Not tested with VisualEditor.
 *
 * To install, put the following two lines in your common.js:

window.autoWatchlistExpiry = "2 weeks";
mw.loader.load("/w/index.php?title=User:Rummskartoffel/auto-watchlist-expiry.js&action=raw&ctype=text/javascript"); // Backlink: [[User:Rummskartoffel/auto-watchlist-expiry.js]]

 * Set the window.autoWatchlistExpiry to a duration of your choosing in either
 * hours, days, weeks, or months. There's a limit of 181 days (meaning at most 6
 * months, 25 weeks etc.) imposed by MediaWiki, which I can't do anything about.
 * If the duration specified is invalid, the script won't do anything except
 * print a message to the browser console.
 */
mw.loader.using(["oojs-ui", "mediawiki.api"], function () {
    if (
        ["edit", "submit"].indexOf(mw.config.get("wgAction")) === -1 ||
        $("#ca-unwatch").length
    ) {
        return;
    }
    if (typeof window.autoWatchlistExpiry !== "string" || !is_expiry_valid()) {
        console.error(
            "auto-watchlist-expiry: Window.autoWatchlistExpiry is invalid, exiting."
        );
        return;
    }
    main();

    function main() {
        var expiry_dropdown = OO.ui.infuse($("#wpWatchlistExpiryWidget"));
        var expiry_dropdown_items =
            expiry_dropdown.dropdownWidget.getMenu().items;
        if (
            !expiry_dropdown_items.filter(function (item) {
                return item.data === window.autoWatchlistExpiry;
            }).length
        ) {
            expiry_dropdown.setOptions(
                expiry_dropdown_items
                    .map(function (item) {
                        return { data: item.data, label: item.label };
                    })
                    .concat({
                        data: window.autoWatchlistExpiry,
                    })
            );
        }
        expiry_dropdown.setValue(window.autoWatchlistExpiry);
    }

    function is_expiry_valid() {
        if (window.autoWatchlistExpiry === "infinite") {
            console.warn(
                "auto-watchlist-expiry: Setting window.autoWatchlistExpiry to" +
                    ' "infinite" is possible, but unnecessary. You can just ' +
                    "disable the script to achieve the same result."
            );
            return true;
        }
        var count = parseInt(window.autoWatchlistExpiry.split(" ")[0]),
            unit = window.autoWatchlistExpiry.split(" ")[1];
        if (isNaN(count)) return false;
        if (count === 0) {
            window.autoWatchlistExpiry = "0 days";
            return true;
        }
        if (
            (/hours?/.test(unit) && count <= 4344) ||
            (/days?/.test(unit) && count <= 181) ||
            (/weeks?/.test(unit) && count <= 25) ||
            (/months?/.test(unit) && count <= 6)
        )
            return true;
        return false;
    }
});

// </nowiki>
