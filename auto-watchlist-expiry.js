/**
 * <nowiki>
 * Automatically watchlists every page you edit or delete for a user-definable
 * duration. See [[w:en:User:Rummskartoffel/auto-watchlist-expiry]] for usage
 * instructions.
 */
mw.loader.using(["oojs-ui", "mediawiki.api"], function () {
    if ($("#ca-unwatch").length) {
        return;
    }
    if (!is_valid_expiry(window.autoWatchlistExpiry)) {
        console.error(
            "auto-watchlist-expiry: window.autoWatchlistExpiry is invalid, exiting."
        );
        return;
    }
    main(window.autoWatchlistExpiry);

    function main(expiry) {
        if (mw.config.get("wgAction") == "delete") {
            if (!expiry.delete) return;
            if ($(".permissions-errors").length) return;

            var api = new mw.Api();
            var message = "watchlist-expiry-options";
            api.getMessages(message).then(function (response) {
                var default_expiry_options = response[message]
                    .split(",")
                    .map(function (option) {
                        var tmp = option.split(":");
                        return { label: tmp[0], data: tmp[1] };
                    });
                setup_watch_on_delete(default_expiry_options, expiry);
            });
            return;
        }
        var old_editor_expiry_dropdown = $("#wpWatchlistExpiryWidget");
        if (old_editor_expiry_dropdown.length)
            set_dropdown_value(
                OO.ui.infuse(old_editor_expiry_dropdown),
                expiry.edit || expiry
            );
        // Because opening VE, unlike opening the old editor, doesn't navigate
        // and therefore doesn't cause user scripts to be (re-)loaded, we have
        // to register this hook unconditionally.
        mw.hook("ve.saveDialog.stateChanged").add(function () {
            set_dropdown_value(
                ve.init.target.saveDialog.checkboxesByName.wpWatchlistExpiry,
                expiry.edit || expiry
            );
        });
    }

    function setup_watch_on_delete(default_expiry_options, expiry) {
        var watch_checkbox_field_layout = OO.ui.infuse(
            $("#wpWatch").closest(".oo-ui-fieldLayout")
        );

        var expiry_dropdown = new OO.ui.DropdownInputWidget({
            options: default_expiry_options,
        });
        set_dropdown_value(expiry_dropdown, expiry.delete);
        watch_checkbox_field_layout.$element.after(expiry_dropdown.$element);

        $("#deleteconfirm").on("submit", function () {
            var watch_checkbox = watch_checkbox_field_layout.getField();
            if (watch_checkbox.isSelected()) {
                new mw.Api().watch(
                    mw.config.get("wgRelevantPageName"),
                    expiry_dropdown.getValue()
                );
            }
        });
    }

    function set_dropdown_value(dropdown, value) {
        var items = dropdown.dropdownWidget.getMenu().items;
        if (
            !items.filter(function (item) {
                return item.data === value;
            }).length
        ) {
            dropdown.setOptions(
                items
                    .map(function (item) {
                        return { data: item.data, label: item.label };
                    })
                    .concat({
                        data: value,
                    })
            );
        }
        dropdown.setValue(value);
    }

    function is_valid_expiry(expiry) {
        if (typeof expiry === "string") {
            if (expiry === "infinite") return true;

            var tmp = expiry.split(" "),
                count = parseInt(tmp[0]),
                unit = tmp[1];
            if (isNaN(count)) return false;
            if (
                (/hours?/.test(unit) && count <= 4344) ||
                (/days?/.test(unit) && count <= 181) ||
                (/weeks?/.test(unit) && count <= 25) ||
                (/months?/.test(unit) && count <= 6)
            )
                return true;
            return false;
        } else if (typeof expiry === "object") {
            var result = true;
            if (expiry.delete) {
                result &&= typeof expiry.delete == "string";
                result &&= is_valid_expiry(expiry.delete);
            }
            return result && is_valid_expiry(expiry.edit);
        }
        return false;
    }
});

// </nowiki>
