const fs=require("fs"); //Node process's file system. This is the core node module (you do not have to npm install)
//Node core =  don't need to install a package it's already included in node 
//another node core module
const path=require("path");

const PDFDocument= require('pdfkit');//Actually pdfkit exposes a pdf document constructor, do đó tui không đặt biến tên pdfKit mà là pdfDocument (closer to what this package really exposes)
//turns out to be a readable stream

const Product = require('../models/product');
//const Order = require('../models/order');
const Dich_vu_san_pham=require('../services/productService');
const Dich_vu_don_hang=require('../services/orderService');

//sử dụng pdfkit
//tạo a readable stream , do đó có thể được write vào server và vào response object
const pdfDoc=new PDFDocument(); 
//tiếp, save pdf file in root directory




//Note: MVC controller/endpoint handler named shopController which contains many public/exports endpoint actions which returns presentational information (not JSON data like Web API Controllers)
exports.getProducts = (req, res, next) => {
  //Product.find()
  // Dich_vu_san_pham.tim_co_dieu_kien({}) //empty document, bắt buộc có do dịch vụ yêu cầu tham số
  //   .then(products => {
  //     console.log(products);
  //     res.render('shop/product-list', {
  //       prods: products,
  //       pageTitle: 'All Products',
  //       path: '/products'
  //     });
  //   })
  //QUERY PARAMETER từ action getIndex and I can use that data/number on the BACKEND to control which data I want to fetch
  const page=+req.query.page || 1; //nếu GET req trang http://localhost:3000/ thì page = undefined khi đó nextPage=page+1=undefined+1=NaN hiển thị trực tiếp trên nút phân trang. 
  /*
      this means if this is undefined or if this does not hold a true-ish value, then we'll use this page=1 instead, khi đó né được nút phân trang mang giá trị NaN
  */
  console.log("Với GET req này thì page có giá trị: ",page); //trang http://localhost:3000/  thì page is undefined, khi đó skip=NaN 👉 xem Mongoose debug ở terminal
  console.log("typeof page là gì?",typeof(page)); //trong "/" thì undefined , còn trang /?page=1 thì type là 👉 string 
  //với + trước req.query.page thì http://localhost:3000/?page=1 thì có page=1 type number, lúc này skip:0 và limit:2

  //const totalItems; //💢Syntax Error: mussing initializer in const declaration . Synk: 'const' declaration must be initialized -->💊 Solution?
  let totalItems;

  //with that number, we just need to define how many items should be displayed per page
     /* 
        *** Cách 1 (tui chọn)--> store as a global constant in this file
        *** Cách 2 --> store it in a different file, export it there and import it here
     */

  const ITEMS_PER_PAGE =2; //WHY?it should be some number lower than the number of items you have here (I got 3 products shown) so that you can see a difference.
  /* if I'm on page one want to fetch the first two items,

     if I'm on page two, I want to fetch items three and four, on page three I would fetch four and five and so on. 
  */
  /* PROBLEM: Product.find() right now gives us all the items but we can actually control this */
  /* SOLUTION:  In mongodb and therefore also mongoose, there is a skip function . We can add this on a cursor and find does return a cursor to skip the first X amount of results  */
     ///https://www.mongodb.com/docs/manual/reference/method/db.collection.find/#std-label-crud-read-cursor
        //// The cursor.skip() method controls the starting point of the results set. The following operation skips the FIRST 5 documents in the bios collection and returns all remaining documents: db.bios.find().skip( 5 )

  //Product.find()  //đầy đủ hơn là Product.find({}) trả về 1 cursor chứ không phải mảng 

  /* The important thing is I don't need catch because I'll concatenate my other promise chain later, */
  /*  important thing here is this will now not to retrieve all the products but simply just a number */
  Product.find().countDocuments()
         .then(numProducts=>{//must have argument expression
              //number of products is what I get back in this then block function here
              totalItems=numProducts;
              //kick off my normal find method where I then really fetch the items and I skip and limit them
              return Dich_vu_san_pham.tim_co_dieu_kien_de_phan_trang({},page,ITEMS_PER_PAGE)    //empty document, bắt buộc có do dịch vụ yêu cầu tham số     
         })
         .then(products => { //products có thể undefined
             console.log(JSON.stringify(products)); //imageUrl="images\image-22-8-2022-data_fetch.PNG". Tại sao static file là images nhưng lại xuát hien ? xem req.file.path thấy path="images\\image-22-8-2022-data_fetch.PNG"
             res.render('shop/product-list', {
                  prods: products, //nếu products undefined thì Javascript bên view sẽ thông báo "No product found!", đặc biệt dễ thấy trong phân trang khi nhập ?page=100. Do đó cần các nút trang để tăng UX 
                  //not just products, but also the number of products 
                  pageTitle: 'Products',
                  path: '/products', //item gets marked in the navigation.
                  /* ------------------💙--------------------- */
                  currentPage: page, //vế phải là string
                  /* so that I always know what's the currently active page */
                  // return/pass the information whether there is a next page
                  /* will be the case if the total number of items is greater than the page we are on times the items per page */
                  /* we have a next page if items per page times page is smaller than total items because if we have 10 total items and we are on page 4, then we have 2 times 4, 8 items which we are seeing. So there will be a next page */
                  hasNextPage:ITEMS_PER_PAGE*page<totalItems,
                  /* return the information whether the current page is greater than 1 */
                  /* If that is true then there is this a previous page because there will be page one, if that is false because we are on page one already */
                  hasPreviousPage:page>1,//page 1 sẽ không có trang trước đó
                  /* if we are on page 1 the next page would be page 2 and previous page would be page 0 */
                  nextPage:page+1, //note: nếu /?page=1 thì 1(active) 11  [Tại sao không phải là 1 2 ? Vì cộng chuỗi với nhau 👉 Phải nhớ quy luật:String không cast thành Number được (sẽ là NaN) nhưng Number có thể cast thành String]
                  previousPage:page-1,
                  /*  add last page to have a way of displaying the highest page number  */
                  /*
                      if we have let's say 11 total items and we have items per page of two, then the result would be 5.5 and then math.seal would return us 6 which would be the correct value because we would need 6 pages to display all 11 items, if we show 2 items per page
                  */
                  lastPage:Math.ceil(totalItems/ITEMS_PER_PAGE)  //lastPage tùy thuộc website có bao nhiêu SP (Dynamic!!! ❤️) . VD 39 sp và 2sp/page thì trang cuối cùng là nút 20
           });
         }) 
         .catch(err => {
           console.log(err);
         });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  //Product.findById(prodId)
  Dich_vu_san_pham.tim_theo_ID(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products'
      });
    })
    .catch(err => console.log(err));
};

