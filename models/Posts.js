const mongoose = require("mongoose");
const schema = mongoose.Schema;
const postSchema = new schema({
  author: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  createdAt:{
      type:String,
      required:true
  },
  likes: [
    {
      type:String,
      ref:"Author"
    } 
  ],
  comments: [
    {
      userName:String,
      userComment:String
    }
  ],
});

const Post = mongoose.model("Posts", postSchema, "posts");
module.exports = Post;
