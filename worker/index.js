//get the config details for connecting to redis
const keys = require("./keys");
//get redis client
const redis = require("redis");

const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_startegy: () => 1000 //reconnects to redes servre every millisecond
});
const subRedis = redisClient.duplicate();

function fib(index) {
  if(index < 2) return 1;
  return fib(index-1) + fib(index-2);
}
//subscribe to any insertions to redis
subRedis.subscribe('insert');
//listen for any message insert to redis and initiate action
subRedis.on('message',(channel,message) => {
  redisClient.hset('values',message,fib(parseInt(message)));
});
