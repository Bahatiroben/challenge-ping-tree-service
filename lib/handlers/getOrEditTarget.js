const invalidMethod = require('../utils/invalidMethod')
const redis = require('../redis')

module.exports = (req, res) => {
    var id = req.url.split('/').pop()
    if (req.method === 'GET') {
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
  } else if (req.method === 'POST') {
        return redis.hget('targets', id, function(err, data) {
        if (!err) {
            if(data === null) {
                res.writeHead(404)
                return res.end(JSON.stringify({message: 'target not found'}))
            }
            // UPDATE the target
            var currentTarget = JSON.parse(data);
            var updatedTarget = {...currentTarget, ...req.body};
            redis.hmset('targets', [id, JSON.stringify(updatedTarget)], function() {
                res.writeHead(200)
                return res.end(JSON.stringify({message: 'target updated suceessfully'}))
            })
        }
    })
  }
  return invalidMethod(req, res)
}
