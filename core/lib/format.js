'use strict'

const cliFormat = require('cli-format')
const colors = require('colors/safe')

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
        width: 25
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

  const banner = '\n' + colors.yellow.bold('* ').repeat(Math.ceil(settings.width / 2)) +
    '\n' + cliFormat.wrap(text, settings) +
    '\n' + colors.yellow.bold('* ').repeat(Math.ceil(settings.width / 2))

  return banner
}

FormatHelpers.prototype.getCommandHelp = function (entryPoint, command) {
  const commandObj = entryPoint.commands[command]

  let lines = []

  lines.push(
    this.getHeader(entryPoint)
  )

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
        parametersDescription.push({
          key: colors.bold(parameter.key),
          value: parameter.description || ''
        })
      })
    }
  }

  lines.push('')
  lines.push(`$ ${colors.bold(`dadi ${entryPoint.id} ${command}${parametersCommandStr}`)}`)
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

  lines.push(
    this.getHeader(entryPoint)
  )

  if (invalidCommand) {
    lines.push('')
    lines.push(`'${invalidCommand}' is not a valid command.`)
  }

  lines.push('')
  lines.push(`$ ${colors.bold(`dadi ${entryPoint.id} <command>`)}`)

  lines.push('')
  lines.push('')
  lines.push(colors.grey(`Available commands:`))
  lines.push('')

  lines.push(this.getEntryPointCommands(entryPoint))

  lines.push(colors.grey('---'))
  lines.push('')
  lines.push(`Type ${colors.bold(`dadi help ${entryPoint.id} <command>`)} to learn more about a specific command.`)
  lines.push('')

  return lines.join('\n')
}

FormatHelpers.prototype.getGeneralHelp = function (entryPoints, invalidCommand) {
  let lines = []

  lines.push(
    this.getHeader()
  )

  if (invalidCommand) {
    lines.push('')
    lines.push(`'${invalidCommand}' is not a valid command.`)
  }

  Object.keys(entryPoints).forEach(entryPoint => {
    lines.push('')
    lines.push(colors.grey(`> ${entryPoints[entryPoint].name}`))
    lines.push(
      this.getEntryPointCommands(entryPoints[entryPoint], `dadi ${entryPoint} `)
    )
  })

  lines.push(colors.grey('---'))
  lines.push('')
  lines.push(`Type ${colors.bold('dadi help <command>')} to learn more about a specific command.`)
  lines.push('')

  return lines.join('\n')
}

FormatHelpers.prototype.getHeader = function (entryPoint) {
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
