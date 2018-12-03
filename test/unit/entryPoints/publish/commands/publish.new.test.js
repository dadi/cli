const argsHelper = require('./../../../../helpers/args')
const fs = require('fs-extra')
const mockExec = require('./../../../../helpers/MockExec')
const mockInquirer = require('./../../../../helpers/mockInquirer')
const mockSpinner = require('./../../../../helpers/MockSpinner')
const path = require('path')
const registry = require('./../../../../../lib/registry')

const mockSetupRun = jest.fn(baseDirectory => Promise.resolve())

jest.mock('./../../../../../entryPoints/publish/commands/setup', () => ({
  run: mockSetupRun
}))

const publishNew = require('./../../../../../entryPoints/publish/commands/new')

beforeEach(() => {
  fs.readdir = jest.fn(path => {
    return Promise.resolve([])
  })

  registry.downloadBoilerplate = jest.fn(() => {
    return Promise.resolve()
  })

  mockSetupRun.mockClear()
})

describe('Publish `new` command', () => {
  test('exports a description string', () => {
    expect(typeof publishNew.description).toBe('string')
  })

  test('pings the versions API endpoint to get the list of available versions for the given product', () => {
    const args = argsHelper.getArgsForCommand('publish new')
    
    registry.getBoilerplateVersions = jest.fn(product => {
      return Promise.resolve(['1.0', '2.0'])
    })

    return publishNew(args).then(stdout => {
      expect(registry.getBoilerplateVersions).toHaveBeenCalledTimes(1)
      expect(registry.getBoilerplateVersions.mock.calls[0][0]).toBe('publish')
    })
  })

  test('displays an error message if the given version is not valid', () => {
    const args = argsHelper.getArgsForCommand('publish new --version=2.x')
    
    registry.getBoilerplateVersions = jest.fn(product => {
      return Promise.resolve(['1.3', '1.5'])
    })

    return publishNew(args).catch(stdout => {
      expect(mockSpinner.mock.calls[0][1]).toBe('start')
      expect(mockSpinner.mock.calls[1][1]).toBe('fail')
      expect(mockSpinner.mock.calls[1][0]).toContain('is not a valid version')
      expect(mockSpinner.mock.calls[1][0]).toContain('Available versions: 1.3, 1.5')
    })
  })

  describe('alerts the user when the target directory exists and is not empty', () => {
    test('when specifying a directory', () => {
      const args = argsHelper.getArgsForCommand('publish new my-existing-dir')

      fs.readdir = jest.fn(path => {
        return Promise.resolve([
          'dir1',
          'dir2'
        ])
      })

      mockInquirer.setAnswer({
        confirm: false
      })    
      
      registry.getBoilerplateVersions = jest.fn(product => {
        return Promise.resolve(['1.3', '1.5'])
      })

      return publishNew(args).catch(stdout => {
        expect(mockInquirer.mock.calls[0][0][0].type)
          .toBe('confirm')
        expect(mockInquirer.mock.calls[0][0][0].message)
          .toBe(`The target directory (${path.resolve('my-existing-dir')}) is not empty. Would you like to proceed?`)
      })
    })

    test('when not specifying a directory', () => {
      const args = argsHelper.getArgsForCommand('publish new')

      fs.readdir = jest.fn(path => {
        return Promise.resolve([
          'dir1',
          'dir2'
        ])
      })

      mockInquirer.setAnswer({
        confirm: false
      })    
      
      registry.getBoilerplateVersions = jest.fn(product => {
        return Promise.resolve(['1.3', '1.5'])
      })

      return publishNew(args).catch(stdout => {
        expect(mockInquirer.mock.calls[0][0][0].type)
          .toBe('confirm')
        expect(mockInquirer.mock.calls[0][0][0].message)
          .toBe(`The target directory (${path.resolve('.')}) is not empty. Would you like to proceed?`)
      })
    })    
  })  

  test('uses the directory specified in the command if one is specified, constructing the success message accordingly', () => {
    const args = argsHelper.getArgsForCommand('publish new my-new-publish')
    
    registry.getBoilerplateVersions = jest.fn(product => {
      return Promise.resolve(['1.x', '2.x'])
    })

    registry.downloadBoilerplate = jest.fn(() => {
      return Promise.resolve('cd my-new-publish && npm start')
    })

    return publishNew(args).then(stdout => {
      expect(mockExec.mock.calls[0][0]).toBe('npm install')
      expect(mockExec.mock.calls[0][1].cwd).toBe(
        path.join(process.cwd(), 'my-new-publish')
      )

      expect(stdout).toContain('\n\ncd my-new-publish && npm start')
    })
  })

  test('uses the current directory if none is specified, constructing the success message accordingly', () => {
    const args = argsHelper.getArgsForCommand('publish new')
    
    registry.getBoilerplateVersions = jest.fn(product => {
      return Promise.resolve(['1.x', '2.x'])
    })

    registry.downloadBoilerplate = jest.fn(() => {
      return Promise.resolve('npm start')
    })

    return publishNew(args).then(stdout => {
      expect(mockExec.mock.calls[0][0]).toBe('npm install')
      expect(mockExec.mock.calls[0][1].cwd).toBe(process.cwd())

      expect(stdout).toContain('\n\nnpm start')
    })
  })

  describe('setup command', () => {
    test('is initiated with the correct directory when a directory is specified', () => {
      const args = argsHelper.getArgsForCommand('publish new my-new-publish')
      
      registry.getBoilerplateVersions = jest.fn(product => {
        return Promise.resolve(['1.x', '2.x'])
      })

      return publishNew(args).then(stdout => {
        expect(mockSetupRun.mock.calls[0][0]).toBe('my-new-publish')
      })    
    })

    test('is initiated with the correct directory when a directory is not specified', () => {
      const args = argsHelper.getArgsForCommand('publish new')
      
      registry.getBoilerplateVersions = jest.fn(product => {
        return Promise.resolve(['1.x', '2.x'])
      })

      return publishNew(args).then(stdout => {
        expect(mockSetupRun.mock.calls[0][0]).toBe('.')
      })    
    })

    test('is not called when the --skip-setup parameter is supplied', () => {
      const args = argsHelper.getArgsForCommand('publish new --skip-setup')
      
      registry.getBoilerplateVersions = jest.fn(product => {
        return Promise.resolve(['1.x', '2.x'])
      })

      return publishNew(args).then(stdout => {
        expect(mockSetupRun).not.toHaveBeenCalled()
      })      
    })
  })
})
