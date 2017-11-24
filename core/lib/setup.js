'use strict'

const colors = require('colors/safe')
const deepMerge = require('deepmerge')
const formatHelpers = require('./format')
const inquirer = require('inquirer')
const objectPath = require('object-path')
const shellHelpers = require('./shell')

const Setup = function (steps, schema) {
  this.steps = steps
  this.schema = schema
}

Setup.prototype.setTitle = function (title) {
  this.title = title
}

Setup.prototype.start = function (initialState = {}) {
  const numberOfQuestions = this.steps.reduce((items, step) => {
    return items + step.questions.length
  }, 0)

  let answers = initialState
  let queue = Promise.resolve()
  let questionsAnswered = 0

  if (this.title) {
    shellHelpers.showText(formatHelpers.getHeader())
    shellHelpers.showText('')
    shellHelpers.showText(colors.bold(`    ${this.title}`))
  }

  this.steps.forEach(step => {
    if (step.text) {
      const percentage = Math.round(questionsAnswered / numberOfQuestions * 100)
      const percentageStr = ` (${percentage}% complete)`

      queue = queue.then(() => shellHelpers.showText(`\n${step.text}${colors.grey(percentageStr)}\n`))
    }

    step.questions.forEach(question => {
      if (question.type === 'info') {
        queue = queue.then(() => {
          if (
            typeof question.condition !== 'function' ||
            question.condition(answers)
          ) {
            shellHelpers.showSpinner(question.message, 'info')
          }
        })

        return
      }

      // If we already an answer for this question (i.e. it was supplied as part
      // of the initial state), we skip it.
      if (objectPath.get(answers, question.name) !== undefined) {
        return
      }

      const fieldSchema = objectPath.get(this.schema, question.name) || {}

      // Choices and list format
      if (!question.choices && Array.isArray(fieldSchema.format)) {
        question.choices = fieldSchema.format
      }

      if (question.choices) {
        question.type = 'list'

        if (typeof question.choices === 'function') {
          const preFn = question.choices

          queue = queue.then(() => {
            const preFnSpinner = shellHelpers.showSpinner('Crunching some numbers')

            return preFn().then(result => {
              preFnSpinner.stop()

              question.choices = result
            })
          })
        }
      }

      if (typeof fieldSchema.format === 'function') {
        switch (fieldSchema.format.name) {
          case 'Boolean':
            question.type = 'confirm'
            question.default = fieldSchema.default === true

            break

          case 'Number':
            question.validate = input => {
              return !isNaN(Number(input))
            }

            break
        }
      }

      // Default value
      if (question.default === undefined) {
        if (fieldSchema.default) {
          question.default = fieldSchema.default
        }
      } else if (typeof question.default === 'function') {
        queue = queue.then(() => {
          question.default = question.default(answers)
        })
      }

      // Message
      if (!question.message) {
        question.message = fieldSchema.doc
      }

      queue = queue.then(() => {
        if (
          typeof question.condition === 'function' &&
          !question.condition(answers)
        ) {
          return
        }

        return inquirer.prompt([question]).then(newAnswer => {
          answers = answers
            ? deepMerge(answers, newAnswer)
            : newAnswer
        })
      })
    })

    questionsAnswered += step.questions.length
  })

  return queue.then(() => {
    shellHelpers.showText('')

    return answers
  })
}

module.exports = Setup
