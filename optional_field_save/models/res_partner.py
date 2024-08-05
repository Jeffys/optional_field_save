from odoo import fields, models

class Partner(models.Model):

    _inherit = "res.partner"
    
    optional_field_save = fields.Json(string="Optional Field Save", default={})
