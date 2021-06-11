const invalidMethod = require('../utils/invalidMethod')
const redis = require('../redis')

module.exports = (req, res) => {
  if (req.method === 'POST') {
    const id = req.id
    const target = { id: id, ...req.body }
    // use hashes for storing targets
    redis.hmset('targets', [id, JSON.stringify(target)], () => {
      res.writeHead(201)
      return res.end(JSON.stringify({ message: 'target created', id }))
    })
    return
  }
  return invalidMethod(req, res)
}
