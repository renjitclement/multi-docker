const keys = require("./keys");

//get the required libs
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

//create an express server app for handling http request and response.the ap obj will act as server
const app = express();
//cors for cross origin request. This will enable us to make request from one domain where
//the react application is running to another domain where the express APIs are exposed.
app.use(cors());
//body parser will parse the incoming request to react server and parses the body to json format, which will be used
//by the express API to work with
app.use(bodyParser.json());

//postgres client setup
//create a pool object
const { Pool } = require('pg');
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort
});
//add an error listener to pg client to log errors when there is connection error.
pgClient.on('error', () => console.log('Lost pg connection'));

//one last thing is to create the table to store the indices values permamnently.
pgClient
  .query('create table if not exists values (number INT)')
  .catch(err => console.log(err));


//setup redis redis client
const redis = require('redis');
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_startegy: () => 1000
});
const redisPublisher = redisClient.duplicate();


//configure route handlers for redis server

//test url
app.get('/',(req,res) => {
  res.send('Hi');
});

//get all values for indices for postgres
app.get('/values/all', async (req,res) => {
  const indices = await pgClient.query('select * from values');
  res.send(indices.rows);
});

//get all values for indices from redis hash
app.get('/values/current', async (req,res) => {
  redisClient.hgetall('values', (err,values) => {
    res.send(values);
  });
});

//post call to handle the request for calculating the fibonacci.this will require the index for which fibonacci
//has to be calculated.
app.post('/values', async (req,res) => {
  const index = req.body.index;
  if(parseInt(index) > 40) {
    return res.status(422).send("Index too high");
  }
  //now lets save the index to the hash in redis and set the value of that as nothing yet for now as we have not calculatd the value yet.
  redisClient.hset('values', index , "nothing yet! " );
  //after that lets publish an inster event so that any listener can listen to this event and perform the tasks.
  //We already have the worker listening for insert events.
  redisPublisher.publish('insert',index);
  //then add the new index to the postgres database permanently
  pgClient.query('INSERT INTO VALUES(number) VALUES($1)', [index]);
  res.send({ working: true});
});

//make the express server listen on port 5000
app.listen(5000, err => {
  console.log("listening");
});
