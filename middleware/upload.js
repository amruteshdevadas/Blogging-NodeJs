
const path = require('path')
const multer = require('multer')

    var storage = multer.diskStorage({
      destination: function(req,file,cb){
        cb(null,'./public/images')
      },
    
      filename: function(req,file,cb){
          let ext = path.extname(file.originalname)
          cb(null,Date.now() + ext)
      }
    })

var upload = multer({

    storage: storage,
    fileFilter:function(req,file,callback){

        if(
          file.mimetype =='image/png' ||
          file.mimetype == 'image/jpg'
        )
        {
          callback(null,true)
        }
        else{
          console.log('only jpeg allowed')
          callback(null,false)
        }
      },
      limits:{
        fileSize :1024 *1024 * 1
      }
})

exports.uploadImage =upload.single('avatar')
exports.upload = (req,res,next)=>{
 next()

}
  