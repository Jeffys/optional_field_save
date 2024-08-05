/** @odoo-module **/

const { patch } = require("@web/core/utils/patch");
const { WebClient } = require("@web/webclient/webclient");
const { session } = require("@web/session");

patch(WebClient.prototype, {
    setup() {
        this.session = session;
        super.setup();
        this.getOptionalActiveFields();
    },

    async getOptionalActiveFields() {
        this.optionalActiveFields = {};
        const partnerId = session.partner_id;
        let datapartnerId = await this.orm.call("res.partner", "search_read", [[["id", "=", partnerId]], ["id", "name", "optional_field_save"]]);
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
    },
});
