var express = require("express");
var router = express.Router();
var Author = require("../models/Authors");
var bcrypt = require("bcrypt");
var jwt = require('jsonwebtoken')
const {upload,uploadImage} = require('../middleware/upload')
require('dotenv').config()

/* GET users listing. */

function authenticate(req, res, next) {
  if (req.headers.authorization) {
    let token = req.headers.authorization;
    var decoded = jwt.verify(token, process.env.ENCRYPYION_KEY);
    req.userId = decoded.data;
    next();
  } else {
    res.send("No Token Present");
  }
}
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

router.post("/register", async (req, res, next) => {
  const { _id, userName, password } = req.body.author;

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);

  let newAuthor = new Author({
    _id: _id,
    userName: userName,
    password: hash,
  });

  try {
    await Author.collection.insertOne(newAuthor);

    res.status(200).json({
      message: "Registration Successful..!!",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

router.post("/login", async (req, res, next) => {
  let userId = req.body.id;
  let password = req.body.password;

  try {
    let user = await Author.findOne({ _id: userId });

    let comparePassword = bcrypt.compareSync(password, user.password);

    if (comparePassword) {

      //generate Token
     let token = jwt.sign({
        data: userId
      }, (process.env.ENCRYPYION_KEY)
      , { expiresIn: '4h' });

      res.json({
        message:"Logged in",
        token: token,
        id:userId
      });
    } else {
      res.status(500).send("Check your Credentials..!");
    }
  } catch (error) {
    res.send(error.message);
  }
});

router.get('/getUser/:id',async(req,res)=>{
  let id = req.params.id

  try {
  let userData =  await Author.findOne({_id:id})
    res.send(userData)
    
  } catch (error) {
    res.send(error.message)
    console.log(error)
    
  }

})

router.get('/getUser',authenticate,async(req,res,next)=>{

  try {
    let userData =  await Author.findOne({_id:req.userId})
      res.send(userData)
      
    } catch (error) {
      res.send(error.message)
      console.log(error)
      
    }
})

router.post('/settings',authenticate,uploadImage,upload,async(req,res)=>{
  let id = req.userId
  try {
  let userData = await Author.findOne({_id:id})
  let userName = req.body.userName
  let about = req.body.about
   if(req.file)
   {
    let filePath = req.file.path
    try {
      await Author.updateOne({_id:id},{$set:{avatar:filePath,userName:userName,about:about}})
      res.send("File updated Successfully")
    } catch (error) {
      res.send(error.message)
      console.log(error)
    }
   }
   else{
    let filePath = userData.avatar
    try {
      await Author.updateOne({_id:id},{$set:{avatar:filePath,userName:userName,about:about}})
      res.send("File updated Successfully")
    } catch (error) {
      res.send(error.message)
      console.log(error)
    }
   }
  } catch (error) {
    res.send(error.message)
    console.log(error)
    
  }
 
  


})
module.exports = router;
