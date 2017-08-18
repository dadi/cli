require('./../../../helpers/disable-colours')

const argsHelper = require('./../../../helpers/args')
const mockExec = require('./../../../helpers/mockExec')
const mockSpinner = require('./../../../helpers/MockSpinner')
const registry = require('./../../../../lib/registry')

const apiNew = require('./../../../../entryPoints/api/commands/new')

describe('API `new` command', () => {
  test('exports a description string', () => {
    expect(typeof apiNew.description).toBe('string')
  })

  test('pings the versions API endpoint to get the list of available versions for the given product', () => {
    const args = argsHelper.getArgsForCommand('dadi api new')
    
    registry.getBoilerplateVersions = jest.fn(product => {
      return Promise.resolve(['1.0', '2.0'])
    })

    return apiNew(args).then(stdout => {
      expect(registry.getBoilerplateVersions).toHaveBeenCalledTimes(1)
      expect(registry.getBoilerplateVersions.mock.calls[0][0]).toBe('api')
    })
  })

  test('displays an error message if the given version is not valid', () => {
    const args = argsHelper.getArgsForCommand('dadi api new --version=2.x')
    
    registry.getBoilerplateVersions = jest.fn(product => {
      return Promise.resolve(['1.3', '1.5'])
    })

    return apiNew(args).catch(stdout => {
      expect(mockSpinner.mock.calls[0][1]).toBe('start')
      expect(mockSpinner.mock.calls[1][1]).toBe('fail')
      expect(mockSpinner.mock.calls[1][0]).toContain('is not a valid version')
      expect(mockSpinner.mock.calls[1][0]).toContain('Available versions: 1.3, 1.5')
    })
  })

  test('uses the directory specified in the command if one is specified, constructing the success message accordingly', () => {
    const args = argsHelper.getArgsForCommand('dadi api new my-new-api')
    
    registry.getBoilerplateVersions = jest.fn(product => {
      return Promise.resolve(['1.x', '2.x'])
    })

    return apiNew(args).then(stdout => {
      expect(mockExec.mock.calls[0][0]).toContain('cd my-new-api/_temp')
      expect(mockExec.mock.calls[1][0]).toContain('cd my-new-api')
      expect(mockExec.mock.calls[2][0]).toContain('rm -rf my-new-api/.git')

      expect(stdout).toContain('\n\ncd my-new-api && npm start')
    })
  })

  test('uses the current directory if none is specified, constructing the success message accordingly', () => {
    const args = argsHelper.getArgsForCommand('dadi api new')
    
    registry.getBoilerplateVersions = jest.fn(product => {
      return Promise.resolve(['1.x', '2.x'])
    })

    return apiNew(args).then(stdout => {
      expect(mockExec.mock.calls[0][0]).toContain('cd ./_temp')
      expect(mockExec.mock.calls[1][0]).toContain('cd .')
      expect(mockExec.mock.calls[2][0]).toContain('rm -rf ./.git')

      expect(stdout).toContain('\n\nnpm start')
    })
  })
})
