const mockInquirer = require('./../../helpers/mockInquirer')
const MockSpinner = require('./../../helpers/MockSpinner')
const format = require('./../../../lib/format')
const Setup = require('./../../../lib/setup')

// (!) We're mocking `console.log()` in this test, so if you need
// to debug something within the test itself, you must use `debug()`
const debug = console.log
console.log = jest.fn()

afterEach(() => {
  console.log.mockClear()
})

const mockSchema1 = {
  host: {
    doc: 'The IP address the application will run on',
    format: 'ipaddress',
    default: '0.0.0.0'
  },
  port: {
    doc: 'The port number the application will bind to',
    format: 'port',
    default: 8080,
    env: 'PORT'
  }
}

describe('Setup helper', () => {
  test('displays the DADI logo and any title set via `setTitle()`', () => {
    const setup = new Setup([], mockSchema1)

    setup.setTitle('Testing title')

    return setup.start().then(out => {
      expect(console.log.mock.calls[0][0]).toBe(format.getHeader())
      expect(console.log.mock.calls[2][0]).toContain('Testing title')
    })
  })

  test('displays sections with instructional text and percentage of completion', () => {
    const steps = [
      {
        text: 'Let\'s configure the server host',
        questions: [
          {
            name: 'host',
            message: 'What is the server host?'
          }
        ]
      },
      {
        text: 'Time to configure the server port',
        questions: [
          {
            name: 'port',
            message: 'What is the server port?'
          }
        ]
      }
    ]

    mockInquirer.setAnswer({
      host: '127.0.0.1',
      port: 8081
    })

    const setup = new Setup(steps, mockSchema1)

    return setup.start().then(out => {
      expect(console.log.mock.calls[0][0]).toContain(
        `${steps[0].text} (0% complete)`
      )
      expect(console.log.mock.calls[1][0]).toContain(
        `${steps[1].text} (50% complete)`
      )
    })
  })

  test('displays the questions for each step', () => {
    const steps = [
      {
        text: 'Let\'s configure the server host',
        questions: [
          {
            name: 'host',
            message: 'What is the server host?'
          }
        ]
      },
      {
        text: 'Time to configure the server port',
        questions: [
          {
            name: 'port',
            message: 'What is the server port?'
          }
        ]
      }
    ]

    mockInquirer.setAnswer({
      host: '127.0.0.1',
      port: 8081
    })

    const setup = new Setup(steps, mockSchema1)

    return setup.start().then(out => {
      expect(mockInquirer.mock.calls[0][0][0].name).toBe(steps[0].questions[0].name)
      expect(mockInquirer.mock.calls[0][0][0].message).toBe(steps[0].questions[0].message)
      expect(mockInquirer.mock.calls[0][0][0].default).toBe(mockSchema1.host.default)

      expect(mockInquirer.mock.calls[1][0][0].name).toBe(steps[1].questions[0].name)
      expect(mockInquirer.mock.calls[1][0][0].message).toBe(steps[1].questions[0].message)
      expect(mockInquirer.mock.calls[1][0][0].default).toBe(mockSchema1.port.default)
    })
  })

  test('does not display questions that are defined in the initial state', () => {
    const steps = [
      {
        text: 'Let\'s configure the server host',
        questions: [
          {
            name: 'host',
            message: 'What is the server host?'
          }
        ]
      },
      {
        text: 'Time to configure the server port',
        questions: [
          {
            name: 'port',
            message: 'What is the server port?'
          }
        ]
      }
    ]

    mockInquirer.setAnswer({
      host: '127.0.0.1',
      port: 8081
    })

    const setup = new Setup(steps, mockSchema1)

    return setup.start({
      host: 'my-host.com'
    }).then(out => {
      expect(mockInquirer).toHaveBeenCalledTimes(1)
      expect(mockInquirer.mock.calls[0][0][0].name).toBe(steps[1].questions[0].name)
      expect(mockInquirer.mock.calls[0][0][0].message).toBe(steps[1].questions[0].message)
      expect(mockInquirer.mock.calls[0][0][0].default).toBe(mockSchema1.port.default)
    })
  })

  describe('creates question objects', () => {
    test('with `type: list` if the question contains a `choices` array', () => {
      const steps = [
        {
          questions: [
            {
              name: 'favouriteService',
              message: 'What is your favourite DADI microservice?',
              choices: [
                'API',
                'Web',
                'CDN',
                'Other'
              ]
            }
          ]
        }
      ]

      mockInquirer.setAnswer({
        favouriteService: 'API'
      })

      const setup = new Setup(steps, mockSchema1)

      return setup.start().then(out => {
        expect(mockInquirer.mock.calls[0][0][0].name).toBe(steps[0].questions[0].name)
        expect(mockInquirer.mock.calls[0][0][0].message).toBe(steps[0].questions[0].message)
        expect(mockInquirer.mock.calls[0][0][0].choices).toEqual(steps[0].questions[0].choices)
        expect(mockInquirer.mock.calls[0][0][0].type).toBe('list')
      })
    })

    test('with `type: list` if the question contains a `choices` function', () => {
      const mockChoices = [
        'API',
        'Web',
        'CDN',
        'Other'
      ]
      const steps = [
        {
          questions: [
            {
              name: 'favouriteService',
              message: 'What is your favourite DADI microservice?',
              choices: () => {
                return new Promise((resolve, reject) => {
                  setTimeout(() => {
                    resolve(mockChoices)
                  }, 100)
                })
              }
            }
          ]
        }
      ]

      mockInquirer.setAnswer({
        favouriteService: 'API'
      })

      const setup = new Setup(steps, mockSchema1)

      return setup.start().then(out => {
        expect(mockInquirer.mock.calls[0][0][0].name).toBe(steps[0].questions[0].name)
        expect(mockInquirer.mock.calls[0][0][0].message).toBe(steps[0].questions[0].message)
        expect(mockInquirer.mock.calls[0][0][0].choices).toEqual(mockChoices)
        expect(mockInquirer.mock.calls[0][0][0].type).toBe('list')

        expect(MockSpinner.mock.calls[0][0]).toBe('Crunching some numbers')
        expect(MockSpinner.mock.calls[0][1]).toBe('start')
        expect(MockSpinner.mock.calls[1][0]).toBe('Crunching some numbers')
        expect(MockSpinner.mock.calls[1][1]).toBe('stop')
      })
    })

    test('with `type: list` if the field schema\'s `format` property is an Array', () => {
      const schema = {
        favouriteService: {
          doc: 'Favourite DADI microservice',
          format: [
            'API',
            'Web',
            'CDN',
            'Other'
          ]
        }
      }
      const steps = [
        {
          questions: [
            {
              name: 'favouriteService',
              message: 'What is your favourite DADI microservice?'
            }
          ]
        }
      ]

      mockInquirer.setAnswer({
        favouriteService: 'API'
      })

      const setup = new Setup(steps, schema)

      return setup.start().then(out => {
        expect(mockInquirer.mock.calls[0][0][0].name).toBe(steps[0].questions[0].name)
        expect(mockInquirer.mock.calls[0][0][0].message).toBe(steps[0].questions[0].message)
        expect(mockInquirer.mock.calls[0][0][0].choices).toEqual(schema.favouriteService.format)
        expect(mockInquirer.mock.calls[0][0][0].type).toBe('list')
      })
    })

    test('with `type: confirm` if the field schema\'s `format` property is set to Boolean', () => {
      const schema = {
        usingDadi: {
          doc: 'Is using DADI',
          format: Boolean
        }
      }
      const steps = [
        {
          questions: [
            {
              name: 'usingDadi',
              message: 'Are you using DADI yet?'
            }
          ]
        }
      ]

      mockInquirer.setAnswer({
        usingDadi: true
      })

      const setup = new Setup(steps, schema)

      return setup.start().then(out => {
        expect(mockInquirer.mock.calls[0][0][0].name).toBe(steps[0].questions[0].name)
        expect(mockInquirer.mock.calls[0][0][0].message).toBe(steps[0].questions[0].message)
        expect(mockInquirer.mock.calls[0][0][0].type).toBe('confirm')
      })
    })

    test('with a validation function if the field schema\'s `format` property is set to Number', () => {
      const schema = {
        microservicesCount: {
          doc: 'Number of DADI microservices in use',
          format: Number
        }
      }
      const steps = [
        {
          questions: [
            {
              name: 'microservicesCount',
              message: 'How many DADI microservices are you using?'
            }
          ]
        }
      ]

      mockInquirer.setAnswer({
        microservicesCount: 6
      })

      const setup = new Setup(steps, schema)

      return setup.start().then(out => {
        expect(mockInquirer.mock.calls[0][0][0].name).toBe(steps[0].questions[0].name)
        expect(mockInquirer.mock.calls[0][0][0].message).toBe(steps[0].questions[0].message)
        
        const validateFn = mockInquirer.mock.calls[0][0][0].validate

        expect(validateFn).toBeInstanceOf(Function)
        expect(validateFn(123)).toBe(true)
        expect(validateFn(123.45)).toBe(true)
        expect(validateFn('asd123')).toBe(false)
        expect(validateFn('123asd')).toBe(false)
      })
    })

    describe('with a `default` property', () => {
      test('if the question contains one, defined as a static value', () => {
        const schema = {
          microservicesCount: {
            doc: 'Number of DADI microservices in use',
            format: Number
          }
        }
        const steps = [
          {
            questions: [
              {
                name: 'microservicesCount',
                message: 'How many DADI microservices are you using?',
                default: 5
              }
            ]
          }
        ]

        mockInquirer.setAnswer({
          microservicesCount: 6
        })

        const setup = new Setup(steps, schema)

        return setup.start().then(out => {
          expect(mockInquirer.mock.calls[0][0][0].default).toBe(steps[0].questions[0].default)
        })
      })

      test('if the question contains one, defined as a function', () => {
        const schema = {
          microservicesCount: {
            doc: 'Number of DADI microservices in use',
            format: Number
          }
        }
        const steps = [
          {
            questions: [
              {
                name: 'howManyCount',
                message: 'How many DADI microservices are there?'
              },
              {
                name: 'microservicesCount',
                message: 'How many DADI microservices are you using?',
                default: answers => {
                  return answers.howManyCount
                }
              }
            ]
          }
        ]

        mockInquirer.setAnswer({
          howManyCount: 100,
          microservicesCount: 6
        })

        const setup = new Setup(steps, schema)

        return setup.start().then(out => {
          expect(mockInquirer.mock.calls[1][0][0].default).toBe(100)
        })
      })

      test('if the field schema\'s `default` property is set', () => {
        const schema = {
          microservicesCount: {
            doc: 'Number of DADI microservices in use',
            default: 5,
            format: Number
          }
        }
        const steps = [
          {
            questions: [
              {
                name: 'microservicesCount',
                message: 'How many DADI microservices are you using?'
              }
            ]
          }
        ]

        mockInquirer.setAnswer({
          microservicesCount: 6
        })

        const setup = new Setup(steps, schema)

        return setup.start().then(out => {
          expect(mockInquirer.mock.calls[0][0][0].default).toBe(schema.microservicesCount.default)
        })
      })
    })

    test('with a `message` from the field schema if the question does not contain one', () => {
      const schema = {
        microservicesCount: {
          doc: 'Number of DADI microservices in use',
          default: 5,
          format: Number
        }
      }
      const steps = [
        {
          questions: [
            {
              name: 'microservicesCount'
            }
          ]
        }
      ]

      mockInquirer.setAnswer({
        microservicesCount: 6
      })

      const setup = new Setup(steps, schema)

      return setup.start().then(out => {
        expect(mockInquirer.mock.calls[0][0][0].message).toBe(schema.microservicesCount.doc)
      })
    })
  })

  describe('conditionally renders questions based on the `condition` property', () => {
    test('renders questions if the result of the condition is true', () => {
      const steps = [
        {
          questions: [
            {
              name: 'favouriteMicroservice',
              message: 'What is your favourite DADI microservice?',
              choices: [
                'API',
                'Web',
                'CDN',
                'Other'
              ]
            },
            {
              name: 'favouriteMicroserviceOther',
              message: 'Please specify',
              condition: answers => answers.favouriteMicroservice === 'Other'
            },
            {
              name: 'name',
              message: 'What is your name?'
            }
          ]
        }
      ]

      mockInquirer.setAnswer({
        favouriteMicroservice: 'Other',
        name: 'John Doe'
      })

      const setup = new Setup(steps, {})

      return setup.start().then(out => {
        expect(mockInquirer).toHaveBeenCalledTimes(3)

        expect(mockInquirer.mock.calls[0][0][0].name).toBe(steps[0].questions[0].name)
        expect(mockInquirer.mock.calls[0][0][0].message).toBe(steps[0].questions[0].message)

        expect(mockInquirer.mock.calls[1][0][0].name).toBe(steps[0].questions[1].name)
        expect(mockInquirer.mock.calls[1][0][0].message).toBe(steps[0].questions[1].message)

        expect(mockInquirer.mock.calls[2][0][0].name).toBe(steps[0].questions[2].name)
        expect(mockInquirer.mock.calls[2][0][0].message).toBe(steps[0].questions[2].message)
      })
    })

    test('skips conditions if the result of the condition is false', () => {
      const steps = [
        {
          questions: [
            {
              name: 'favouriteMicroservice',
              message: 'What is your favourite DADI microservice?',
              choices: [
                'API',
                'Web',
                'CDN',
                'Other'
              ]
            },
            {
              name: 'favouriteMicroserviceOther',
              message: 'Please specify',
              condition: answers => answers.favouriteMicroservice === 'Other'
            },
            {
              name: 'name',
              message: 'What is your name?'
            }
          ]
        }
      ]

      mockInquirer.setAnswer({
        favouriteMicroservice: 'API',
        name: 'John Doe'
      })

      const setup = new Setup(steps, {})

      return setup.start().then(out => {
        expect(mockInquirer).toHaveBeenCalledTimes(2)

        expect(mockInquirer.mock.calls[0][0][0].name).toBe(steps[0].questions[0].name)
        expect(mockInquirer.mock.calls[0][0][0].message).toBe(steps[0].questions[0].message)

        expect(mockInquirer.mock.calls[1][0][0].name).toBe(steps[0].questions[2].name)
        expect(mockInquirer.mock.calls[1][0][0].message).toBe(steps[0].questions[2].message)
      })
    })
  })

  describe('when `type` is `info`', () => {
    test('displays informative text if `condition` is not defined', () => {
      const steps = [
        {
          questions: [
            {
              name: 'name',
              message: 'What is your name?'
            },
            {
              type: 'info',
              message: 'This is an informative text'
            },
            {
              name: 'age',
              message: 'What is your age?'
            }
          ]
        }
      ]

      mockInquirer.setAnswer({
        name: 'John Doe',
        age: 75
      })

      const setup = new Setup(steps, {})

      return setup.start().then(out => {
        expect(mockInquirer.mock.calls[0][0][0]).toEqual(steps[0].questions[0])
        expect(mockInquirer.mock.calls[1][0][0]).toEqual(steps[0].questions[2])

        expect(MockSpinner).toHaveBeenCalledTimes(1)
        expect(MockSpinner.mock.calls[0][0]).toBe(steps[0].questions[1].message)
        expect(MockSpinner.mock.calls[0][1]).toBe(steps[0].questions[1].type)
      })
    })

    test('displays informative text if `condition` is set and evaluates to `true`', () => {
      const steps = [
        {
          questions: [
            {
              name: 'name',
              message: 'What is your name?'
            },
            {
              type: 'info',
              message: 'This is an informative text',
              condition: answers => {
                expect(answers.name).toBe('John Doe')

                return true
              }
            },
            {
              name: 'age',
              message: 'What is your age?'
            }
          ]
        }
      ]

      mockInquirer.setAnswer({
        name: 'John Doe',
        age: 75
      })

      const setup = new Setup(steps, {})

      return setup.start().then(out => {
        expect(mockInquirer.mock.calls[0][0][0]).toEqual(steps[0].questions[0])
        expect(mockInquirer.mock.calls[1][0][0]).toEqual(steps[0].questions[2])

        expect(MockSpinner).toHaveBeenCalledTimes(1)
        expect(MockSpinner.mock.calls[0][0]).toBe(steps[0].questions[1].message)
        expect(MockSpinner.mock.calls[0][1]).toBe(steps[0].questions[1].type)
      })
    })

    test('does not display informative text if `condition` is set and evaluates to `false`', () => {
      const steps = [
        {
          questions: [
            {
              name: 'name',
              message: 'What is your name?'
            },
            {
              type: 'info',
              message: 'This is an informative text',
              condition: answers => {
                expect(answers.name).toBe('John Doe')

                return false
              }
            },
            {
              name: 'age',
              message: 'What is your age?'
            }
          ]
        }
      ]

      mockInquirer.setAnswer({
        name: 'John Doe',
        age: 75
      })

      const setup = new Setup(steps, {})

      return setup.start().then(out => {
        expect(mockInquirer.mock.calls[0][0][0]).toEqual(steps[0].questions[0])
        expect(mockInquirer.mock.calls[1][0][0]).toEqual(steps[0].questions[2])

        expect(MockSpinner).not.toHaveBeenCalled()
      })
    })
  })

  describe('returns an object with the answers', () => {
    const steps = [
      {
        questions: [
          {
            name: 'bio.name',
            message: 'What is your name?'
          },
          {
            name: 'bio.age',
            message: 'What is your age?'
          },
          {
            name: 'job',
            message: 'What is your job title?'
          }
        ]
      }
    ]

    test('handles nested properties', () => {
      const mockAnswers = {
        bio: {
          name: 'John Doe',
          age: 75
        },
        job: 'Software Engineer'
      }

      mockInquirer.setAnswer(mockAnswers)

      const setup = new Setup(steps, {})

      return setup.start().then(out => {
        expect(out).toEqual(mockAnswers)
      })
    })
  })
})
