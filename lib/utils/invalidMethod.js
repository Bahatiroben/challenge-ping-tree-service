const sendJson = require('send-data/json')

module.exports = (req, res) => {
  res.statusCode = 405
  return sendJson(req, res, { message: 'Invalid method used' })
}
