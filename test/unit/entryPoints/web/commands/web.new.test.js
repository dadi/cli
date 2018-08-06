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

const webNew = require('./../../../../../entryPoints/web/commands/new')
const fsReadFile = fs.readFile
const fsWriteFile = fs.writeFile

beforeAll(() => {
  fs.readFile = file => {
    if (path.basename(file) === 'server.js') {
      return Promise.resolve(
        'require(\'@dadi/web\')(/*@requires@*/)'
      )
    }

    return fsReadFile(file)
  }

  registry.downloadBoilerplate = jest.fn(() => {
    return Promise.resolve()
  })
})

beforeEach(() => {
  fs.readdir = jest.fn((path) => {
    return Promise.resolve([])
  })

  fs.writeFile = (file, data) => {
    return Promise.resolve()
  }
})

afterAll(() => {
  fs.readFile = fsReadFile
  fs.writeFile = fsWriteFile
})

describe('Web `new` command', () => {
  test('exports a description string', () => {
    expect(typeof webNew.description).toBe('string')
  })

  test('pings the versions API endpoint to get the list of available versions for the given product', () => {
    const args = argsHelper.getArgsForCommand('web new')
    
    registry.getBoilerplateVersions = jest.fn(product => {
      return Promise.resolve(['1.0', '2.0'])
    })

    return webNew(args).then(stdout => {
      expect(registry.getBoilerplateVersions).toHaveBeenCalledTimes(1)
      expect(registry.getBoilerplateVersions.mock.calls[0][0]).toBe('web')
    })
  })

  test('displays an error message if the given version is not valid', () => {
    const args = argsHelper.getArgsForCommand('web new --version=2.x')
    
    registry.getBoilerplateVersions = jest.fn(product => {
      return Promise.resolve(['1.3', '1.5'])
    })

    return webNew(args).catch(stdout => {
      expect(mockSpinner.mock.calls[0][1]).toBe('start')
      expect(mockSpinner.mock.calls[1][1]).toBe('fail')
      expect(mockSpinner.mock.calls[1][0]).toContain('is not a valid version')
      expect(mockSpinner.mock.calls[1][0]).toContain('Available versions: 1.3, 1.5')
    })
  })

  describe('alerts the user when the target directory exists and is not empty', () => {
    test('when specifying a directory', () => {
      const args = argsHelper.getArgsForCommand('web new my-existing-dir')

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

      return webNew(args).catch(stdout => {
        expect(mockInquirer.mock.calls[0][0][0].type)
          .toBe('confirm')
        expect(mockInquirer.mock.calls[0][0][0].message)
          .toBe(`The target directory (${path.resolve('my-existing-dir')}) is not empty. Would you like to proceed?`)
      })
    })

    test('when not specifying a directory', () => {
      const args = argsHelper.getArgsForCommand('web new')

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

      return webNew(args).catch(stdout => {
        expect(mockInquirer.mock.calls[0][0][0].type)
          .toBe('confirm')
        expect(mockInquirer.mock.calls[0][0][0].message)
          .toBe(`The target directory (${path.resolve('.')}) is not empty. Would you like to proceed?`)
      })
    })    
  })  

  test('uses the directory specified in the command if one is specified, constructing the success message accordingly', () => {
    const args = argsHelper.getArgsForCommand('web new my-new-web')
    
    registry.getBoilerplateVersions = jest.fn(product => {
      return Promise.resolve(['1.x', '2.x'])
    })

    registry.downloadBoilerplate = jest.fn(() => {
      return Promise.resolve('cd my-new-web && npm start')
    })

    return webNew(args).then(stdout => {
      expect(mockExec.mock.calls[0][0]).toBe('npm install')
      expect(mockExec.mock.calls[0][1].cwd).toBe(
        path.join(process.cwd(), 'my-new-web')
      )

      expect(stdout).toContain('\n\ncd my-new-web && npm start')
    })
  })

  test('uses the current directory if none is specified, constructing the success message accordingly', () => {
    const args = argsHelper.getArgsForCommand('web new')
    
    registry.getBoilerplateVersions = jest.fn(product => {
      return Promise.resolve(['1.x', '2.x'])
    })

    registry.downloadBoilerplate = jest.fn(() => {
      return Promise.resolve('npm start')
    })

    return webNew(args).then(stdout => {
      expect(mockExec.mock.calls[0][0]).toBe('npm install')
      expect(mockExec.mock.calls[0][1].cwd).toBe(process.cwd())

      expect(stdout).toContain('\n\nnpm start')
    })
  })

  describe('template engine configuration for versions >= 3.0', () => {
    test('installs and initialises the engines provided in the `--engine` parameter', () => {
      const args = argsHelper.getArgsForCommand('web new --engine=@dadi/web-dustjs --engine=@dadi/web-pugjs')

      registry.getBoilerplateVersions = jest.fn(product => {
        return Promise.resolve(['1.x', '2.x', '3.x'])
      })

      fs.writeFile = jest.fn((file, content) => {
        return Promise.resolve(true)
      })

      return webNew(args).then(stdout => {
        const dustInstall = mockExec.mock.calls.find(command => {
          return command[0].includes('npm install @dadi/web-dustjs --save')
        })

        const pugInstall = mockExec.mock.calls.find(command => {
          return command[0].includes('npm install @dadi/web-pugjs --save')
        })

        expect(Array.isArray(dustInstall)).toBe(true)
        expect(Array.isArray(pugInstall)).toBe(true)

        expect(fs.writeFile.mock.calls[0][0]).toBe(
          path.join(process.cwd(), 'server.js')
        )
        expect(fs.writeFile.mock.calls[0][1]).toBe(
          'require(\'@dadi/web\')({"engines":[require(\'@dadi/web-dustjs\'),require(\'@dadi/web-pugjs\')]})'
        )
      })
    })

    test('retrieves from npm the list of available engines if a `--engine` parameter is not provided', () => {
      const args = argsHelper.getArgsForCommand('web new')

      registry.getBoilerplateVersions = jest.fn(product => {
        return Promise.resolve(['1.x', '2.x', '3.x'])
      })

      mockInquirer.setAnswer({
        engines: []
      })

      const request = nock(registryUrl)
        .get('/-/v1/search')
        .query({
          text: 'dadi-web-engine'
        })
        .reply(200, {objects: []})

      return webNew(args).then(stdout => {
        expect(request.isDone()).toBe(true)
      })
    })

    test('prompts the user to select the template engines to be installed', () => {
      const args = argsHelper.getArgsForCommand('web new')

      registry.getBoilerplateVersions = jest.fn(product => {
        return Promise.resolve(['1.x', '2.x', '3.x'])
      })

      const availableEngines = [
        {
          package: {
            name: '@dadi/web-dustjs',
            scope: 'dadi',
            description: 'A Dust.js interface for DADI Web',
            keywords: ['dadi-web-engine']
          }
        },
        {
          package: {
            name: '@dadi/web-pugjs',
            scope: 'dadi',
            description: 'A Pug.js interface for DADI Web',
            keywords: ['dadi-web-engine']
          }
        }
      ]

      mockInquirer.setAnswer({
        engines: []
      })

      const request = nock(registryUrl)
        .get('/-/v1/search')
        .query({
          text: 'dadi-web-engine'
        })
        .reply(200, {objects: availableEngines})

      return webNew(args).then(stdout => {
        expect(request.isDone()).toBe(true)
        expect(mockInquirer.mock.calls[0][0][0].type).toBe('checkbox')
        expect(mockInquirer.mock.calls[0][0][0].name).toBe('engines')
        expect(Array.isArray(mockInquirer.mock.calls[0][0][0].choices)).toBe(true)
        expect(mockInquirer.mock.calls[0][0][0].choices.length).toBe(2)

        mockInquirer.mock.calls[0][0][0].choices.forEach((choice, index) => {
          expect(choice.value).toBe(availableEngines[index].package.name)
          expect(choice.short).toBe(availableEngines[index].package.name)
          expect(choice.name).toBe(
            `${availableEngines[index].package.name} — ${availableEngines[index].package.description}`
          )
        })
      })
    })

    test('installs and initialises the engines selected by the user in the interactive prompt', () => {
      const args = argsHelper.getArgsForCommand('web new')

      registry.getBoilerplateVersions = jest.fn(product => {
        return Promise.resolve(['1.x', '2.x', '3.x'])
      })

      const availableEngines = [
        {
          package: {
            name: '@dadi/web-dustjs',
            scope: 'dadi',
            description: 'A Dust.js interface for DADI Web',
            keywords: ['dadi-web-engine']
          }
        },
        {
          package: {
            name: '@dadi/web-pugjs',
            scope: 'dadi',
            description: 'A Pug.js interface for DADI Web',
            keywords: ['dadi-web-engine']
          }
        }
      ]

      mockInquirer.setAnswer({
        engines: ['@dadi/web-dustjs']
      })

      const request = nock(registryUrl)
        .get('/-/v1/search')
        .query({
          text: 'dadi-web-engine'
        })
        .reply(200, {objects: availableEngines})

      fs.writeFile = jest.fn((file, content) => {
        return Promise.resolve(true)
      })

      return webNew(args).then(stdout => {
        expect(request.isDone()).toBe(true)

        const pugInstall = mockExec.mock.calls.find(command => {
          return command[0].includes('npm install @dadi/web-dustjs --save')
        })

        const enginesCall = mockExec.mock.calls.find(command => {
          return command[0].includes('{"engines":[require(\\"@dadi\\/web-dustjs\\")]}')
        })

        expect(Array.isArray(pugInstall)).toBe(true)

        expect(fs.writeFile.mock.calls[0][0]).toBe(
          path.join(process.cwd(), 'server.js')
        )
        expect(fs.writeFile.mock.calls[0][1]).toBe(
          'require(\'@dadi/web\')({"engines":[require(\'@dadi/web-dustjs\')]})'
        )
      })
    })

    test('installs and initialises Dust.js even if not selected by the user', () => {
      const args = argsHelper.getArgsForCommand('web new')

      registry.getBoilerplateVersions = jest.fn(product => {
        return Promise.resolve(['1.x', '2.x', '3.x'])
      })

      const availableEngines = [
        {
          package: {
            name: '@dadi/web-dustjs',
            scope: 'dadi',
            description: 'A Dust.js interface for DADI Web',
            keywords: ['dadi-web-engine']
          }
        },
        {
          package: {
            name: '@dadi/web-pugjs',
            scope: 'dadi',
            description: 'A Pug.js interface for DADI Web',
            keywords: ['dadi-web-engine']
          }
        }
      ]

      mockInquirer.setAnswer({
        engines: ['@dadi/web-pugjs']
      })

      fs.writeFile = jest.fn((file, content) => {
        return Promise.resolve(true)
      })

      const request = nock(registryUrl)
        .get('/-/v1/search')
        .query({
          text: 'dadi-web-engine'
        })
        .reply(200, {objects: availableEngines})

      return webNew(args).then(stdout => {
        expect(request.isDone()).toBe(true)

        const pugInstall = mockExec.mock.calls.find(command => {
          return command[0].includes('npm install @dadi/web-pugjs --save')
        })

        expect(Array.isArray(pugInstall)).toBe(true)

        expect(fs.writeFile.mock.calls[0][0]).toBe(
          path.join(process.cwd(), 'server.js')
        )
        expect(fs.writeFile.mock.calls[0][1]).toBe(
          'require(\'@dadi/web\')({"engines":[require(\'@dadi/web-pugjs\'),require(\'@dadi/web-dustjs\')]})'
        )
      })
    })
  })
})
