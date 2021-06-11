var bl = require('bl')
var fs = require('fs')
var path = require('path')

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

test.serial.cb('invalid method', function (t) {
  var url = '/api/targets'
  servertest(server(), url, { encoding: 'json', method: 'GET' }, function (err, res) {
    t.falsy(err, 'no error')
    t.is(res.statusCode, 405, 'correct statusCode')
    t.is(res.body.message, 'Invalid method used', 'status is for invalid method')
    t.end()
  })
})
