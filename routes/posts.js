var express = require("express");
var router = express.Router();
require("dotenv").config();
var jwt = require("jsonwebtoken");
var Post = require("../models/Posts");
var cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: `${process.env.CLOUDINARY_NAME}`,
    api_key: `${process.env.CLOUDINARY_API_KEY}`,
    api_secret: `${process.env.CLOUDINARY_API_SECRET}`,
});

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
router.post("/createPost", authenticate, async (req, res, next) => {
  try {
    const { title, image, content } = req.body.newPost;
    console.log(req.body.newPost);
      try {
        const uploadResponse = await cloudinary.uploader.upload(image, {
          upload_preset: 'blogging',
      });
      console.log(uploadResponse);
      var imageLink = uploadResponse.url
      } catch (error) {
        console.log(error.message)
      }
    let post = new Post({
      author: req.userId,
      image: imageLink,
      title: title,
      content: content,
      createdAt: new Date(),
    });
    await Post.collection.insertOne(post);
    res.send("Post Successfully Added");
  } catch (error) {
    // res.send(error.message);
    console.log(error);
  }
});
router.get("/myposts", authenticate, async (req, res, next) => {
  try {
    let userId = req.userId;
    console.log(req.userId);
    let userPosts = await Post.find({ author: userId });
    res.send(userPosts);
  } catch (error) {
    res.send("NO Posts..");
  }
});

router.get("/getpost", async (req, res, next) => {
  let postId = req.headers.id;

  try {
    let post = await Post.findOne({ _id: postId });
    res.json({
      post,
    });
  } catch (error) {
    res.send(error.message);
    console.log(error);
  }
});

router.put("/editpost", async (req, res, next) => {
  let postId = req.body.id;
  const { title, image, content } = req.body.editedPost;

  try {
    await Post.updateOne(
      { _id: postId },
      { title: title, image: image, content: content, createdAt: new Date() }
    );
    res.send("Succesfully Edited the post");
  } catch (error) {
    consoele.log(error);
    res.send(error.message);
  }
});

router.delete("/deletePost", authenticate, async (req, res, next) => {
  let postId = req.headers.id;
  console.log(postId)

  try {
    await Post.deleteOne({_id: postId });

    res.send("Post Deleted");
  } catch (error) {
    res.send(error.message);
    console.log(error);
  }
});

router.get("/getAllPosts", async (req, res, next) => {
  try {
    let posts = await Post.find({});
    res.send(posts);
  } catch (error) {
    res.send(error.message);
    console.log(error);
  }
});

router.post("/likePost", authenticate, async (req, res, next) => {
  let id = req.body.id;
  console.log(req.userId)

  try {
    let post = await Post.find({ _id: id });
    console.log(post[0].likes)

    if (post[0].likes.length>0) {
      let likesArray = post[0].likes;
      console.log(likesArray)
      let user = likesArray.find((like) => {
        return like === req.userId;
      });

      console.log(user)
      if (user) {
        res.send("Post Already Liked");
      } 
      else {
        await Post.updateOne({ _id: id }, { $push: { likes: req.userId } });
        res.send("Post Liked");
      }
    }
    else{
      await Post.updateOne({ _id: id }, { $push: { likes: req.userId } });
        res.send("Post Liked");
    }
  } 
  catch (error) {
    res.send(error.message);
    console.log(error);
  }
});

router.post("/commentPost", authenticate, async (req, res, next) => {
  let id = req.body.id;

  let comment ={
    userName : req.userId , 
    userComment:req.body.comment
  }
  console.log(comment)

  try {
    let post = await Post.find({ _id: id });
    console.log(post[0].comments)

    if (post[0].comments.length >0) {
      let commentsArray = post[0].comments;
      console.log(commentsArray)
      let user = commentsArray.find((comment) => {
        return comment.userName == req.userId;
      });

      console.log(user)
      if (user) {
        res.send("Post Already Commented");
      } 
      else {
        await Post.updateOne({ _id: id },{ $push:{ comments: comment}});
        res.send("Post commented");
      }
    }
    else{
      await Post.updateOne({ _id: id }, { $push:{ comments:comment }});
        res.send("Post commented");
    }
  } 
  catch (error) {
    res.send(error.message);
    console.log(error);
  }
});



module.exports = router;