exports.getIndex = (req, res, next) => {
  //QUERY PARAMETER từ action getIndex and I can use that data/number on the BACKEND to control which data I want to fetch
  const page=+req.query.page || 1; //nếu GET req trang http://localhost:3000/ thì page = undefined khi đó nextPage=page+1=undefined+1=NaN hiển thị trực tiếp trên nút phân trang. 
  /*
      this means if this is undefined or if this does not hold a true-ish value, then we'll use this page=1 instead, khi đó né được nút phân trang mang giá trị NaN
  */
  console.log("Với GET req này thì page có giá trị: ",page); //trang http://localhost:3000/  thì page is undefined, khi đó skip=NaN 👉 xem Mongoose debug ở terminal
  console.log("typeof page là gì?",typeof(page)); //trong "/" thì undefined , còn trang /?page=1 thì type là 👉 string 
  //với + trước req.query.page thì http://localhost:3000/?page=1 thì có page=1 type number, lúc này skip:0 và limit:2

  //const totalItems; //💢Syntax Error: mussing initializer in const declaration . Synk: 'const' declaration must be initialized -->💊 Solution?
  let totalItems;

  //with that number, we just need to define how many items should be displayed per page
     /* 
        *** Cách 1 (tui chọn)--> store as a global constant in this file
        *** Cách 2 --> store it in a different file, export it there and import it here
     */

  const ITEMS_PER_PAGE =2; //WHY?it should be some number lower than the number of items you have here (I got 3 products shown) so that you can see a difference.
  /* if I'm on page one want to fetch the first two items,

     if I'm on page two, I want to fetch items three and four, on page three I would fetch four and five and so on. 
  */
  /* PROBLEM: Product.find() right now gives us all the items but we can actually control this */
  /* SOLUTION:  In mongodb and therefore also mongoose, there is a skip function . We can add this on a cursor and find does return a cursor to skip the first X amount of results  */
     ///https://www.mongodb.com/docs/manual/reference/method/db.collection.find/#std-label-crud-read-cursor
        //// The cursor.skip() method controls the starting point of the results set. The following operation skips the FIRST 5 documents in the bios collection and returns all remaining documents: db.bios.find().skip( 5 )

  //Product.find()  //đầy đủ hơn là Product.find({}) trả về 1 cursor chứ không phải mảng 

  /* The important thing is I don't need catch because I'll concatenate my other promise chain later, */
  /*  important thing here is this will now not to retrieve all the products but simply just a number */
  Product.find().countDocuments()
         .then(numProducts=>{//must have argument expression
              //number of products is what I get back in this then block function here
              totalItems=numProducts;
              //kick off my normal find method where I then really fetch the items and I skip and limit them
              return Dich_vu_san_pham.tim_co_dieu_kien_de_phan_trang({},page,ITEMS_PER_PAGE)    //empty document, bắt buộc có do dịch vụ yêu cầu tham số     
         })
         .then(products => { //products có thể undefined
             console.log(JSON.stringify(products)); //imageUrl="images\image-22-8-2022-data_fetch.PNG". Tại sao static file là images nhưng lại xuát hien ? xem req.file.path thấy path="images\\image-22-8-2022-data_fetch.PNG"
             res.render('shop/index', {
                  prods: products, //nếu products undefined thì Javascript bên view sẽ thông báo "No product found!", đặc biệt dễ thấy trong phân trang khi nhập ?page=100. Do đó cần các nút trang để tăng UX 
                  //not just products, but also the number of products 
                  pageTitle: 'Shop',
                  path: '/',
                  /* ------------------💙--------------------- */
                  currentPage: page, //vế phải là string
                  /* so that I always know what's the currently active page */
                  // return/pass the information whether there is a next page
                  /* will be the case if the total number of items is greater than the page we are on times the items per page */
                  /* we have a next page if items per page times page is smaller than total items because if we have 10 total items and we are on page 4, then we have 2 times 4, 8 items which we are seeing. So there will be a next page */
                  hasNextPage:ITEMS_PER_PAGE*page<totalItems,
                  /* return the information whether the current page is greater than 1 */
                  /* If that is true then there is this a previous page because there will be page one, if that is false because we are on page one already */
                  hasPreviousPage:page>1,//page 1 sẽ không có trang trước đó
                  /* if we are on page 1 the next page would be page 2 and previous page would be page 0 */
                  nextPage:page+1, //note: nếu /?page=1 thì 1(active) 11  [Tại sao không phải là 1 2 ? Vì cộng chuỗi với nhau 👉 Phải nhớ quy luật:String không cast thành Number được (sẽ là NaN) nhưng Number có thể cast thành String]
                  previousPage:page-1,
                  /*  add last page to have a way of displaying the highest page number  */
                  /*
                      if we have let's say 11 total items and we have items per page of two, then the result would be 5.5 and then math.seal would return us 6 which would be the correct value because we would need 6 pages to display all 11 items, if we show 2 items per page
                  */
                  lastPage:Math.ceil(totalItems/ITEMS_PER_PAGE)  //lastPage tùy thuộc website có bao nhiêu SP (Dynamic!!! ❤️) . VD 39 sp và 2sp/page thì trang cuối cùng là nút 20
           });
         })
         .catch(err => {
              console.log("Dịch vụ sản phẩm tim_co_dieu_kien đã phát hiện lỗi: ",err);
         });
};

