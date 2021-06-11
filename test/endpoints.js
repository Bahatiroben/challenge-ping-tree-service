var bl = require('bl')
var fs = require('fs')
var path = require('path')
var sampleData = {
  "url": "http://example.com",
  "value": "0.50",
  "maxAcceptsPerDay": "10",
  "accept": {
      "geoState": {
          "$in": ["ca", "ny"]
      },
        "hour": {
          "$in": [ "13", "14", "15" ]
        }
  }
}
process.env.NODE_ENV = 'test'

var test = require('ava')
var servertest = require('servertest')

var server = require('../lib/server')

test.serial.cb('healthcheck', function (t) {
  var url = '/health'
  servertest(server(), url, { encoding: 'json' }, function (err, res) {
    t.falsy(err, 'no error')

    t.is(res.statusCode, 200, 'correct statusCode')
    t.is(res.body.status, 'OK', 'status is ok')
    t.end()
  })
})

test.serial.cb('post a target', function (t) {
  var url = 'api/targets'
  var serverStream = servertest(server(), url, { encoding: 'json', method: 'POST' })
  fs.createReadStream(path.join(__dirname, '/sampleTarget1.json')).pipe(serverStream)

  serverStream.pipe(bl(function (err, data) {
    t.falsy(err, 'no error')
    var stringData = data.toString()
    var res = JSON.parse(stringData)
    t.is(res.message, 'target created', 'correct message returned')
    t.truthy(res.id, 'non empty id returned')
    t.end()
  }))
})

test.serial.cb('get all targets', function (t) {
  var url = '/api/targets'
  const redis = require('../lib/redis');
  redis.hmset('targets', [1, JSON.stringify({id: 1, ...sampleData})])
  servertest(server(), url, { encoding: 'json', method: 'GET' }, function (err, res) {
    t.falsy(err, 'no error')
    t.is(res.statusCode, 200, 'correct statusCode')
    t.is(res.body.message, 'fetched all targets suceessfully', 'correct status code returned')
    t.truthy(res.body.data)
    t.end()
  })
})

test.serial.cb('get target by id', function (t) {
  var url = '/api/target/1'
  const redis = require('../lib/redis');
  redis.hmset('targets', [1, JSON.stringify({id: 1, ...sampleData})])
  servertest(server(), url, { encoding: 'json', method: 'GET' }, function (err, res) {
    t.falsy(err, 'no error')
    t.is(res.statusCode, 200, 'correct statusCode')
    t.is(res.body.message, 'fetched target suceessfully', 'correct message returned')
    t.is(res.body.data.id, 1, 'the returned target id matches the is in the url 1')
    t.end()
  })
})

test.serial.cb('returns 404 when it misses a target during get target by id', function (t) {
  var url = '/api/target/x1_'
  const redis = require('../lib/redis');
  redis.hmset('targets', [1, JSON.stringify({id: 1, ...sampleData})])
  servertest(server(), url, { encoding: 'json', method: 'GET' }, function (err, res) {
    t.falsy(err, 'no error')
    t.is(res.statusCode, 404, 'correct statusCode')
    t.is(res.body.message, 'target not found', 'correct message returned')
    t.end()
  })
})

test.serial.cb('invalid method', function (t) {
  var url = '/api/targets'
  servertest(server(), url, { encoding: 'json', method: 'PUT' }, function (err, res) {
    t.falsy(err, 'no error')
    t.is(res.statusCode, 405, 'correct statusCode')
    t.is(res.body.message, 'Invalid method used', 'status is for invalid method')
    t.end()
  })
})