'use strict'

const registryUrl = require('registry-url')()
const request = require('request-promise-native')

const NpmHelpers = function () {}

/**
  * Searches the NPM registry
  *
  * @param {args.text} The text to be searched
  * @param {args.filter} A function to filter results with
  *
  * @return {Promise} A Promise resolving with an array of results
  */
NpmHelpers.prototype.search = function ({filter, text}) ={
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
