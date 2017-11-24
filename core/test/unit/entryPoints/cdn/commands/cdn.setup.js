require('./../../../../helpers/disable-colours')

const argsHelper = require('./../../../../helpers/args')
const fs = require('fs-extra')
const mockInquirer = require('./../../../../helpers/mockInquirer')
const path = require('path')
const registry = require('./../../../../../lib/registry')

const cdnSetup = require('./../../../../../entryPoints/api/commands/setup')
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

describe('CDN `setup` command', () => {
  test('exports a description string', () => {
    expect(typeof cdnSetup.description).toBe('string')
  })

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

    fsHelpers.loadApp = app => {
      return Promise.resolve({
        module: {
          Config: {
            get: parameter => parameter
          }
        },
        pkg: {
          version: '1.8.0'
        }
      })
    }
  })

  beforeEach(() => {
    configHelpers.getAppConfig.mockClear()
    configHelpers.saveAppConfig.mockClear()

    promptAnswers = {
      server: {
        name: 'My CDN',
        host: '0.0.0.0',
        port: 8081,
        protocol: 'http'
      },
      env: 'development'
    }
  })

  test('writes the API configuration file', () => {
    const args = argsHelper.getArgsForCommand('dadi api setup')

    mockInquirer.setAnswer(promptAnswers)

    return cdnSetup(args).then(out => {
      const mockCall = configHelpers.saveAppConfig.mock.calls[0][0]

      expect(configHelpers.saveAppConfig).toHaveBeenCalledTimes(2)
      expect(mockCall.description).toBe('CDN configuration file')
      expect(mockCall.fileName).toBe(`config.${promptAnswers.env}.json`)
      expect(mockCall.app).toBe('@dadi/cdn')
      expect(mockCall.config).toEqual(answers)
    })
  })  
})
