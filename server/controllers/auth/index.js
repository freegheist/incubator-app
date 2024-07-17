const { Router } = require("express");
const { getTable, getClient } = require("../../dal");
const { signToken } = require("../../handlers");
const utils = require("./utils");
const Config = require("../../config"); 

const router = Router();
const mongoClient = getClient();
const usersCollection = getTable("users");
const passwordsCollection = getTable("passwords");
const activityCollection = getTable("activity");

function usernameIsValid(username) {
  return /^[0-9a-zA-Z_.-]+$/.test(username);
}

let wrap =
  (fn) =>
  (...args) =>
    fn(...args).catch(args[2]);

  router.post("/register", async (req, res, next) => {
    const { password, ...user } = req.body;
  
    if (!password) {
      return res.status(403).send("User must have a password");
    }
  
    if (!usernameIsValid(req.body.username)) {
      return res.send({
        error: "Username is invalid, spaces and special characters are not allowed",
      });
    }
  
    const session = Config.useReplicaSet ? mongoClient.startSession() : null;
  
    try {
      const existingUsername = await usersCollection.findOne({
        username: req.body.username,
      });
      const existingEmail = await usersCollection.findOne({
        email: req.body.email,
      });
  
      if (existingUsername) {
        return res.send({ error: "Username taken" });
      } else if (existingEmail) {
        return res.send({ error: "Email taken" });
      }
  
      const registerUser = async () => {
        const hash = await utils.createHash(password);
        const { insertedId: userId } = await usersCollection.insertOne(
          { ...user, createdDate: new Date() },
          Config.useReplicaSet ? { session } : {}
        );
  
        await passwordsCollection.insertOne({ userId, hash }, Config.useReplicaSet ? { session } : {});
        await activityCollection.insertOne({
          activityLevel: "global",
          activityType: "newUser",
          sourceUser: { ...user, _id: userId },
          date: new Date(),
        }, Config.useReplicaSet ? { session } : {});
  
        return { userId, token: await signToken({ ...user, _id: userId }) };
      };
  
      if (Config.useReplicaSet) {
        await session.withTransaction(registerUser);
      } else {
        const { userId, token } = await registerUser();
        return res.status(200).send({ token, user: { ...user, _id: userId } });
      }
    } catch (e) {
      console.error("Error in user registration:", e);
      next(e);
    } finally {
      if (session) {
        session.endSession();
      }
    }
  });
  

router.post(
  "/login",
  wrap(async (req, res) => {
    const { username, password } = req.body;
    const userUsername = await usersCollection.findOne({ username: username });
    const userEmail = await usersCollection.findOne({ email: username });

    if (!userUsername && !userEmail) {
      res.send({ error: "User does not exist" });
      return;
    }
    if (userUsername) {
      const doesMatch = await utils.verifyPasswordForUser(
        userUsername._id,
        password
      );
      if (!doesMatch) {
        res.send({ error: "Incorrect password" });
        return;
      }
      const token = await signToken(userUsername);
      res.status(200).send({ token, user: userUsername });
    } else if (userEmail) {
      const doesMatch = await utils.verifyPasswordForUser(
        userEmail._id,
        password
      );
      if (!doesMatch) {
        res.send({ error: "Incorrect password" });
        return;
      }
      const token = await signToken(userEmail);
      res.status(200).send({ token, user: userEmail });
    }
  })
);

module.exports = router;
