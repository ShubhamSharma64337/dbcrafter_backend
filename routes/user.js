var express = require('express');
var router = express.Router();
const { MongoClient } = require('mongodb')
var ObjectId = require('mongodb').ObjectId; 

let url = 'mongodb://localhost:27017/dbcrafter'

if(process.env.NODE_ENV === 'production'){//the NODE_ENV environment variable is set by gcloud appengine runtime as production when app is 
  //hosted on gcloud, so we check it to set the connection string to online database if the app is in production, and to local mongodb database
  //if the app is not in production
  
  //we need to use %40 to add @ symbol in case the password has it
  url = process.env.MONGO_CONNECTION
}

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
     let already = await collection.find({uid: req.session.user.uid},{projection: {tbls: 0, uid: 0}}).toArray();
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
    let objIdObject = new ObjectId(req.body._id);
    // the following code examples can be pasted here...
    let already = await collection.findOne({uid: req.session.user.uid, _id: objIdObject},{projection: {uid: 0}})
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

// This middleware will handle the validation of data being sent to creatediagram route
router.use('/creatediagram', function(req, res, next){
  // Checking if the diagram name is valid
  if(/^\s*$/.test(req.body.name) || req.body.name === null){
    res.send({success: false, message: "Diagram name cannot be empty!"});
    return;
  } else if(req.body.isPublic === null) {
    res.send({success: false, message: "Is public attribute must be defined!"});
    return;
  }
  else {
    next();
  }
})

/*Create new diagram for user*/
router.post('/creatediagram', function(req, res, next){
  // Connection URL
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
      await collection.insertOne({uid: req.session.user.uid, name: req.body.name, isPublic: req.body.isPublic, tbls: req.body.tbls}); 
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

/*Delete a diagram for user*/
router.post('/deletediagram', function(req, res, next){
  // Connection URL
  const client = new MongoClient(url);
  
  // Database Name
  const dbName = 'dbcrafter';
  let created = {success: false, message: 'Cannot delete diagram'}
  async function main() {
    // Use connect method to connect to the server
    await client.connect();
    console.log('Connected successfully to server');
    const db = client.db(dbName);
    const collection = db.collection('diagrams');
    
    // the following code examples can be pasted here...
    let already = await collection.findOne({uid: req.session.user.uid, name: req.body.name})
    if(already){
      created.success = true;
      created.message = 'Diagram successfully deleted!';
      await collection.deleteOne({uid: req.session.user.uid, name: req.body.name}); 
    } else {
      created.success = false;
      created.message = 'Diagram not found!';
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
      created.success = false;
      created.message = 'Diagram does not exist already, you must create the diagram first to save changes to it!';
    } else {
      await collection.updateOne({uid: req.session.user.uid, name: req.body.name}, {$set: {tbls: req.body.tbls, isPublic: req.body.isPublic}}); 
      created.success = true;
      created.message = 'Diagram successfully saved!';
    }
  }

  main()
    .then(()=>{ res.send(created) }) //Remember, this accepts a method, not a function call, passing a function call leads to huge problems
    .catch(console.error)
    .finally(() => client.close());
})

// This middleware will handle the validation of data being sent to renamediagram route
router.use('/renamediagram', function(req, res, next){
  // Checking if the diagram name is valid
  if(/^\s*$/.test(req.body.oldname) || /^\s*$/.test(req.body.newname) || req.body.oldname === null || req.body.newname === null){
    res.send({success: false, message: "Diagram name cannot be empty!"});
    return;
  } else {
    next();
  }
})

router.post('/renamediagram', function(req, res, next){
  // Connection URL
  const client = new MongoClient(url);
  
  // Database Name
  const dbName = 'dbcrafter';
  let created = {success: false, message: 'Cannot rename diagram'}
  async function main() {
    // Use connect method to connect to the server
    await client.connect();
    console.log('Connected successfully to server');
    const db = client.db(dbName);
    const collection = db.collection('diagrams');
    
    // the following code examples can be pasted here...
    let already = await collection.findOne({name: req.body.oldname, uid: req.session.user.uid})
    if(!already){
      created.success = false;
      created.message = 'Diagram does not exist!';
    } else {
      await collection.updateOne({name: req.body.oldname, uid: req.session.user.uid}, {$set: {name: req.body.newname}}); 
      created.success = true;
      created.message = 'Diagram successfully renamed!';
    }
  }

  main()
    .then(()=>{ res.send(created) }) //Remember, this accepts a method, not a function call, passing a function call leads to huge problems
    .catch(console.error)
    .finally(() => client.close());
})

//this returns a list of names and _id for all the diagrams which have isPublic attribute set to true
router.get('/gettemplates',function (req, res, next){
  // Connection URL
  const client = new MongoClient(url);
   
  // Database Name
  const dbName = 'dbcrafter';
  let created = {success: false, message: 'No templates available!'}
  async function main() {
    // Use connect method to connect to the server
    await client.connect();
    console.log('Connected successfully to server');
    const db = client.db(dbName);
    const collection = db.collection('diagrams');
    
    // Here we find diagrams which are public, and are not created by the current user
    let already = await collection.find({isPublic: true, uid: { $not: { $eq: req.session.user.uid}}}, {projection: {tbls: 0, uid: 0, isPublic: 0}}).toArray();
    if(already.length>0){
      created.success = true;
      created.message = already
    } else {
      created.success = false;
      created.message = 'No public templates available!';
    }
  }

  main()
    .then(()=>{ res.send(created) }) //Remember, this accepts a method, not a function call, passing a function call leads to huge problems
    .catch(console.error)
    .finally(() => client.close());
}
)

//get the template specified by the name send in the request
router.post('/gettemplate', function(req,res, next){
  // Connection URL
  const client = new MongoClient(url);
  
  // Database Name
  const dbName = 'dbcrafter';
  let created = {success: false, message: 'Cannot find template with specified id'}
  async function main() {
    // Use connect method to connect to the server
    await client.connect();
    console.log('Connected successfully to server');
    const db = client.db(dbName);
    const collection = db.collection('diagrams');
    let objIdObject = new ObjectId(req.body._id); //we must create an ObjectId object, we cannot directly compare _id with a string value
    let already = await collection.findOne({_id: objIdObject, isPublic: true},{projection: {_id: 0, uid: 0, isPublic: 0}})
    if(!already){
      created.success = false;
      created.message = 'Cannot find template with specified id!';
    } else {
      created.success = true;
      created.message = already;
    }
  }

  main()
    .then(()=>{ res.send(created)}) //Remember, this accepts a method, not a function call, passing a function call leads to huge problems
    .catch(console.error)
    .finally(() => client.close());
})

module.exports = router;
