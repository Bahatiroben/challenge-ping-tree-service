const sendJson = require('send-data/json')
const invalidMethod = require('../utils/invalidMethod')
const redis = require('../redis')
const { updateTargetSchema } = require('../utils/validate')

module.exports = async (req, res) => {
  var id = req.url.split('/').pop()
  if (req.method === 'GET') {
    // get all targets
    redis.hget('targets', id, function (err, data) {
      if (!err) {
        if (data === null) {
          res.statusCode = 404
          return sendJson(req, res, { message: 'target not found' })
        }
        res.statusCode = 200
        return sendJson(req, res, { message: 'fetched target suceessfully', data: JSON.parse(data) })
      }
    })
    return
  } else if (req.method === 'POST') {
    const { error } = await updateTargetSchema.validate(req.body)
    if (error) {
      res.statusCode = 400
      return sendJson(req, res, { error: error.details[0].message, message: 'validation error' })
    }
    return redis.hget('targets', id, function (err, data) {
      if (!err) {
        if (data === null) {
          res.statusCode = 404
          return sendJson(req, res, { message: 'target not found' })
        }
        // UPDATE the target
        var currentTarget = JSON.parse(data)
        var updatedTarget = { ...currentTarget, ...req.body }
        redis.hmset('targets', [id, JSON.stringify(updatedTarget)], function () {
          res.statusCode = 200
          return sendJson(req, res, { message: 'target updated suceessfully' })
        })
      }
    })
  }
  return invalidMethod(req, res)
}
