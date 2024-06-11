var express = require('express');
var router = express.Router();
const { MongoClient } = require('mongodb')
var ObjectId = require('mongodb').ObjectId; 
const bcrypt = require('bcrypt')
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config()

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

//This is middleware for getdiagrams route
router.use('/getdiagrams', function(req, res, next){
  next();
})

//get all the diagrams of the signed in user
router.post('/getdiagrams', function(req, res, next){
   // Connection URL
   const client = new MongoClient(url);
   
   // Database Name
   const dbName = 'dbcrafter';
   let created = {success: false, message: 'No diagrams created yet!', numPages: 0}
   async function main() {
     // Use connect method to connect to the server
     await client.connect();
     console.log('Connected successfully to server');
     const db = client.db(dbName);
     const collection = db.collection('diagrams');
     
     const pageCount = req.body.pageSize ? parseInt(req.body.pageSize):8; //This contains the number of diagrams to be sent on each page
     let numDiagrams = await collection.countDocuments({uid: req.session.user.uid});
     let numPages = Math.ceil(numDiagrams/pageCount);
     const pageNumber = req.body.pageNumber || req.body.pageNumber < 1 ?parseInt(req.body.pageNumber):1; //If no page number is sent in the request body, or invalid page number is sent, set it to 1
     let already = null;
     if(req.body.keyword && !/\s+/.test(req.body.keyword)){
       numDiagrams = await collection.countDocuments({uid: req.session.user.uid, name: {$regex : req.body.keyword, $options : 'i'}},{projection: {tbls: 0, uid: 0}});
       numPages = Math.ceil(numDiagrams/pageCount)
       already = await collection.find({uid: req.session.user.uid, name:  {$regex : req.body.keyword, $options : 'i'}},{projection: {tbls: 0, uid: 0}}).limit(pageCount).skip((pageNumber-1)*pageCount).toArray();
     } else {
       already = await collection.find({uid: req.session.user.uid},{projection: {tbls: 0, uid: 0}}).limit(pageCount).skip((pageNumber-1)*pageCount).toArray();
     }
     if(already.length>0){
       created.success = true;
       created.message = already;
       created.numPages = numPages;
     } else {
       created.success = false;
       created.message = 'No diagram found!';
       created.numPages = 0;
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

    let objIdObject = new ObjectId(req.body._id);
    // the following code examples can be pasted here...
    let already = await collection.findOne({uid: req.session.user.uid, _id: objIdObject})
    if(already){
      created.success = true;
      created.message = 'Diagram successfully deleted!';
      await collection.deleteOne({uid: req.session.user.uid, _id: objIdObject}); 
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
  if(/^\s*$/.test(req.body.newname) || req.body.newname === null){
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
    
    let objIdObject = new ObjectId(req.body._id)
    // the following code examples can be pasted here...
    let already = await collection.findOne({_id: objIdObject, uid: req.session.user.uid})
    if(!already){
      created.success = false;
      created.message = 'Diagram does not exist!';
    } else {
      await collection.updateOne({_id: objIdObject, uid: req.session.user.uid}, {$set: {name: req.body.newname}}); 
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

//Middleware to validate data received on changepassword route
router.use('/changepassword',function(req,res,next){
  if(Object.keys(req.body).length === 0){
    res.send({success: false, message: 'Request body cannot be empty'});
  }
  else if(req.body.oldPassword === '' || req.body.oldPassword === null){
    res.send({success: false, message: 'Old password cannot be empty'});
  }
  else if(req.body.newPassword === '' || req.body.newPassword === null){
    res.send({success: false, message: 'New password cannot be empty'});
  }
  else if(req.body.confirmNewPassword === '' || req.body.confirmNewPassword === null){
    res.send({success: false, message: 'Confirmation password cannot be empty'});
  }
  else if(req.body.newPassword !== req.body.confirmNewPassword){
    res.send({success:false, message: 'New Password and Confirmation Password not matched!'});
  }
  else if(!/.{6,}/.test(req.body.newPassword) || !/.{6,}/.test(req.body.confirmNewPassword)){
    res.send({success: false, message: 'New Password must be at least 6 characters long!'});
  }
  else{
    next();
  }
})

//Route for changing password
router.post('/changepassword', function(req,res,next){
  // Connection URL
  const client = new MongoClient(url);

  // Database Name
  const dbName = 'dbcrafter';
  let result = {success: false, message: 'Not Signed In'};
  async function main() {
    // Use connect method to connect to the server
    await client.connect();
    console.log('Connected successfully to server');
    const db = client.db(dbName);
    const collection = db.collection('users');
    
    const uidObject = new ObjectId(req.session.user.uid);
    const findResult = await collection.findOne({_id: uidObject});
    if(findResult){
      let oldPassIsValid = await bcrypt.compare(req.body.oldPassword, findResult.password)
      if(oldPassIsValid){
        //now hashing the received new password using bcrypt
        const hash = await bcrypt.hash(req.body.newPassword, 10);
        await collection.updateOne({_id: uidObject}, {$set: {password: hash}}); 
        result.success = true;
        result.message = "Successfully changed the password!";
      } else {
        result.success = false;
        result.message = "Incorrect old password!";
      }

    } else {
      result.success = false;
      result.message = "Account not found!";
    }
    return 'done.';
  }

  main()
    .then(()=>{
      res.send(result)
    })
    .catch(console.Error)
    .finally(() => client.close());
})

//Middleware for reset account route
router.use('/resetaccount', function(req,res,next){
  if(Object.keys(req.body).length === 0){
    res.send({success: false, message: 'Request body cannot be empty'});
  } else if(req.body.password == null || req.body.password === ''){ //req.body.password == null treats null and undefined as same, === null does not!
    res.send({success:false,message:'Password cannot be null!'});
  } else {
    next();
  }
})

//Route for resetting account i.e delete all diagrams
router.post('/resetaccount', function(req,res,next){
  // Connection URL
  const client = new MongoClient(url);

  // Database Name
  const dbName = 'dbcrafter';
  let result = {success: false, message: 'Not Signed In'};
  async function main() {
    // Use connect method to connect to the server
    await client.connect();
    console.log('Connected successfully to server');
    const db = client.db(dbName);
    const collection = db.collection('users');
    
    const uidObject = new ObjectId(req.session.user.uid);
    const findResult = await collection.findOne({_id: uidObject});
    if(findResult){
      let oldPassIsValid = await bcrypt.compare(req.body.password, findResult.password)
      if(oldPassIsValid){
        let delResult = deleteAllDiagrams(req.session.user.uid)
        if(delResult === -1){
          result.success = false;
          result.message = "An error occured while trying to reset the account!";
        } else {
          result.success = true;
          result.message = "Your account has been reset!";
        }
      } else {
        result.success = false;
        result.message = "Incorrect old password!";
      }

    } else {
      result.success = false;
      result.message = "Account not found!";
    }
    return 'done.';
  }

  main()
    .then(()=>{
      res.send(result)
    })
    .catch(console.Error)
    .finally(() => client.close());
})

//This function is used by reset account route
function deleteAllDiagrams(user_id){
  // Connection URL
  const client = new MongoClient(url);

  // Database Name
  const dbName = 'dbcrafter';
  async function main() {
    // Use connect method to connect to the server
    await client.connect();
    console.log('Connected successfully to server');
    const db = client.db(dbName);
    const collection = db.collection('diagrams');
    await collection.deleteMany({uid: user_id})
    return 'done.';
  }

  main()
  .then(()=>{ return 0 }) //Remember, this accepts a method, not a function call, passing a function call leads to huge problems
    .catch(()=>{console.error(); return -1})
    
}

//Middleware for delete account route
router.use('/deleteaccount', function(req,res,next){
  if(Object.keys(req.body).length === 0){
    res.send({success: false, message: 'Request body cannot be empty'});
  } else if(req.body.password == null || req.body.password === ''){ //req.body.password == null treats null and undefined as same, === null does not!
    res.send({success:false,message:'Password cannot be null!'});
  } else {
    next();
  }
})

//Route for deleting account
router.post('/deleteaccount', function(req,res,next){
  // Connection URL
  const client = new MongoClient(url);

  // Database Name
  const dbName = 'dbcrafter';
  let result = {success: false, message: 'Not Signed In'};
  async function main() {
    // Use connect method to connect to the server
    await client.connect();
    console.log('Connected successfully to server');
    const db = client.db(dbName);
    const collection = db.collection('users');
    
    const uidObject = new ObjectId(req.session.user.uid);
    const findResult = await collection.findOne({_id: uidObject});
    if(findResult){
      let oldPassIsValid = await bcrypt.compare(req.body.password, findResult.password)
      if(oldPassIsValid){
        let delResult = await collection.deleteOne({_id: uidObject})
        deleteAllDiagrams(req.session.user.uid)
        if(delResult.count === 0){
          result.success = false;
          result.message = "An error occured while trying to delete the account!";
        } else {
          result.success = true;
          result.message = "Your account has been deleted!";
          req.session.destroy();
        }
      } else {
        result.success = false;
        result.message = "Incorrect password!";
      }

    } else {
      result.success = false;
      result.message = "Account not found!";
    }
    return 'done.';
  }

  main()
    .then(()=>{
      res.send(result)
    })
    .catch(console.Error)
    .finally(() => client.close());
})

//Middleware to validate data sent on /user/getattributes route
router.use('/getattributes', function(req,res,next){
  if(Object.keys(req.body).length < 1){
    res.send({success:false, message: "Request body cannot be empty!"})
  } else if(/^\s*$/.test(req.body.tblName) || req.body.tblName === null){
    res.send({success:false, message: "tblName attribute not found in request body!"})
  } else {
    next();
  }
})

//This route returns a JSON Array containing attributes for a specified object name using the Google Gemini AI API
router.post('/getattributes',function(req,res,next){
  const safe = {
    "HARM_CATEGORY_HARASSMENT": "BLOCK_NONE",
    "HARM_CATEGORY_HATE_SPEECH": "BLOCK_NONE",
    "HARM_CATEGORY_SEXUALLY_EXPLICIT": "BLOCK_NONE",
    "HARM_CATEGORY_DANGEROUS_CONTENT": "BLOCK_NONE",
  }
  const genAI = new GoogleGenerativeAI(process.env.API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", safe});
  async function run() {
    const prompt = "Give me a array of objects of names and SQL datatype of attributes of a " + req.body.tblName + " object without comments, include primary key attribute as boolean, do not use markdown and do not include size. The key names should be name, type and isPKey. Output as JSON without markdown."
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    res.send({success:true,message:JSON.parse(text)});
  }
  
  run().catch((error)=>{console.log(error);res.send({success:false,message:"An error occured in trying to access Google Gemini API, please try using a different table name or try again after some time"})});

})
module.exports = router;