var express = require("express");
var router = express.Router();
var Author = require("../models/Authors");
var bcrypt = require("bcrypt");
var jwt = require('jsonwebtoken')
const {upload,uploadImage} = require('../middleware/upload')
require('dotenv').config()
var sendEmail = require("../utils/SendEmail");
var Token = require('../models/TokenModel')
// var cloudinary = require('../utils/Cloudinary')
var cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: `${process.env.CLOUDINARY_NAME}`,
    api_key: `${process.env.CLOUDINARY_API_KEY}`,
    api_secret: `${process.env.CLOUDINARY_API_SECRET}`,
});


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

router.post('/settings',authenticate, async(req,res)=>{
  let id = req.userId
 const{avatar,about,userName}= req.body.data
try 
    {
      if(avatar)
      {
          try {
            const uploadResponse = await cloudinary.uploader.upload(avatar, {
              upload_preset: 'blogging',
          });
          console.log(uploadResponse);
          var imageLink = uploadResponse.url
          } catch (error) {
            console.log(error.message)
          }
        }
      await Author.updateOne({_id:id},{$set:{about:about,userName:userName,avatar:imageLink}})
      res.send("Updated Successfully")
}
catch (error) {
    res.send(error.message)
    console.log(error) 
  }
 
})

router.post("/forgetPassword", async (req, res, next) => {
  let token =""
  try {
    let user = await Author.findOne(
      { _id: req.body.id },
      { userName:0 }
    );

    if (user) {
      //user found then generate a token and send in mail and save it in db for checking in future
      try {
        let userToken = await Token.findOne(
          { _id: req.body.id },
          { token:1,_id:0}
        );
        if(userToken.token)
        {
          token = userToken.token
          console.log("im from already exited token")
  
        }
      } catch (error) {
        token = jwt.sign({ _id: req.body.id }, `${process.env.ENCRYPYION_KEY}`);
        const userToken = new Token({
          _id: req.body.id,
          token: token,
        }).save();
        console.log("im from new token")
        
      }
      const link = `${process.env.BASE_URL}/authors/password-reset/${user._id}/${token}`;

      console.log(link)
      await sendEmail(user._id, "Password reset", link);
      res.send("password reset link sent to your email account");

    } else {
      res.status(500).send("user Not Found..!!");
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error.message,
    });
  }
});


router.post("/password-reset/:userId/:token", async (req, res) => {
  const userId = req.params.userId;
  const token = req.params.token;
  const password = req.body.password;
  console.log(token)
  try {
    let user = await Token.findOne({ _id: userId });
    if (user) {
      let compareToken = (user.token == token)
      console.log(compareToken)
      if (compareToken) {
        // change the password of the user..
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt);
        req.body.password = hash;
        let passChange = await Author.findByIdAndUpdate(
          { _id: userId },
          { password: req.body.password }
        );
        res.json({
          message: "Password changed..!!",
        });
      }
    }
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message);

  }
});

module.exports = router;
