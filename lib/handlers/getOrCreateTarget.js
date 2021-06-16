const sendJson = require('send-data/json')
const invalidMethod = require('../utils/invalidMethod')
const redis = require('../redis')
const { createTargetSchema } = require('../utils/validate')

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const id = req.id
    const { error } = await createTargetSchema.validate(req.body)
    if (error) {
      res.statusCode = 400
      return sendJson(req, res, { error: error.details[0].message, message: 'validation error' })
    }
    const target = { id: id, ...req.body }
    // use hashes for storing targets
    redis.hmset('targets', [id, JSON.stringify(target)], () => {
      res.statusCode = 201
      return sendJson(req, res, { message: 'target created', id })
    })
    return
  } else if (req.method === 'GET') {
    // get all targets
    redis.hgetall('targets', function (err, data) {
      if (!err) {
        res.statusCode = 200
        var dataValues = Object.values(data)
        var dataJson = dataValues.map(function (entry) {
          return JSON.parse(entry)
        })
        return sendJson(req, res, { data: dataJson, message: 'fetched all targets suceessfully' })
      }
    })
    return
  }
  return invalidMethod(req, res)
}
