const path = require('path')

beforeEach(() => {
  jest.resetModules()
})

describe('FS utility', () => {
  describe('checks whether a file exists at the given path', () => {
    test('returns a Promise resolved with `true` if a file exists', () => {
      jest.mock('fs-extra', () => ({
        stat: file => {
          return Promise.resolve({})
        }
      }))

      const fsHelpers = require('./../../../lib/fs')

      return fsHelpers
        .fileExists('/Users/fakeUser/somefile.txt')
        .then(fileExists => {
          expect(fileExists).toBe(true)
        })
    })

    test('returns a Promise resolved with `false` if a file does not exist', () => {
      jest.mock('fs-extra', () => ({
        stat: file => {
          const error = new Error()

          error.code = 'ENOENT'

          return Promise.reject(error)
        }
      }))

      const fsHelpers = require('./../../../lib/fs')

      return fsHelpers
        .fileExists('/Users/fakeUser/somefile.txt')
        .then(fileExists => {
          expect(fileExists).toBe(false)
        })
    })
  })

  describe('requires a given app from the filesystem', () => {
    test('returns the entry point module and the package manifest', () => {
      const mockModule = require('./../../helpers/MockDadiApi')
      const mockPkg = require('./../../helpers/mockPackage.json')

      const fsHelpers = require('./../../../lib/fs')

      return fsHelpers.loadApp('@dadi/mock-app').then(app => {
        expect(app.module.toString()).toBe(mockModule.toString())
        expect(app.pkg).toEqual(mockPkg)
      })
    })

    test('returns an error if the app fails to load', () => {
      const fsHelpers = require('./../../../lib/fs')

      return fsHelpers.loadApp('@dadi/unmocked-app').catch(err => {
        expect(err).toBeInstanceOf(Error)
        expect(err.message).toBe('ERR_LOADING_APP')
      })
    })
  })
})