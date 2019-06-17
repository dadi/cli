const argsHelper = require('./../../../../helpers/args')
const fs = require('fs')
const mockDadiApi = require('./../../../../helpers/MockDadiApi')
const mockExec = require('./../../../../helpers/MockExec')
const mockInquirer = require('./../../../../helpers/mockInquirer')
const mockSpinner = require('./../../../../helpers/MockSpinner')
const path = require('path')
const pmock = require('pmock')
const registry = require('./../../../../../lib/registry')
const setMockInquirerAnswer = require('./../../../../helpers/mockInquirer')
  .setAnswer
const shell = require('./../../../../../lib/shell')
const util = require('./../../../../../lib/util')

const createRecordsFnV1 = fs.readFileSync(
  path.resolve(
    __dirname +
      './../../../../../entryPoints/api/commands/clients-add/create-records-api-v1.js'
  ),
  'utf8'
)
const createRecordsFnV3 = fs.readFileSync(
  path.resolve(
    __dirname +
      './../../../../../entryPoints/api/commands/clients-add/create-records-api-v3.js'
  ),
  'utf8'
)
const createRecordsFnV5 = fs.readFileSync(
  path.resolve(
    __dirname +
      './../../../../../entryPoints/api/commands/clients-add/create-records-api-v5.js'
  ),
  'utf8'
)

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

  describe('API versions [0, 3.0[', () => {
    beforeAll(() => {
      jest.mock('./../../../../../lib/fs', () => ({
        loadAppFile: app => {
          return Promise.resolve({
            version: '2.0.0'
          })
        }
      }))

      jest.resetModules()

      apiClientsAdd = require('./../../../../../entryPoints/api/commands/clients-add')
    })

    describe("triggers interactive mode if data isn't supplied as parameters", () => {
      test('prompts the user for a clientId and secret and creates a client with the answers', () => {
        const args = argsHelper.getArgsForCommand('api clients:add')
        const mockAnswers = {
          id: 'testClient',
          secret: 'superSecret',
          accessType: 'admin'
        }

        setMockInquirerAnswer(mockAnswers)

        return apiClientsAdd(args).then(stdout => {
          expect(mockSpinner.mock.calls[0][0]).toBe('Creating a new client')
          expect(mockSpinner.mock.calls[0][1]).toBe('start')

          expect(mockExec.mock.calls[0][0]).toBe(
            `node -e "${createRecordsFnV1}" ${mockAnswers.id} ${
              mockAnswers.secret
            } ${mockAnswers.accessType}`
          )
        })
      })

      test('generates a random secret if the user leaves the answer empty', () => {
        const args = argsHelper.getArgsForCommand('api clients:add')
        const mockAnswers = {
          id: 'testClient',
          secret: '',
          accessType: 'admin'
        }

        setMockInquirerAnswer(mockAnswers)

        return apiClientsAdd(args).then(stdout => {
          expect(mockExec.mock.calls[0][0]).toBe(
            `node -e "${createRecordsFnV1}" ${
              mockAnswers.id
            } ${mockRandomSecret} ${mockAnswers.accessType}`
          )
        })
      })

      test('displays an error message if there is already a client with the ID supplied', () => {
        const args = argsHelper.getArgsForCommand('api clients:add')
        const mockAnswers = {
          id: 'existingClient',
          secret: 'superSecret',
          accessType: 'admin'
        }

        setMockInquirerAnswer(mockAnswers)
        mockExec.setNextResponse(new Error('ID_EXISTS'))

        return apiClientsAdd(args).then(stdout => {
          expect(mockSpinner.mock.calls[0][0]).toBe('Creating a new client')
          expect(mockSpinner.mock.calls[0][1]).toBe('start')
          expect(mockSpinner.mock.calls[1][0]).toBe(
            `The ID ${mockAnswers.id} already exists`
          )
          expect(mockSpinner.mock.calls[1][1]).toBe('fail')
        })
      })

      test('displays an error message if the operation has failed', () => {
        const args = argsHelper.getArgsForCommand('api clients:add')
        const mockAnswers = {
          id: 'existingClient',
          secret: 'superSecret',
          accessType: 'admin'
        }

        setMockInquirerAnswer(mockAnswers)
        mockExec.setNextResponse(new Error())

        return apiClientsAdd(args).then(stdout => {
          expect(mockSpinner.mock.calls[0][0]).toBe('Creating a new client')
          expect(mockSpinner.mock.calls[0][1]).toBe('start')
          expect(mockSpinner.mock.calls[1][0]).toBe('Could not create client')
          expect(mockSpinner.mock.calls[1][1]).toBe('fail')
        })
      })
    })

    describe('uses data passed as parameters', () => {
      test('creates a client with the clientId, secret and access type passed as parameters', () => {
        const mockArgs = {
          clientId: 'someClient',
          secret: 'mySecret',
          accessType: 'admin'
        }
        const args = argsHelper.getArgsForCommand(
          `dadi api clients:add --id=${mockArgs.clientId} --secret=${
            mockArgs.secret
          } --accessType=${mockArgs.accessType}`
        )

        return apiClientsAdd(args).then(stdout => {
          expect(mockSpinner.mock.calls[0][0]).toBe('Creating a new client')
          expect(mockSpinner.mock.calls[0][1]).toBe('start')
          expect(mockExec.mock.calls[0][0]).toBe(
            `node -e "${createRecordsFnV1}" ${mockArgs.clientId} ${
              mockArgs.secret
            } ${mockArgs.accessType}`
          )
        })
      })

      test('uses `user` as the default value for `accessType` is not supplied', () => {
        const mockArgs = {
          clientId: 'someClient',
          secret: 'mySecret'
        }
        const args = argsHelper.getArgsForCommand(
          `dadi api clients:add --id=${mockArgs.clientId} --secret=${
            mockArgs.secret
          }`
        )

        return apiClientsAdd(args).then(stdout => {
          expect(mockSpinner.mock.calls[0][0]).toBe('Creating a new client')
          expect(mockSpinner.mock.calls[0][1]).toBe('start')
          expect(mockExec.mock.calls[0][0]).toBe(
            `node -e "${createRecordsFnV1}" ${mockArgs.clientId} ${
              mockArgs.secret
            } user`
          )
        })
      })

      test('displays an error message if there is already a client with the ID supplied', () => {
        const mockArgs = {
          clientId: 'existingClient',
          secret: 'mySecret',
          accessType: 'admin'
        }
        const args = argsHelper.getArgsForCommand(
          `dadi api clients:add --id=${mockArgs.clientId} --secret=${
            mockArgs.secret
          } --accessType=${mockArgs.accessType}`
        )

        mockExec.setNextResponse(new Error('ID_EXISTS'))

        return apiClientsAdd(args).then(stdout => {
          expect(mockSpinner.mock.calls[0][0]).toBe('Creating a new client')
          expect(mockSpinner.mock.calls[0][1]).toBe('start')
          expect(mockSpinner.mock.calls[1][0]).toBe(
            `The ID ${mockArgs.clientId} already exists`
          )
          expect(mockSpinner.mock.calls[1][1]).toBe('fail')
        })
      })
    })
  })

  describe('API versions [3.0, 5.0[', () => {
    const mockShowSpinner = shell.showSpinner

    jest.mock('./../../../../../lib/shell', () => ({
      showSpinner: mockShowSpinner
    }))

    beforeAll(() => {
      jest.mock('./../../../../../lib/fs', () => ({
        loadAppFile: app => {
          return Promise.resolve({
            version: '3.0.0'
          })
        }
      }))

      jest.resetModules()

      apiClientsAdd = require('./../../../../../entryPoints/api/commands/clients-add')
    })

    describe("triggers interactive mode if data isn't supplied as parameters", () => {
      test('prompts the user for a clientId and secret and creates a client with the answers', () => {
        const args = argsHelper.getArgsForCommand('api clients:add')
        const mockAnswers = {
          id: 'testClient',
          secret: 'superSecret',
          accessType: 'admin'
        }

        setMockInquirerAnswer(mockAnswers)

        return apiClientsAdd(args).then(stdout => {
          expect(mockSpinner.mock.calls[0][0]).toBe('Creating a new client')
          expect(mockSpinner.mock.calls[0][1]).toBe('start')
          expect(mockSpinner.mock.calls[1][0]).toBe(
            `Created client with ID ${mockAnswers.id} and access type ${
              mockAnswers.accessType
            }.`
          )
          expect(mockSpinner.mock.calls[1][1]).toBe('succeed')

          expect(mockExec.mock.calls[0][0]).toBe(
            `node -e "${createRecordsFnV3}" ${mockAnswers.id} ${
              mockAnswers.secret
            } ${mockAnswers.accessType}`
          )
        })
      })

      test('generates a random secret if the user leaves the answer empty', () => {
        const args = argsHelper.getArgsForCommand('api clients:add')
        const mockAnswers = {
          id: 'testClient',
          secret: '',
          accessType: 'admin'
        }

        setMockInquirerAnswer(mockAnswers)

        return apiClientsAdd(args).then(stdout => {
          expect(mockSpinner.mock.calls[1][0]).toBe(
            `Created client with ID ${mockAnswers.id} and access type ${
              mockAnswers.accessType
            }. The secret we generated for you is ${mockRandomSecret} – store it somewhere safe!`
          )
          expect(mockSpinner.mock.calls[1][1]).toBe('succeed')

          expect(mockExec.mock.calls[0][0]).toBe(
            `node -e "${createRecordsFnV3}" ${
              mockAnswers.id
            } ${mockRandomSecret} ${mockAnswers.accessType}`
          )
        })
      })

      test('displays an error message if there is already a client with the ID supplied', () => {
        const args = argsHelper.getArgsForCommand('api clients:add')
        const mockAnswers = {
          id: 'existingClient',
          secret: 'superSecret',
          accessType: 'admin'
        }

        setMockInquirerAnswer(mockAnswers)
        mockExec.setNextResponse(new Error('ID_EXISTS'))

        return apiClientsAdd(args).then(stdout => {
          expect(mockSpinner.mock.calls[0][0]).toBe('Creating a new client')
          expect(mockSpinner.mock.calls[0][1]).toBe('start')
          expect(mockSpinner.mock.calls[1][0]).toBe(
            `The ID ${mockAnswers.id} already exists`
          )
          expect(mockSpinner.mock.calls[1][1]).toBe('fail')

          expect(mockExec.mock.calls[0][0]).toBe(
            `node -e "${createRecordsFnV3}" ${mockAnswers.id} ${
              mockAnswers.secret
            } ${mockAnswers.accessType}`
          )
        })
      })
    })

    describe('uses data passed as parameters', () => {
      test('creates a client with the clientId, secret and accessType passed as parameters', () => {
        const mockArgs = {
          clientId: 'someClient',
          secret: 'mySecret',
          accessType: 'admin'
        }
        const args = argsHelper.getArgsForCommand(
          `dadi api clients:add --id=${mockArgs.clientId} --secret=${
            mockArgs.secret
          } --accessType=${mockArgs.accessType}`
        )

        return apiClientsAdd(args).then(stdout => {
          expect(mockSpinner.mock.calls[0][0]).toBe('Creating a new client')
          expect(mockSpinner.mock.calls[0][1]).toBe('start')

          expect(mockExec.mock.calls[0][0]).toBe(
            `node -e "${createRecordsFnV3}" ${mockArgs.clientId} ${
              mockArgs.secret
            } ${mockArgs.accessType}`
          )
        })
      })

      test('uses `user` as the default value for `accessType` if not supplied', () => {
        const mockArgs = {
          clientId: 'someClient',
          secret: 'mySecret'
        }
        const args = argsHelper.getArgsForCommand(
          `dadi api clients:add --id=${mockArgs.clientId} --secret=${
            mockArgs.secret
          }`
        )

        return apiClientsAdd(args).then(stdout => {
          expect(mockSpinner.mock.calls[0][0]).toBe('Creating a new client')
          expect(mockSpinner.mock.calls[0][1]).toBe('start')

          expect(mockExec.mock.calls[0][0]).toBe(
            `node -e "${createRecordsFnV3}" ${mockArgs.clientId} ${
              mockArgs.secret
            } user`
          )
        })
      })

      test('displays an error message if there is already a client with the ID supplied', () => {
        const mockArgs = {
          clientId: 'existingClient',
          secret: 'mySecret',
          accessType: 'admin'
        }
        const args = argsHelper.getArgsForCommand(
          `dadi api clients:add --id=${mockArgs.clientId} --secret=${
            mockArgs.secret
          } --accessType=${mockArgs.accessType}`
        )

        mockExec.setNextResponse(new Error('ID_EXISTS'))

        return apiClientsAdd(args).then(stdout => {
          expect(mockSpinner.mock.calls[0][0]).toBe('Creating a new client')
          expect(mockSpinner.mock.calls[0][1]).toBe('start')
          expect(mockSpinner.mock.calls[1][0]).toBe(
            `The ID ${mockArgs.clientId} already exists`
          )
          expect(mockSpinner.mock.calls[1][1]).toBe('fail')

          expect(mockExec.mock.calls[0][0]).toBe(
            `node -e "${createRecordsFnV3}" ${mockArgs.clientId} ${
              mockArgs.secret
            } ${mockArgs.accessType}`
          )
        })
      })
    })
  })

  describe('API versions [5.0, Infinity]', () => {
    const mockShowSpinner = shell.showSpinner

    jest.mock('./../../../../../lib/shell', () => ({
      showSpinner: mockShowSpinner
    }))

    beforeAll(() => {
      jest.mock('./../../../../../lib/fs', () => ({
        loadAppFile: app => {
          return Promise.resolve({
            version: '5.0.0'
          })
        }
      }))

      jest.resetModules()

      apiClientsAdd = require('./../../../../../entryPoints/api/commands/clients-add')
    })

    describe("triggers interactive mode if data isn't supplied as parameters", () => {
      test('prompts the user for a clientId and secret and creates a client with the answers', () => {
        const args = argsHelper.getArgsForCommand('api clients:add')
        const mockAnswers = {
          id: 'testClient',
          secret: 'superSecret',
          accessType: 'admin'
        }

        setMockInquirerAnswer(mockAnswers)

        return apiClientsAdd(args).then(stdout => {
          expect(mockSpinner.mock.calls[0][0]).toBe('Creating a new client')
          expect(mockSpinner.mock.calls[0][1]).toBe('start')
          expect(mockSpinner.mock.calls[1][0]).toBe(
            `Created client with ID ${mockAnswers.id} and access type ${
              mockAnswers.accessType
            }.`
          )
          expect(mockSpinner.mock.calls[1][1]).toBe('succeed')

          expect(mockExec.mock.calls[0][0]).toBe(
            `node -e "${createRecordsFnV5}" ${mockAnswers.id} ${
              mockAnswers.secret
            } ${mockAnswers.accessType}`
          )
        })
      })

      test('generates a random secret if the user leaves the answer empty', () => {
        const args = argsHelper.getArgsForCommand('api clients:add')
        const mockAnswers = {
          id: 'testClient',
          secret: '',
          accessType: 'admin'
        }

        setMockInquirerAnswer(mockAnswers)

        return apiClientsAdd(args).then(stdout => {
          expect(mockSpinner.mock.calls[1][0]).toBe(
            `Created client with ID ${mockAnswers.id} and access type ${
              mockAnswers.accessType
            }. The secret we generated for you is ${mockRandomSecret} – store it somewhere safe!`
          )
          expect(mockSpinner.mock.calls[1][1]).toBe('succeed')

          expect(mockExec.mock.calls[0][0]).toBe(
            `node -e "${createRecordsFnV5}" ${
              mockAnswers.id
            } ${mockRandomSecret} ${mockAnswers.accessType}`
          )
        })
      })

      test('displays an error message if there is already a client with the ID supplied', () => {
        const args = argsHelper.getArgsForCommand('api clients:add')
        const mockAnswers = {
          id: 'existingClient',
          secret: 'superSecret',
          accessType: 'admin'
        }

        setMockInquirerAnswer(mockAnswers)
        mockExec.setNextResponse(new Error('ID_EXISTS'))

        return apiClientsAdd(args).then(stdout => {
          expect(mockSpinner.mock.calls[0][0]).toBe('Creating a new client')
          expect(mockSpinner.mock.calls[0][1]).toBe('start')
          expect(mockSpinner.mock.calls[1][0]).toBe(
            `The ID ${mockAnswers.id} already exists`
          )
          expect(mockSpinner.mock.calls[1][1]).toBe('fail')

          expect(mockExec.mock.calls[0][0]).toBe(
            `node -e "${createRecordsFnV5}" ${mockAnswers.id} ${
              mockAnswers.secret
            } ${mockAnswers.accessType}`
          )
        })
      })
    })

    describe('uses data passed as parameters', () => {
      test('creates a client with the clientId, secret and accessType passed as parameters', () => {
        const mockArgs = {
          clientId: 'someClient',
          secret: 'mySecret',
          accessType: 'admin'
        }
        const args = argsHelper.getArgsForCommand(
          `dadi api clients:add --id=${mockArgs.clientId} --secret=${
            mockArgs.secret
          } --accessType=${mockArgs.accessType}`
        )

        return apiClientsAdd(args).then(stdout => {
          expect(mockSpinner.mock.calls[0][0]).toBe('Creating a new client')
          expect(mockSpinner.mock.calls[0][1]).toBe('start')

          expect(mockExec.mock.calls[0][0]).toBe(
            `node -e "${createRecordsFnV5}" ${mockArgs.clientId} ${
              mockArgs.secret
            } ${mockArgs.accessType}`
          )
        })
      })

      test('uses `user` as the default value for `accessType` if not supplied', () => {
        const mockArgs = {
          clientId: 'someClient',
          secret: 'mySecret'
        }
        const args = argsHelper.getArgsForCommand(
          `dadi api clients:add --id=${mockArgs.clientId} --secret=${
            mockArgs.secret
          }`
        )

        return apiClientsAdd(args).then(stdout => {
          expect(mockSpinner.mock.calls[0][0]).toBe('Creating a new client')
          expect(mockSpinner.mock.calls[0][1]).toBe('start')

          expect(mockExec.mock.calls[0][0]).toBe(
            `node -e "${createRecordsFnV5}" ${mockArgs.clientId} ${
              mockArgs.secret
            } user`
          )
        })
      })

      test('displays an error message if there is already a client with the ID supplied', () => {
        const mockArgs = {
          clientId: 'existingClient',
          secret: 'mySecret',
          accessType: 'admin'
        }
        const args = argsHelper.getArgsForCommand(
          `dadi api clients:add --id=${mockArgs.clientId} --secret=${
            mockArgs.secret
          } --accessType=${mockArgs.accessType}`
        )

        mockExec.setNextResponse(new Error('ID_EXISTS'))

        return apiClientsAdd(args).then(stdout => {
          expect(mockSpinner.mock.calls[0][0]).toBe('Creating a new client')
          expect(mockSpinner.mock.calls[0][1]).toBe('start')
          expect(mockSpinner.mock.calls[1][0]).toBe(
            `The ID ${mockArgs.clientId} already exists`
          )
          expect(mockSpinner.mock.calls[1][1]).toBe('fail')

          expect(mockExec.mock.calls[0][0]).toBe(
            `node -e "${createRecordsFnV5}" ${mockArgs.clientId} ${
              mockArgs.secret
            } ${mockArgs.accessType}`
          )
        })
      })
    })
  })
})
