var Joi = require('joi')

var createTargetSchema = Joi.object(
  {
    url: Joi.string().required().uri(),
    value: Joi.number().required(),
    maxAcceptsPerDay: Joi.number().min(1).required(),
    accept: Joi.object({
      geoState: Joi.object({ $in: Joi.array().required() }).required(),
      hour: Joi.object({ $in: Joi.array().required() }).required()
    }).required()
  }
).required()

var updateTargetSchema = Joi.object(
  {
    url: Joi.string().optional().uri(),
    value: Joi.number().optional(),
    maxAcceptsPerDay: Joi.number().min(1).optional(),
    accept: Joi.object({
      geoState: Joi.object({ $in: Joi.array().required() }).optional(),
      hour: Joi.ref('geoState')
    }).optional()
  }
).required()

var decisionSchema = Joi.object({
  geoState: Joi.string().length(2).required(),
  publisher: Joi.string().required(),
  timestamp: Joi.date().required()
}).required()

module.exports = {
  updateTargetSchema,
  createTargetSchema,
  decisionSchema
}
