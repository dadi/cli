const constants = require('./../../../../shared/constants')
const fs = require('fs-extra')
const mockSpinner = require('./../../helpers/MockSpinner')
const nock = require('nock')
const path = require('path')
const registry = require('./../../../lib/registry')

describe('registry utility', () => {
  describe('boilerplates endpoint', () => {
    test('makes a request to the correct API endpoint', () => {
      const request = nock(constants.apiUrl)
        .get('/v1/boilerplates.json')
        .reply(200, {})

      return registry.getBoilerplateVersions('api').then(versions => {
        expect(request.isDone()).toBe(true)
      })
    })

    test('returns the versions for the given product sorted by semver version/range', () => {
      const request = nock(constants.apiUrl)
        .get('/v1/boilerplates.json')
        .reply(200, {
          api: ['1.1.x', '1.0', '2.x', '3.x', '0.1'],
          cdn: [],
          web: []
        })

      return registry.getBoilerplateVersions('api').then(versions => {
        expect(request.isDone()).toBe(true)
        expect(versions).toEqual(['0.1', '1.0', '1.1.x', '2.x', '3.x'])
      })
    })

    test('returns an empty array when supplied with an invalid product', () => {
      const request = nock(constants.apiUrl)
        .get('/v1/boilerplates.json')
        .reply(200, {
          api: [],
          cdn: [],
          web: []
        })

      return registry.getBoilerplateVersions('foobar').then(versions => {
        expect(request.isDone()).toBe(true)
        expect(versions).toEqual([])
      })
    })

    test('returns a rejected Promise if the request fails', () => {
      const request = nock(constants.apiUrl)
        .get('/v1/boilerplates.json')
        .reply(500)

      return registry.getBoilerplateVersions('api').catch(error => {
        expect(request.isDone()).toBe(true)
        expect(error.statusCode).toEqual(500)
      })
    })
  })

  describe('download methods', () => {
    const mockZipPath = path.resolve(
      __dirname,
      '..',
      '..',
      'helpers',
      'mockZip.zip'
    )
    const mockZipSize = 297
    const scratchPath = path.resolve(__dirname, '..', '..', 'scratch')

    afterEach(() => {
      return fs.emptyDir(scratchPath)
    })

    describe('`downloadFile()` method', () => {
      test('downloads a file to a given location', () => {
        const request = nock(constants.apiUrl)
          .get('/boilerplates/api/2.2.x.zip')
          .replyWithFile(200, mockZipPath, {
            'Content-Type': 'application/zip',
            'content-length': mockZipSize
          })

        return registry.downloadFile({
          file: 'boilerplates/api/2.2.x.zip',
          target: scratchPath,
          unzip: false
        }).then(res => {
          return fs.readdir(scratchPath)
        }).then(files => {
          expect(files).toEqual(['2.2.x.zip'])
        })
      })

      test('downloads a file to a given location and unzips it if `unzip` is truthy, removing the original ZIP', () => {
        const request = nock(constants.apiUrl)
          .get('/boilerplates/api/2.2.x.zip')
          .replyWithFile(200, mockZipPath, {
            'Content-Type': 'application/zip',
            'content-length': mockZipSize
          })

        return registry.downloadFile({
          file: 'boilerplates/api/2.2.x.zip',
          target: scratchPath,
          unzip: true
        }).then(res => {
          return fs.readdir(scratchPath)
        }).then(files => {
          expect(files).toEqual(['mockZip'])

          return fs.readdir(
            path.join(scratchPath, 'mockZip')
          )
        }).then(files => {
          expect(files).toEqual(['file.txt'])
        })
      })

      test('calls `progressCallback` with the completion percentage', () => {
        const request = nock(constants.apiUrl)
          .get('/boilerplates/api/2.2.x.zip')
          .replyWithFile(200, mockZipPath, {
            'Content-Type': 'application/zip',
            'content-length': mockZipSize
          })

        const mockProgressCallback = jest.fn()

        return registry.downloadFile({
          file: 'boilerplates/api/2.2.x.zip',
          target: scratchPath,
          progressCallback: mockProgressCallback,
          unzip: false
        }).then(res => {
          expect(mockProgressCallback).toHaveBeenCalled()
          expect(mockProgressCallback.mock.calls[0][0]).toBe(100)
        })
      })

      test('returns an error if the file does not exist', () => {
        const request = nock(constants.apiUrl)
          .get('/boilerplates/api/fake.version.zip')
          .replyWithError('404')

        return registry.downloadFile({
          file: 'boilerplates/api/fake.version.zip',
          target: scratchPath,
          unzip: true
        }).catch(err => {
          expect(err.name).toBe('FetchError')
        })
      })
    })

    describe('`downloadBoilerplate() method`', () => {
      test('downloads a boilerplate and extracts its contents to the target directory', () => {
        const request = nock(constants.apiUrl)
          .get('/boilerplates/api/mockZip.zip')
          .replyWithFile(200, mockZipPath, {
            'Content-Type': 'application/zip',
            'content-length': mockZipSize
          })

        return registry.downloadBoilerplate({
          product: 'api',
          target: scratchPath,
          version: 'mockZip'
        }).then(res => {
          expect(res).toBe(`cd ${scratchPath} && npm start`)
          return fs.readdir(scratchPath)
        }).then(files => {
          expect(mockSpinner.mock.calls[0][0]).toBe('Downloading boilerplate')
          expect(mockSpinner.mock.calls[0][1]).toBe('start')
          expect(mockSpinner.mock.calls[1][0]).toBe('Downloading boilerplate')
          expect(mockSpinner.mock.calls[1][1]).toBe('succeed')
          expect(files).toEqual(['file.txt'])
        })
      })

      test('returns an error if the boilerplate does not exist', () => {
        const request = nock(constants.apiUrl)
          .get('/boilerplates/api/fake.version.zip')
          .replyWithError('404')

        return registry.downloadBoilerplate({
          product: 'api',
          target: scratchPath,
          version: 'fake.version'
        }).catch(err => {
          expect(mockSpinner).toHaveBeenCalledTimes(2)
          expect(mockSpinner.mock.calls[0][0]).toBe('Downloading boilerplate')
          expect(mockSpinner.mock.calls[0][1]).toBe('start')
          expect(mockSpinner.mock.calls[1][0]).toBe(
            'The connection to the DADI registry has failed. Are you connected to the Internet?'
          )
          expect(mockSpinner.mock.calls[1][1]).toBe('fail')
          expect(err.name).toBe('FetchError')
        })
      })
    })
  })
})