const mockInquirer = require('./../../helpers/mockInquirer')
const path = require('path')
const pmock = require('pmock')

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

  describe('requires an app file from the filesystem', () => {
    test('returns the loaded file if it exists', () => {
      const fsHelpers = require('./../../../lib/fs')

      return fsHelpers.loadAppFile('@dadi/some-app', {
        filePath: 'some-file.json'
      }).then(file => {
        expect(file.name).toBe('@dadi/api')
      })
    })

    test('returns an error if the file fails to load', () => {
      const fsHelpers = require('./../../../lib/fs')

      return fsHelpers.loadAppFile('@dadi/some-app', {
        filePath: 'some-other-file.json'
      }).catch(err => {
        expect(err.code).toBe('MODULE_NOT_FOUND')
      })
    })
  })

  describe('reads a file from the filesystem', () => {
    test('returns the contents of the file if it exists', () => {
      const mockFullPath = path.resolve(
        process.cwd(),
        'some-directory',
        'mock-file.txt'
      )

      jest.mock('fs-extra', () => ({
        readFile: (filePath, encoding) => {
          expect(filePath).toBe(mockFullPath)
          expect(encoding).toBe('utf8')

          return Promise.resolve('This is a text file')
        }
      }))

      const fsHelpers = require('./../../../lib/fs')

      return fsHelpers.readFile('mock-file.txt', {
        baseDirectory: 'some-directory'
      }).then(file => {
        expect(file).toBe('This is a text file')
      })
    })

    test('returns an error if the file fails to load', () => {
      const mockFullPath = path.resolve(
        process.cwd(),
        'some-directory',
        'mock-file.txt'
      )

      jest.mock('fs-extra', () => ({
        readFile: (filePath, encoding) => {
          expect(filePath).toBe(mockFullPath)
          expect(encoding).toBe('utf8')

          return Promise.reject(new Error('ENOENT'))
        }
      }))

      const fsHelpers = require('./../../../lib/fs')

      return fsHelpers.readFile('mock-file.txt', {
        baseDirectory: 'some-directory'
      }).catch(err => {
        expect(err.message).toBe('ENOENT')
      })
    })
  })

  describe('warns if there is a non-empty directory at a given path', () => {
    test('returns `false` if the given directory exists and is empty', () => {
      const mockDirectory = '/some/directory'

      jest.mock('fs-extra', () => ({
        readdir: directoryPath => {
          expect(directoryPath).toBe(mockDirectory)

          return Promise.resolve([])
        }
      }))

      const fsHelpers = require('./../../../lib/fs')

      return fsHelpers.warnIfDirectoryIsNotEmpty({
        directory: mockDirectory
      }).then(result => {
        expect(mockInquirer).not.toHaveBeenCalled()
        expect(result).toBe(false)
      })
    })

    test('returns `false` if the given directory does not exist', () => {
      const mockDirectory = '/some/directory'

      jest.mock('fs-extra', () => ({
        readdir: directoryPath => {
          expect(directoryPath).toBe(mockDirectory)

          const err = new Error()

          err.code = 'ENOENT'

          return Promise.reject(err)
        }
      }))

      const fsHelpers = require('./../../../lib/fs')

      return fsHelpers.warnIfDirectoryIsNotEmpty({
        directory: mockDirectory
      }).then(result => {
        expect(mockInquirer).not.toHaveBeenCalled()
        expect(result).toBe(false)
      })
    })

    describe('displays a message if the directory exists and is not empty', () => {
      test('uses a default message if the `message` parameter is not supplied', () => {
        const mockDirectory = '/some/directory'

        jest.mock('fs-extra', () => ({
          readdir: directoryPath => {
            expect(directoryPath).toBe(mockDirectory)

            return Promise.resolve([
              'file1.txt',
              'file2.txt'
            ])
          }
        }))

        const fsHelpers = require('./../../../lib/fs')

        mockInquirer.setAnswer({
          confirm: true
        })

        return fsHelpers.warnIfDirectoryIsNotEmpty({
          directory: mockDirectory
        }).then(result => {
          expect(mockInquirer).toHaveBeenCalledTimes(1)
          expect(mockInquirer.mock.calls[0][0][0].type).toBe('confirm')
          expect(mockInquirer.mock.calls[0][0][0].message).toBe(
            `The target directory (${mockDirectory}) is not empty. Would you like to proceed?`
          )
        })
      })

      test('uses message in the `message` parameter if supplied', () => {
        const mockDirectory = '/some/directory'
        const mockMessage = 'Dangerous move! Are you sure?'

        jest.mock('fs-extra', () => ({
          readdir: directoryPath => {
            expect(directoryPath).toBe(mockDirectory)

            return Promise.resolve([
              'file1.txt',
              'file2.txt'
            ])
          }
        }))

        const fsHelpers = require('./../../../lib/fs')

        mockInquirer.setAnswer({
          confirm: true
        })

        return fsHelpers.warnIfDirectoryIsNotEmpty({
          directory: mockDirectory,
          message: mockMessage
        }).then(result => {
          expect(mockInquirer).toHaveBeenCalledTimes(1)
          expect(mockInquirer.mock.calls[0][0][0].type).toBe('confirm')
          expect(mockInquirer.mock.calls[0][0][0].message).toBe(mockMessage)
        })
      })

      test('resolves if the user has confirm they want to proceed', () => {
        const mockDirectory = '/some/directory'

        jest.mock('fs-extra', () => ({
          readdir: directoryPath => {
            expect(directoryPath).toBe(mockDirectory)

            return Promise.resolve([
              'file1.txt',
              'file2.txt'
            ])
          }
        }))

        const fsHelpers = require('./../../../lib/fs')

        mockInquirer.setAnswer({
          confirm: true
        })

        return fsHelpers.warnIfDirectoryIsNotEmpty({
          directory: mockDirectory
        }).then(result => {
          expect(mockInquirer).toHaveBeenCalledTimes(1)
          expect(mockInquirer.mock.calls[0][0][0].type).toBe('confirm')
          expect(mockInquirer.mock.calls[0][0][0].message).toBe(
            `The target directory (${mockDirectory}) is not empty. Would you like to proceed?`
          )
          expect(result).toBe(false)
        })
      })

      test('rejects if the user has indicated they do not want to proceed', () => {
        const mockDirectory = '/some/directory'

        jest.mock('fs-extra', () => ({
          readdir: directoryPath => {
            expect(directoryPath).toBe(mockDirectory)

            return Promise.resolve([
              'file1.txt',
              'file2.txt'
            ])
          }
        }))

        const fsHelpers = require('./../../../lib/fs')

        mockInquirer.setAnswer({
          confirm: false
        })

        return fsHelpers.warnIfDirectoryIsNotEmpty({
          directory: mockDirectory
        }).catch(err => {
          expect(mockInquirer).toHaveBeenCalledTimes(1)
          expect(err.message).toBe('Command aborted')
        })
      })
    })
  })
})