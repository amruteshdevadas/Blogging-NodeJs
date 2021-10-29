const mongoose = require('mongoose')
const schema = mongoose.Schema;
const userSchema = new schema({
    _id:{
        type:String,
        required:true
    },
    userName:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    avatar:String,
    about:String
   
})

const User = mongoose.model('Users',userSchema,'users')
module.exports= User;