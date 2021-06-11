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
  } else if(req.method === 'GET') {
    // get all targets
    redis.hgetall('targets', function(err, data) {
      if(!err) {
        res.writeHead(200);
        var dataValues = Object.values(data);
        var dataJson = dataValues.map(function(entry) {
          return JSON.parse(entry)
        })
        return res.end(JSON.stringify({data: dataJson, message: 'fetched all targets suceessfully'}))
      }
    })
    return
  }
  return invalidMethod(req, res)
}
