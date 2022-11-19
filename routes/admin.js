//path
const path = require('path');
/*
// Old Way:
const conn = mongoose.createConnection(youConnectionURI);
const gfs = require('gridfs-store')(conn.db);
gfs.collection('yourBucketName');

// New Way:
const conn = mongoose.createConnection(youConnectionURI);
const gridFSBucket = new mongoose.mongo.GridFSBucket(conn.db, {bucketName: 'yourBucketName'});


*/
const mongoose = require('mongoose');
//MONGODB_URI với các biến môi trường được Express app đọc từ bên ngoài (file nodemon.json khi dev env)
const MONGODB_URI =`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@khangserver0.w0azxjp.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;
//crypto
const crypto=require('crypto');
//multer
const multer= require('multer');
//GridFsStorage, GRIDJS-STREAM
const {GridFsStorage}= require('multer-gridfs-storage');
Grid=require('gridfs-stream');
const methodOverride = require('method-override');

const express = require('express');
const Product = require('../models/product'); //ok

//const conn=mongoose.createConnection(MONGODB_URI, { useNewUrlParser: true });
//global reusable variables 
const promise=mongoose.connect(MONGODB_URI, { useNewUrlParser: true }); //trả về mongoose.Connection
const conn = mongoose.connection;
//const gidfsStore = require('gridfs-store')(conn.db); //warning: deprecated, this is not needed any more
let gfs,gridfsBucket;

////GridStore is deprecated. You can use the GridFSBucket instance to call read and write operations on the files in your bucket.
conn.once('open',()=>{
    console.log(`MongoDB connection is opened to database ${process.env.MONGO_DEFAULT_DATABASE}`);
    //conn.db is mongodb.Db instance, set when the connection is opened
    
    
    //hover sẽ thấy GridFSBucket() là constructor for a streaming GridFS interface
    //HỖ TRỢ stream hình ảnh cùng stream response tới browser (sau khi file tới được xác định là một image)
    gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: 'tailenhinhanh' //lúc này chưa thấy collection "tailenhinhanh" trong MongoDB. Bucket name phải matches với collection name
    });

    gfs=Grid(conn.db,mongoose.mongo); 
    gfs.collection('tailenhinhanh'); //lúc này chưa thấy collection "tailenhinhanh" trong MongoDB
})

//import express-validator functions
const {body} =require('express-validator/check');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

//API chứa mã yêu cầu gridFS tìm file (có thể là file nhạc, video...) có filename nào đó
//xem morgan để biết GET req có 404 hay 200
    ///nếu 404 thì lý do là thiếu /admin trên url
router.get('/files/:filename',(req,res)=>{
      
  //gfs.files.findOne({filename:req.params.['filename'])
  console.log(req.params.filename)
  gfs.files.findOne({filename:req.params.filename},(err,file)=>{
      if(!file || file.length === 0){
          console.log("Không thấy file này")
          return res.status(404).json({
              err:'No file exists'
          })
      }
      //File exists
      console.log("Đã tìm thấy file trong MongoDB")
      return res.status(200).json(file);
      //🎉http://localhost:5000/admin/files/27e9c4f2c70839ced81721d63a0168f3.PNG
  })
})

//API tìm một file hình nào đó (phải lọc ra định dạng ảnh (đều lowercase): jpg,jpeg,gif,png,svg)
  ///https://quantrimang.com/cong-nghe/tim-hieu-ve-dinh-dang-file-khi-nao-thi-dung-jpeg-gif-va-png-116533
  ///https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types
router.get('/images/:filename',(req,res)=>{
  //lấy files (txt , jpg , .doc...) rồi lọc ra các định dạng ảnh
  //dùng gfs.files cũng tương tự dùng mongoose's model
      gfs.files.findOne({filename:req.params.filename},(error,file)=>{
        if(!file || file.length === 0){
            console.log("Không thấy file này")
            return res.status(404).json({
                err:'No file exists'
            })
        }
      
      //there is a file , but not sure this is an image
      //check to make sure it's an image , then stream the mix of response and image to browser
      //image/webp
      //image/svg+xml
      //image/png
      //image/jpeg
      //image/jpg
      //image/gif
      //image/avif
      //image/apng


      //ReferenceError: file is not defined
      if(file.contentType.toLowerCase()==='image/webp' ||
         file.contentType.toLowerCase()==='image/svg+xml'||
         file.contentType.toLowerCase()==='image/png'|| 
         file.contentType.toLowerCase()==='image/jpeg'|| 
         file.contentType.toLowerCase()==='image/jpg' ||
         file.contentType.toLowerCase()==='image/gif'||
         file.contentType.toLowerCase()==='image/avif'|| 
         file.contentType.toLowerCase()==='image/apng'
      ){
          console.log("This file is an image!");
          //ứng dụng gridfsBucket để  trả về cho browser (lúc này có thể comment out cho gridfsBucket hoạt động)
          const readstream = gridfsBucket.openDownloadStream(file._id);
          readstream.pipe(res); //hòa image stream vào response stream để hướng tới browser
      }else{
          console.log("Not an image")
          res.status(404).json({err:'not an image'}); 
      }

      //DEMO:🎉 http://localhost:5000/admin/images/27e9c4f2c70839ced81721d63a0168f3.PNG
          ///thấy trả về trang toàn binary characters, nhưng khi img tag href nó thì sẽ trả ra hình ảnh rõ nét
    })
})

// /admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct);

// /admin/products => GET
//giả sử form POST tới action='/admin/products' thì cũng là http://localhost:5000/admin/products nhưng "No products found" vì method POST , giải pháp là tới POST /edit-product rồi res.redirect tới GET /admin/products
router.get('/products', isAuth, adminController.getProducts);

// /admin/add-product => POST
//thêm middleware multer để xử lý uploaded file với format multipart/form-data
//tên của input type="file" là: "image"

//storage engine
const storage=new GridFsStorage({
    //url:MONGODB_URI,
    db:promise,
    file:(req,file)=>{
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
         
          const fileInfo = {
            filename: filename,
            bucketName: 'tailenhinhanh' //bucketName should match the collection name
          };
          resolve(fileInfo); //resolve the Promise with that fileInfo
        });
      });
    }
})
const upload = multer({ storage });

//  /admin/add-product
router.post('/add-product', upload.single('image'), [
    //https://stackoverflow.com/questions/50767728/no-errors-with-express-validator-isempty
        /// vì sao khi price input có value='' thì bị msg='Invalid value' ??
    //input name with validation
    body('title')
       //.isAlphanumeric()   //nếu có validator này thì "First book" là invalid vì ở giữa có space, quy định chỉ có text và numbers
       .toString()
       .isLength({min:3})
       .trim(),
    //built-in validator that checks whether this input named "imageUrl" fulfills the characteristics of a url
    //body('imageUrl').isURL(), //VD nếu gửi file hình req.body.image vào imput's name "imageUrl" thì sẽ bị báo lỗi bằng default msg "Invalid value" do khác isUrl
       /// sau này cố ý đặt imageUrl = image.path thì isURL()= false nên không check body('imageUrl').isURL(); và Model products vẫn giữ lại imageUrl kiểu String
    body('price')
        //.isEmpty(),  //nếu price empty thiệt thì isEmpty=true thì express validator ok, nhưng mongoose model validator không ok
        .isFloat(),    //nếu price empty thì express validator thấy value="" sẽ msg='Invalid value', trước khi mongoose model validator không ok
        //to ensure that this has to have some decimal places. // isNumeric() = isFloat() + isInt()  ??
    body('description')
        .isLength({min:5,max:200})
        .trim()
    ] 
    ,isAuth, adminController.postAddProduct
);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct); 
//việc dùng /:productId cho phép router.get('/edit-product/:productId') re-render tới router.get('/edit-product')

//post /admin/add-product có upload image bằng multer và có middleware upload.single('image'). Do đó post /admin/edit-product cũng phải có vì dùng chung image field
router.post('/edit-product', upload.single('image') , [
    //https://stackoverflow.com/questions/50767728/no-errors-with-express-validator-isempty

    //title with validation
    body('title')
       //.isAlphanumeric()  //sẽ không chịu whitespace giữa các chữ
       .toString()
       .isLength({min:3})
       .trim(),

    //built-in validator that checks whether this fulfills the characteristics of a url
    //❤️body('imageUrl').isURL(),

    body('price').isFloat(),   
    //to ensure that this has to have some decimal places.
    // isNumeric() = isFloat() + isInt()  ??
    //Tuy nhiên khi không nhập gì cho "price" input thì báo lỗi. WHY??

    body('description')
         .isLength({min:5,max:1000}).withMessage("yêu cầu số chữ min 5 và max 200") //thay vì chỉ nhận mặc định "Invalid value" không biết sai ở validation nào
         .trim() // xóa các whitespace (do click thanh Space) trước và sau
    // cái khó là khi có error trong express-validator thì chỉ báo mặc định msg='Invalid value' chứ không biết sai chỗ nào

    //https://stackoverflow.com/questions/37531458/express-validator-show-only-one-validation-error-message-of-a-field
    ], 
    isAuth, 
    adminController.postEditProduct
    );

router.delete('/product/:productId', isAuth, adminController.deleteProduct);
//OK, HTTP method/verb này để delete, nhưng đó chỉ là semantic , bạn cũng dùng POST được, vi2 you can in general use any http verb to do anything because you define with your serve side logic what will happen
//But về ngữ nghĩa, it makes sense to try to be clear about your intention and there is a delete verb, we can now use it so why wouldn't we use it?
//because 'delete' http verb requests can have dynamic url parameter :productId.
//now we can extract that information from our url, không extract nó từ req.body như post verb được nữa ✍️
//sửa luôn tên của controller action vì không dùng post verb nữa, deleteProduct makes more sense 
// isAuth middleware I will keep in place though (giữ nguyên vị trí)

// DELETE /admin/images/:id
router.delete('/images/:filename',(req,res)=>{
    console.log("filename trên đường dẫn là: ",req.params.filename)
    //let file_id=mongoose.Types.ObjectId(req.params.id.trim()); 
    //Error: Argument passed in must be a single String of 12 bytes or a string of 24 hex characters
       ///Lý do: không cho filename (vvvvv.PNG) vào mongoose.Types.ObjectId được bằng cách let file_name=mongoose.Types.ObjectId(req.params.filename.trim()); 
    //Solution: Dựa vào filename trong product để liên kết tới ID của hình có filename đó
       ///https://stackoverflow.com/questions/60896129/delete-files-and-chunk-with-gridfsbucket
      
    //xóa ảnh trên MongoDB's GridFS
    gfs.files.findOne({filename:req.params.filename},(err,file)=>{
        if(!file || file.length === 0){
            console.log("Không thấy file này")
            return res.status(404).json({
                err:'No file exists'
            })
        }
        //File exists
        console.log("Đã tìm thấy file trong MongoDB");
        console.log("image muốn delete có id là: ",file._id);
        //đi vào fs.files để tìm file có id trên rồi delete
        //Kết quả: "8cdb2fc5226cec522db56d77819b1ae7.PNG" là filename cần xóa tương ứng file id là 63759833291ca411346657bf
        //xóa xong trong fs.files thì fs.chunks cũng tự xóa do có reference tới
        //💢Problem: products collection chưa xóa product có reference là imageFilename="8cdb2fc5226cec522db56d77819b1ae7.PNG"
        //🎏Solution: dùng Product mongoose model để xóa product nào có filename trên
        
        //https://www.geeksforgeeks.org/mongoose-queries-model-deleteone-api/  👉 vì sao không được?
        //https://www.geeksforgeeks.org/mongoose-findoneanddelete-function/
        //mongoose findOneAndUpdate
        gridfsBucket.delete(file._id)
                    .then(result=>{
                        console.log("đã xóa file hình"); //ok
                        console.log("filename của SP cần xóa: ",req.params.filename)
                        Product.findOneAndDelete({imageFilename:req.params.filename},function(err,doc){
                            console.log("destroyed product successfully");
                            res.redirect('/admin/products'); 
                        })
                               
                    })
                    //CÁCH 2
                    // .then(result=>{
                    //     console.log(result);
                    //     console.log("destroyed product successfully");
                    //     //res.redirect('/admin/products'); 
                        
                    // })
                    .catch(err=>{
                        console.log(err);
                    })
        
        
    })
    
    
   
    
})

module.exports = router;
