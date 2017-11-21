'use strict'

const registryUrl = require('registry-url')()
const request = require('request-promise-native')

const AUTHOR_WHITELIST = [
  'adamkdean',
  'abovedave',
  'arthurmingard',
  'eduardoboucas',
  'jimlambie',
  'josephdenne'
]

const NpmHelpers = function () {}

NpmHelpers.prototype.filters = {
  hasKeyword: function (result, keyword) {
    const pkg = result && result.package

    if (!pkg || !pkg.keywords) return false

    return pkg.keywords.includes(keyword)
  },

  isTrusted: function (result) {
    const pkg = result && result.package

    if (!pkg) return false

    return pkg.scope === 'dadi' ||
      Boolean(
        pkg.publisher &&
        pkg.publisher.username &&
        AUTHOR_WHITELIST.includes(pkg.publisher.username)
      )
  }
}

NpmHelpers.prototype.getAuthorWhitelist = function () {
  return AUTHOR_WHITELIST
}

/**
  * Searches the NPM registry
  *
  * @param {args.text} The text to be searched
  * @param {args.filter} A function to filter results with
  *
  * @return {Promise} A Promise resolving with an array of results
  */
NpmHelpers.prototype.search = function ({filter, text}) {
  return request({
    json: true,
    uri: `${registryUrl}-/v1/search?text=${encodeURIComponent(text)}`
  }).then(response => {
    if (typeof filter === 'function') {
      return response.objects.filter(filter)
    }

    return response.objects
  })
}

module.exports = new NpmHelpers()
