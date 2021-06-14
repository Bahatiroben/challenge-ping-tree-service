var bl = require('bl')
var fs = require('fs')
var path = require('path')
process.env.NODE_ENV = 'test'

var test = require('ava')
var servertest = require('servertest')

var redis = require('../lib/redis')
var server = require('../lib/server')

var sampleData = {
  url: 'http://example.com',
  value: '0.50',
  maxAcceptsPerDay: '10',
  accept: {
    geoState: {
      $in: ['ca', 'ny']
    },
    hour: {
      $in: ['13', '14', '15']
    }
  }
}

var date = new Date()
var availableKey = [date.getFullYear(), date.getMonth() + 1, date.getDate(), 'available'].join('-')
var finishedKey = [date.getFullYear(), date.getMonth() + 1, date.getDate(), 'finished'].join('-')

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
  redis.hmset('targets', [1, JSON.stringify({ id: 1, ...sampleData })])
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
  redis.hmset('targets', [1, JSON.stringify({ id: 1, ...sampleData })])
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
  redis.hmset('targets', [1, JSON.stringify({ id: 1, ...sampleData })])
  servertest(server(), url, { encoding: 'json', method: 'GET' }, function (err, res) {
    t.falsy(err, 'no error')
    t.is(res.statusCode, 404, 'correct statusCode')
    t.is(res.body.message, 'target not found', 'correct message returned')
    t.end()
  })
})

test.serial.cb('update a target by ID', function (t) {
  var url = 'api/target/1'
  var serverStream = servertest(server(), url, { encoding: 'json', method: 'POST' })
  fs.createReadStream(path.join(__dirname, '/targetUpdate.json')).pipe(serverStream)

  serverStream.pipe(bl(function (err, data) {
    t.falsy(err, 'no error')
    var stringData = data.toString()
    var res = JSON.parse(stringData)
    t.is(res.message, 'target updated suceessfully')
    t.end()
  }))
})

test.serial.cb('returns 404 when it misses a target during UPDATE target by id', function (t) {
  var url = '/api/target/x1_'
  var serverStream = servertest(server(), url, { encoding: 'json', method: 'POST' })
  fs.createReadStream(path.join(__dirname, '/targetUpdate.json')).pipe(serverStream)

  serverStream.pipe(bl(function (err, data) {
    t.falsy(err, 'no error')
    var stringData = data.toString()
    var res = JSON.parse(stringData)
    t.is(res.message, 'target not found')
    t.end()
  }))
})

test.serial.cb('invalid method', function (t) {
  var url = 'api/targets'
  var serverStream = servertest(server(), url, { encoding: 'json', method: 'PATCH' })
  fs.createReadStream(path.join(__dirname, '/targetUpdate.json')).pipe(serverStream)

  serverStream.pipe(bl(function (err, data) {
    t.falsy(err, 'no error')
    var stringData = data.toString()
    var res = JSON.parse(stringData)
    t.is(res.message, 'Invalid method used')
    t.end()
  }))
})

function initTests () {
  var mockTargets = [
    {
      id: 'i2',
      url: 'http://example60.com',
      value: '0.60',
      maxAcceptsPerDay: '3',
      accept: {
        geoState: {
          $in: ['ca', 'ny']
        },
        hour: {
          $in: ['12', '13', '14']
        }
      }
    },
    {
      id: 'i3',
      url: 'http://example70.com',
      value: '0.70',
      maxAcceptsPerDay: '4',
      accept: {
        geoState: {
          $in: ['ca', 'ny']
        },
        hour: {
          $in: ['15', '16', '17']
        }
      }
    },
    {
      id: 'i4',
      url: 'http://example80.com',
      value: '0.80',
      maxAcceptsPerDay: '5',
      accept: {
        geoState: {
          $in: ['ca', 'ny']
        },
        hour: {
          $in: ['18', '19', '20']
        }
      }
    }
  ]
  redis.hmset('targets', [
    mockTargets[0].id, JSON.stringify(mockTargets[0]),
    mockTargets[1].id, JSON.stringify(mockTargets[1]),
    mockTargets[2].id, JSON.stringify(mockTargets[2])
  ])
}

initTests()
test.serial.cb('should get the available target\'s url and initialize it into the available targets db', function (t) {
  var url = '/route'
  var serverStream = servertest(server(), url, { encoding: 'json', method: 'POST' })
  fs.createReadStream(path.join(__dirname, '/userDetails1.json')).pipe(serverStream)

  serverStream.pipe(bl(function (err, data) {
    t.falsy(err, 'no error')
    var stringData = data.toString()
    var res = JSON.parse(stringData)
    t.is(res.url, 'http://example60.com', 'returns url of the first target')
    redis.hget(availableKey, 'i2', function (error, data) {
      t.falsy(error, 'no error')
      t.is(data, 2, 'first target with i2 is stored with 1 less accepts (3-1)')
      t.end()
    })
  }))
})

test.serial.cb('should return a rejection when the user details does not match any stored target', function (t) {
  var url = '/route'
  var serverStream = servertest(server(), url, { encoding: 'json', method: 'POST' })
  fs.createReadStream(path.join(__dirname, '/userDetails2.json')).pipe(serverStream)

  serverStream.pipe(bl(function (err, data) {
    t.falsy(err, 'no error')
    var stringData = data.toString()
    var res = JSON.parse(stringData)
    t.is(res.decision, 'reject', 'returns a rejection decision since state rw-ki and hour 120 are not supported')
    t.end()
  }))
})

test.serial.cb('should get the target and update its maxAcceptsPerDay if it still has atleast one more accept', function (t) {
  var url = '/route'
  var serverStream = servertest(server(), url, { encoding: 'json', method: 'POST' })
  fs.createReadStream(path.join(__dirname, '/userDetails1.json')).pipe(serverStream)

  serverStream.pipe(bl(function (err, data) {
    t.falsy(err, 'no error')
    var stringData = data.toString()
    var res = JSON.parse(stringData)
    t.is(res.url, 'http://example60.com', 'returns url of the first target')
    redis.hget(availableKey, 'i2', function (error, data) {
      t.falsy(error, 'no error')
      t.is(data, 1, 'first target with i2 is stored with 1 less accepts (2-1)')
      t.end()
    })
  }))
})

test.serial.cb('should get the available target\'s url if its already created and if it hits its limit it gets transfered to finished db', function (t) {
  var url = '/route'
  var serverStream = servertest(server(), url, { encoding: 'json', method: 'POST' })
  fs.createReadStream(path.join(__dirname, '/userDetails1.json')).pipe(serverStream)

  serverStream.pipe(bl(function (err, data) {
    t.falsy(err, 'no error')
    var stringData = data.toString()
    var res = JSON.parse(stringData)
    t.is(res.url, 'http://example60.com', 'returns url of the first target')
    redis.hget(finishedKey, 'i2', function (error, data) {
      t.falsy(error, 'no error')
      t.is(data, 0, 'first target with i2 is stored in finished with 1 less accepts (1-1)')
      t.end()
    })
  }))
})

test.serial.cb('should handle an invalid method on request for target', function (t) {
  var url = '/route'
  var serverStream = servertest(server(), url, { encoding: 'json', method: 'PUT' })
  fs.createReadStream(path.join(__dirname, '/userDetails1.json')).pipe(serverStream)

  serverStream.pipe(bl(function (err, data) {
    t.falsy(err, 'no error')
    var stringData = data.toString()
    var res = JSON.parse(stringData)
    t.is(res.message, 'Invalid method used', 'message for invalid method')
    t.end()
  }))
})
