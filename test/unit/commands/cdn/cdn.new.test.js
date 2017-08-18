require('./../../../helpers/disable-colours')

const argsHelper = require('./../../../helpers/args')
const mockExec = require('./../../../helpers/mockExec')
const mockSpinner = require('./../../../helpers/MockSpinner')
const registry = require('./../../../../lib/registry')

const cdnNew = require('./../../../../entryPoints/cdn/commands/new')

describe('CDN `new` command', () => {
  test('exports a description string', () => {
    expect(typeof cdnNew.description).toBe('string')
  })

  test('pings the versions API endpoint to get the list of available versions for the given product', () => {
    const args = argsHelper.getArgsForCommand('dadi cdn new')
    
    registry.getBoilerplateVersions = jest.fn(product => {
      return Promise.resolve(['1.0', '2.0'])
    })

    return cdnNew(args).then(stdout => {
      expect(registry.getBoilerplateVersions).toHaveBeenCalledTimes(1)
      expect(registry.getBoilerplateVersions.mock.calls[0][0]).toBe('cdn')
    })
  })

  test('displays an error message if the given version is not valid', () => {
    const args = argsHelper.getArgsForCommand('dadi cdn new --version=2.x')
    
    registry.getBoilerplateVersions = jest.fn(product => {
      return Promise.resolve(['1.3', '1.5'])
    })

    return cdnNew(args).catch(stdout => {
      expect(mockSpinner.mock.calls[0][1]).toBe('start')
      expect(mockSpinner.mock.calls[1][1]).toBe('fail')
      expect(mockSpinner.mock.calls[1][0]).toContain('is not a valid version')
      expect(mockSpinner.mock.calls[1][0]).toContain('Available versions: 1.3, 1.5')
    })
  })

  test('uses the directory specified in the command if one is specified, constructing the success message accordingly', () => {
    const args = argsHelper.getArgsForCommand('dadi cdn new my-new-cdn')
    
    registry.getBoilerplateVersions = jest.fn(product => {
      return Promise.resolve(['1.x', '2.x'])
    })

    return cdnNew(args).then(stdout => {
      expect(mockExec.mock.calls[0][0]).toContain('cd my-new-cdn/_temp')
      expect(mockExec.mock.calls[1][0]).toContain('cd my-new-cdn')
      expect(mockExec.mock.calls[2][0]).toContain('rm -rf my-new-cdn/.git')

      expect(stdout).toContain('\n\ncd my-new-cdn && npm start')
    })
  })

  test('uses the current directory if none is specified, constructing the success message accordingly', () => {
    const args = argsHelper.getArgsForCommand('dadi cdn new')
    
    registry.getBoilerplateVersions = jest.fn(product => {
      return Promise.resolve(['1.x', '2.x'])
    })

    return cdnNew(args).then(stdout => {
      expect(mockExec.mock.calls[0][0]).toContain('cd ./_temp')
      expect(mockExec.mock.calls[1][0]).toContain('cd .')
      expect(mockExec.mock.calls[2][0]).toContain('rm -rf ./.git')

      expect(stdout).toContain('\n\nnpm start')
    })
  })
})
