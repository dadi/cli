require('./../../../../helpers/disable-colours')

const argsHelper = require('./../../../../helpers/args')
const fs = require('fs-extra')
const mockInquirer = require('./../../../../helpers/mockInquirer')
const nock = require('nock')
const path = require('path')
const registry = require('./../../../../../lib/registry')
const registryUrl = require('registry-url')()

const apiClientsAdd = require('./../../../../../entryPoints/api/commands/clients-add')
const apiSetup = require('./../../../../../entryPoints/api/commands/setup')
const configHelpers = require('./../../../../../lib/config')
const fsHelpers = require('./../../../../../lib/fs')

beforeEach(() => {
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

describe('API `setup` command', () => {
  test('exports a description string', () => {
    expect(typeof apiSetup.description).toBe('string')
  })

  describe('API < v3', () => {
    beforeAll(() => {
      fsHelpers.loadAppFile = app => {
        return Promise.resolve({
          version: '2.2.1'
        })
      }
    })

    test('returns an `UNSUPPORTED_VERSION` error', () => {
      const args = argsHelper.getArgsForCommand('api setup')

      return apiSetup(args).catch(err => {
        expect(err.message).toBe('UNSUPPORTED_VERSION')
      })
    })    
  })

  describe('API >= v3', () => {
    let promptAnswers

    beforeAll(() => {
      configHelpers.getAppConfig = jest.fn(app => {
        return Promise.resolve({
          schema: {}
        })
      })

      configHelpers.saveAppConfig = jest.fn(options => {
        return Promise.resolve({
          path: '/some/path'
        })
      })

      fsHelpers.loadAppFile = app => {
        return Promise.resolve({
          version: '3.0.0'
        })
      }
    })

    beforeEach(() => {
      configHelpers.getAppConfig.mockClear()
      configHelpers.saveAppConfig.mockClear()

      promptAnswers = {
        _meta: {
          datastore: {
            database: 'apiv3',
            username: 'johndoe',
            password: 'foobar',
            host: '127.0.0.1'
          },
          client: {
            create: true,
            clientId: 'testClient',
            secret: 'superSecret',
            accessType: 'admin'
          }
        },
        app: {
          name: 'My API'
        },
        datastore: '@dadi/api-mongodb',
        server: {
          host: '0.0.0.0',
          port: 8080,
          protocol: 'http'
        },
        publicUrl: {
          host: 'my-api.com',
          port: 80,
          protocol: 'http'
        },
        caching: {
          directory: {
            enabled: true,
            path: './workspace/cache'
          },
          redis: {
            enabled: false
          }
        },
        media: {
          storage: 'disk',
          basePath: './workspace/uploads'
        },
        env: 'development'
      }
    })

    test('writes the API configuration file', () => {
      const args = argsHelper.getArgsForCommand('api setup')

      const request = nock(registryUrl)
        .get('/-/v1/search')
        .query({
          text: 'dadi-api-connector'
        })
        .reply(200, {objects: mockNpmPackages})

      mockInquirer.setAnswer(promptAnswers)

      return apiSetup(args).then(out => {
        const expectedConfig = Object.assign({}, promptAnswers, {
          auth: {
            datastore: promptAnswers.datastore,
            database: promptAnswers._meta.datastore.database
          }
        })

        delete expectedConfig._meta

        const mockCall = configHelpers.saveAppConfig.mock.calls[0][0]

        expect(configHelpers.saveAppConfig).toHaveBeenCalled()
        expect(mockCall.description).toBe('API configuration file')
        expect(mockCall.fileName).toBe(`config.${promptAnswers.env}.json`)
        expect(mockCall.app).toBe('@dadi/api')
        expect(mockCall.config).toEqual(expectedConfig)
      })
    })

    describe('clients:add command', () => {
      beforeAll(() => {
        apiClientsAdd.createClient = jest.fn(() => Promise.resolve(true))  
      })
      
      beforeEach(() => {
        apiClientsAdd.createClient.mockClear()
      })

      test('is called if the user has chosen to create a client', () => {
        const args = argsHelper.getArgsForCommand('api setup')

        mockInquirer.setAnswer(promptAnswers)

        return apiSetup(args).then(out => {
          expect(apiClientsAdd.createClient).toHaveBeenCalledTimes(1)
          expect(apiClientsAdd.createClient.mock.calls[0][0].clientId)
            .toBe(promptAnswers._meta.client.clientId)
          expect(apiClientsAdd.createClient.mock.calls[0][0].secret)
            .toBe(promptAnswers._meta.client.secret)
          expect(apiClientsAdd.createClient.mock.calls[0][0].accessType)
            .toBe(promptAnswers._meta.client.accessType)
        })
      })

      test('is not called if the user has chosen not to create a client', () => {
        const args = argsHelper.getArgsForCommand('api setup')

        promptAnswers._meta.client.create = false

        mockInquirer.setAnswer(promptAnswers)

        return apiSetup(args).then(out => {
          expect(apiClientsAdd.createClient).not.toHaveBeenCalled()
        })
      })
    })

    describe('RethinkDB connector', () => {
      beforeEach(() => {
        promptAnswers.datastore = '@dadi/api-rethinkdb'
        promptAnswers._meta.datastore.port = 28015
      })

      test('writes the database configuration file', () => {
        const args = argsHelper.getArgsForCommand('api setup')

        mockInquirer.setAnswer(promptAnswers)

        return apiSetup(args).then(out => {
          expect(configHelpers.saveAppConfig).toHaveBeenCalledTimes(2)

          const mockCall = configHelpers.saveAppConfig.mock.calls[1][0]

          expect(mockCall.description).toBe('Database configuration file')
          expect(mockCall.fileName).toBe(`rethinkdb.${promptAnswers.env}.json`)
          expect(mockCall.app).toBe('@dadi/api')

          expect(mockCall.config.hosts[0].host)
            .toBe(promptAnswers._meta.datastore.host)
          expect(mockCall.config.hosts[0].port)
            .toBe(promptAnswers._meta.datastore.port)
          expect(mockCall.config.username)
            .toBe(promptAnswers._meta.datastore.username)
          expect(mockCall.config.password)
            .toBe(promptAnswers._meta.datastore.password)
          expect(mockCall.config.database)
            .toBe(promptAnswers._meta.datastore.database)
        })
      })
    })

    describe('MongoDB connector', () => {
      beforeEach(() => {
        promptAnswers.datastore = '@dadi/api-mongodb'
        promptAnswers._meta.datastore.port = 27017
      })

      test('writes the database configuration file', () => {
        const args = argsHelper.getArgsForCommand('api setup')

        mockInquirer.setAnswer(promptAnswers)

        return apiSetup(args).then(out => {
          expect(configHelpers.saveAppConfig).toHaveBeenCalledTimes(2)

          const mockCall = configHelpers.saveAppConfig.mock.calls[1][0]

          expect(mockCall.description).toBe('Database configuration file')
          expect(mockCall.fileName).toBe(`mongodb.${promptAnswers.env}.json`)
          expect(mockCall.app).toBe('@dadi/api')

          expect(mockCall.config.hosts[0].host)
            .toBe(promptAnswers._meta.datastore.host)
          expect(mockCall.config.hosts[0].port)
            .toBe(promptAnswers._meta.datastore.port)
          expect(mockCall.config.username)
            .toBe(promptAnswers._meta.datastore.username)
          expect(mockCall.config.password)
            .toBe(promptAnswers._meta.datastore.password)
          expect(mockCall.config.database)
            .toBe(promptAnswers._meta.datastore.database)
          expect(mockCall.config.databases[promptAnswers._meta.datastore.database])
            .toEqual({
              hosts: [
                {
                  host: promptAnswers._meta.datastore.host,
                  port: promptAnswers._meta.datastore.port
                }
              ]
            })
        })
      })
    })
  })
})
