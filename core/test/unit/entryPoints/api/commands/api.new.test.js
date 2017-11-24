require('./../../../../helpers/disable-colours')

const argsHelper = require('./../../../../helpers/args')
const fs = require('fs-extra')
const mockExec = require('./../../../../helpers/MockExec')
const mockInquirer = require('./../../../../helpers/mockInquirer')
const mockSpinner = require('./../../../../helpers/MockSpinner')
const nock = require('nock')
const path = require('path')
const registry = require('./../../../../../lib/registry')
const registryUrl = require('registry-url')()

const apiNew = require('./../../../../../entryPoints/api/commands/new')
const apiSetup = require('./../../../../../entryPoints/api/commands/setup')

beforeEach(() => {
  apiSetup.run = jest.fn(baseDirectory => Promise.resolve())

  fs.readdir = jest.fn(path => {
    return Promise.resolve([])
  })

  fs.writeFile = jest.fn((filePath, contents, callback) => {
    callback(null)
  })

  registry.downloadBoilerplate = jest.fn(() => {
    return Promise.resolve()
  })
})

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

  describe('alerts the user when the target directory exists and is not empty', () => {
    test('when specifying a directory', () => {
      const args = argsHelper.getArgsForCommand('dadi api new my-existing-dir')

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

      return apiNew(args).catch(stdout => {
        expect(mockInquirer.mock.calls[0][0][0].type)
          .toBe('confirm')
        expect(mockInquirer.mock.calls[0][0][0].message)
          .toBe(`The target directory (${path.resolve('my-existing-dir')}) is not empty. Would you like to proceed?`)
      })
    })

    test('when not specifying a directory', () => {
      const args = argsHelper.getArgsForCommand('dadi api new')

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

      return apiNew(args).catch(stdout => {
        expect(mockInquirer.mock.calls[0][0][0].type)
          .toBe('confirm')
        expect(mockInquirer.mock.calls[0][0][0].message)
          .toBe(`The target directory (${path.resolve('.')}) is not empty. Would you like to proceed?`)
      })
    })    
  })

  test('uses the directory specified in the command if one is specified, constructing the success message accordingly', () => {
    const args = argsHelper.getArgsForCommand('dadi api new my-new-api')
    
    registry.getBoilerplateVersions = jest.fn(product => {
      return Promise.resolve(['1.x', '2.x'])
    })

    registry.downloadBoilerplate = jest.fn(() => {
      return Promise.resolve('cd my-new-api && npm start')
    })

    return apiNew(args).then(stdout => {
      expect(mockExec.mock.calls[0][0]).toBe('npm install')
      expect(mockExec.mock.calls[0][1].cwd).toBe(
        path.join(process.cwd(), 'my-new-api')
      )

      expect(stdout).toContain('\n\ncd my-new-api && npm start')
    })
  })

  test('uses the current directory if none is specified, constructing the success message accordingly', () => {
    const args = argsHelper.getArgsForCommand('dadi api new')
    
    registry.getBoilerplateVersions = jest.fn(product => {
      return Promise.resolve(['1.x', '2.x'])
    })

    registry.downloadBoilerplate = jest.fn(() => {
      return Promise.resolve('npm start')
    })

    return apiNew(args).then(stdout => {
      expect(mockExec.mock.calls[0][0]).toBe('npm install')
      expect(mockExec.mock.calls[0][1].cwd).toBe(process.cwd())

      expect(stdout).toContain('\n\nnpm start')
    })
  })

  describe('database connector prompt', () => {
    const mockNpmPackages = [
      {
        package: {
          name: '@dadi/api-mongodb',
          scope: 'dadi',
          description: 'A MongoDB adapter for DADI API',
          keywords: ['dadi-api-connector']
        }
      },
      {
        package: {
          name: '@dadi/api-filestore',
          scope: 'dadi',
          description: 'A JSON datastore adapter for DADI API',
          keywords: ['dadi-api-connector']
        }
      }
    ]

    test('is not shown if API version is prior to 3.0', () => {
      const args = argsHelper.getArgsForCommand('dadi api new')
      
      registry.getBoilerplateVersions = jest.fn(product => {
        return Promise.resolve(['1.x', '2.x'])
      })

      registry.downloadBoilerplate = jest.fn(() => {
        return Promise.resolve('npm start')
      })

      return apiNew(args).then(stdout => {
        expect(mockInquirer).not.toHaveBeenCalled()
      })
    })

    test('is not shown if the `--database` parameter is supplied', () => {
      const args = argsHelper.getArgsForCommand('dadi api new --database=@dadi/api-mongodb')
      
      registry.getBoilerplateVersions = jest.fn(product => {
        return Promise.resolve(['1.x', '2.x', '3.x'])
      })

      registry.downloadBoilerplate = jest.fn(() => {
        return Promise.resolve('npm start')
      })

      return apiNew(args).then(stdout => {
        expect(mockInquirer).not.toHaveBeenCalled()
      })
    })

    test('is shown if API version is greater than 3.0 and the `--database` parameter is not supplied', () => {
      const args = argsHelper.getArgsForCommand('dadi api new')
      
      registry.getBoilerplateVersions = jest.fn(product => {
        return Promise.resolve(['1.x', '2.x', '3.x'])
      })

      registry.downloadBoilerplate = jest.fn(() => {
        return Promise.resolve('npm start')
      })

      mockInquirer.setAnswer({
        connector: '@dadi/api-mongodb'
      })

      const request = nock(registryUrl)
        .get('/-/v1/search')
        .query({
          text: 'dadi-api-connector'
        })
        .reply(200, {objects: mockNpmPackages})

      return apiNew(args).then(stdout => {
        expect(mockInquirer).toHaveBeenCalledTimes(1)
        expect(mockInquirer.mock.calls[0][0][0].type).toBe('list')
        expect(mockInquirer.mock.calls[0][0][0].name).toBe('connector')
        expect(mockInquirer.mock.calls[0][0][0].message).toBe(
          'Which database engine would you like to install?'
        )

        expect(mockInquirer.mock.calls[0][0][0].choices[0].value).toBe(
          mockNpmPackages[0].package.name
        )
        expect(mockInquirer.mock.calls[0][0][0].choices[0].name).toBe(
          `${mockNpmPackages[0].package.name} — ${mockNpmPackages[0].package.description}`
        )

        expect(mockInquirer.mock.calls[0][0][0].choices[1].value).toBe(
          mockNpmPackages[1].package.name
        )
        expect(mockInquirer.mock.calls[0][0][0].choices[1].name).toBe(
          `${mockNpmPackages[1].package.name} — ${mockNpmPackages[1].package.description}`
        )
      })
    })
  })
  
  describe('setup command', () => {
    test('is not executed if the `--skip-setup` parameter has been supplied', () => {
      const args = argsHelper.getArgsForCommand('dadi api new --database=@dadi/api-mongodb --skip-setup')
      
      registry.getBoilerplateVersions = jest.fn(product => {
        return Promise.resolve(['1.x', '2.x', '3.x'])
      })

      registry.downloadBoilerplate = jest.fn(() => {
        return Promise.resolve('npm start')
      })

      return apiNew(args).then(stdout => {
        expect(apiSetup.run).not.toHaveBeenCalled()
      })  
    })

    test('is executed if the `--skip-setup` parameter has not been supplied', () => {
      const args = argsHelper.getArgsForCommand('dadi api new --database=@dadi/api-mongodb')
      
      registry.getBoilerplateVersions = jest.fn(product => {
        return Promise.resolve(['1.x', '2.x', '3.x'])
      })

      registry.downloadBoilerplate = jest.fn(() => {
        return Promise.resolve('npm start')
      })

      return apiNew(args).then(stdout => {
        expect(apiSetup.run).toHaveBeenCalledTimes(1)
        expect(apiSetup.run.mock.calls[0][0].baseDirectory).toBe('.')
        expect(apiSetup.run.mock.calls[0][0].datastore).toBe('@dadi/api-mongodb')
      })  
    })

    test('resolves even if the version of API being installed is not supported by the setup command', () => {
      const args = argsHelper.getArgsForCommand('dadi api new')
      
      registry.getBoilerplateVersions = jest.fn(product => {
        return Promise.resolve(['1.x', '2.x'])
      })

      registry.downloadBoilerplate = jest.fn(() => {
        return Promise.resolve('npm start')
      })

      return apiNew(args).then(stdout => {
        expect(apiSetup.run).toHaveBeenCalledTimes(1)
        expect(stdout).toContain('npm start')
      })  
    })
  })
})
