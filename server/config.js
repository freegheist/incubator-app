const Config = {
  development: {
    bcryptSaltRounds: 10,
    jwtSecret:
      "shhhhh this is a secret. It's probably a better idea to store it somewhere else and not in the codebase :)",
    minStatusDate: "2020-04-13T21:00:00.000Z",
    mongoUrl: process.env.MONGO_URL,
    dbName: "dashincubator-import",
  },
  production: {
    bcryptSaltRounds: 10,
    jwtSecret:
      "shhhhh this is a secret. It's probably a better idea to store it somewhere else and not in the codebase :)",
    minStatusDate: "2020-04-13T21:00:00.000Z",
    mongoUrl: process.env.MONGO_URL,
    dbName: "dashincubator-import",
  },
};

module.exports = Config[process.env.NODE_ENV] || Config.development;
