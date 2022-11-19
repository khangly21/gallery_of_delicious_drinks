const path = require('path'); 

require('dotenv').config();  

const fs=require('fs');//cho phép file system operations theo các dạng sync, async (callback, promise-based)
const https=require('https'); //không cần, vì deploy lên Heroku thì nó hỗ trợ hết


const express = require('express'); //create Express application

const morgan = require('morgan'); //để theo dõi luồng chạy của từng req tới, nghĩa là khi hiển thị hình thì server log ra terminal: GET /public/khoHinhPublic/image-22-08-2022-install_React.PNG 200 8.879 ms

//const bodyParser = require('body-parser'); //không cần, do chức năng này đã có trong express.urlencoded()
var cookieParser=require('cookie-parser');   //có vẻ không cần thiết

const mongoose = require('mongoose'); //1 high vulnerability ở express-session
const session = require('express-session');
//Settings object for the session ID cookie. The default value is { path: '/', httpOnly: true, secure: false, maxAge: null }.
//The following are options that can be set in this object. Example (xem Kết quả cần đạt) cookie.secure

//Lưu trữ session trên MongoDB
const MongoDBStore = require('connect-mongodb-session')(session); //https://stackoverflow.com/questions/6819911/node-js-express-js-session-handling-with-mongodb-mongoose
//⚠️Warning: default server-side session storage, MemoryStore, is purposely NOT designed for a production environment. It will leak memory under most conditions, does not scale past a single process, and is meant for debugging and developing.
//👉 List of compatible session:  https://www.npmjs.com/package/express-session#compatible-session-stores

//const csrf = require('csurf');//chống lại csrf attacks
const flash = require('connect-flash');
const methodOverride = require('method-override');
//crypto để sau này generate the unique filename. Đây cũng là core nodejs module
const crypto=require('crypto');

const helmet=require('helmet'); //helps in securing HTTP headers (https://www.geeksforgeeks.org/node-js-securing-apps-with-helmet-js/)
//node asset compression middleware 👉 https://github.com/expressjs/compression
const compression= require('compression'); //giảm khối lượng nội dung (response body) được server gửi cho client, nhưng never compress responses có Cache-Control headers

const errorController = require('./controllers/error');
const User = require('./models/user'); //WHY? vì entry point app.js là 1 big controller, do đó nó có thể gọi các controller con và model luôn

//dùng template string chứa các dynamic value (biến hay expression)
/*
  Node's process object, this is an object not defined by us but this is globally available (accessible) in the node app (it's part of the node core runtime.)
*/
/*
Now on this process object, we have the very helpful env property and that is now an object with all the

environment variables
*/
//process.env là object chứa tất cả các environment variables that Node knows
//a bunch of default environment variables but we can also set our own ones
//environment variable như process.env.MONGO_USER
//you could of course make that WHOLE connection string (phổ biến nha) an environment variable
//Nhưng cơ sở để lựa chọn là: depending on whether that string changes regularly or just the values inside of it

