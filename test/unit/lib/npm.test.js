const nock = require('nock')
const npm = require('./../../../lib/npm')
const registryUrl = require('registry-url')()

describe('npm utility', () => {
  describe('`search()` method', () => {
    test('makes a request to the correct npm registry endpoint and returns the results', () => {
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

    test('filters the results returned with a callback function provided', () => {
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

  test('returns the authors whitelist', () => {
    const authors = npm.getAuthorWhitelist()

    expect(authors).toBeInstanceOf(Array)

    authors.forEach(author => {
      expect(typeof author).toBe('string')
    })
  })
  
  describe('search filters', () => {
    describe('`hasKeyword`', () => {
      test('returns `false` if the package is invalid or does not have keywords', () => {
        const search1 = npm.filters.hasKeyword(null, 'foo')
        const search2 = npm.filters.hasKeyword({
          package: null
        }, 'foo')
        const search3 = npm.filters.hasKeyword({
          package: {
            name: 'some-package'
          }
        }, 'foo')

        expect(search1).toBe(false)
        expect(search2).toBe(false)
        expect(search3).toBe(false)
      })

      test('returns `false` if the package does not include the given keyword', () => {
        const search1 = npm.filters.hasKeyword({
          package: {
            name: 'some-package',
            keywords: []
          }
        }, 'three')
        const search2 = npm.filters.hasKeyword({
          package: {
            name: 'some-package',
            keywords: [
              'one',
              'two'
            ]
          }
        }, 'three')

        expect(search1).toBe(false)
        expect(search2).toBe(false)
      })

      test('returns `true` if the package includes the given keyword', () => {
        const search1 = npm.filters.hasKeyword({
          package: {
            name: 'some-package',
            keywords: [
              'one',
              'two',
              'three'
            ]
          }
        }, 'two')

        expect(search1).toBe(true)
      })
    })

    describe('`isTrusted`', () => {
      test('returns `false` if the package is invalid', () => {
        const search1 = npm.filters.isTrusted(null)
        const search2 = npm.filters.isTrusted({
          package: null
        })
        const search3 = npm.filters.isTrusted({
          package: {
            name: 'some-package'
          }
        })
        const search4 = npm.filters.isTrusted({
          package: {
            name: 'some-package',
            publisher: null
          }
        })
        const search5 = npm.filters.isTrusted({
          package: {
            name: 'some-package',
            publisher: {
              username: null
            }
          }
        })

        expect(search1).toBe(false)
        expect(search2).toBe(false)
        expect(search3).toBe(false)
        expect(search4).toBe(false)
        expect(search5).toBe(false)
      })

      test('returns `false` if the package is not in the @dadi scope and the publisher is not whitelisted', () => {
        const search = npm.filters.isTrusted({
          package: {
            name: 'some-package',
            publisher: {
              username: 'unknowndude'
            }
          }
        })

        expect(search).toBe(false)
      })

      test('returns `true` if the package is not in the @dadi scope and the publisher is whitelisted', () => {
        const authors = npm.getAuthorWhitelist()

        authors.forEach(author => {
          const search = npm.filters.isTrusted({
            package: {
              name: 'some-package',
              publisher: {
                username: author
              }
            }
          })

          expect(search).toBe(true)  
        })
      })

      test('returns `true` if the package is in the @dadi scope, regardless of whether the publisher is whitelisted', () => {
        const authors = npm.getAuthorWhitelist()
        const search1 = npm.filters.isTrusted({
          package: {
            scope: 'dadi',
            name: 'some-package',
            publisher: {
              username: 'unknowndude'
            }
          }
        })
        const search2 = npm.filters.isTrusted({
          package: {
            scope: 'dadi',
            name: 'some-package',
            publisher: {
              username: authors[0]
            }
          }
        })

        expect(search1).toBe(true)
        expect(search2).toBe(true)
      })
    })
  })
})