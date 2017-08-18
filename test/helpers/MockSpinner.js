const mockSpinnerFactory = function (message, callback) {
  this.message = message
  this.callback = callback
}

mockSpinnerFactory.prototype.fail = function () {
  this.callback(this.message, 'fail')

  return this
}

mockSpinnerFactory.prototype.start = function () {
  this.callback(this.message, 'start')

  return this
}

mockSpinnerFactory.prototype.succeed = function () {
  this.callback(this.message, 'succeed')

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
