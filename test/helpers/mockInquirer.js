const objectPath = require('object-path')

let answer

const mockInquirer = jest.fn(questions => {
  questions.forEach(question => {
    const questionAnswer = question.name && objectPath.get(
      answer,
      question.name
    )

    if (
      questionAnswer === undefined &&
      question.default
    ) {
      objectPath.set(answer, question.name, question.default)
    }
  })

  return Promise.resolve(answer)
})

beforeEach(() => {
  answer = null
  mockInquirer.mockClear()
})

jest.mock('inquirer', () => ({
  prompt: mockInquirer
}))

module.exports = mockInquirer
module.exports.setAnswer = newAnswer => {
  answer = newAnswer
}
