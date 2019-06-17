const argsHelper = require('./../../../../helpers/args')
const fs = require('fs')
const mockExec = require('./../../../../helpers/MockExec')
const mockSpinner = require('./../../../../helpers/MockSpinner')
const path = require('path')
const pmock = require('pmock')
const setMockInquirerAnswer = require('./../../../../helpers/mockInquirer')
  .setAnswer

const upgradeRecordsFnV1 = fs.readFileSync(
  path.resolve(
    __dirname +
      './../../../../../entryPoints/api/commands/clients-upgrade/upgrade-records-api-v5.js'
  ),
  'utf8'
)

let apiClientsAdd = require('./../../../../../entryPoints/api/commands/clients-upgrade')

this.cwd = pmock.cwd('/Users/fakeuser/fakedir')

describe('API `clients:add` command', () => {
  test('exports a description string', () => {
    expect(typeof apiClientsAdd.description).toBe('string')
  })

  describe('to API 5.0', () => {
    beforeAll(() => {
      jest.mock('./../../../../../lib/fs', () => ({
        loadAppFile: app => {
          return Promise.resolve({
            version: '4.0.0'
          })
        }
      }))

      jest.resetModules()

      apiClientsAdd = require('./../../../../../entryPoints/api/commands/clients-upgrade')
    })

    test('calls the appropriate function with the right arguments', () => {
      const args = argsHelper.getArgsForCommand('api clients:upgrade')
      const mockAnswers = {
        id: 'testClient',
        secret: 'superSecret',
        accessType: 'admin'
      }

      setMockInquirerAnswer(mockAnswers)

      return apiClientsAdd(args).then(stdout => {
        expect(mockSpinner.mock.calls[0][0]).toBe('Analysing client records')
        expect(mockSpinner.mock.calls[0][1]).toBe('start')

        expect(mockExec.mock.calls[0][0]).toBe(
          `node -e "${upgradeRecordsFnV1}"`
        )
      })
    })
  })
})
