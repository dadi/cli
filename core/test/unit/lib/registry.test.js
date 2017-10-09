const nock = require('nock')
const registry = require('./../../../lib/registry')

describe('registry utility', () => {
  test('makes a request to the correct API endpoint', () => {
    const request = nock(registry.apiUrl)
      .get('/versions.json')
      .reply(200, {})

    return registry.getBoilerplateVersions('api').then(versions => {
      expect(request.isDone()).toBe(true)
    })
  })

  test('returns the versions for the given product sorted by semver version/range', () => {
    const request = nock(registry.apiUrl)
      .get('/versions.json')
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
    const request = nock(registry.apiUrl)
      .get('/versions.json')
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
    const request = nock(registry.apiUrl)
      .get('/versions.json')
      .reply(500)

    return registry.getBoilerplateVersions('api').catch(error => {
      expect(request.isDone()).toBe(true)
      expect(error.statusCode).toEqual(500)
    })
  })
})