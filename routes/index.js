var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Dbcraftr API' });
});

//Middleware to check if the username or password is empty
router.use(['/login','/signup'],function(req, res, next){
  if(req.body.username==='' || req.body.password===''){
    res.send({message: 'Username or password cannot be empty'});
  } else {
    next();
  }
})

/* POST login */
router.post('/login', (req, res, next)=>{
  const { MongoClient } = require('mongodb');
  // or as an es module:
  // import { MongoClient } from 'mongodb'

  // Connection URL
  const url = 'mongodb://localhost:27017';
  const client = new MongoClient(url);

  // Database Name
  const dbName = 'dbcrafter';
  let authenticated = false;
  async function main() {
    // Use connect method to connect to the server
    await client.connect();
    console.log('Connected successfully to server');
    const db = client.db(dbName);
    const collection = db.collection('users');
    
    // the following code examples can be pasted here...
    const findResult = await collection.findOne({username: req.body.username, password: req.body.password});
    if(findResult){
      authenticated = true
    }
    return 'done.';
  }

  main()
    .then(()=>{
      if(authenticated){
        res.send({authenticated: true, message: "Login successful"})
      } else {
        res.send({authenticated: false, message: "Account not found"})
      }
    })
    .catch(console.Error)
    .finally(() => client.close());
})

/*POST signup*/
router.post('/signup', (req, res, next) => {
  const { MongoClient } = require('mongodb');
  // or as an es module:
  // import { MongoClient } from 'mongodb'

  // Connection URL
  const url = 'mongodb://localhost:27017';
  const client = new MongoClient(url);

  // Database Name
  const dbName = 'dbcrafter';

  async function main() {
    // Use connect method to connect to the server
    await client.connect();
    console.log('Connected successfully to server');
    const db = client.db(dbName);
    const collection = db.collection('users');
  
    // the following code examples can be pasted here...
    const insertResult = await collection.insertOne({username: req.body.username, password: req.body.password});
    console.log('Inserted document =>', insertResult);
    return 'done.';
  }

  main()
    .then(res.send('Signup Successful'))
    .catch(console.error)
    .finally(() => client.close());
})

module.exports = router;
