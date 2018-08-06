const cliFormat = require('cli-format')
const constants = require('./../../../lib/constants')
const format = require('./../../../lib/format')

const buildKeyValueTable = format.buildKeyValueTable

format.buildKeyValueTable = rows => {
  return buildKeyValueTable(rows).replace(/\u001b\[0m/g, '')
}

describe('Format helper', () => {
  describe('`buildKeyValueTable` method', () => {
    test('for each row in the given array, displays a column for a `key` and another one for a `value` properties', () => {
      const rows = [
        {key: 'foo', value: 'Some value for foo'},
        {key: 'foobar', value: 'Some value for foobar'},
        {key: 'foobarbaz', value: 'Some value for foobarbaz'}
      ]

      const keyValueTable = format.buildKeyValueTable(rows)

      rows.forEach(row => {
        expect(keyValueTable).toContain(row.key)
        expect(keyValueTable).toContain(row.value)
      })
    })
  })

  describe('`getBanner` method', () => {
    test('renders a banner with a single line of text', () => {
      const banner = format.getBanner('Small string')
        .replace(/\u001b\[0m/g, '')

      expect(banner).toBe(`
* * * * * * * * * * * * * * * * * * * * * * * * *
* Small string                                  *
* * * * * * * * * * * * * * * * * * * * * * * * *`)
    })

    test('renders a banner with multiple lines of text', () => {
      const banner = format.getBanner(
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua'
      ).replace(/\u001b\[0m/g, '')

      expect(banner).toBe(`
* * * * * * * * * * * * * * * * * * * * * * * * *
* Lorem ipsum dolor sit amet, consectetur       *
* adipiscing elit, sed do eiusmod tempor        *
* incididunt ut labore et dolore magna aliqua   *
* * * * * * * * * * * * * * * * * * * * * * * * *`)
    })
  })

  describe('`getCommandHelp` method', () => {
    const mockEntryPoint = {
      id: 'foo',
      name: 'Foo',
      commands: {
        new: {
          description: 'Creates a new installation of DADI Foo',
          parameters: {
            inline: [
              {
                key: 'name',
                description: 'the name of the DADI Foo instance'
              }
            ],
            flags: [
              {
                key: 'useBar',
                description: 'enable "bar" mode'
              },
              {
                key: 'useBaz',
                description: 'enable "baz" mode'
              },
              {
                key: 'version',
                description: 'the version of Foo to install (defaults to latest)'
              }
            ]
          }
        }
      }
    }

    test('contains the DADI header', () => {
      const help = format.getCommandHelp(mockEntryPoint, 'new')

      expect(help).toContain(format.getHeader())
    })

    test('contains the command description', () => {
      const help = format.getCommandHelp(mockEntryPoint, 'new')

      expect(help).toContain(mockEntryPoint.commands.new.description)
    })

    describe('if the command has parameters', () => {
      test('contains the "Available parameters:" string', () => {
        const help = format.getCommandHelp(mockEntryPoint, 'new')

        expect(help).toContain('Available parameters:\n')
      })

      test('contains the full command skeleton with all the available inline flag parameters', () => {
        const mockEntryPointNoInlineParameters = Object.assign({}, mockEntryPoint, {
          commands: {
            new: Object.assign({}, mockEntryPoint.commands.new, {
              parameters: {
                flags: mockEntryPoint.commands.new.parameters.flags
              }
            })
          }
        })

        const help = format.getCommandHelp(mockEntryPointNoInlineParameters, 'new')

        expect(help).toContain(`$ ${constants.rootCommand} foo new --useBar --useBaz --version\n`)
      })

      test('contains the full command skeleton with all the available inline parameters', () => {
        const mockEntryPointNoFlagParameters = Object.assign({}, mockEntryPoint, {
          commands: {
            new: Object.assign({}, mockEntryPoint.commands.new, {
              parameters: {
                inline: mockEntryPoint.commands.new.parameters.inline
              }
            })
          }
        })

        const help = format.getCommandHelp(mockEntryPointNoFlagParameters, 'new')

        expect(help).toContain(`$ ${constants.rootCommand} foo new <name>\n`)
      })

      test('contains the full command skeleton with all the available inline and flag parameters', () => {
        const help = format.getCommandHelp(mockEntryPoint, 'new')

        expect(help).toContain(`$ ${constants.rootCommand} foo new <name> --useBar --useBaz --version\n`)
      })

      test('contains the list of available commands and their description', () => {
        const help = format.getCommandHelp(mockEntryPoint, 'new')
        const parametersTable = format.buildKeyValueTable(
          mockEntryPoint.commands.new.parameters.inline.map(parameter => {
            return {
              key: parameter.key,
              value: parameter.description
            }
          }).concat(
            mockEntryPoint.commands.new.parameters.flags.map(parameter => {
              return {
                key: parameter.key,
                value: parameter.description
              }
            })
          )
        )

        expect(help).toContain(parametersTable)
      })
    })

    describe('if the command does not have parameters', () => {
      const mockEntryPointNoParameters = {
        id: 'foo',
        name: 'Foo',
        commands: {
          new: {
            description: 'Creates a new installation of DADI Foo'
          }
        }
      }

      test('contains the full command skeleton without any parameters', () => {
        const help = format.getCommandHelp(mockEntryPointNoParameters, 'new')

        expect(help).toContain(`$ ${constants.rootCommand} foo new\n`)
      })

      test('does not contain the "Available parameters:" string', () => {
        const help = format.getCommandHelp(mockEntryPointNoParameters, 'new')

        expect(help).not.toContain('Available parameters:\n')
      })
    })
  })

  describe('`getEntryPointCommands` method', () => {
    const mockEntryPoint = {
      id: 'foo',
      name: 'Foo',
      commands: {
        new: {
          description: 'Creates a new installation of DADI Foo'
        },
        setup: {
          description: 'Configures an installation of DADI Foo'
        },
        'clients:add': {
          description: 'Creates a new client on DADI Foo'
        }
      }
    }

    test('contains a list of available commands along with their description', () => {
      const help = format.getEntryPointCommands(mockEntryPoint)
      const commandsTable = format.buildKeyValueTable(
        Object.keys(mockEntryPoint.commands).map(command => {
          return {
            key: command,
            value: mockEntryPoint.commands[command].description
          }
        })
      )

      expect(help).toContain(commandsTable)
    })

    test('contains a list of available commands, prefixed with the `prefix` argument, along with their description', () => {
      const help = format.getEntryPointCommands(mockEntryPoint, 'ftw ')
      const commandsTable = format.buildKeyValueTable(
        Object.keys(mockEntryPoint.commands).map(command => {
          return {
            key: 'ftw ' + command,
            value: mockEntryPoint.commands[command].description
          }
        })
      )

      expect(help).toContain(commandsTable)
    })
  })

  describe('`getEntryPointHelp` method', () => {
    const mockEntryPoint = {
      id: 'foo',
      name: 'Foo',
      commands: {
        new: {
          description: 'Creates a new installation of DADI Foo'
        },
        setup: {
          description: 'Configures an installation of DADI Foo'
        },
        'clients:add': {
          description: 'Creates a new client on DADI Foo'
        }
      }
    }

    test('contains the DADI header', () => {
      const help = format.getEntryPointHelp(mockEntryPoint)

      expect(help).toContain(format.getHeader())
    })

    test('contains the skeleton command', () => {
      const help = format.getEntryPointHelp(mockEntryPoint)

      expect(help).toContain(`$ ${constants.rootCommand} foo <command>\n`)
    })

    test('contains the list of available commands', () => {
      const help = format.getEntryPointHelp(mockEntryPoint)
      const commandsTable = format.getEntryPointCommands(mockEntryPoint)

      expect(help).toContain('Available commands:\n')
      expect(help).toContain(commandsTable)
    })

    test('contains the help text', () => {
      const help = format.getEntryPointHelp(mockEntryPoint)

      expect(help).toContain(`Type ${constants.rootCommand} help foo <command> to learn more about a specific command.`)
    })

    test('flags a given command as invalid if the `invalidCommand` argument is present', () => {
      const help = format.getEntryPointHelp(mockEntryPoint, 'no-such-command')

      expect(help).toContain('\'no-such-command\' is not a valid command.\n')
    })
  })

  describe('`getGeneralHelp` method', () => {
    const mockEntryPoints = {
      foo: {
        id: 'foo',
        name: 'Foo',
        commands: {
          new: {
            description: 'Creates a new installation of DADI Foo'
          },
          setup: {
            description: 'Configures an installation of DADI Foo'
          },
          'clients:add': {
            description: 'Creates a new client on DADI Foo'
          }
        }
      },
      bar: {
        id: 'bar',
        name: 'Bar',
        commands: {
          new: {
            description: 'Creates a new installation of DADI Bar'
          },
          setup: {
            description: 'Configures an installation of DADI Bar'
          },
          'clients:add': {
            description: 'Creates a new client on DADI Bar'
          }
        }
      }
    }

    test('contains the DADI header', () => {
      const help = format.getGeneralHelp(mockEntryPoints)

      expect(help).toContain(format.getHeader())
    })

    test('flags a given command as invalid if the `invalidCommand` argument is present', () => {
      const help = format.getGeneralHelp(mockEntryPoints, 'no-such-command')

      expect(help).toContain('\'no-such-command\' is not a valid command.\n')
    })

    test('contains the list of commands for each entry point', () => {
      const help = format.getGeneralHelp(mockEntryPoints)

      expect(help).toContain(format.getEntryPointCommands(mockEntryPoints.foo, `${constants.rootCommand} foo `))
      expect(help).toContain(format.getEntryPointCommands(mockEntryPoints.bar, `${constants.rootCommand} bar `))
    })

    test('contains the help text', () => {
      const help = format.getGeneralHelp(mockEntryPoints)

      expect(help).toContain(`Type ${constants.rootCommand} help <command> to learn more about a specific command.`)
    })
  })
})