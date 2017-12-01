require('./../../../../helpers/disable-colours')

const argsHelper = require('./../../../../helpers/args')
const mockDadiApi = require('./../../../../helpers/MockDadiApi')
const mockExec = require('./../../../../helpers/MockExec')
const mockInquirer = require('./../../../../helpers/mockInquirer')
const mockSpinner = require('./../../../../helpers/MockSpinner')
const path = require('path')
const pmock = require('pmock')
const registry = require('./../../../../../lib/registry')
const setMockInquirerAnswer = require('./../../../../helpers/mockInquirer').setAnswer
const shell = require('./../../../../../lib/shell')
const util = require('./../../../../../lib/util')

const mockRandomSecret = '1q2w3e4r5t6y7u8i9o'

jest.mock('./../../../../../lib/util', () => ({
  generatePassword: () => mockRandomSecret
}))

let apiClientsAdd = require('./../../../../../entryPoints/api/commands/clients-add')

this.cwd = pmock.cwd('/Users/fakeuser/fakedir')

describe('API `clients:add` command', () => {
  test('exports a description string', () => {
    expect(typeof apiClientsAdd.description).toBe('string')
  })

  describe('API < v3', () => {
    const mockConfigParameters = {
      'auth.clientCollection': 'collection',
      'auth.database': 'database'
    }

    let mockApi
    let mockClients
    let mockDatabase

    beforeAll(() => {
      mockApi = {
        module: {
          Config: {
            get: parameter => mockConfigParameters[parameter]
          },
          Connection: jest.fn((options, datastore) => {
            return {
              on: (event, callback) => {
                if (event === 'connect') {
                  callback(mockDatabase)
                }
              }
            }
          })
        },
        pkg: {
          version: '2.0.0'
        }
      }

      jest.mock('./../../../../../lib/fs', () => ({
        loadApp: app => {
          return Promise.resolve(mockApi)
        }
      }))

      jest.resetModules()

      apiClientsAdd = require('./../../../../../entryPoints/api/commands/clients-add')
    })

    beforeEach(() => {
      mockDatabase = {
        close: jest.fn(),

        find: jest.fn(() => {
          return {
            toArray: callback => {
              callback(null, mockClients)
            }
          }
        }),

        insert: jest.fn((payload, callback) => {
          callback(null, {})
        })
      }

      mockDatabase.collection = jest.fn(collection => ({
        find: mockDatabase.find,
        insert: mockDatabase.insert
      }))

      mockClients = []
    })

    afterEach(() => {
      mockDatabase.close.mockClear()
      mockDatabase.collection.mockClear()
      mockDatabase.find.mockClear()
      mockDatabase.insert.mockClear()
      mockApi.module.Connection.mockClear()
    })

    describe('triggers interactive mode if data isn\'t supplied as parameters', () => {
      test('prompts the user for a clientId and secret and creates a client with the answers', () => {
        const args = argsHelper.getArgsForCommand('dadi api clients:add')
        const mockAnswers = {
          id: 'testClient',
          secret: 'superSecret',
          type: 'admin'
        }

        setMockInquirerAnswer(mockAnswers)

        return apiClientsAdd(args).then(stdout => {
          expect(mockSpinner.mock.calls[0][0]).toBe('Creating a new client')
          expect(mockSpinner.mock.calls[0][1]).toBe('start')

          expect(mockDatabase.collection).toHaveBeenCalledTimes(2)
          expect(mockDatabase.collection.mock.calls[0][0]).toBe(mockConfigParameters['auth.clientCollection'])

          expect(mockDatabase.find.mock.calls[0][0].clientId).toBe(mockAnswers.id)
          expect(mockDatabase.insert.mock.calls[0][0]).toEqual({
            clientId: mockAnswers.id,
            secret: mockAnswers.secret,
            type: mockAnswers.type
          })

          expect(mockDatabase.close).toHaveBeenCalled()
        })
      })

      test('generates a random secret if the user leaves the answer empty', () => {
        const args = argsHelper.getArgsForCommand('dadi api clients:add')
        const mockAnswers = {
          id: 'testClient',
          secret: '',
          type: 'admin'
        }

        setMockInquirerAnswer(mockAnswers)

        return apiClientsAdd(args).then(stdout => {
          expect(mockDatabase.find.mock.calls[0][0].clientId).toBe(mockAnswers.id)
          expect(mockDatabase.insert.mock.calls[0][0]).toEqual({
            clientId: mockAnswers.id,
            secret: mockRandomSecret,
            type: mockAnswers.type
          })
        })
      })

      test('displays an error message if there is already a client with the ID supplied', () => {
        const args = argsHelper.getArgsForCommand('dadi api clients:add')
        const mockAnswers = {
          id: 'existingClient',
          secret: 'superSecret',
          type: 'admin'
        }

        setMockInquirerAnswer(mockAnswers)

        mockClients = [
          {
            clientId: mockAnswers.id
          }
        ]

        return apiClientsAdd(args).then(stdout => {
          expect(mockSpinner.mock.calls[0][0]).toBe('Creating a new client')
          expect(mockSpinner.mock.calls[0][1]).toBe('start')
          expect(mockSpinner.mock.calls[1][0]).toBe(`The ID ${mockAnswers.id} already exists`)
          expect(mockSpinner.mock.calls[1][1]).toBe('fail')
          expect(mockDatabase.find.mock.calls[0][0].clientId).toBe(mockAnswers.id)
          expect(mockDatabase.insert).not.toHaveBeenCalled()

          expect(mockDatabase.close).toHaveBeenCalled()
        })
      })

      test('displays an error message if the find operation has failed', () => {
        const args = argsHelper.getArgsForCommand('dadi api clients:add')
        const mockAnswers = {
          id: 'existingClient',
          secret: 'superSecret',
          type: 'admin'
        }

        setMockInquirerAnswer(mockAnswers)

        mockClients = [
          {
            clientId: mockAnswers.id
          }
        ]

        mockDatabase.find = jest.fn(() => {
          return {
            toArray: callback => {
              callback(true)
            }
          }
        })

        return apiClientsAdd(args).then(stdout => {
          expect(mockSpinner.mock.calls[0][0]).toBe('Creating a new client')
          expect(mockSpinner.mock.calls[0][1]).toBe('start')
          expect(mockSpinner.mock.calls[1][0]).toBe('Could not create client')
          expect(mockSpinner.mock.calls[1][1]).toBe('fail')
          expect(mockDatabase.close).toHaveBeenCalled()
        })
      })

      test('displays an error message if the insert operation has failed', () => {
        const args = argsHelper.getArgsForCommand('dadi api clients:add')
        const mockAnswers = {
          id: 'existingClient',
          secret: 'superSecret',
          type: 'admin'
        }

        setMockInquirerAnswer(mockAnswers)

        mockClients = []

        mockDatabase.insert = jest.fn((payload, callback) => {
          callback(true)
        })

        return apiClientsAdd(args).then(stdout => {
          expect(mockSpinner.mock.calls[0][0]).toBe('Creating a new client')
          expect(mockSpinner.mock.calls[0][1]).toBe('start')
          expect(mockSpinner.mock.calls[1][0]).toBe('Could not create client')
          expect(mockSpinner.mock.calls[1][1]).toBe('fail')

          expect(mockDatabase.close).toHaveBeenCalled()
        })
      })
    })

    describe('uses data passed as parameters', () => {
      test('creates a client with the clientId, secret and type passed as parameters', () => {
        const mockArgs = {
          clientId: 'someClient',
          secret: 'mySecret',
          type: 'admin'
        }
        const args = argsHelper.getArgsForCommand(
          `dadi api clients:add --id=${mockArgs.clientId} --secret=${mockArgs.secret} --type=${mockArgs.type}`
        )

        return apiClientsAdd(args).then(stdout => {
          expect(mockSpinner.mock.calls[0][0]).toBe('Creating a new client')
          expect(mockSpinner.mock.calls[0][1]).toBe('start')
          expect(mockDatabase.find.mock.calls[0][0].clientId).toBe(mockArgs.clientId)
          expect(mockDatabase.insert.mock.calls[0][0]).toEqual(mockArgs)
        })
      })

      test('uses `user` as the default value for `type` if not supplied', () => {
        const mockArgs = {
          clientId: 'someClient',
          secret: 'mySecret',
          type: 'user'
        }
        const args = argsHelper.getArgsForCommand(
          `dadi api clients:add --id=${mockArgs.clientId} --secret=${mockArgs.secret}`
        )

        return apiClientsAdd(args).then(stdout => {
          expect(mockSpinner.mock.calls[0][0]).toBe('Creating a new client')
          expect(mockSpinner.mock.calls[0][1]).toBe('start')
          expect(mockDatabase.find.mock.calls[0][0].clientId).toBe(mockArgs.clientId)
          expect(mockDatabase.insert.mock.calls[0][0]).toEqual(mockArgs)
        })
      })

      test('displays an error message if there is already a client with the ID supplied', () => {
        const mockArgs = {
          clientId: 'existingClient',
          secret: 'mySecret',
          type: 'admin'
        }
        const args = argsHelper.getArgsForCommand(
          `dadi api clients:add --id=${mockArgs.clientId} --secret=${mockArgs.secret} --type=${mockArgs.type}`
        )

        mockClients = [
          {
            clientId: mockArgs.clientId
          }
        ]

        return apiClientsAdd(args).then(stdout => {
          expect(mockSpinner.mock.calls[0][0]).toBe('Creating a new client')
          expect(mockSpinner.mock.calls[0][1]).toBe('start')
          expect(mockSpinner.mock.calls[1][0]).toBe(`The ID ${mockArgs.clientId} already exists`)
          expect(mockSpinner.mock.calls[1][1]).toBe('fail')

          expect(mockDatabase.find.mock.calls[0][0].clientId).toBe(mockArgs.clientId)
          expect(mockDatabase.insert).not.toHaveBeenCalled()
        })
      })
    })
  })

  describe('API > v3', () => {
    const mockConfigParameters = {
      'auth.clientCollection': 'collection',
      'auth.database': 'database',
      'auth.datastore': 'datastore'
    }

    let mockApi
    let mockClients
    let mockDatabase
    let mockShellKillProcess = jest.fn()

    const mockShowSpinner = shell.showSpinner

    jest.mock('./../../../../../lib/shell', () => ({
      killProcess: mockShellKillProcess,
      showSpinner: mockShowSpinner
    }))

    beforeAll(() => {
      mockDatabase = {
        find: jest.fn(() => Promise.resolve({
          results: mockClients
        })),

        insert: jest.fn(() => Promise.resolve({}))
      }

      mockApi = {
        module: {
          Config: {
            get: parameter => mockConfigParameters[parameter]
          },
          Connection: jest.fn((options, datastore) => {
            return {
              on: (event, callback) => {
                if (event === 'connect') {
                  callback(mockDatabase)
                }
              }
            }
          })
        },
        pkg: {
          version: '3.0.0'
        }
      }

      jest.mock('./../../../../../lib/fs', () => ({
        loadApp: app => {
          return Promise.resolve(mockApi)
        }
      }))

      jest.resetModules()

      apiClientsAdd = require('./../../../../../entryPoints/api/commands/clients-add')
    })

    beforeEach(() => {
      mockClients = []
    })

    afterEach(() => {
      mockApi.module.Connection.mockClear()
      mockDatabase.find.mockClear()
      mockDatabase.insert.mockClear()
      mockShellKillProcess.mockClear()
    })

    describe('triggers interactive mode if data isn\'t supplied as parameters', () => {
      test('prompts the user for a clientId and secret and creates a client with the answers', () => {
        const args = argsHelper.getArgsForCommand('dadi api clients:add')
        const mockAnswers = {
          id: 'testClient',
          secret: 'superSecret',
          type: 'admin'
        }

        setMockInquirerAnswer(mockAnswers)

        return apiClientsAdd(args).then(stdout => {
          expect(mockSpinner.mock.calls[0][0]).toBe('Creating a new client')
          expect(mockSpinner.mock.calls[0][1]).toBe('start')
          expect(mockDatabase.find.mock.calls[0][0].query.clientId).toBe(mockAnswers.id)
          expect(mockDatabase.insert.mock.calls[0][0].data).toEqual({
            clientId: mockAnswers.id,
            secret: mockAnswers.secret,
            type: mockAnswers.type
          })

          expect(mockShellKillProcess).toHaveBeenCalled()
        })
      })

      test('generates a random secret if the user leaves the answer empty', () => {
        const args = argsHelper.getArgsForCommand('dadi api clients:add')
        const mockAnswers = {
          id: 'testClient',
          secret: '',
          type: 'admin'
        }

        setMockInquirerAnswer(mockAnswers)

        return apiClientsAdd(args).then(stdout => {
          expect(mockDatabase.find.mock.calls[0][0].query.clientId).toBe(mockAnswers.id)
          expect(mockDatabase.insert.mock.calls[0][0].data).toEqual({
            clientId: mockAnswers.id,
            secret: mockRandomSecret,
            type: mockAnswers.type
          })
        })
      })

      test('displays an error message if there is already a client with the ID supplied', () => {
        const args = argsHelper.getArgsForCommand('dadi api clients:add')
        const mockAnswers = {
          id: 'existingClient',
          secret: 'superSecret',
          type: 'admin'
        }

        setMockInquirerAnswer(mockAnswers)

        mockClients = [
          {
            clientId: mockAnswers.id
          }
        ]

        return apiClientsAdd(args).then(stdout => {
          expect(mockSpinner.mock.calls[0][0]).toBe('Creating a new client')
          expect(mockSpinner.mock.calls[0][1]).toBe('start')
          expect(mockSpinner.mock.calls[1][0]).toBe(`The ID ${mockAnswers.id} already exists`)
          expect(mockSpinner.mock.calls[1][1]).toBe('fail')

          expect(mockDatabase.find.mock.calls[0][0].query.clientId).toBe(mockAnswers.id)
          expect(mockDatabase.insert).not.toHaveBeenCalled()

          expect(mockShellKillProcess).toHaveBeenCalled()
        })
      })
    })

    describe('uses data passed as parameters', () => {
      test('creates a client with the clientId, secret and type passed as parameters', () => {
        const mockArgs = {
          clientId: 'someClient',
          secret: 'mySecret',
          type: 'admin'
        }
        const args = argsHelper.getArgsForCommand(
          `dadi api clients:add --id=${mockArgs.clientId} --secret=${mockArgs.secret} --type=${mockArgs.type}`
        )

        return apiClientsAdd(args).then(stdout => {
          expect(mockSpinner.mock.calls[0][0]).toBe('Creating a new client')
          expect(mockSpinner.mock.calls[0][1]).toBe('start')

          expect(mockDatabase.find.mock.calls[0][0].query.clientId).toBe(mockArgs.clientId)
          expect(mockDatabase.insert.mock.calls[0][0].data).toEqual(mockArgs)

          expect(mockShellKillProcess).toHaveBeenCalled()
        })
      })

      test('uses `user` as the default value for `type` if not supplied', () => {
        const mockArgs = {
          clientId: 'someClient',
          secret: 'mySecret',
          type: 'user'
        }
        const args = argsHelper.getArgsForCommand(
          `dadi api clients:add --id=${mockArgs.clientId} --secret=${mockArgs.secret}`
        )

        return apiClientsAdd(args).then(stdout => {
          expect(mockSpinner.mock.calls[0][0]).toBe('Creating a new client')
          expect(mockSpinner.mock.calls[0][1]).toBe('start')

          expect(mockDatabase.find.mock.calls[0][0].query.clientId).toBe(mockArgs.clientId)
          expect(mockDatabase.insert.mock.calls[0][0].data).toEqual(mockArgs)

          expect(mockShellKillProcess).toHaveBeenCalled()
        })
      })

      test('displays an error message if there is already a client with the ID supplied', () => {
        const mockArgs = {
          clientId: 'existingClient',
          secret: 'mySecret',
          type: 'admin'
        }
        const args = argsHelper.getArgsForCommand(
          `dadi api clients:add --id=${mockArgs.clientId} --secret=${mockArgs.secret} --type=${mockArgs.type}`
        )

        mockClients = [
          {
            clientId: mockArgs.clientId
          }
        ]

        return apiClientsAdd(args).then(stdout => {
          expect(mockSpinner.mock.calls[0][0]).toBe('Creating a new client')
          expect(mockSpinner.mock.calls[0][1]).toBe('start')
          expect(mockSpinner.mock.calls[1][0]).toBe(`The ID ${mockArgs.clientId} already exists`)
          expect(mockSpinner.mock.calls[1][1]).toBe('fail')

          expect(mockDatabase.find.mock.calls[0][0].query.clientId).toBe(mockArgs.clientId)
          expect(mockDatabase.insert).not.toHaveBeenCalled()

          expect(mockShellKillProcess).toHaveBeenCalled()
        })
      })
    })
  })
})
