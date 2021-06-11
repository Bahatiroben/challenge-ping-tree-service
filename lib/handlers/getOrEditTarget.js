const invalidMethod = require('../utils/invalidMethod')
const redis = require('../redis')

module.exports = (req, res) => {
    if(req.method === 'GET') {
        var id = req.url.split('/').pop()
        // get all targets
        redis.hget('targets', id, function(err, data) {
        if(!err) {
            if(data === null) {
                res.writeHead(404)
                return res.end(JSON.stringify({message: 'target not found'}))
            }
            res.writeHead(200)
            return res.end(JSON.stringify({message: 'fetched target suceessfully', data: JSON.parse(data)}))
        }
        })
        return
  }
  return invalidMethod(req, res)
}
