let answer

const mockInquirer = jest.fn(questions => {
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
