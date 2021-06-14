var invalidMethod = require('../utils/invalidMethod')
var redis = require('../redis')
var { promisify } = require('util')

var date = new Date()
var availableKey = [date.getFullYear(), date.getMonth() + 1, date.getDate(), 'available'].join('-')
var finishedKey = [date.getFullYear(), date.getMonth() + 1, date.getDate(), 'finished'].join('-')
module.exports = async (req, res) => {
  if (req.method === 'POST') {
    var clientInfo = req.body
    var availableKey = [date.getFullYear(), date.getMonth() + 1, date.getDate(), 'available'].join('-')
    var finishedKey = [date.getFullYear(), date.getMonth() + 1, date.getDate(), 'finished'].join('-')
    // get all targets
    await redis.hgetall('targets', async function (err, data) {
      if (data && !err) {
        var dataValues = Object.values(data)
        var dataJson = dataValues.map(function (entry) {
          return JSON.parse(entry)
        })
        // fetch the already finished targets year:month:day returns ids
        var alreadyDoneTargets = await getAlreadyDoneTargets()
        var alreadyDoneTargetIds = Object.keys(alreadyDoneTargets)
        var allowedTargets = dataJson.filter(function (entry) {
          var clientHour = parseInt(clientInfo.timestamp.split('T')[1].split(':')[0])
          return (entry.accept.geoState.$in.indexOf(clientInfo.geoState) !== -1 &&
                    entry.accept.hour.$in[0] <= clientHour &&
                    entry.accept.hour.$in[entry.accept.hour.$in.length - 1] >= clientHour &&
                    alreadyDoneTargetIds.indexOf(entry.id) === -1)
        })
        if (allowedTargets.length < 1) {
          // there is no matching target
          res.writeHead(404)
          return res.end(JSON.stringify({ decision: 'reject' }))
        }
        // sort them from max to min
        var sortedMaxToMinTargets = allowedTargets.sort(function (min, max) {
          return max.value - min.value
        })
        var choosenTarget = sortedMaxToMinTargets[0]
        // if already ordered, decrement
        var maxAcceptsForCreatedTarget = await getAvailableTarget(choosenTarget.id)
        if (maxAcceptsForCreatedTarget) {
          choosenTarget.maxAcceptsPerDay = maxAcceptsForCreatedTarget - 1
          if (maxAcceptsForCreatedTarget - 1 < 1) {
            // last one. store into non available and delete from available
            redis.hdel(availableKey, choosenTarget.id)
            redis.hmset(finishedKey, [choosenTarget.id, choosenTarget.maxAcceptsPerDay])
            res.writeHead(200)
            return res.end(JSON.stringify({ url: choosenTarget.url }))
          } else {
            // there are still more than one(last). rekeep
            redis.hmset(availableKey, [choosenTarget.id, choosenTarget.maxAcceptsPerDay])
            res.writeHead(200)
            return res.end(JSON.stringify({ url: choosenTarget.url }))
          }
        } else {
          // means it is requested for the first time. decrement one and store into available
          redis.hmset(availableKey, [choosenTarget.id, choosenTarget.maxAcceptsPerDay - 1])
          res.writeHead(200)
          return res.end(JSON.stringify({ url: choosenTarget.url }))
        }
      } else {
        res.writeHead(404)
        return res.end(JSON.stringify({ decision: 'reject' }))
      }
    })
    return
  }
  return invalidMethod(req, res)
}

async function getAlreadyDoneTargets () {
  const hgetall = promisify(redis.hgetall).bind(redis)
  var targets = {}
  await hgetall(finishedKey).then(function (data) {
    targets = data || {}
  })
  return targets
}

async function getAvailableTarget (id) {
  const hget = promisify(redis.hget).bind(redis)
  var targetsMaxAccepts
  await hget(availableKey, id).then(function (value) {
    targetsMaxAccepts = value
  })
  return targetsMaxAccepts
}
