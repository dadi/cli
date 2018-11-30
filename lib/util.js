const anyid = require('anyid').anyid

const UtilHelpers = function () {}

UtilHelpers.prototype.generatePassword = function () {
  return anyid()
    .encode('0a-io')
    .section(
      anyid()
        .length(3)
        .random()
    )
    .section(
      anyid()
        .encode('0a')
        .length(4)
        .random()
    )
    .section(
      anyid()
        .length(3)
        .random()
    )
    .id()
}

module.exports = new UtilHelpers()
