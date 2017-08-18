const mockExec = require('./../helpers/MockExec')
const mockSpinner = require('./../helpers/MockSpinner')
const mockCommandOutput = require('./../helpers/MockExec').map
const shell = require('./../../lib/shell')

describe('Shell utility', () => {
  describe('`run()`', () => {
    test('runs a shell command provided as a string', () => {
      const command = 'ls'
      const lsMock = jest.fn()

      return shell.run(command).then(stdout => {
        expect(mockExec).toHaveBeenCalledTimes(1)
        expect(mockExec.mock.calls[0][0]).toEqual(command)
        expect(stdout).toEqual(mockCommandOutput[command])
      })
    })

    test('runs a shell command provided as a command object', () => {
      const command = shell.command('ls')
      const lsMock = jest.fn()

      return shell.run(command).then(stdout => {
        expect(mockExec).toHaveBeenCalledTimes(1)
        expect(mockExec.mock.calls[0][0]).toEqual(command.command)
        expect(stdout).toEqual(mockCommandOutput[command.command])        
      })
    })

    test('runs a shell command and outputs a progress message that transforms into a check mark if the command succeeds', () => {
      const message = 'Listing directory'
      const command = shell.command('ls', message)
      const lsMock = jest.fn()

      const execution = shell.run(command)

      expect(mockSpinner).toHaveBeenCalledTimes(1)
      expect(mockSpinner.mock.calls[0][0]).toEqual(message)
      expect(mockSpinner.mock.calls[0][1]).toEqual('start')

      return execution.then(stdout => {
        expect(mockExec).toHaveBeenCalledTimes(1)
        expect(mockExec.mock.calls[0][0]).toEqual(command.command)
        expect(stdout).toEqual(mockCommandOutput[command.command])

        expect(mockSpinner).toHaveBeenCalledTimes(2)
        expect(mockSpinner.mock.calls[1][0]).toEqual(message)
        expect(mockSpinner.mock.calls[1][1]).toEqual('succeed')
      })
    })

    test('runs a shell command and outputs a progress message that transforms into a check mark if the command fails', () => {
      const message = 'Removing current directory'
      const command = shell.command('rm .', message)
      const mockOutput = mockCommandOutput[command.command]
      const lsMock = jest.fn()

      const execution = shell.run(command)

      expect(mockSpinner).toHaveBeenCalledTimes(1)
      expect(mockSpinner.mock.calls[0][0]).toEqual(message)
      expect(mockSpinner.mock.calls[0][1]).toEqual('start')

      return execution.catch(error => {
        expect(mockExec).toHaveBeenCalledTimes(1)
        expect(mockExec.mock.calls[0][0]).toEqual(command.command)
        expect(error).toBe(mockOutput)

        expect(mockSpinner).toHaveBeenCalledTimes(2)
        expect(mockSpinner.mock.calls[1][0]).toEqual(message)
        expect(mockSpinner.mock.calls[1][1]).toEqual('fail')
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
        expect(mockSpinner.mock.calls[0][0]).toEqual(commands[0].message)
        expect(mockSpinner.mock.calls[0][1]).toEqual('start')
        expect(mockSpinner.mock.calls[1][0]).toEqual(commands[0].message)
        expect(mockSpinner.mock.calls[1][1]).toEqual('succeed')

        expect(mockExec.mock.calls[1][0]).toEqual(commands[1].command)
        expect(mockSpinner.mock.calls[2][0]).toEqual(commands[1].message)
        expect(mockSpinner.mock.calls[2][1]).toEqual('start')
        expect(mockSpinner.mock.calls[3][0]).toEqual(commands[1].message)
        expect(mockSpinner.mock.calls[3][1]).toEqual('succeed')
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

      expect(mockSpinner).toHaveBeenCalledTimes(1)
      expect(mockSpinner.mock.calls[0][0]).toEqual(message)
      expect(mockSpinner.mock.calls[0][1]).toEqual('start')
      expect(spinner.constructor).toBe(mockSpinner.factory)
    })
  })
})
