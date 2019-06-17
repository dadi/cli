const ACL = require('@dadi/api').ACL
const clientId = process.argv[1]
const secret = process.argv[2]
const accessType = process.argv[3]

if (typeof console.restoreConsole === 'function') {
  console.restoreConsole()
}

function terminate (err, message) {
  if (err) {
    console.error(err)

    process.exit(1)
  } else {
    console.log(message)

    process.exit(0)
  }
}

function createClient () {
  ACL.client
    .create(
    {
      accessType,
      clientId,
      secret
    },
    {
      allowAccessType: true
    }
    )
    .then(response => {
      terminate(null, response)
    })
    .catch(error => {
      terminate(error)
    })
}

const { model } = ACL.client

if (model.connection.readyState === 1) {
  createClient()
} else {
  model.connection.once('connect', createClient)
}
