const MockSpinner = function (message, callback) {
  this.message = message
  this.callback = callback
}

MockSpinner.prototype.fail = function () {
  this.callback(this.message, 'fail')

  return this
}

MockSpinner.prototype.start = function () {
  this.callback(this.message, 'start')

  return this
}

MockSpinner.prototype.succeed = function () {
  this.callback(this.message, 'succeed')

  return this
}

module.exports = MockSpinner
