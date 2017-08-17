const mockSpinner = require('./../helpers/MockSpinner')
const MOCK_COMMAND_OUTPUT = {
  'ls': 'dir1\ndir2\ndir3',
  'pwd': '/data/dadi/products/cli',
  'rm .': new Error('"." and ".." may not be removed')
}

let mockSpinnerOutput = jest.fn()
let mockExec = jest.fn((command, callback) => {
  setTimeout(() => {
    const result = MOCK_COMMAND_OUTPUT[command]

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

jest.mock('ora', () => {
  return message => new mockSpinner(message, mockSpinnerOutput)
})

const shell = require('./../../lib/shell')

beforeEach(() => {
  mockExec.mockClear()
  mockSpinnerOutput.mockClear()
})

describe('Shell utility', () => {
  describe('`run()`', () => {
    test('runs a shell command provided as a string', () => {
      const command = 'ls'
      const lsMock = jest.fn()

      return shell.run(command).then(stdout => {
        expect(mockExec).toHaveBeenCalledTimes(1)
        expect(mockExec.mock.calls[0][0]).toEqual(command)
        expect(stdout).toEqual(MOCK_COMMAND_OUTPUT[command])
      })
    })

    test('runs a shell command provided as a command object', () => {
      const command = shell.command('ls')
      const lsMock = jest.fn()

      return shell.run(command).then(stdout => {
        expect(mockExec).toHaveBeenCalledTimes(1)
        expect(mockExec.mock.calls[0][0]).toEqual(command.command)
        expect(stdout).toEqual(MOCK_COMMAND_OUTPUT[command.command])        
      })
    })

    test('runs a shell command and outputs a progress message that transforms into a check mark if the command succeeds', () => {
      const message = 'Listing directory'
      const command = shell.command('ls', message)
      const lsMock = jest.fn()

      const execution = shell.run(command)

      expect(mockSpinnerOutput).toHaveBeenCalledTimes(1)
      expect(mockSpinnerOutput.mock.calls[0][0]).toEqual(message)
      expect(mockSpinnerOutput.mock.calls[0][1]).toEqual('start')

      return execution.then(stdout => {
        expect(mockExec).toHaveBeenCalledTimes(1)
        expect(mockExec.mock.calls[0][0]).toEqual(command.command)
        expect(stdout).toEqual(MOCK_COMMAND_OUTPUT[command.command])

        expect(mockSpinnerOutput).toHaveBeenCalledTimes(2)
        expect(mockSpinnerOutput.mock.calls[1][0]).toEqual(message)
        expect(mockSpinnerOutput.mock.calls[1][1]).toEqual('succeed')
      })
    })

    test('runs a shell command and outputs a progress message that transforms into a check mark if the command fails', () => {
      const message = 'Removing current directory'
      const command = shell.command('rm .', message)
      const mockOutput = MOCK_COMMAND_OUTPUT[command.command]
      const lsMock = jest.fn()

      const execution = shell.run(command)

      expect(mockSpinnerOutput).toHaveBeenCalledTimes(1)
      expect(mockSpinnerOutput.mock.calls[0][0]).toEqual(message)
      expect(mockSpinnerOutput.mock.calls[0][1]).toEqual('start')

      return execution.catch(error => {
        expect(mockExec).toHaveBeenCalledTimes(1)
        expect(mockExec.mock.calls[0][0]).toEqual(command.command)
        expect(error).toBe(mockOutput)

        expect(mockSpinnerOutput).toHaveBeenCalledTimes(2)
        expect(mockSpinnerOutput.mock.calls[1][0]).toEqual(message)
        expect(mockSpinnerOutput.mock.calls[1][1]).toEqual('fail')
      })
    })
  })

  describe('`runAll()`', () => {
    test('runs a sequence of commands and outputs their progress messages', () => {
      const commands = [
        shell.command(
          'pwd',
          'Getting information about current path'
        ),
        shell.command(
          'ls',
          'Listing current directory'
        )
      ]

      return shell.runAll(commands).then(stdout => {
        expect(mockExec).toHaveBeenCalledTimes(2)

        expect(mockExec.mock.calls[0][0]).toEqual(commands[0].command)
        expect(mockSpinnerOutput.mock.calls[0][0]).toEqual(commands[0].message)
        expect(mockSpinnerOutput.mock.calls[0][1]).toEqual('start')
        expect(mockSpinnerOutput.mock.calls[1][0]).toEqual(commands[0].message)
        expect(mockSpinnerOutput.mock.calls[1][1]).toEqual('succeed')

        expect(mockExec.mock.calls[1][0]).toEqual(commands[1].command)
        expect(mockSpinnerOutput.mock.calls[2][0]).toEqual(commands[1].message)
        expect(mockSpinnerOutput.mock.calls[2][1]).toEqual('start')
        expect(mockSpinnerOutput.mock.calls[3][0]).toEqual(commands[1].message)
        expect(mockSpinnerOutput.mock.calls[3][1]).toEqual('succeed')
      })
    })

    test('runs a sequence of commands and stops if one fails', () => {
      const commands = [
        shell.command(
          'pwd',
          'Getting information about current path'
        ),
        shell.command(
          'rm .',
          'Removing current directory'
        ),
        shell.command(
          'ls',
          'Listing current directory'
        )
      ]

      return shell.runAll(commands).catch(error => {
        expect(mockExec).toHaveBeenCalledTimes(2)
        expect(mockExec.mock.calls[0][0]).toEqual(commands[0].command)
        expect(mockExec.mock.calls[1][0]).toEqual(commands[1].command)
      })
    })
  })

  describe('`showSpinner`', () => {
    test('starts a spinner with the given message and returns a reference to itself', () => {
      const message = 'Who\'s your DADI?'
      const spinner = shell.showSpinner(message)

      expect(mockSpinnerOutput).toHaveBeenCalledTimes(1)
      expect(mockSpinnerOutput.mock.calls[0][0]).toEqual(message)
      expect(mockSpinnerOutput.mock.calls[0][1]).toEqual('start')
      expect(spinner.constructor).toBe(mockSpinner)
    })
  })
})
