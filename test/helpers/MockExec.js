let nextResponse

const mockCommandOutput = {
  'ls': 'dir1\ndir2\ndir3',
  'pwd': '/data/dadi/products/cli',
  'rm .': new Error('"." and ".." may not be removed')
}

const mockExec = jest.fn((command, options, callback) => {
  if (typeof options === 'function') {
    callback = options
  }

  setTimeout(() => {
    let result

    if (nextResponse) {
      result = nextResponse

      nextResponse = undefined
    } else {
      result = mockCommandOutput[command] || ''
    }

    if (result instanceof Error) {
      callback(result, null, result.message)
    } else {
      callback(null, result, null)
    }
  }, 500)
})

jest.mock('child_process', () => ({
  exec: mockExec
}))

beforeEach(() => {
  mockExec.mockClear()
})

module.exports = mockExec
module.exports.map = mockCommandOutput
module.exports.setNextResponse = response => {
  nextResponse = response
}
