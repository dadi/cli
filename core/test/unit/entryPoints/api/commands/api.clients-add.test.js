require('./../../../../helpers/disable-colours')

const argsHelper = require('./../../../../helpers/args')
const mockDadiApi = require('./../../../../helpers/MockDadiApi')
const mockExec = require('./../../../../helpers/mockExec')
const mockInquirer = require('./../../../../helpers/mockInquirer')
const mockSpinner = require('./../../../../helpers/MockSpinner')
const path = require('path')
const pmock = require('pmock')
const registry = require('./../../../../../lib/registry')
const setMockInquirerAnswer = require('./../../../../helpers/mockInquirer').setAnswer

const apiClientsAdd = require('./../../../../../entryPoints/api/commands/clients-add')

this.cwd = pmock.cwd('/Users/fakeuser/fakedir')

describe('API `clients:add` command', () => {
  test('exports a description string', () => {
    expect(typeof apiClientsAdd.description).toBe('string')
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
        expect(mockDadiApi.mockDatabase.find.mock.calls[0][0].clientId).toBe(mockAnswers.id)
        expect(mockDadiApi.mockDatabase.insert.mock.calls[0][0]).toEqual({
          clientId: mockAnswers.id,
          secret: mockAnswers.secret,
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

      mockDadiApi.setExistingClients([
        {
          clientId: mockAnswers.id
        }
      ])
      
      return apiClientsAdd(args).then(stdout => {
        expect(mockSpinner.mock.calls[0][0]).toBe('Creating a new client')
        expect(mockSpinner.mock.calls[0][1]).toBe('start')
        expect(mockSpinner.mock.calls[1][0]).toBe(`The ID ${mockAnswers.id} already exists`)
        expect(mockSpinner.mock.calls[1][1]).toBe('fail')

        expect(mockDadiApi.mockDatabase.find.mock.calls[0][0].clientId).toBe(mockAnswers.id)
        expect(mockDadiApi.mockDatabase.insert).not.toHaveBeenCalled()
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
        expect(mockDadiApi.mockDatabase.find.mock.calls[0][0].clientId).toBe(mockArgs.clientId)
        expect(mockDadiApi.mockDatabase.insert.mock.calls[0][0]).toEqual(mockArgs)
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
        expect(mockDadiApi.mockDatabase.find.mock.calls[0][0].clientId).toBe(mockArgs.clientId)
        expect(mockDadiApi.mockDatabase.insert.mock.calls[0][0]).toEqual(mockArgs)
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

      mockDadiApi.setExistingClients([
        {
          clientId: mockArgs.clientId
        }
      ])
      
      return apiClientsAdd(args).then(stdout => {
        expect(mockSpinner.mock.calls[0][0]).toBe('Creating a new client')
        expect(mockSpinner.mock.calls[0][1]).toBe('start')
        expect(mockSpinner.mock.calls[1][0]).toBe(`The ID ${mockArgs.clientId} already exists`)
        expect(mockSpinner.mock.calls[1][1]).toBe('fail')

        expect(mockDadiApi.mockDatabase.find.mock.calls[0][0].clientId).toBe(mockArgs.clientId)
        expect(mockDadiApi.mockDatabase.insert).not.toHaveBeenCalled()
      })
    })
  })
})