exports.getCart = (req, res, next) => {
  //controller action 'getCart' controls incoming req object, modify cấu trúc của nó
  //controller sau đó catch error 
  //then sendback a response object to the client
  
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items;
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products
      });
    })
    .catch(err => console.log(err));
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  //Product.findById(prodId)  //bị Snyk warning
  Dich_vu_san_pham.tim_theo_ID(prodId) //giúp tránh Snyk warning Product.findById(prodId) ??
    .then(product => {
      return req.user.addToCart(product);
      
    })
    .then(result => {
      console.log(result);
      res.redirect('/cart');
    })
    .catch(err => console.log(err)); //warning nếu Dich_vu_san_pham thiếu catch cho Promise , may result in unhandle Promise rejection
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => console.log(err));
};

exports.postOrder = (req, res, next) => {
  console.log("Ban đầu thì req.user là: \n",JSON.stringify(req.user));//Nếu thấy [object Object] hay [Object] Try adding JSON.stringify(result) to convert the JS Object into a JSON string.
  req.user
    .populate('cart.items.productId') //giúp mở rộng phần đang che giấu thông tin bên trong req.user
    .execPopulate()
    .then(user => {//chứa productId ban đầu là 1 hashed string, đi qua populate().execPopulate() trả về Promise user có productId là 1 full JS object
      console.log("Sau khi 'more elaborate' thì req.user là: \n",JSON.stringify(req.user));
      const products = user.cart.items.map(i => {
        //dùng map để tạo đối tượng javascipt mới
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });

      //tạo thực thể order mới
      // const order = new Order({
      //   user: {
      //     //tác giả ghi vế phải là req.user.email và req.user  cũng ok vì đây cần populated ProductId
      //     email: user.email,
      //     userId: user       //Schema yêu cầu ObjectId nên dù ghi :user hay :req.user cũng trả ra ObjectId
      //   },
      //   products: products
      // });
      // return order.save();

      return Dich_vu_don_hang.create_va_luu_doi_tuong_moi(user,products); 
    })
    .then(result => {
      //result chính là saved order
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => console.log(err));
};

exports.getOrders = (req, res, next) => {
  //https://www.geeksforgeeks.org/mongoose-find-function/
     /// parameter [query/condition] 👉 Find all documents that matches the condition 
  //Order.find({ 'user.userId': req.user._id })
  Dich_vu_don_hang.tim_co_dieu_kien({ 'user.userId': req.user._id }) //nếu tìm tất cả thì find({})
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders
      });
    })
    .catch(err => console.log(err));
};

