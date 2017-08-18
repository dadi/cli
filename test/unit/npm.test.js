const nock = require('nock')
const npm = require('./../../lib/npm')
const registryUrl = require('registry-url')()

describe('npm utility', () => {
  test('Makes a request to the correct npm registry endpoint and returns the results', () => {
    const text = 'Some text'
    const resultObjects = [
      {
        id: 'foobar1'
      },
      {
        id: 'foobar2'
      }
    ]
    const request = nock(registryUrl)
      .get('/-/v1/search')
      .query({
        text
      })
      .reply(200, {objects: resultObjects})

    return npm.search({text}).then(results => {
      expect(request.isDone()).toBe(true)
      expect(results).toEqual(resultObjects)
    })
  })

  test('Filters the results returned with a callback function provided', () => {
    const text = 'Some text'
    const resultObjects = [
      {
        id: 'foobar1',
        someFlag: false
      },
      {
        id: 'foobar2',
        someFlag: true
      },
      {
        id: 'foobar3',
        someFlag: false
      }
    ]
    const request = nock(registryUrl)
      .get('/-/v1/search')
      .query({
        text
      })
      .reply(200, {objects: resultObjects})

    return npm.search({
      text,
      filter: obj => obj.someFlag
    }).then(results => {
      expect(request.isDone()).toBe(true)
      expect(results.length).toBe(1)
      expect(results[0].id).toBe('foobar2')
    })
  })
})