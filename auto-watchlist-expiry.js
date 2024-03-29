/**
 * <nowiki>
 * Automatically watchlists every page you edit or delete for a user-definable
 * duration. See [[w:en:User:Rummskartoffel/auto-watchlist-expiry]] for usage
 * instructions.
 */
mw.loader.using(["oojs-ui", "mediawiki.api", "mediawiki.Uri"], function () {
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
            // TODO: Cache this when possible
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

        // Because opening VE, unlike opening the old editor, doesn't navigate
        // and therefore doesn't cause user scripts to be (re-)loaded, we have
        // to register its hook unconditionally. Handling the old editor
        // unconditionally as well is not necessary, but simplifies the code.
        if (mw.config.get("wgCurRevisionId") == 0 && expiry.create)
            setup_watch_on_edit(expiry.create);
        else if (new mw.Uri(location.toString()).query.undo && expiry.undo)
            setup_watch_on_edit(expiry.undo);
        else setup_watch_on_edit(expiry.edit || expiry);
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

    /**
     * @param {string} expiry
     */
    function setup_watch_on_edit(expiry) {
        var old_editor_expiry_dropdown = $("#wpWatchlistExpiryWidget");
        if (old_editor_expiry_dropdown.length)
            set_dropdown_value(
                OO.ui.infuse(old_editor_expiry_dropdown),
                expiry
            );

        mw.hook("ve.saveDialog.stateChanged").add(function () {
            set_dropdown_value(
                ve.init.target.saveDialog.checkboxesByName.wpWatchlistExpiry,
                expiry
            );
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
            var maxYears = 1,
                maxMonths = 12 * maxYears,
                maxWeeks = 52 * maxYears,
                maxDays = 365 * maxYears,
                maxHours = 24 * maxDays;
            if (
                (/hours?/.test(unit) && count <= maxHours) ||
                (/days?/.test(unit) && count <= maxDays) ||
                (/weeks?/.test(unit) && count <= maxWeeks) ||
                (/months?/.test(unit) && count <= maxMonths) ||
                (/years?/.test(unit) && count <= maxYears)
            )
                return true;
            return false;
        } else if (typeof expiry === "object") {
            var optional_options = ["delete", "create", "undo"];
            for (var i = 0; i < optional_options.length; ++i) {
                if (expiry[optional_options[i]]) {
                    if (
                        typeof expiry[optional_options[i]] !== "string" ||
                        !is_valid_expiry(expiry[optional_options[i]])
                    )
                        return false;
                }
            }
            return is_valid_expiry(expiry.edit);
        }
        return false;
    }
});

// </nowiki>
