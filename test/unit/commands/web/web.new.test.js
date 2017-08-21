require('./../../../helpers/disable-colours')

const argsHelper = require('./../../../helpers/args')
const mockExec = require('./../../../helpers/mockExec')
const mockInquirer = require('./../../../helpers/mockInquirer')
const mockSpinner = require('./../../../helpers/MockSpinner')
const nock = require('nock')
const registry = require('./../../../../lib/registry')
const registryUrl = require('registry-url')()
const setMockInquirerAnswer = require('./../../../helpers/mockInquirer').setAnswer

const webNew = require('./../../../../entryPoints/web/commands/new')

describe('Web `new` command', () => {
  test('exports a description string', () => {
    expect(typeof webNew.description).toBe('string')
  })

  test('pings the versions API endpoint to get the list of available versions for the given product', () => {
    const args = argsHelper.getArgsForCommand('dadi web new')
    
    registry.getBoilerplateVersions = jest.fn(product => {
      return Promise.resolve(['1.0', '2.0'])
    })

    return webNew(args).then(stdout => {
      expect(registry.getBoilerplateVersions).toHaveBeenCalledTimes(1)
      expect(registry.getBoilerplateVersions.mock.calls[0][0]).toBe('web')
    })
  })

  test('displays an error message if the given version is not valid', () => {
    const args = argsHelper.getArgsForCommand('dadi web new --version=2.x')
    
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

  test('uses the directory specified in the command if one is specified, constructing the success message accordingly', () => {
    const args = argsHelper.getArgsForCommand('dadi web new my-new-web')
    
    registry.getBoilerplateVersions = jest.fn(product => {
      return Promise.resolve(['1.x', '2.x'])
    })

    return webNew(args).then(stdout => {
      expect(mockExec.mock.calls[0][0]).toContain('cd my-new-web/_temp')
      expect(mockExec.mock.calls[1][0]).toContain('cd my-new-web')
      expect(mockExec.mock.calls[2][0]).toContain('rm -rf my-new-web/.git')

      expect(stdout).toContain('\n\ncd my-new-web && npm start')
    })
  })

  test('uses the current directory if none is specified, constructing the success message accordingly', () => {
    const args = argsHelper.getArgsForCommand('dadi web new')
    
    registry.getBoilerplateVersions = jest.fn(product => {
      return Promise.resolve(['1.x', '2.x'])
    })

    return webNew(args).then(stdout => {
      expect(mockExec.mock.calls[0][0]).toContain('cd ./_temp')
      expect(mockExec.mock.calls[1][0]).toContain('cd .')
      expect(mockExec.mock.calls[2][0]).toContain('rm -rf ./.git')

      expect(stdout).toContain('\n\nnpm start')
    })
  })

  describe('template engine configuration for versions >= 3.0', () => {
    test('installs and initialises the engines provided in the `--engine` parameter', () => {
      const args = argsHelper.getArgsForCommand('dadi web new --engine=@dadi/web-dustjs --engine=@dadi/web-pugjs')

      registry.getBoilerplateVersions = jest.fn(product => {
        return Promise.resolve(['1.x', '2.x', '3.x'])
      })

      return webNew(args).then(stdout => {
        const dustInstall = mockExec.mock.calls.find(command => {
          return command[0].includes('npm install @dadi/web-dustjs --save')
        })

        const pugInstall = mockExec.mock.calls.find(command => {
          return command[0].includes('npm install @dadi/web-pugjs --save')
        })

        const enginesCall = mockExec.mock.calls.find(command => {
          return command[0].includes('{"engines":["@dadi\\/web-dustjs","@dadi\\/web-pugjs"]}')
        })

        expect(Array.isArray(dustInstall)).toBe(true)
        expect(Array.isArray(pugInstall)).toBe(true)
        expect(Array.isArray(enginesCall)).toBe(true)
      })
    })

    test('retrieves from npm the list of available engines if a `--engine` parameter is not provided', () => {
      const args = argsHelper.getArgsForCommand('dadi web new')

      registry.getBoilerplateVersions = jest.fn(product => {
        return Promise.resolve(['1.x', '2.x', '3.x'])
      })

      const request = nock(registryUrl)
        .get('/-/v1/search')
        .query({
          text: 'dadi web'
        })
        .reply(200, {objects: []})

      return webNew(args).then(stdout => {
        expect(request.isDone()).toBe(true)
      })
    })

    test('prompts the user to select the template engines to be installed', () => {
      const args = argsHelper.getArgsForCommand('dadi web new')

      registry.getBoilerplateVersions = jest.fn(product => {
        return Promise.resolve(['1.x', '2.x', '3.x'])
      })

      const availableEngines = [
        {
          package: {
            name: '@dadi/web-dustjs',
            description: 'A Dust.js interface for DADI Web',
            keywords: ['dadi', 'web']
          }
        },
        {
          package: {
            name: '@dadi/web-pugjs',
            description: 'A Pug.js interface for DADI Web',
            keywords: ['dadi', 'web']
          }
        }
      ]

      const request = nock(registryUrl)
        .get('/-/v1/search')
        .query({
          text: 'dadi web'
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
      const args = argsHelper.getArgsForCommand('dadi web new')

      registry.getBoilerplateVersions = jest.fn(product => {
        return Promise.resolve(['1.x', '2.x', '3.x'])
      })

      const availableEngines = [
        {
          package: {
            name: '@dadi/web-dustjs',
            description: 'A Dust.js interface for DADI Web',
            keywords: ['dadi', 'web']
          }
        },
        {
          package: {
            name: '@dadi/web-pugjs',
            description: 'A Pug.js interface for DADI Web',
            keywords: ['dadi', 'web']
          }
        }
      ]

      setMockInquirerAnswer({
        engines: ['@dadi/web-pugjs']
      })

      const request = nock(registryUrl)
        .get('/-/v1/search')
        .query({
          text: 'dadi web'
        })
        .reply(200, {objects: availableEngines})

      return webNew(args).then(stdout => {
        expect(request.isDone()).toBe(true)

        const pugInstall = mockExec.mock.calls.find(command => {
          return command[0].includes('npm install @dadi/web-pugjs --save')
        })

        const enginesCall = mockExec.mock.calls.find(command => {
          return command[0].includes('{"engines":["@dadi\\/web-pugjs"]}')
        })        

        expect(Array.isArray(pugInstall)).toBe(true)
        expect(Array.isArray(enginesCall)).toBe(true)
      })
    })
  })
})
