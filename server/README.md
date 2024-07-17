## Incubator-App Server

## Backend setup for local development

Copy the `.env.example` file to a new `.env` file in the root.  It assumes you have mongo running locally with a databse called `incubator` created.

## Production 

To use production database, you should change the `MONGO_URL` to `<MONGO_URL>/?retryWrites=true&w=majority`, and `USE_REPLICA_SET` to `true` for production.
