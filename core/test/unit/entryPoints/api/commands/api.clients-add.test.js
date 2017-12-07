require('./../../../../helpers/disable-colours')

const argsHelper = require('./../../../../helpers/args')
const fs = require('fs')
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

const createRecordsFnV1V2 = fs.readFileSync(
  path.resolve(__dirname + './../../../../../entryPoints/api/commands/clients-add/create-records-api-v1-v2.js'),
  'utf8'
)
const createRecordsFnV3 = fs.readFileSync(
  path.resolve(__dirname + './../../../../../entryPoints/api/commands/clients-add/create-records-api-v3.js'),
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

  describe('API < v3', () => {
    const mockConfigParameters = {
      'auth.clientCollection': 'collection',
      'auth.database': 'database'
    }

    let mockClients
    let mockDatabase

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

          expect(mockExec.mock.calls[0][0]).toBe(
            `node -e "${createRecordsFnV1V2}" ${mockAnswers.id} ${mockAnswers.secret} ${mockAnswers.type}`
          )
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
          expect(mockExec.mock.calls[0][0]).toBe(
            `node -e "${createRecordsFnV1V2}" ${mockAnswers.id} ${mockRandomSecret} ${mockAnswers.type}`
          )
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
        mockExec.setNextResponse(new Error('ID_EXISTS'))

        return apiClientsAdd(args).then(stdout => {
          expect(mockSpinner.mock.calls[0][0]).toBe('Creating a new client')
          expect(mockSpinner.mock.calls[0][1]).toBe('start')
          expect(mockSpinner.mock.calls[1][0]).toBe(`The ID ${mockAnswers.id} already exists`)
          expect(mockSpinner.mock.calls[1][1]).toBe('fail')
        })
      })

      test('displays an error message if the operation has failed', () => {
        const args = argsHelper.getArgsForCommand('dadi api clients:add')
        const mockAnswers = {
          id: 'existingClient',
          secret: 'superSecret',
          type: 'admin'
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
          expect(mockExec.mock.calls[0][0]).toBe(
            `node -e "${createRecordsFnV1V2}" ${mockArgs.clientId} ${mockArgs.secret} ${mockArgs.type}`
          )
        })
      })

      test('uses `user` as the default value for `type` if not supplied', () => {
        const mockArgs = {
          clientId: 'someClient',
          secret: 'mySecret'
        }
        const args = argsHelper.getArgsForCommand(
          `dadi api clients:add --id=${mockArgs.clientId} --secret=${mockArgs.secret}`
        )

        return apiClientsAdd(args).then(stdout => {
          expect(mockSpinner.mock.calls[0][0]).toBe('Creating a new client')
          expect(mockSpinner.mock.calls[0][1]).toBe('start')
          expect(mockExec.mock.calls[0][0]).toBe(
            `node -e "${createRecordsFnV1V2}" ${mockArgs.clientId} ${mockArgs.secret} user`
          )
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

        mockExec.setNextResponse(new Error('ID_EXISTS'))

        return apiClientsAdd(args).then(stdout => {
          expect(mockSpinner.mock.calls[0][0]).toBe('Creating a new client')
          expect(mockSpinner.mock.calls[0][1]).toBe('start')
          expect(mockSpinner.mock.calls[1][0]).toBe(`The ID ${mockArgs.clientId} already exists`)
          expect(mockSpinner.mock.calls[1][1]).toBe('fail')
        })
      })
    })
  })

  describe('API > v3', () => {
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
          expect(mockSpinner.mock.calls[1][0]).toBe(
            `Created client with ID ${mockAnswers.id} and type ${mockAnswers.type}.`
          )
          expect(mockSpinner.mock.calls[1][1]).toBe('succeed')

          expect(mockExec.mock.calls[0][0]).toBe(
            `node -e "${createRecordsFnV3}" ${mockAnswers.id} ${mockAnswers.secret} ${mockAnswers.type}`
          )
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
          expect(mockSpinner.mock.calls[1][0]).toBe(
            `Created client with ID ${mockAnswers.id} and type ${mockAnswers.type}. The secret we generated for you is ${mockRandomSecret} – store it somewhere safe!`
          )
          expect(mockSpinner.mock.calls[1][1]).toBe('succeed')

          expect(mockExec.mock.calls[0][0]).toBe(
            `node -e "${createRecordsFnV3}" ${mockAnswers.id} ${mockRandomSecret} ${mockAnswers.type}`
          )
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
        mockExec.setNextResponse(new Error('ID_EXISTS'))

        return apiClientsAdd(args).then(stdout => {
          expect(mockSpinner.mock.calls[0][0]).toBe('Creating a new client')
          expect(mockSpinner.mock.calls[0][1]).toBe('start')
          expect(mockSpinner.mock.calls[1][0]).toBe(`The ID ${mockAnswers.id} already exists`)
          expect(mockSpinner.mock.calls[1][1]).toBe('fail')

          expect(mockExec.mock.calls[0][0]).toBe(
            `node -e "${createRecordsFnV3}" ${mockAnswers.id} ${mockAnswers.secret} ${mockAnswers.type}`
          )
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

          expect(mockExec.mock.calls[0][0]).toBe(
            `node -e "${createRecordsFnV3}" ${mockArgs.clientId} ${mockArgs.secret} ${mockArgs.type}`
          )
        })
      })

      test('uses `user` as the default value for `type` if not supplied', () => {
        const mockArgs = {
          clientId: 'someClient',
          secret: 'mySecret'
        }
        const args = argsHelper.getArgsForCommand(
          `dadi api clients:add --id=${mockArgs.clientId} --secret=${mockArgs.secret}`
        )

        return apiClientsAdd(args).then(stdout => {
          expect(mockSpinner.mock.calls[0][0]).toBe('Creating a new client')
          expect(mockSpinner.mock.calls[0][1]).toBe('start')

          expect(mockExec.mock.calls[0][0]).toBe(
            `node -e "${createRecordsFnV3}" ${mockArgs.clientId} ${mockArgs.secret} user`
          )
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

        mockExec.setNextResponse(new Error('ID_EXISTS'))

        return apiClientsAdd(args).then(stdout => {
          expect(mockSpinner.mock.calls[0][0]).toBe('Creating a new client')
          expect(mockSpinner.mock.calls[0][1]).toBe('start')
          expect(mockSpinner.mock.calls[1][0]).toBe(`The ID ${mockArgs.clientId} already exists`)
          expect(mockSpinner.mock.calls[1][1]).toBe('fail')

          expect(mockExec.mock.calls[0][0]).toBe(
            `node -e "${createRecordsFnV3}" ${mockArgs.clientId} ${mockArgs.secret} ${mockArgs.type}`
          )
        })
      })
    })
  })
})
