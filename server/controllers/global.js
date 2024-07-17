const { Router } = require("express");
const { ObjectID } = require("mongodb");
const { getTable } = require("../dal");
const { noAuthHandlers } = require("../handlers");

const router = Router();
const activityCollection = getTable("activity");
const tasksCollection = getTable("tasks");
const bountiesCollection = getTable("bounties");
const notificationsCollection = getTable("notifications");

router.get(
  "/activity",
  ...noAuthHandlers(async (req, res) => {
    const result = await activityCollection.find({}).toArray();
    res.send(result.sort((a, b) => new Date(b.date) - new Date(a.date)));
  })
);

router.get(
  "/notifications",
  ...noAuthHandlers(async (req, res) => {
    const result = await notificationsCollection
      .find({
        $or: [
          { "destinationUser._id": req.tokenPayload._id },
          { "destinationUser._id": ObjectID(req.tokenPayload._id) },
        ],
      })
      .toArray();
    res.send(result.sort((a, b) => new Date(b.date) - new Date(a.date)));
  })
);

router.get(
  "/dashboard",
  ...noAuthHandlers(async (req, res) => {
    const unpaidTasks = await tasksCollection
      .find({ status: "complete", isPaid: { $exists: false } })
      .toArray();
    const pendingAdminApproval = await tasksCollection
      .find({
        status: "pending",
        $or: [
          { "createdBy._id": req.tokenPayload._id },
          { "createdBy._id": ObjectID(req.tokenPayload._id) },
        ],
      })
      .toArray();
    let pendingJobs = [];
    const pendingJobAdminApproval = await tasksCollection
      .find({
        bountyType: "job",
        completions: { $exists: true, $not: { $size: 0 } },
        $or: [
          { "createdBy._id": req.tokenPayload._id },
          { "createdBy._id": ObjectID(req.tokenPayload._id) },
        ],
      })
      .toArray();
    for (let i = 0; i < pendingJobAdminApproval.length; i++) {
      for (let j = 0; j < pendingJobAdminApproval[i].completions.length; j++) {
        let newJob = { ...pendingJobAdminApproval[i] };
        delete newJob.reviews;
        delete newJob.completions;
        if (!pendingJobAdminApproval[i].completions[j].isPaid) {
          pendingJobs.push({
            ...newJob,
            ...pendingJobAdminApproval[i].completions[j],
          });
        }
      }
    }
    const pendingContributorCompletion = await tasksCollection
      .find({
        status: "open",
        $or: [
          { "assignee._id": req.tokenPayload._id },
          { "assignee._id": ObjectID(req.tokenPayload._id) },
        ],
      })
      .toArray();
    const pendingContributorModify = await tasksCollection
      .find({
        status: "modify",
        $or: [
          { "assignee._id": req.tokenPayload._id },
          { "assignee._id": ObjectID(req.tokenPayload._id) },
        ],
      })
      .toArray();
    const pendingConcepts = await bountiesCollection
      .find({ type: "concept", status: "review" })
      .toArray();
    const result = {
      unpaidTasks: req.tokenPayload.isSuperUser && unpaidTasks,
      pendingAdminApproval: req.tokenPayload.isAdmin && [
        ...pendingAdminApproval,
        ...pendingJobs,
      ],
      pendingContributorCompletion,
      pendingContributorModify,
      pendingConcepts: req.tokenPayload.isAdmin && pendingConcepts,
    };
    res.send(result);
  })
);
router.get(
  "/dashboard-count",
  ...noAuthHandlers(async (req, res) => {
    if (!req.tokenPayload) {
      // User is not authenticated, return default data
      return res.json({
        unpaidTasks: 0,
        pendingAdminApproval: 0,
        pendingContributorCompletion: 0,
        pendingContributorModify: 0,
        pendingConcepts: 0,
      });
    }

    const unpaidTasks = req.tokenPayload.isSuperUser
      ? await tasksCollection
          .find({ status: "complete", isPaid: { $exists: false } })
          .count()
      : 0;

    const pendingAdminApproval = req.tokenPayload.isAdmin
      ? await tasksCollection
          .find({
            status: "pending",
            $or: [
              { "createdBy._id": req.tokenPayload._id },
              { "createdBy._id": ObjectID(req.tokenPayload._id) },
            ],
          })
          .count()
      : 0;

    let pendingJobs = [];
    if (req.tokenPayload.isAdmin) {
      const pendingJobAdminApproval = await tasksCollection
        .find({
          bountyType: "job",
          completions: { $exists: true, $not: { $size: 0 } },
          $or: [
            { "createdBy._id": req.tokenPayload._id },
            { "createdBy._id": ObjectID(req.tokenPayload._id) },
          ],
        })
        .toArray();
      for (let i = 0; i < pendingJobAdminApproval.length; i++) {
        for (let j = 0; j < pendingJobAdminApproval[i].completions.length; j++) {
          let newJob = { ...pendingJobAdminApproval[i] };
          delete newJob.reviews;
          delete newJob.completions;
          if (!pendingJobAdminApproval[i].completions[j].isPaid) {
            pendingJobs.push({
              ...newJob,
              ...pendingJobAdminApproval[i].completions[j],
            });
          }
        }
      }
    }

    const pendingContributorCompletion = await tasksCollection
      .find({
        status: "open",
        $or: [
          { "assignee._id": req.tokenPayload._id },
          { "assignee._id": ObjectID(req.tokenPayload._id) },
        ],
      })
      .count();

    const pendingContributorModify = await tasksCollection
      .find({
        status: "modify",
        $or: [
          { "assignee._id": req.tokenPayload._id },
          { "assignee._id": ObjectID(req.tokenPayload._id) },
        ],
      })
      .count();

    const pendingConcepts = req.tokenPayload.isAdmin
      ? await bountiesCollection
          .find({ type: "concept", status: "review" })
          .count()
      : 0;

    const result = {
      unpaidTasks,
      pendingAdminApproval: pendingAdminApproval + pendingJobs.length,
      pendingContributorCompletion,
      pendingContributorModify,
      pendingConcepts,
    };

    res.json(result);
  })
);
module.exports = router;
