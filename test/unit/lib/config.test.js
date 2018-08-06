const mockSpinner = require('./../../helpers/MockSpinner')
const path = require('path')
const getTime = Date.prototype.getTime

beforeEach(() => {
  jest.resetModules()
})

describe('Config utility', () => {
  describe('builds the path to an app\'s config file', () => {
    test('given a filename', () => {
      const config = require('./../../../lib/config')
      const configPath = config._getConfigFilePath({
        fileName: 'config.qa.json'
      })

      expect(configPath).toBe('config/config.qa.json')
    })

    test('given a filename and the sample parameter', () => {
      const config = require('./../../../lib/config')
      const configPath = config._getConfigFilePath({
        fileName: 'config.qa.json',
        sample: true
      })

      expect(configPath).toBe('config/config.qa.json.sample')
    })

    test('given a filename and the timestamp parameter', () => {
      const config = require('./../../../lib/config')

      Date.prototype.getTime = () => 123456789

      const configPath = config._getConfigFilePath({
        fileName: 'config.qa.json',
        timestamp: true
      })

      expect(configPath).toBe('config/config.qa.json-123456789')

      Date.prototype.getTime = getTime
    })
  })

  describe('loads an app\'s config schema', () => {
    test('checks whether a config file exists and requires `config.js` if it does', () => {
      const mockFileExists = jest.fn(file => Promise.resolve(true))
      const mockLoadAppFile = jest.fn(() => Promise.resolve({
        _def: {
          foo: 'bar'
        }
      }))

      jest.mock('./../../../lib/fs', () => ({
        fileExists: mockFileExists,
        loadAppFile: mockLoadAppFile
      }))

      const config = require('./../../../lib/config')

      return config.getAppConfig({
        app: '@dadi/api'
      }).then(config => {
        expect(mockFileExists.mock.calls[0][0]).toBe(
          path.join(
            process.cwd(),
            'config/config.development.json'
          )
        )
        expect(config).toEqual({
          schema: {
            foo: 'bar'
          }
        })
        expect(mockLoadAppFile.mock.calls[0][0]).toBe('@dadi/api')
      })
    })

    test('checks whether a config file exists and creates an empty one if not, only then requiring `config.js`', () => {
      const mockFileExists = jest.fn(file => Promise.resolve(false))
      const mockLoadAppFile = jest.fn(() => Promise.resolve({
        _def: {
          foo: 'bar'
        }
      }))
      const mockUnlink = jest.fn((filePath, callback) => callback(null))
      const mockWriteFile = jest.fn((filePath, content, callback) => callback(null))

      jest.mock('./../../../lib/fs', () => ({
        fileExists: mockFileExists,
        loadAppFile: mockLoadAppFile
      }))

      jest.mock('fs', () => ({
        unlink: mockUnlink,
        writeFile: mockWriteFile
      }))

      const config = require('./../../../lib/config')
      const configFilePath = path.join(
        process.cwd(),
        'config/config.development.json'
      )

      return config.getAppConfig({
        app: '@dadi/api'
      }).then(config => {
        expect(mockFileExists.mock.calls[0][0]).toBe(configFilePath)
        expect(config).toEqual({
          schema: {
            foo: 'bar'
          }
        })        
        expect(mockLoadAppFile.mock.calls[0][0]).toBe('@dadi/api')
        expect(mockWriteFile.mock.calls[0][0]).toBe(configFilePath)
        expect(mockWriteFile.mock.calls[0][1]).toBe('{}')
        expect(mockUnlink.mock.calls[0][0]).toBe(configFilePath)
      })
    })
  })

  describe('writes a config block to a file', () => {
    test('if a file does not exist at the computed path, the config is written straight away', () => {
      const mockNewConfig = {
        server: {
          host: '123.45.678.9',
          port: 1234
        }
      }
      const mockFileExists = jest.fn(file => Promise.resolve(false))
      const mockWriteFile = jest.fn((filePath, content, callback) => callback(null))

      jest.mock('./../../../lib/fs', () => ({
        fileExists: mockFileExists
      }))

      jest.mock('fs', () => ({
        writeFile: mockWriteFile
      }))

      const config = require('./../../../lib/config')
      const configFilePath = path.join(
        process.cwd(),
        'config/config.development.json'
      )

      return config.saveAppConfig({
        app: '@dadi/api',
        config: mockNewConfig,
        fileName: 'config.development.json',
      }).then(config => {
        expect(mockWriteFile.mock.calls[0][0]).toBe(configFilePath)
        expect(mockWriteFile.mock.calls[0][1]).toBe(JSON.stringify(mockNewConfig, null, 2))
        expect(mockWriteFile).toHaveBeenCalledTimes(1)

        expect(mockSpinner.mock.calls[0][0]).toBe('Writing files')
        expect(mockSpinner.mock.calls[0][1]).toBe('start')
        expect(mockSpinner.mock.calls[1][0]).toBe(`Configuration file written to ${config.path}.`)
        expect(mockSpinner.mock.calls[1][1]).toBe('succeed')

        expect(config.path).toBe(configFilePath)
      })
    })

    test('if a file already exists at the computed path, it is copied to a filename with a timestamp appended and only then the new config is written', () => {
      const mockExistingConfig = {
        server: {
          host: '0.0.0.0',
          port: 8080
        }
      }
      const mockNewConfig = {
        server: {
          host: '123.45.678.9',
          port: 1234
        }
      }
      const mockFileExists = jest.fn(file => Promise.resolve(true))
      const mockReadFile = jest.fn((file, encoding, callback) => {
        callback(null, JSON.stringify(mockExistingConfig, null, 2))
      })
      const mockWriteFile = jest.fn((filePath, content, callback) => callback(null))

      jest.mock('./../../../lib/fs', () => ({
        fileExists: mockFileExists
      }))

      jest.mock('fs', () => ({
        readFile: mockReadFile,
        writeFile: mockWriteFile
      }))

      Date.prototype.getTime = () => 123456789

      const config = require('./../../../lib/config')
      const configFilePath = path.join(
        process.cwd(),
        'config/config.development.json'
      )
      const backupFilePath = path.join(
        process.cwd(),
        'config/config.development.json-123456789'
      )

      return config.saveAppConfig({
        app: '@dadi/api',
        config: mockNewConfig,
        fileName: 'config.development.json',
      }).then(config => {
        expect(mockReadFile.mock.calls[0][0]).toBe(configFilePath)

        expect(mockWriteFile.mock.calls[0][0]).toBe(backupFilePath)
        expect(mockWriteFile.mock.calls[0][1]).toBe(JSON.stringify(mockExistingConfig, null, 2))
        expect(mockWriteFile.mock.calls[1][0]).toBe(configFilePath)
        expect(mockWriteFile.mock.calls[1][1]).toBe(JSON.stringify(mockNewConfig, null, 2))
        expect(mockWriteFile).toHaveBeenCalledTimes(2)

        expect(mockSpinner.mock.calls[0][0]).toBe('Writing files')
        expect(mockSpinner.mock.calls[0][1]).toBe('start')
        expect(mockSpinner.mock.calls[1][0]).toBe(`Configuration file written to ${config.path}. A file already existed at that location, so it was backed up to ${config.backupPath}.`)
        expect(mockSpinner.mock.calls[1][1]).toBe('warn')

        expect(config.path).toBe(configFilePath)
        expect(config.backupPath).toBe(backupFilePath)

        Date.prototype.getTime = getTime
      })
    })
  })
})