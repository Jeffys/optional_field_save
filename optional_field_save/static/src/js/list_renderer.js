/** @odoo-module **/

const { browser } = require("@web/core/browser/browser");
const { session } = require("@web/session");
const { ListRenderer } = require("@web/views/list/list_renderer");
var rpc = require('web.rpc');

function getOptionalActiveFields() {
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
};

function saveOptionalActiveFields() {
    this.setDatabase(this.keyOptionalFields, Object.keys(this.optionalActiveFields).filter((fieldName) => this.optionalActiveFields[fieldName]));
    browser.localStorage.setItem(this.keyOptionalFields, Object.keys(this.optionalActiveFields).filter((fieldName) => this.optionalActiveFields[fieldName]));
};

async function setDatabase(value1, value2) {
    const partnerId = session.partner_id;
    const domain = [["id", "=", partnerId]];
    const fields = ["id", "name", "optional_field_save"];
    var datapartnerId = await rpc.query({
        model: "res.partner",
        method: "search_read",
        args: [domain, fields],
    });
    if (datapartnerId) {
        let old_value = {}
        old_value = datapartnerId[0].optional_field_save;
        const keysToCheck = Object.keys(old_value);
        let string = value1;
        let arrayString = string.split(",");
        let key = "optional_field." + arrayString[1];
        let value = value2.join(",");
        if (keysToCheck.includes(key)) {
            old_value[key] = value;
            browser.sessionStorage.removeItem(key);
            browser.sessionStorage.setItem(key, value);
            await rpc.query({
                model: 'res.partner',
                method: 'write',
                args: [[partnerId], { optional_field_save: old_value }],
            })
        } else {
            if (!old_value) {
                old_value = { [key]: value };
                await rpc.query({
                    model: 'res.partner',
                    method: 'write',
                    args: [[partnerId], { optional_field_save: old_value }],
                })
                browser.sessionStorage.setItem(key, value);
            } else {
                old_value[key] = value;
                await rpc.query({
                    model: 'res.partner',
                    method: 'write',
                    args: [[partnerId], { optional_field_save: old_value }],
                })
                browser.sessionStorage.setItem(key, value);
            }
        }
    } else {
        console.error("Error fetching data:", error);
    }
};

ListRenderer.prototype.saveOptionalActiveFields = saveOptionalActiveFields;
ListRenderer.prototype.getOptionalActiveFields = getOptionalActiveFields;
ListRenderer.prototype.setDatabase = setDatabase;

return ListRenderer;