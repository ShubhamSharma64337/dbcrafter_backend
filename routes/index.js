var express = require('express');
var router = express.Router();
const { MongoClient } = require('mongodb')
var session = require('express-session');

//Setting session options
router.use(session({  
  name: `dbcrafter`,
  secret: '123456',  
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // This will only work if you have https enabled!
    maxAge: 1800000 // 30 minutes
  } 
}));

/* Check signin status*/
router.get('/loginstatus',(req,res,next)=>{
  if(req.session.user){
    res.send({success: true, user: req.session.user, message: "User is logged in"});
  } else {
    res.send({success:false, user: null, message:"No user is logged in"});
  }
})

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Dbcraftr API' });
});

//Middleware to validate the signin data
router.use('/signin',function(req, res, next){
  if(Object.keys(req.body).length === 0){
    res.send({success: false, message: 'Request body cannot be empty'});
  }
  else if(req.body.email==='' || req.body.password===''){
    res.send({success: false, message: 'Email or password cannot be empty'});
  }
  else if(req.session.user){
    res.send({success: false, message: 'User already logged in!'});
  }
  else {
    next();
  }
})

//Middleware to validate the signup data
router.use('/signup',function(req, res, next){
  if(Object.keys(req.body).length === 0){
    res.send({success: false, message: 'Request body cannot be empty'});
  }
  else if(req.body.email==='' || req.body.password===''){
    res.send({success: false, message: 'Email or password cannot be empty'});
  }
  else if(req.body.password !== req.body.confirmPassword){
    res.send({success:false, message: 'Password and Confirmation Password not matched!'});
  }
  else {
    next();
  }
})

/* POST signin */
router.post('/signin', (req, res, next)=>{
  // Connection URL
  const url = 'mongodb://localhost:27017';
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
    
    // the following code examples can be pasted here...
    const findResult = await collection.findOne({email: req.body.email, password: req.body.password});
    if(findResult){
      result.success = true;
      req.session.user = req.body.email;
      result.message = "Sign in successfull";
    } else {
      result.success = false;
      result.message = "Invalid email or password";
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

/*POST signup*/
router.post('/signup', (req, res, next) => {
  // Connection URL
  const url = 'mongodb://localhost:27017';
  const client = new MongoClient(url);
  
  // Database Name
  const dbName = 'dbcrafter';
  let created = {success: false, message: 'Cannot Create Account'}
  async function main() {
    // Use connect method to connect to the server
    await client.connect();
    console.log('Connected successfully to server');
    const db = client.db(dbName);
    const collection = db.collection('users');
    
    // the following code examples can be pasted here...
    let already = await collection.findOne({email: req.body.email})
    if(!already){
      created.success = true;
      created.message = 'Successfully signed up';
      await collection.insertOne({email: req.body.email, password: req.body.password}); 
    } else {
      created.success = false;
      created.message = 'Email is already registered';
    }
  }

  main()
    .then(()=>{ res.send(created) }) //Remember, this accepts a method, not a function call, passing a function call leads to huge problems
    .catch(console.error)
    .finally(() => client.close());
})

//Middleware for logout
router.use('/logout',(req,res,next)=>{
  if(req.session.user){
    next()
  }else{
    res.send({success: false, message: "Not logged in!"})
  }
})

/* LOGOUT */
router.get('/logout',(req, res, next)=>{
  req.session.destroy(()=>{
      res.send({success: true, message: 'Successfully logged out!'});
  });
})

module.exports = router;