//const MONGODB_URI ='mongodb+srv://lyvietkhang_admin:FLC0EfhTqJHonvsI@khangserver0.w0azxjp.mongodb.net/testMongoose';
const MONGODB_URI =`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@khangserver0.w0azxjp.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;
console.log(MONGODB_URI);
//tạo conn có thể tái sử dụng để giúp gridFS 


//highlight one special environment variable. Thường các vd trên mạng sẽ cho thấy gán giá trị là "development" vào
console.log(process.env.NODE_ENV); 

const app = express();  //const app = require('express')();

//hỗ trợ DELETE có thể dùng app.delete() với form method='POST'
app.use(methodOverride('_method'))
app.use(cookieParser()); 
   //TRAP: đoạn code vừa rồi tạo cookie-parser middleware và không dùng secret nào, vì Using cookie-parser may result in issues if the secret is not the same between this module and cookie-parser. Ở đây chỉ dùng cookieparser cho việc đọc cookie
   //REALITY: session() creates a express's session middleware which now directly reads and writes cookies on req/res
   //cách dùng: https://www.geeksforgeeks.org/how-to-access-http-cookie-in-node-js/. 
   //Lưu ý cách dùng cookie-parser: việc tạo cookie middleware  cookieParser(secret, options) có thể gây issue với session về thuộc tính secret 👉 https://www.npmjs.com/package/express-session
app.use(morgan('dev'));//để dễ theo dõi đường đi của req. rất quan trọng

//tạo đối tượng ConnectMongoDBSession.MongoDBStore
const store = new MongoDBStore({
    //uri: process.env.MONGODB_URI,
    uri: MONGODB_URI, 
    collection: 'sessions'  //✍️ đối tượng cần lưu sẽ nằm trong collection "sessions". Nhưng trong source code thì đối tượng này là session
});

//const csrfProtection = csrf();

//I will read in my private key by using the node file system package
//you can read a file synchronously.  this will block code execution until the file is read . that typically, this is not what you want to do
//but here I actually don't want to continue with starting the server unless I have read that file in.
//So here I will read that file synchronously
// I want to read is server.key, fieldso my private key file.

// const privateKey=fs.readFileSync('server.key');
// const certificate=fs.readFileSync('server.cert');

//Now with these two files read in, we can scroll down to the place where we start the server with app.listen 


mongoose.set('debug', true); //Mongoose debug logging VD: signup thì mongoose sẽ log User.findById()
//mongoose was built on mongoDB driver module
//Mongoose's change tracking sends a minimal update to MongoDB based on the changes you made to the document. You can set Mongoose's debug mode to see the operations Mongoose sends to MongoDB.

//https://www.geeksforgeeks.org/how-to-setup-view-engine-in-node-js/
app.set('view engine', 'ejs'); //tự động tìm thư mục views , nên không cần thiết app.set('views', 'views');
app.set('views', path.join(__dirname, 'views')) 
console.log("Bí mật path.join : \n",path.join(__dirname, 'views')); //path.join(chứa các path to be joined) từ thư mục hiện tại (__dirname) join the relative path "views"
//app.set('views', 'views');//https://stackoverflow.com/questions/69445254/is-path-join-dirname-views-no-longer-needed-for-rendering-ejs
//path.join(__dirname, relative_path)

//Dynamic Port Setup, đòi hỏi phải có khi deploy lên HEROKU 
app.set('port', process.env.PORT || 5000);  //dạng app.set(name,value) với value mà PORT là undefined, phải có process.env

//now Hook routers up inside of Express server, then we can app.use(router)
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

//maybe helemt will be in the place where we then also set up all our other middleware
//đón incoming requests thì không có gì nói vì nó là middleware; Đáng nói là nó phải đứng trước tất cả controller trong routes vì protect với các special headers
app.use(helmet());
app.use(compression());

//req.body is not defined by default, it is used to parse encoded-in-url text (comes from form submitting) into JS object of text, cannot parse file of binary data into text inside JS object
//app.use(bodyParser.urlencoded({ extended: false })); //thay thế là app.use(express.urlencoded({ extended: false }))
app.use(express.urlencoded({ extended: false }))
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public'))); 
     //✅http://localhost:3005/bg_grass.PNG
     //✅http://localhost:3005/khoHinhPublic/bg_grass.PNG
     //🎉Lesson: tương đương application-level route (use/get/post) trong đó filename is very dynamic!

//path.join giúp tạo absolute path cho static resources, không phụ thuộc __dirname là nơi current running Node process đang ở đâu cũng được ! VD các absolute path sau src="/css/auth.css" 🧡 http://localhost:3000/css/auth.css  (Note: không liên quan gì app.use('/admin,...) vì chỗ này không server static files)
//app.use('/images',express.static(path.join(__dirname, 'images'))); //now if URL has path prefix /images, Express also serve the images static folder , Example 🧡 http://localhost:3000/images/image-22-8-2022-data_fetched.PNG
//app.use(express.static('images'));  hay app.use(express.static(path.join(__dirname, 'images'))); //NOT 🖤 http://localhost:3000/images/image-22-8-2022-data_fetched.PNG , but 🧡 http://localhost:3000/image-22-8-2022-data_fetched.PNG


app.use('/public',express.static(path.join(__dirname, 'public'))); //ĐÂY LÀ BÍ QUYẾT GIÚP DÙNG multer's path để gắn vào src

app.use(express.static(path.join(__dirname, 'images'))); 
//This technique can come in handy when providing multiple directories as static files. These prefixes can help distinguish between multiple directories.
//https://stackoverflow.com/questions/51366832/do-you-use-express-static-public-or-path-join-dirname-public
//Since you are using express.static, which is the first middleware in your code, requests that match the files in the static folder will be handled by express.static. The files in .well-known probably do not have a .json extension, hence the content type will be inferred as application/octet-stream as this is the default.


app.use(
  // tạo session chứa cookie thôi
    ///kết quả: do đó ngay từ brand-new req ĐẦU TIÊN tới the first app.use((req, res, next) 
      //// thì req LƯU biến sessionID, và đối tượng Session chứa đối tượng cookie (chưa có value nào) 
      //// khi res trang web hay cho dù res trang báo lỗi 500 thì res gửi 1 response cookie  vào browser
    /// với brand-new req THỨ HAI thì browser chủ động đọc response cookie  và gửi bản copy của cookie bên trong req  
  session({
    secret: 'my secret',  //secret used to sign the session cookie --> https://www.npmjs.com/package/cookie-parser
    resave: false, //if true, the session is forced to be saved back to session store
    saveUninitialized: false, //https://stackoverflow.com/questions/68841518/storing-sessions-with-express-session-connect-mongo-and-mongoose

    //Tại sao cần store??
    //Also if you don’t use something like redis of mongo, all your memory will get eaten up. Express-session isn’t built for production environments.
    //Dùng MongoStore để lưu session vào MongoDB
    store: store    //do đó ngay từ brand-new req tới app.use((req, res, next)  đầu tiên, đã có biến sessionStore
    //đối tượng cookie đang mang các giá trị mặc định, có thể setting mới cho nó ở đây https://www.npmjs.com/package/express-session
    //💛 cookie: { secure: true }   //mặc định cookie:{secure:null, và các thuộc tính khác} 
    //By default, the Secure attribute is not set with falsy . When truthy, the Secure attribute is set, otherwise it is not
    //💛 Please note that secure: true is a recommended option. However, it requires an https-enabled website, i.e., HTTPS is necessary for secure cookies. If secure is set, and you access your site over HTTP, the cookie will not be set. If you have your node.js behind a proxy and are using secure: true, you need to set "trust proxy" in express: app.set('trust proxy', 1) // trust first proxy
  })
);
//app.use(csrfProtection);  //tạo biến csrf trong session


app.use(flash());

//req mới, nhưng nếu tìm thấy session thì là user cũ chưa log out
//VD hành trình của user chưa đăng nhập là: GET req  '/' -->GET req  '/login' --> GET req '/admin/edit-product' --> GET req '/admin/products' --> '/login'
  /// '/' thì req A với !reqA.session.user , thì session chứa cookie đã có trên server (trên MongoDB không có req.session.user nào)
  /// '/login'thì req B với !reqB.session.user (trên MongoDB không có req.session.user nào)
  /// '/admin/edit-product' thì req C với !reqC.session.user (trên MongoDB không có req.session.user nào) nhận được nội dung trang này là "Page Not Found!" 
  /// '/admin/products' thì req D với !reqD.session.user (trên MongoDB không có req.session.user nào) [VÀ GẶP PHẢI CSRF PROTECTION TRONG FORM nên bị res.redirect tới '/login']
  /// Tiếp theo, user này quyết định đăng nhập thành công => so trùng email và tìm được model user => tạo req.session.user (với các mongoose magic methods) lẫn req.session.isLoggedIn
  /// '/' với req E , nhưng lần này đã đánh giá được req.session.user._id nên reqE.user=user aka req mới user cũ
  /// '/admin/add-product/' với req F,  đã đánh giá được req.session.user._id nên reqF.user=user  aka req mới user cũ



app.use((req, res, next) => {
  //console.log("Nếu lần đầu tới website, client chưa lưu cookie thì req chứa những gì? \n",req) 
  //hoặc xem Dev tool >> Network nhưng chỉ có request headeders
  //dĩ nhiên GET req thì body:{}

  //if là kỹ thuật tránh báo lỗi ReferenceError nếu session.user không tồn tại
      //Ngoài ra nếu session.user không tồn tại mà dùng Model để find là làm crash app

  //trước kia đã gán user cho req.session rồi req.session.save() vào CSDL thì user được lưu trong MongoStore 
  //Bây giờ không phải gán mà là truy xuất : https://stackoverflow.com/questions/51731771/node-js-how-to-save-a-users-shopping-cart-in-express-session
  
  //DĨ NHIÊN CÓ req.session vì req đi qua middleware session(), nhưng câu hỏi là có req.session.user hay không
  if (!req.session.user) {  //WHY? TRONG PHP HAY EXPRESS, TRƯỚC KHI LẤY GIÁ TRỊ BIẾN SESSION PHẢI XEM SESSION CÓ TỒN TẠI KHÔNG (cũng đồng nghĩa người dùng log out chưa)
    //TRƯỜNG HỢP 0: if (!req.session) thì app.use(cookieParser) sẽ làm stuck trình duyệt. Solution 1 là phải ghi if(!req.session.user); Solution 2 là cho app.use(cookieParser) nằm phía sau middleware chứa if(!req.session.user)
    //TRƯỜNG HỢP 1: CLIENT CHỨA COOKIE --> nếu ghi if (!req.session) thì là if(false) và không thoát hàm, bị catch lỗi TypeError: Cannot read properties of undefined (reading '_id')
    //TRƯỜNG HỢP 2: CLIENT KHÔNG CHỨA COOKIE --> nếu ghi if (!req.session) thì là if(true)
    //2 TRƯỜNG HỢP TRÊN LÀ SAI vì bất cứ req nào trước khi tới middleware này đều được express app gắn session vào req
    //how to extract cookie từ req, vì req chứa tên object là [Symbol(kHeaders)] không rõ ràng đang chứa cookie
       ///https://stackoverflow.com/questions/51812422/node-js-how-can-i-get-cookie-value-by-cookie-name-from-request

    //I TRY TO GET user OUT OF session
    //req.session.user lẫn req.session.isLoggedIn được tạo ra lúc nào? exports.postLogin nếu đăng nhập thành công
 
    //I have a solution for session.user inexistence: because if I would not add this check, then I could try to find a user without the session.user OBJECT existing and that would then crash our app . Why? nhớ lại nếu user.name thì user có mà name không có thì không crash, còn user mà undefined thì REFERENCE Error: user is not defined
    return next(); //ok, hiện không có session nào đối với máy client cookie này, thì req sẽ không được gán req.user và sẽ tới middleware kế tiếp
    //thoát hàm (nghĩa là code tiếp theo sẽ unreachable, không cho chạy ra ngoài if) và nhảy tới middleware kế tiếp
  }

  //console.log("req có chứa thuộc tính cookies?? Có, trong rawHeaders \n",req); 
  console.log("req cookie:\n",req.cookies); //ok, nhưng req.cookies là dĩ nhiên có, đâu cần cookieParser?
  User.findById(req.session.user._id)  //idea là dùng session dễ truy cập để chạy hàm Mongoose, kết quả ra mongoose model có thể thực hiện magic
    //for some reason, we might still not find that user (undefined) in database (sẽ gây app crash ?? NO vì đây không phải database technical problem , do đó có nguy cơ gây ra store undefined object trong req, khi đó console.log(req.user) sẽ gây app crash vì ReferenceError) even if we have it stored in a session, maybe because the user was deleted in a database in-between.
    .then(user => {  //Khi tìm thấy session tức là người dùng chưa logout (vì logout là session.destroy )
        if(!user){
            return next(); // we are super safe that we don't store some undefined object in the req.user (vì sẽ báo lỗi nếu undefined gọi hàm). Nhưng but that we continue without the user instead if we can't find the user (promise trả về undefine).
        }
        req.user = user; //mục đích để sử dụng Mongoose magic methods (lý do là req.session.user trên MongoDB chỉ lưu data thôi, không có lưu hàm _ thầy NTHuy cũng nói). Đời sống của session.user bắt đầu ở login thành công và được kế thừa ở ngay lúc vào trang chủ
        
        next();
    })
    //catch block với log thì  not really useful though
    //.catch(err => console.log("Đã phát hiện lỗi: \n",err)); //again we're not working with technical error objects here
    /*
        catch rất hay bắt err nên err ở đây hoặc tồn tại hoặc undefined
        because it's really important, this catch block will not fire if I don't find the user with this ID
        it will only fire if there are any TECHnical issues you could say, if the database is down or if the
        user of this app does not have sufficient permissions to execute this action.
    */
    .catch(err=>{
        //Nếu không có error object thì err is undefined 
        //Nếu có error object,  It will make more sense to throw a new error here where we simply wrap the error object we get
        //proactively Throwing this error has a significant advantage which I will show you in a second
        //trước kia tham số của builtin Error class function là 1 message string, giờ là 1 err object 
        // if we do have some technical issue regarding database, we throw a real error
        throw new Error(err);
        //Why I do like this??  as it turns out, expressjs gives us a way of taking care of such errors, that is why I'm doing it like this.
        /*
            Alternatively to error throwing, we could of course also simply call next here to continue without req.user being set (giải quyết như user undefined) or anything like that
            next()
            but I want to throw an error because we had a technical issue connecting to our database and that is something that might be a bigger problem than just a non-existing user (Tui không muốn bỏ qua nó)
       */
    })
});


app.use((req, res, next) => {
  console.log("Hi, khi vực của locals object!")
  //https://www.geeksforgeeks.org/express-js-res-locals-property/
      /// it is only available to the view(s) rendered during that request/response cycle (if any).

  //Đối tượng locals hay nằm bên trong res (xem hình trong Kết quả cần đạt)
  res.locals.isAuthenticated = req.session.isLoggedIn; //vế phải được định nghĩa tại exports.postLogin nếu đăng nhập thành công
  //res.locals.csrfToken = req.csrfToken();//nếu đang logout status mà vào /admin/add-product thì sẽ bị tới trang báo lỗi: invald csrf token
  next();
});



//ok, với client cookie có session tương ứng trên server, thì req đó sẽ có req.user 👉 có thể dùng req.user trong các controllers
//client cookie tới mà không có session tương ứng thì req không mang gói thông tin user nào
app.use('/admin', adminRoutes); //req bắt buộc phải qua absolute path "/admin" (gắn trực tiếp vào computer address http://localhost:port)
app.use(shopRoutes); //ok. các anh req không có req.user có thể vào Shop để tham quan. còn chuyện add-to-cart sẽ bị middleware is-auth chặn lại, thậm chí xử lý hiển thị theo role không cho xem option Add Product nhưng anh req_no_user nào cố gắng gõ /admin/add-product cũng sẽ bị is-auth chặn lại
app.use(authRoutes);

//maybe helemt will be in the place where we then also set up all our other middleware
//đón incoming requests
//app.use(helmet()); 👈⚠️ Vị trí này là sau các response của các controllers , kết quả là res header không có headers đặc biệt nào của helmet! 😎

//res.redirect('/500');. Mấy anh middleware này hay bắt lỗi nên code để cuối 



//xử lý lỗi là bởi các middlewares cuối cùng
app.use('/500',errorController.get500); //vì sao có path prefix /500 hay không có thì vẫn không tới get500 được??
app.use(errorController.get404);

//middleware error handler
// app.use((err,req,res,next)=>{
//   console.log("I got exception")
//   res.status(err.status || 500);
//   res.render('error',{
//       message: err.message,
//       error:err
//   });
// })  


/*
First, we need to define a connection. If your app uses only one database, you should use mongoose.connect. If you need to create additional connections, use mongoose.createConnection.

Both connect and createConnection take a mongodb:// URI
*/

mongoose
  //.connect(process.env.MONGODB_URI)
  .connect(MONGODB_URI)
  /*
  //https://fatihkalifa.com/express-crash-mongodb-fix
  I didn't know that mongoose.connect returns an object with connection property that behaves like EventEmitter. This connection property can listen to various events like error, disconnected, and open.
  */
  .then(result => {
    //nếu process.env.PORT undefined thì mặc định lấy 3000
    //khi server cần đọc private key và certificate định danh của mình
    //không dùng app.listen nữa
    //dùng https.createServer to create a https server, this function takes 2 arguments: 
        ///2 arguments
        /// the first one configures the server
            //// here we have to point it at our private key
            //// a javascript object where you need to set two things:
                ///// privateKey
                ///// certificate
        /// the second argument will be our request handle
            ////in our case our express application
    // https.createServer({key:privateKey , cert:certificate},app)
    //      .listen(app.get("port"),function(error){ //nếu .listen(port) thì ReferenceError (thường thấy cho biến let bị gọi mà trước đó chưa được gán giá trị nào hết): port is not defined
                app.listen(app.get("port"),err=>{
                  if(err) throw err;
                
                  console.log("Express app has just been listening on port: "+app.get("port"))
                }); 
                
          //});
          //https://www.geeksforgeeks.org/how-to-setup-view-engine-in-node-js/
          //Kết quả: http://localhost:3000/ sẽ The page is not working vì http
  })
  .catch(err => {
    //https://stackoverflow.com/questions/50241066/how-to-get-node-to-exit-when-mongo-connect-fails
    console.log("we found some error: \n",err); //Không bắt lỗi app mà bắt lỗi mongooseConnection, do đó trong app.listen phải thực hiện error handling
    process.exit(1);  //I've already handled the error case by exiting the process if there is an error. So if there is an error, the app will quit
  });
