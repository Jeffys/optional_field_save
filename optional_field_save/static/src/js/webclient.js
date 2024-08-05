/** @odoo-module **/

const { patch } = require("@web/core/utils/patch");
const { WebClient } = require("@web/webclient/webclient");
const { session } = require("@web/session");
const { useOwnDebugContext } = require ("@web/core/debug/debug_context");
const { DebugMenu } = require ("@web/core/debug/debug_menu");
const { localization } = require ("@web/core/l10n/localization");
const { useBus, useService } = require ("@web/core/utils/hooks");
const { Component, onMounted, useExternalListener, useState } = require ("@odoo/owl");
const { registry } = require ("@web/core/registry");
var rpc = require('web.rpc');

function setup() {
    this.menuService = useService("menu");
    this.actionService = useService("action");
    this.title = useService("title");
    this.router = useService("router");
    this.user = useService("user");
    useService("legacy_service_provider");
    useOwnDebugContext({ categories: ["default"] });
    if (this.env.debug) {
        registry.category("systray").add(
            "web.debug_mode_menu",
            {
                Component: DebugMenu,
            },
            { sequence: 100 }
        );
    }
    this.localization = localization;
    this.state = useState({
        fullscreen: false,
    });
    this.title.setParts({ zopenerp: "Odoo" }); // zopenerp is easy to grep
    useBus(this.env.bus, "ROUTE_CHANGE", this.loadRouterState);
    useBus(this.env.bus, "ACTION_MANAGER:UI-UPDATED", ({ detail: mode }) => {
        if (mode !== "new") {
            this.state.fullscreen = mode === "fullscreen";
        }
    });
    onMounted(() => {
        this.loadRouterState();
        // the chat window and dialog services listen to 'web_client_ready' event in
        // order to initialize themselves:
        this.env.bus.trigger("WEB_CLIENT_READY");
    });
    useExternalListener(window, "click", this.onGlobalClick, { capture: true });
    this.getOptionalActiveFields();

};

async function getOptionalActiveFields() {
    this.optionalActiveFields = {};
    const partnerId = session.partner_id;
    
    const domain = [["id", "=", partnerId]];
    const fields = ["id", "name", "optional_field_save"];
    
    var datapartnerId = await rpc.query({
        model: "res.partner",
        method: "search_read",
        args: [domain, fields],
    });
    await Promise.resolve();
    let jsonField = datapartnerId.length > 0 ? datapartnerId[0].optional_field_save : {};
    const dictionaries = [];
    
    Object.entries(jsonField).forEach(([key, value]) => {
        const dictionary = {};
        const fields = value.split(",");
        fields.forEach(field => {
            dictionary[field] = true;
        });
        dictionaries.push({ key: key, dictionary: Object.keys(dictionary).join(",") });
    });
    
    dictionaries.forEach(item => {
        sessionStorage.setItem(item.key, item.dictionary);
    });
}

WebClient.prototype.setup = setup;
WebClient.prototype.getOptionalActiveFields = getOptionalActiveFields;

return WebClient;