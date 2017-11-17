const mockSpinnerFactory = function (message, callback) {
  this.message = message
  this.callback = callback
}

mockSpinnerFactory.prototype.fail = function (newMessage) {
  this.callback(newMessage || this.message, 'fail')

  return this
}

mockSpinnerFactory.prototype.start = function (newMessage) {
  this.callback(newMessage || this.message, 'start')

  return this
}

mockSpinnerFactory.prototype.succeed = function (newMessage) {
  this.callback(newMessage || this.message, 'succeed')

  return this
}

mockSpinnerFactory.prototype.warn = function (newMessage) {
  this.callback(newMessage || this.message, 'warn')

  return this
}

let mockSpinner
let mockSpinnerOutput = jest.fn()

jest.mock('ora', () => {
  return message => {
    mockSpinner = new mockSpinnerFactory(message, mockSpinnerOutput)

    return mockSpinner
  }
})

beforeEach(() => {
  mockSpinnerOutput.mockClear()
})

module.exports = mockSpinnerOutput
module.exports.factory = mockSpinnerFactory
