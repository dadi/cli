module.exports.buildConfig = (dbConfig, config) => {
  return {
    hosts: [
      {
        host: dbConfig.host,
        port: dbConfig.port
      }
    ],
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database
  }
}

module.exports.handle = 'rethinkdb'
module.exports.questions = {
  host: true,
  name: true,
  username: true,
  password: true,
  port: true
}
module.exports.settings = {
  defaultPort: 28015
}
