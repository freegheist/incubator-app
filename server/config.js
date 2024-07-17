const Config = {
  development: {
    bcryptSaltRounds: 10,
    jwtSecret: "incubator-jwt-secret",
    minStatusDate: "2020-04-13T21:00:00.000Z",
    mongoUrl: process.env.MONGO_URL,
    dbName: "incubator",
    useReplicaSet: process.env.USE_REPLICA_SET === 'true',
  },
  production: {
    bcryptSaltRounds: 10,
    jwtSecret: "incubator-jwt-secret",
    minStatusDate: "2020-04-13T21:00:00.000Z",
    mongoUrl: process.env.MONGO_URL,
    dbName: "incubator",
    useReplicaSet: process.env.USE_REPLICA_SET === 'true',
  },
};

module.exports = Config[process.env.NODE_ENV] || Config.development;
