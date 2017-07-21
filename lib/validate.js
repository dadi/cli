'use strict'

const ValidateHelpers = function () {}

ValidateHelpers.prototype.isStringLongerThan = function (string, length) {
  return typeof string === 'string' && string.length > length
}

module.exports = new ValidateHelpers()
