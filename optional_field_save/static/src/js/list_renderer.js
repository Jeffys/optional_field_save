/** @odoo-module **/

const { patch } = require("@web/core/utils/patch");
const { browser } = require("@web/core/browser/browser");
const { registry } = require("@web/core/registry");
const { useService } = require("@web/core/utils/hooks");
const { session } = require("@web/session");
const { ListRenderer } = require("@web/views/list/list_renderer");

patch(ListRenderer.prototype, {
    setup() {
        this.session = session;
        this.orm = useService("orm");
        super.setup();
    },

    getOptionalActiveFields() {
        this.optionalActiveFields = {};
        let key = this.keyOptionalFields;
        let str = this.keyOptionalFields.split(",")[1];
        str = "optional_field." + str;
        let optionalActiveFields = sessionStorage.getItem(str) || browser.localStorage.getItem(this.keyOptionalFields);
        const optionalColumn = this.allColumns.filter((col) => col.type === "field" && col.optional);
        if (optionalActiveFields) {
            optionalActiveFields = optionalActiveFields.split(",");
            optionalColumn.forEach((col) => {
                this.optionalActiveFields[col.name] = optionalActiveFields.includes(col.name);
            });
        } else if (optionalActiveFields !== "") {
            for (const col of optionalColumn) {
                this.optionalActiveFields[col.name] = col.optional === "show";
            }
        }
        if (this.props.onOptionalFieldsChanged) {
            this.props.onOptionalFieldsChanged(this.optionalActiveFields);
        }
    },

    saveOptionalActiveFields() {
        this.setDatabase(this.keyOptionalFields, Object.keys(this.optionalActiveFields).filter((fieldName) => this.optionalActiveFields[fieldName]));
        browser.localStorage.setItem(this.keyOptionalFields, Object.keys(this.optionalActiveFields).filter((fieldName) => this.optionalActiveFields[fieldName]));
    },

    async setDatabase(value1, value2) {
        try {
            const partnerId = session.partner_id;
            const datapartnerId = await this.orm.call("res.partner", "search_read", [[["id", "=", partnerId]], ["id", "name", "optional_field_save"]]);
            let old_value = {}
            old_value = datapartnerId[0].optional_field_save;
            let keysToCheck = Object.keys(old_value);
            let string = value1;
            let arrayString = string.split(",");
            let key = "optional_field." + arrayString[1];
            let value = value2.join(",");
            if (datapartnerId.length > 0) {
                if (keysToCheck.includes(key)) {
                    old_value[key] = value;
                    await this.orm.call("res.partner", "write", [[partnerId], { optional_field_save: old_value }]);
                    browser.sessionStorage.removeItem(key);
                    browser.sessionStorage.setItem(key, value);
                } else {
                    if (!old_value) {
                        old_value = { [key]: value };
                        browser.sessionStorage.setItem(key, value);
                    } else {
                        old_value[key] = value;
                        browser.sessionStorage.setItem(key, value);
                    }
                    await this.orm.call("res.partner", "write", [[partnerId], { optional_field_save: old_value }]);
                }
            } else {
                console.warn("Partner not found");
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    },
});
