'use strict'

const cliFormat = require('cli-format')
const colors = require('colors')
const constants = require('./constants')

const FormatHelpers = function () {}

FormatHelpers.prototype.buildKeyValueTable = function (rows) {
  const tableConfig = {
    paddingMiddle: '   ',
    width: 60
  }

  let content = ''

  rows.forEach(row => {
    const item = [
      {
        content: row.key,
        width: 20
      },
      row.value
    ]

    content += cliFormat.columns.wrap(item, tableConfig) + '\n'
  })

  return content
}

FormatHelpers.prototype.getBanner = function (text) {
  const settings = {
    filler: ' ',
    width: 50,
    paddingLeft: colors.yellow.bold('* '),
    paddingRight: colors.yellow.bold(' *')
  }

  const banner = '\n' + colors.yellow.bold('* ').repeat(Math.ceil(settings.width / 2)).slice(0, -1) +
    '\n' + cliFormat.wrap(text, settings) +
    '\n' + colors.yellow.bold('* ').repeat(Math.ceil(settings.width / 2)).slice(0, -1)

  return banner
}

FormatHelpers.prototype.getCommandHelp = function (entryPoint, command) {
  const commandObj = entryPoint.commands[command]

  let lines = []
  let parametersCommandStr = ''
  let parametersDescription

  if (commandObj.parameters) {
    if (Array.isArray(commandObj.parameters.inline)) {
      parametersDescription = parametersDescription || []

      commandObj.parameters.inline.forEach(parameter => {
        parametersCommandStr += ` <${parameter.key}>`
        parametersDescription.push({
          key: colors.bold(parameter.key),
          value: parameter.description || ''
        })
      })
    }

    if (Array.isArray(commandObj.parameters.flags)) {
      parametersDescription = parametersDescription || []

      commandObj.parameters.flags.forEach(parameter => {
        parametersCommandStr += ` --${parameter.key}`

        if (parameter.type) {
          parametersCommandStr += `=<${parameter.key}>`
        }

        parametersDescription.push({
          key: colors.bold(parameter.key),
          value: parameter.description || ''
        })
      })
    }
  }

  lines.push('')
  lines.push(`Usage: ${colors.bold(`${constants.rootCommand} ${entryPoint.id} ${command}${parametersCommandStr}`)}`)
  lines.push('')
  lines.push(`${commandObj.description}`)
  lines.push('')

  if (parametersDescription) {
    lines.push(colors.grey(`Available parameters:`))
    lines.push('')
    lines.push(this.buildKeyValueTable(parametersDescription))
  }

  return lines.join('\n')
}

FormatHelpers.prototype.getEntryPointCommands = function (entryPoint, prefix) {
  prefix = prefix || ''

  const rows = Object.keys(entryPoint.commands)
    .map(command => {
      return {
        key: colors.bold(prefix + command),
        value: entryPoint.commands[command].description || ''
      }
    })

  return this.buildKeyValueTable(rows)
}

FormatHelpers.prototype.getEntryPointHelp = function (entryPoint, invalidCommand) {
  let lines = []

  if (invalidCommand) {
    lines.push('')
    lines.push(`'${invalidCommand}' is not a valid command.`)
  }

  lines.push('')
  lines.push(`Usage: ${colors.bold(`${constants.rootCommand} ${entryPoint.id} ${colors.italic('<command>')}`)}`)
  lines.push('')
  lines.push(`where ${colors.italic('<command>')} is one of:`)

  lines.push(this.getEntryPointCommands(entryPoint, '  '))

  lines.push(colors.grey('---'))
  lines.push('')
  lines.push(`Type ${colors.bold(`${constants.rootCommand} help ${entryPoint.id} <command>`)} to learn more about a specific command.`)
  lines.push('')

  return lines.join('\n')
}

FormatHelpers.prototype.getGeneralHelp = function (entryPoints, invalidCommand) {
  let lines = []

  if (invalidCommand) {
    lines.push('')
    lines.push(`'${invalidCommand}' is not a valid command.`)
  }

  lines.push('')
  lines.push(`Usage: ${colors.bold(`${constants.rootCommand} ${colors.italic('<command>')}`)}`)
  lines.push('')
  lines.push(`where ${colors.italic('<command>')} is one of:`)

  Object.keys(entryPoints).forEach(entryPoint => {
    lines.push(
      this.getEntryPointCommands(entryPoints[entryPoint], `  ${entryPoint} `)
    )
  })

  lines.push(colors.grey('---'))
  lines.push('')
  lines.push(`Type ${colors.bold(`${constants.rootCommand} help <command>`)} to learn more about a specific command.`)
  lines.push('')

  return lines.join('\n')
}

FormatHelpers.prototype.getHeader = function () {
  const headerStr = colors.red(`
  ▓▓▓▓▓  ▓▓▓▓▓▓▓
              ▓▓▓▓
     ▓▓▓▓▓▓▓    ▓▓▓▓
              ▓▓▓▓
          ▓▓▓▓▓▓▓
  `)

  return headerStr
}

module.exports = new FormatHelpers()
