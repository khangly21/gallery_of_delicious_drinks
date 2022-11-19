const mongoose=require('mongoose'); //What is this doing?

const fileHelper= require('../util/file');

const Product = require('../models/product');

const {GridFsStorage}= require('multer-gridfs-storage');
Grid=require('gridfs-stream');
//MONGODB_URI với các biến môi trường được Express app đọc từ bên ngoài (file nodemon.json khi dev env)
const MONGODB_URI =`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@khangserver0.w0azxjp.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;
const promise=mongoose.connect(MONGODB_URI, { useNewUrlParser: true });
const conn = mongoose.connection;
let gfs,gridfsBucket;
conn.once('open',()=>{
  console.log(`MongoDB connection is opened to database ${process.env.MONGO_DEFAULT_DATABASE}`);
  //conn.db is mongodb.Db instance, set when the connection is opened
  
  gfs=Grid(conn.db,mongoose.mongo); 
  gfs.collection('tailenhinhanh');


  //THIẾU ANH NÀY là gfs.files.find() không tìm ra array này, trả chuỗi json "No files exists OR no file in array"
  gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
      bucketName: 'tailenhinhanh' //lúc này chưa thấy collection "tailenhinhanh" trong MongoDB. Bucket name phải matches với collection name
  });
});


//Destructure ‘validationResult’ function from express-validator to use it to find any errors.
const {validationResult}=require('express-validator/check'); //chú ý, trong route thì vế trái đặt là {body} để validate các fields trong req.body

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError:false,
    errorMessage:null,
    validationErrors:[]
  });
};

exports.postAddProduct = (req, res, next) => {
  //Note: multer tạo ra body object (chứa các dữ liệu text) và file/files object (chứa các dữ liệu file). Tất cả được gắn vào req object. Do đó có req.body và req.file hay req.files 
  //const phan_than_yeu_cau=req.body; //lý do là  vế phải không được dấu ".", nhưng dùng spreadOperator

  // we are extracting data from the incoming requests, lưu ý req.body chứa biến có tên của input
  const {title,price,description}={...req.body};  //cách viết 1 này nhìn khó hiểu, nhưng vẫn ra KQ
  //trước khi tới được controller này, thì hình đã được lưu trong MongoDB bởi middleware router.post('/add-product', upload.single('image')
     ///👉 Problem: https://stackoverflow.com/questions/9821499/how-to-query-for-files-in-gridfs-and-return-only-the-last-uploaded-version
     /// Solution: Thử trích phần tử cuối cùng với gfs.files.find().toArray((err,files)=>{
  
  console.log("gfs.files : ",gfs.files);
  console.log("gfs.chunks : ",gfs.chunks);
  console.log("gridfsBucket.files : ",gridfsBucket.files);
  
  //see the latest updated MongoDB GridFS:👉 https://www.mongodb.com/docs/drivers/node/current/fundamentals/gridfs/
  
  const cursor = gridfsBucket.find({}); //TRẢ VỀ CURSOR
  console.log("Có tất cả: ", cursor.length) //undefined
  //🎁SOLUTION đếm số phần tử của cursor: https://www.mongodb.com/docs/manual/reference/method/cursor.count/
  console.log("Có tất cả: ", cursor.count()," phần tử");
  cursor.count().then(number=>console.log("CURSOR.COUNT() thấy có tất cả: ", number," phần tử"))
  cursor.forEach(file_metadata =>{
    console.log("MY DOC:",file_metadata)
  });
  console.log("The last doc is: ",cursor[cursor.length-1]); //undefined
  const cursor2 = gridfsBucket.find({}).sort({_id:-1}).limit(1)
  console.log("cursor2",cursor2.filename);//undefined
  //console.log("Last doc: ", cursor.sort({"_id":-1}).limit(1))
  //MongoError: Cursor is closed https://www.mongodb.com/docs/manual/reference/method/cursor.close/
    ///https://stackoverflow.com/questions/12098815/mongodb-sort-order-on-id
    ///https://www.tutorialspoint.com/mongodb-query-to-find-last-object-in-collection
  //https://www.mongodb.com/docs/manual/reference/method/js-cursor/
   

  gfs.files.find().toArray((err,files)=>{
      if(!files || files.length === 0){
          return res.status(404).json({
              err:"No files exists OR no file in array"
          });
          //Error ở chỗ: nếu !files thì return và nhận được {"err":"No files exists OR no file in array"}
              ///nhưng return này không làm thoát controller, nên sẽ tiếp tục create product và res.redirect('/admin/products');
              //Nên báo lỗi chỗ res.redirect: Cannot set headers after they are sent to the client
      }

      console.log("mảng files là: ",files);

      //express validators
  const errors=validationResult(req);   //VALIDATION ERROR COLLECTING 🧠

  //if there is error, VALIDATION ERROR RETURNING  🧠
  if(!errors.isEmpty()) { //CHÚ Ý: errors không là mảng và isEmpty() không là native function của mảng
    //console.log("postAddProduct errors in fields:\n",errors.array());
    //I render the view again (re-render)
    //validation-failed responses
    return res.status(422).render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false, //we are not editing product
        
        //do postAddProduct có biến product2 nên postEditProduct phải có
        product2:{title,price,description}, //gán destructured object vào biến product2. Chú ý phía trên là gán literal object vào product1
        hasError:true,  // postAddProduct with hasError=true, that simply means that I should ensure that hasError=false is also set in other places where I render this page, like in getAddProduct,getEditProduct
        errorMessage:errors.array()[0].msg, //defalt error msg là 'Invalid value'
        validationErrors:errors.array()
    });
  } 

  const image=req.file; //mỗi upload hình tương ứng req riêng rẽ
  console.log("req.file là: ",image); //có chứa filename là sản phẩm của multer gridfs luôn, do đó không cần yêu cầu cursor tìm cho ra SP vừa post lần cuối là gì
  console.log("req.file cho biết filename của hình tương ứng, từ đó có thể là nguyên liệu cho EJS để ghép vào URL để có binary data cho vào img HTML tag: ",image.filename)

  //gọi Class function để tạo instance mới
  const product = new Product({
        title: title,
        price: price,
        description: description,
        imageFilename: image.filename, //lấy filename trong MongoDB, database healthyproducts, để đưa tới view hiển thị img href="/admin/images/filename"
        userId: req.user  //sẽ chỉ trích id của user thôi
  });

  product
      .save() //Hiển thị được và CSDL Lưu được product có imageUrl:"public\uploads\hinh\image-21-8-2022-EBADF error.PNG"
      .then(result => {
        // console.log(result); //undefined
        console.log('Created Product on MongoDB');
        return res.redirect('/admin/products'); //the point is: Có cần mảng products để gửi cho view 'admin/products' không?? Không vì đang yêu cầu client gọi http://localhost:3000/admin/add-product được xử lý logic bởi exports.getProducts controller action , which send server information 'products' to view 
                                      
      })
      .catch(err => {
          console.log("OH, I HAVE CAUGHT AN ERROR: \n",err); 
          return res.redirect('/500');
      });
      
  })
  
  
  
  
};

//Sec13 - 216/Updating products
//First, getEditProduct shoud load a product to form with /:productId

//cách làm cũng như postAddProduct
exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    //khác true
    return res.redirect('/');
  }

  //the popular req.params nhằm trích productId từ '/admin/edit-product/:productId'
  const prodId = req.params.productId;

  console.log("prodId của getEditProduct:\n", prodId);//ok sau khi nhấn nút Edit

  //từ đó tìm ra product 
  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }

      //re-render view 'admin/edit-product', nhưng lần này không có /:productId so với trong admin>>products.ejs hay /admin/products rồi nhấn nút Edit
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',  //chỉ để CSS hightlight menu
        editing: editMode,
        //product: product, //ok, không báo lỗi CastError: Cast to ObjectIf failed for value "" (type string) at path "_id" for model "Product", do gán được product._id vào view
        product2:product,  //editing=false thì chưa submit product2._id; nhưng vẫn gán vào nếu không view báo lỗi
        hasError:false,
        errorMessage:null,
        validationErrors:[] // because we have no errors here when we just get the page, here we do not collect errors
      });
    })
    .catch(err => console.log(err));
};

exports.postEditProduct = (req, res, next) => {
  //Nhận thông tin từ body object và file object của multer middleware
  //Làm object destructuring thì khó kiểm soát
  const productId= req.body.productId        //đây là hidden input có name="productId"
  const updatedTitle= req.body.title         // field name="title"
  const updatedPrice= req.body.price         // field name="price" 
  const updatedDesc= req.body.description          // field name="description" 
  console.log("productId,updatedTitle,updatedPrice,updatedDesc:",productId,updatedTitle,updatedPrice,updatedDesc);//có phải tất cả undefined nếu không edit anh nào?? Không vì chúng có giá trị mặc định rồi


  const image=req.file; //có thể undefined 
  console.log("req.file mà postEditProduct nhận được là: ",req.file);//undefined nếu không edit hình, chỉ edit các thông tin còn lại
  //Tuy nhiên khi edit, không phải lúc nào incoming req cũng mang req.file vì không có hình mặc định để truyền lên
      /// VD khi muốn edit tên SP thôi, còn image thì giữ nguyên hình. Lúc đó image aka req.file sẽ undefine 
      /// Sẽ ảnh hưởng product.imageFilename = image.filename;  với báo lỗi failed reading undefined (reading filename)

  console.log("prodId là: \n",productId);// undefined là do extract sai input name? thực ra là do các input fields gửi dữ liệu xong là undefined hết vì thiếu upload.single('image') bên trong router

  const errors=validationResult(req);   //VALIDATION ERROR COLLECTING 🧠

  //NẾU CÓ LỖI XÁC THỰC, SẼ BỊ TỚI TRANG http://localhost:5000/admin/edit-product VỚI VIEW "admin/edit-product"
  //if there is error, VALIDATION ERROR RETURNING  🧠 , nói cách khác là re-render 'admin/edit-product'
  if(!errors.isEmpty()) {
      console.log("fetching postEditProduct errors in fields:\n",errors.array()); //Demo không ghi gì mà submit, thì mảng chứa các phần tử value:undefined , và msg:"Invalid value" hiện trên trang web luôn
       
      //từ view 'admin/edit-product' của getEditProduct nhấn Edit mà bị validation error thì phải re-render 'admin/edit-product'
      //validation-failed responses
      return res.render('admin/edit-product', { //re-render
            pageTitle: 'Edit Product',
            path: '/admin/edit-product',
            editing: true, //we are editing product
            product2:{productId,updatedTitle,updatedPrice,updatedDesc},
            hasError:true,  // postEditProduct with hasError=true, that simply means that I should ensure that hasError=false is also set in other places where I render this page, like in getAddProduct,getEditProduct
            errorMessage:errors.array()[0].msg, //default error msg là 'Invalid value' khi missing một field nào đó, cũng giống như mongoose model validator không cho missing thuộc tính nào trong schema
            validationErrors:errors.array()
      });
  }

  //Ok i have passed validation!
  //Dùng productId để load model product thỏa điều kiện, sau đó save() thì If you load an existing document from the database and modify it, save() updates the existing document instead
  
  //Mongoose (but not mongo) can accept object Ids as strings and "cast" them properly for you
  //Khi postEditProduct hay gặp 2 lỗi chính
      ///"Invalid value" nghĩa là description có lượng từ vượt quá, nên expess-validation  mặc định báo lỗi
      /// 💢 Cast Error: 
         ////🍒 Solution1:  Product.findById(mongoose.Types.ObjectId(productId)) (https://stackoverflow.com/questions/17223517/mongoose-casterror-cast-to-objectid-failed-for-value-object-object-at-path)
         ////🍒 Solution2:  Bỏ luôn expressValidator cho "description", lúc này chạy tốt với Product.findById(productId)


  Product.findById(mongoose.Types.ObjectId(productId))
      .then(product => {
              if (product.userId.toString() !== req.user._id.toString()) {
                return res.redirect('/');
              }
              //dùng gfs tìm tailenhinhanh.files ra hình nào có thuộc tính filename là product.imageFilename, tương tự lúc Delete hình với router.delete('/images/:filename'
                  ///cần gfs và gridfsBucket ✅
              //Nếu có req.file tới thì nếu user muốn update hình, thì hình cũ liên kết với product phải được bỏ
              if(image){
                  //dùng imageFilename của hình không cần hiện nữa để xóa file có filename trùng imageFilename
                  gfs.files.findOne({filename:product.imageFilename},(err,file)=>{
                        if(!file || file.length === 0){
                            console.log("Không thấy file này")
                            return res.status(404).json({
                                err:'No file exists'
                            })
                        } 
                        //File exists
                        console.log("Đã tìm thấy file trong MongoDB"); //ok
                        console.log("image muốn delete có id là: ",file._id);
                        gridfsBucket.delete(file._id)
                              .then(result=>{
                                  console.log("đã xóa file hình"); //ok
                              })
                              .catch(err=>console.log(err));
                  })

                  //Nếu người dùng upload hình mới thì mới cập nhật
                  product.imageFilename = image.filename; 
                }
              

                  //từ req.file nhận được, có thể cập nhật imageFilename cho product
                  product.title = updatedTitle;
                  product.price = updatedPrice;
                  product.description = updatedDesc;

                  
                  

                  //😈PROBLEM: khi người dùng không muốn update hình, thì req.file undefined thì không hình nào được cập nhật , trong khi hình cũ bị bỏ đi. Khi đó display không có hình nào hết

                  

                  //cập nhật những thay đổi vào CSDL
                  //https://masteringjs.io/tutorials/mongoose/update
                  //save() is a method on a document, which means you must have a document to save
                  return product.save().then(result => {   
                    console.log('UPDATED PRODUCT!');
                    res.redirect('/'); // '/admin/products' sẽ thấy nhiều console log nên khó theo dõi
                  })
              })
              .catch(err => console.log(err))
}            

exports.getProducts = (req, res, next) => {
   //Bạn có thể thực hiện .skip(req.query).limit() chỗ này để tính toán phân trang giúp giảm lượng lớn dữ liệu 10000 SP đổ vào làm người dùng chờ lâu
  Product.find({ userId: req.user._id })//VD: tài khoản email vietkhang92@gmail.com chưa tạo products nào, nên trang Admin products báo No products found!, còn tài khoản test3@test.com 123456 tạo rất nhiều sp nên Admin Products hiển thị chúng
    // gives us the documents and not just a cursor 
    // .select('title price -_id')
    // .populate('userId', 'name')
    .then(products => {
      console.log("products sẽ trình bày ở trang /admin/products",products);
      res.render('admin/products', {
        products: products,
        //imageFileName không cần vì nó có trong từng product
        pageTitle: 'Admin Products',
        path: '/admin/products'
      });
    })
    .catch(err => console.log(err));
};

exports.deleteProduct = (req, res, next) => {
  // với http delete verb thì Không extract productId từ req.body được nữa because delete request as it turns out also are not allowed to have a request body
  //We cannot send it in the request body because delete requests don't have a body
  const prodId = req.params.productId;
  //logic here afterwards will still work,

  //xóa SP thì xóa luôn hình ảnh của product đó trên server trong public/khoHinhPublic
    ///bằng cách gọi hàm async , dĩ nhiên phải theo sau là then().catch(), nếu không dễ gặp Promise<pending>
  Product.findById(prodId)
         .then(product=>{
            //nếu không tồn tại product thì chủ động tạo một error object đi kèm error message
            if(!product){
              //cho control của chương trình tới controller kế tiếp và thoát hàm controller này (không trở lại thực thi code phía sau nữa, vì bình thường sau dòng next() sẽ thực thi các dòng tiếp theo next)
              return next(new Error("Product not found!"))
            }
            //xóa hình tương ứng của SP muốn xóa
            fileHelper.deleteFile(product.imageUrl) //gọi hàm ASYNC fs.unlink(filePath). Khi nào thực thi xong deleteFile thì không quan trọng, hàm này trả ra void chứ không trả ra Promise; nếu tìm thấy file trong public thì xóa, không thấy thì thoát hàm bằng lệnh 'return;'
            //cứ return bằng cách gọi hàm async deleteOne xóa SP trong CSDL : 
            //I delete the image and I Simultaneously start deleting the product itself.
            return Product.deleteOne({ _id: prodId, userId: req.user._id }); //điều này đảm bảo tìm Product.findById được thì xóa và thoát hàm , không được thì thoát hàm với msg "Product not found". Hàm này trả ra Promise
            /*
                🎉I should only trigger delete one here after I found this
                otherwise we have a race condition where deleting could finish before finding is finished and that would
                be bad.

                💢Problem: đang gọi hàm async Product.findById(prodId).then().catch() ngang cấp (không biết hàm nào sẽ ra kết quả trước-sau) hàm async Product.deleteOne({ _id: prodId, userId: req.user._id }).then().catch()

                🍒Solution (*): Product.findById(prodId).then(capturedProduct=>{ return Product.deleteOne({ _id: prodId, userId: req.user._id }); } ).catch()
            */

                /*
                  💢 Common trap: Solution (*) đang sai lỗi kỹ thuật và sẽ bị báo lỗi Promise<pending>
                  ❤️ Lý do: You must call .then on the promise to capture the results regardless of the promise state (resolved or still pending). The promise will always log pending as long as its results are not resolved yet.
                     /// tương đương  const variable = async deleteFile(path);  hoàn toàn không có then() sẽ bị server logs ra Promise<pending> 
                     /// Thật ra nên là const variable = await deleteFile(path); sau đó xử lý tiếp variable.then(result=>{})?? hoặc mảng thì variable.foreach((doc)=>{}) , vì https://stackoverflow.com/questions/62402475/assign-async-function-result-to-variable
                     /// tầm quan trọng của keyword "await": https://stackoverflow.com/questions/53813344/assigning-result-of-async-method-to-a-variable
                        //// ❤️ If you don't put await execution of existing method will continue regardless of your async method's completion status
                        ///// if you need to wait for some async operation to be completed before continuing the current method you should put await
                  🍒 Solution: https://damaris-goebel.medium.com/promise-pending-60482132574d 
                               https://www.appsloveworld.com/csharp/100/1069/why-await-an-async-function-directly-not-work-without-assigning-it-to-a-task-vari      

                */
         })
         .then(() => {
              console.log('DESTROYED PRODUCT');
              //res.redirect('/admin/products');//we redirect back to admin products which is a route which will return a new html page.
              //💢Nhược điểm: chỉ có delete SP mà load toàn bộ trang web, nói cách khác là new html file 
                 ///hoàn toàn có thể làm vầy nhưng sẽ ảnh hưởng UX
              //🍒Solution: qua Lab20.1 sẽ giải quyết trao đổi json thôi, chứ không load cả HTML page
              //I will not redirect anymore because I'll not load a new page
              //Remember that the request triggering this action will be sent behind the scenes for the existing page, so I want to keep that existing page and therefore my response will be a response where I send json data.
              //Json data is a special format and with expressjs, I can use a json helper method to conveniently return json data and json is simply a data format that looks like a javascript object,
              //we can also set a status here of 200 maybe because for json data, this would be the default too but there since we don't redirect it and so on, where we get a status code set automatically, it would make sense to be very clear about the status code we have
              res.status(200).json({
                  message:'Success! Please note that the page was NOT reloaded, instead the existing page was updated!'
              });
              //Mục tiêu chính vẫn là : I'll also return some json data, the question is of course which data. You simply pass a javascript object here which will then be transformed to json automatically for you
               
         })
         .catch(err=>{
              //default err handler
              // const error=new Error(err);
              // error.httpStatusCode=500;
              // return next(err);

              //I'll also not to use my default error handler above where I would load the 500 page
              //https://www.geeksforgeeks.org/http-status-codes-server-error-responses/
              //Basically, you have to identify what http statusCode should be sent from server based on your outcome of the execution.
                ///https://stackoverflow.com/questions/58288268/how-to-get-error-status-code-from-error-object
              
              //I'll also return some json data
              res.status(500).json({message:"Deleting product failed"});
         });

         //So now I have that in place and now we have two important changes,
             ///this is how we extract the params or the product ID: const prodId=req.params.productId
             /// and now we return json responses because we don't want to render a new page, we JUST WANNA RETURN SOME DATA: res.status(200).json({}) và res.status(500).json({})
}