//READ FILE ASYNC
exports.getInvoice=(req,res,next)=>{
  console.log("Welcome,getInvoice ASync !💛");
  /*
     specified here in my routes file, order ID that's the name and therefore I have to retrieve it by that name in my controller
  */
  const orderId=req.params.orderId; //Chú ý: phải chọn đúng id trên file pdf , nếu không báo lỗi Error: ENOENT: no such file or directory, open 'D:\KHOA_5_BACKEND1\Đồ án, Exercises, Labs, Final\Thực hành VSCode\NJS101x_Lab10.9_khanglvfx15073@funix.edu.vn\data\invoices\invoice-62ef86caea2e5e09ac193aca.pdf'
  console.log("Id của đơn hàng muốn xuất pdf: \n",orderId);
  //Lab10.11
  //Order.findById(orderId)
  Dich_vu_don_hang.tim_theo_ID(orderId)
       .then(order=>{
          //order is promised/future value , could be undefined if no order for this order ID is found (có thể trên db đã xóa ở in-between database mà vẫn hiển thị??)
          
          if(!order){
            console.log("undefined, xem lại hàm async đã return chưa"); //Tuy nhiên khi dùng lớp thư mục Services thì undefined báo lỗi ngay trước khi then(order=>) và app crash vì TypeError: Cannot read properties of undefined (reading 'then') ý nói undefined.then() chứ không vào if 
            return next(new Error('No order found!')); //whatever you want, you can handle this differently

            ////Problem: error không được chuyển tới 500.ejs mà lại output trực tiếp ra trình duyệt với 'No order found!' và các đường dẫn bị lộ
          }
          //If we do have an order however, I want to check if the order is from that user who's logged in
          if(order.user.userId.toString() !== req.user._id.toString()){
            return next(new Error('Unauthorized!'));
          }
          // only if I make it past these two if checks, only in this case I want to read that file and output it.
  
          const invoiceName="invoice-" + orderId+".pdf"; //the file name
            //now we need to retrieve that file and we can retrieve files with nodes file system.
            //We use that before in the course already, fs is in node core
            //asynchronously read with a callback ( I will either get an error or the data), but needs path here should be constructed with the path in node core module so that it works on all operating systems
          const invoicePath=path.join('data','invoices',invoiceName);
          console.log("invoicePath là: \n",invoicePath);

          //const pdfDoc=new pdfDocument(); 
          res.setHeader('Content-Type', 'application/pdf'); // ( calls the native Node.js method), còn các hàm khác không phải node methods nhưng cho ra kết quả giống nhau 

          //có 2 lựa chọn: inline hoặc attachment
          res.setHeader('Content-Disposition','inline;filename="' + invoiceName +'"'); //https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition; https://www.geeksforgeeks.org/http-headers-content-disposition/
              ///Why ?The HTTP Content Disposition is a response-type header field that gives information on how to process the response payload and additional information such as filename when user saves it locally to client computers/mobiles/winforms
          //WHERE to store? invoicePath dẫn tới file "invoice-" + orderId+".pdf" , lúc  này file này chưa tồn tại trên server này
              ///ensures that the pdf we generate here also gets stored on the server (with fs.createWriteStream) and not just serve to client (via res).
          pdfDoc.pipe(fs.createWriteStream(invoicePath))
          //of course I also want to return it to the client, so I also pipe the output into my response, just as before (Tác giả pipe the readable stream output vào writeable stream response object) 
          pdfDoc.pipe(res);

          //Lợi thế của 2 pipe operations trên là gì? 
              /// là để chuẩn bị cho bước tiếp theo là viết nội dung vào trong pdf document 
              /// ✅ Cơ chế: Now we have this set up and now (in the future) whatever we add to the document (thêm nội dung vào pdf) will be forwarded into this file (sẽ được tạo ra on the server dữa trên invoicePath) which gets generated on the fly and into our response (Đạt 2 mục đích vừa lưu trên server vừa gửi cho client)

          //set font size , underline
          //fontSize hay text đứng trước cũng ok
          pdfDoc.font('Times-Roman', 26).text('Invoice',{
            //font('Times-Roman', 13)
            //Error: ENOENT: no such file or directory, open 'arial'
            //Error: ENOENT: no such file or directory, open 'vn-books'
            underline:true
          });
          // Add an image and configurating object, constrain it to a given size, and center it vertically and horizontally
          // pdfDoc.image('./midu.PNG', {
          //   fit: [250, 300],
          //   align: 'center',   
          //   valign: 'center'
          // }); //FAILED

          pdfDoc.text("---------------------------");

          let totalPrice=0;
          
          //loop có thể giúp update totalPrice
          //because total price will then be the old total price plus the product quantity times (x) the product price from each orderItem
          order.products.forEach(orderItem=>{
            totalPrice=totalPrice+orderItem.quantity+orderItem.product.price;
            //hay dùng shortcut
               /// totalPrice += orderItem.quantity+orderItem.product.price;
            //dùng fontsize 14 , vì không muốn dùng super big 26 for all of text
            //Mẹo: mỗi làm failed to download PDF ở client thì thay đổi số 12-123-... rồi f5 lại http://localhost:3000/orders/630497604dfeb32b9419bb2c
            pdfDoc.fontSize(12).text(
              orderItem.product.title+
              ' - '+
              orderItem.quantity + 
              'x' 
              + '$' +
              orderItem.product.price
            );
            //ok, mỗi orderItem kèm SL*đơn giá  nằm trên 1 dòng
          });

          // maybe some more dashes here to separate the list from the total price
          pdfDoc.text('=============');
          pdfDoc.fontSize(20).text("Tổng giá: $"+totalPrice);
          // next gen javascript syntax with back ticks to make this a bit easier to read,
          //viết xen kẽ hardcoded values ( - x $ ) với dynamic values 

          //have to call pdf doc to tell node when you're done writing to that stream because you have to be done at some point, so that file is saved and chunks are sent to client
          pdfDoc.end();  //không phải close(), Dont forget to end the stream; // Finalize PDF file
       })
       .catch(err=>{
          //VD với MongoError, nếu ObjectId bị signup trùng đã tồn tại, hay với unique:value field nào đó thì catch sẽ bắt error và log MongoError ra terminal
          // however, we can simply next an error to use the default error handling function, Express detects error but cannot handle it
          next(err); 

          
       })
  
} //work!


//READ FILE SYNC
exports.getInvoiceSync=(req,res,next)=>{
  console.log("Welcome,getInvoice Sync ❤️");
  //window.alert("Welcome,getInvoiceSync "); //ReferenceError: window is not defined
  /*
      The "ReferenceError: alert is not defined" occurs when the alert() method is used outside of the browser environment, most commonly in Node.js. The alert method is a method on the window object, which is only available in the browser.
  */
  //alert("Welcome,getInvoiceSync"); //output=ReferenceError: alert is not defined  👉 https://bobbyhadz.com/blog/javascript-referenceerror-alert-is-not-defined
  const orderId=req.params.orderId; 
  const invoiceName="invoice-" + orderId+".pdf";
  const invoicePath=path.join('data','invoices',invoiceName);
  //var data =fs.readFileSync(`../data/invoices/invoice-${orderId}.pdf`);
  var data =fs.readFileSync(invoicePath);
  res.contentType("application/pdf");
  res.send(data);
}  //work!