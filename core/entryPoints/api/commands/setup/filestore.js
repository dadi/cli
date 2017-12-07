module.exports.buildConfig = (dbConfig, config) => {
  return {
    database: {
      path: dbConfig.dbPath,
      autosaveInterval: 1000,
      serializationMethod: 'normal'
    }
  }
}

module.exports.handle = 'filestore'
module.exports.questions = {
  name: true,
  path: true
}
module.exports.settings = {
  defaultPort: 27017
}
