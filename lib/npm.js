'use strict'

const registryUrl = require('registry-url')()
const request = require('request-promise-native')

/**
  * Searches the NPM registry
  *
  * @param {args.text} The text to be searched
  * @param {args.filter} A function to filter results with
  *
  * @return {Promise} A Promise resolving with an array of results
  */
module.exports.search = ({filter, text}) => {
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
