var express = require('express');
var router = express.Router();
const { MongoClient } = require('mongodb')
var session = require('express-session');

//user related routes middleware
router.use(function(req, res, next){
  if(!req.session.user){
    res.send({success: false, message: "You must be logged in to access this route!"})
  } else {
    next()
  }
})

//get all the diagrams of the signed in user
router.get('/getdiagrams', function(req, res, next){
   // Connection URL
   const url = 'mongodb://localhost:27017';
   const client = new MongoClient(url);
   
   // Database Name
   const dbName = 'dbcrafter';
   let created = {success: false, message: 'No diagrams created yet!'}
   async function main() {
     // Use connect method to connect to the server
     await client.connect();
     console.log('Connected successfully to server');
     const db = client.db(dbName);
     const collection = db.collection('diagrams');
     
     // the following code examples can be pasted here...
     let already = await collection.find({uid: req.session.user.uid},{projection: {_id: 0, uid: 0}}).toArray();
     if(already.length>0){
       created.success = true;
       created.message = already
     } else {
       created.success = false;
       created.message = 'No diagram found!';
     }
   }
 
   main()
     .then(()=>{ res.send(created) }) //Remember, this accepts a method, not a function call, passing a function call leads to huge problems
     .catch(console.error)
     .finally(() => client.close());
 }
)
//get the diagram specified by the name send in the request
router.post('/getdiagram', function(req,res, next){
  // Connection URL
  const url = 'mongodb://localhost:27017';
  const client = new MongoClient(url);
  
  // Database Name
  const dbName = 'dbcrafter';
  let created = {success: false, message: 'Cannot find diagram with specified name'}
  async function main() {
    // Use connect method to connect to the server
    await client.connect();
    console.log('Connected successfully to server');
    const db = client.db(dbName);
    const collection = db.collection('diagrams');
    
    // the following code examples can be pasted here...
    let already = await collection.findOne({uid: req.session.user.uid, name: req.body.name},{projection: {_id: 0, uid: 0}})
    if(!already){
      created.success = false;
      created.message = 'Cannot find diagram with specified name!';
    } else {
      created.success = true;
      created.message = already;
    }
  }

  main()
    .then(()=>{ res.send(created) }) //Remember, this accepts a method, not a function call, passing a function call leads to huge problems
    .catch(console.error)
    .finally(() => client.close());
})
    
/*Create new diagram for user*/
router.post('/creatediagram', function(req, res, next){
  // Connection URL
  const url = 'mongodb://localhost:27017';
  const client = new MongoClient(url);
  
  // Database Name
  const dbName = 'dbcrafter';
  let created = {success: false, message: 'Cannot save diagram'}
  async function main() {
    // Use connect method to connect to the server
    await client.connect();
    console.log('Connected successfully to server');
    const db = client.db(dbName);
    const collection = db.collection('diagrams');
    
    // the following code examples can be pasted here...
    let already = await collection.findOne({uid: req.session.user.uid, name: req.body.name})
    if(!already){
      created.success = true;
      created.message = 'Diagram successfully created and saved!';
      await collection.insertOne({uid: req.session.user.uid, name: req.body.name, tbls: req.body.tbls}); 
    } else {
      created.success = false;
      created.message = 'Diagram with same name already exists!';
    }
  }

  main()
    .then(()=>{ res.send(created) }) //Remember, this accepts a method, not a function call, passing a function call leads to huge problems
    .catch(console.error)
    .finally(() => client.close());
})

/*Save/update diagram*/
router.post('/savediagram', function(req, res, next){
  // Connection URL
  const url = 'mongodb://localhost:27017';
  const client = new MongoClient(url);
  
  // Database Name
  const dbName = 'dbcrafter';
  let created = {success: false, message: 'Cannot save diagram'}
  async function main() {
    // Use connect method to connect to the server
    await client.connect();
    console.log('Connected successfully to server');
    const db = client.db(dbName);
    const collection = db.collection('diagrams');
    
    // the following code examples can be pasted here...
    let already = await collection.findOne({uid: req.session.user.uid, name: req.body.name})
    if(!already){
      created.success = true;
      created.message = 'Diagram does not exist already, you must create the diagram first to save changes to it!';
    } else {
      await collection.updateOne({uid: req.session.user.uid, name: req.body.name}, {$set: {tbls: req.body.tbls}}); 
      created.success = true;
      created.message = 'Diagram successfully saved!';
    }
  }

  main()
    .then(()=>{ res.send(created) }) //Remember, this accepts a method, not a function call, passing a function call leads to huge problems
    .catch(console.error)
    .finally(() => client.close());
})

module.exports = router;
