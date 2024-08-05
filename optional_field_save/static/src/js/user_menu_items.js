/** @odoo-module **/

import { browser } from "@web/core/browser/browser";
import { registry } from "@web/core/registry";
import { _t } from "@web/core/l10n/translation";
import { logOutItem as OriginalLogOutItem } from "@web/webclient/user_menu/user_menu_items";
import { session } from '@web/session';
import { useBus, useService } from "@web/core/utils/hooks";

function CustomLogOutItem(env) {
    const route = "/web/session/logout";
    return {
        type: "item",
        id: "logout",
        description: _t("Log out"),
        href: `${browser.location.origin}${route}`,
        callback: () => {
            const keys = Object.keys(sessionStorage);
            const keysWithData = keys.filter(key => key.includes('optional_field')); // Filter with word  "optional_field"
            keysWithData.forEach(key => {
                console.log(`Key: ${key}`);
                sessionStorage.removeItem(key)
            });
            browser.location.href = route;
        },
        sequence: 70,
    };
}

registry.category("user_menuitems").remove("log_out"); registry.category("user_menuitems").add("log_out", CustomLogOutItem);

export { OriginalLogOutItem };
