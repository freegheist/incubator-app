const { Router } = require("express");
const { ObjectID } = require("mongodb");
const { getTable } = require("../dal");
const { noAuthHandlers } = require("../handlers");

const router = Router();
const notificationsCollection = getTable("notifications");

router.put(
  "/set-read/:id",
  ...noAuthHandlers(async (req, res) => {
    await notificationsCollection.findOneAndUpdate(
      { _id: ObjectID(req.params.id) },
      { $set: { isRead: true } }
    );
    res.send({ message: "success" });
  })
);

router.put(
  "/set-read-all",
  ...noAuthHandlers(async (req, res) => {
    await notificationsCollection.updateMany(
      {
        $or: [
          { "destinationUser._id": ObjectID(req.tokenPayload._id) },
          { "destinationUser._id": req.tokenPayload._id },
        ],
      },
      { $set: { isRead: true } }
    );
    res.send({ message: "success" });
  })
);

router.get(
  "/count",
  ...noAuthHandlers(async (req, res) => {
    console.log("Token:", req.token);
    console.log("Token Payload:", req.tokenPayload);

    if (!req.tokenPayload || !req.tokenPayload._id) {
      // User is not authenticated, return 0 count
      return res.json({ count: 0 });
    }

    try {
      const notifs = await notificationsCollection
        .find({
          isRead: { $exists: false },
          $or: [
            { "destinationUser._id": ObjectID(req.tokenPayload._id) },
            { "destinationUser._id": req.tokenPayload._id },
          ],
        })
        .toArray();
      res.json({ count: notifs.length });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  })
);
module.exports = router;
