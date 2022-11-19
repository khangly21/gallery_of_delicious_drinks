const crypto = require('crypto');



const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer'); //nodemailer is not a mailserver. It's a library that connects to an SMTP server you specify and sends mails via that server
const sendgridTransport = require('nodemailer-sendgrid-transport');
//With that imported, I can initialise a couple of things here
//create a block-scoped and assign to a const variable
const transporter=nodemailer.createTransport(sendgridTransport(
            { //ReferenceError: Cannot access 'nodemailer' before initialization (vs instantiation?)
              auth:{
                  //Now both are values you get from inside your sendgrid account >> Settings 
                  //api_user:      ,
                  api_key:'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'
              }
            }
        )
)//đã set up xong , giờ thì dùng transporter để gửi email. When? controllers >> auth.js >> postSignup



const { validationResult } = require('express-validator/check');

const User = require('../models/user');

exports.getLogin = (req, res, next) => {
  //2 sự kiện là :
      /// 🔔 getLogin bằng nút thông thường thì message = null 
      /// 🔔 khi đăng nhập thất bại với email hay password thì getLogin bằng 💫 res.redirect
  //🔕 Không liên quan gì sự kiện expressValidator phát hiện lỗi vì không có res.redirect 💫 từ sự kiện đó tới đây
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  //🍽
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message,
    oldInput:{
      email:'',
      password:''
    },
    validationErrors:[]
  });
};

exports.getSignup = (req, res, next) => {
  console.log("GETSIGNUP here!");
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  //🍽
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: message,  //✍️ 
    oldInput: {
      email: '',
      password: '',
      confirmPassword: ''
    },
    validationErrors : []
  });
};

exports.postLogin = (req, res, next) => {
  //Nhận dữ liệu: req.body , và validation errors 
  //const email = req.body.email;  //isEmail //👉 true!
  //const password = req.body.password;  //password đã đủ length min>=5 và chỉ text và numbers 👉 true   ; password đã so trùng 👉 chưa
  //tương đương với 2 dòng trên, thay bằng object assigning destructuring chỉ lấy ra các variables cần thôi (VD tải về 1 thư viện nhưng chỉ destructuring các hàm cần thiết)
  //const {email,password}=req.body;
  //tuy nhiên ES6 cũng cho phép flexible assigning to another variables called ALIAS
  const {email: eml ,password: pw}=req.body;


  //validation errors collection
  const errors = validationResult(req); 


  //Không phải express-validator phát hiện error là dừng ngay chỗ middleware đó và không đi tiếp, mà nó tổng hợp lỗi vào errors và gửi tới postLogin
  if (!errors.isEmpty()) {//🔔 sự kiện express-validator đã phát hiện lỗi
    
    //🍽
    return res.status(422).render('auth/login', { //I return the rendering here
      path: '/login',
      pageTitle: 'Login',
      errorMessage: errors.array()[0].msg,   //✍️ đây là ý chính
      oldInput:{
        email:eml,
        password:pw
      },
      validationErrors:errors.array()
    });
  }

  //Database query
  User.findOne({ email: eml })
    .then(user => {
      //fulfilled promise , biến user có thể lưu đối tượng user hay undefined
      if (!user) {
        /*
        req.flash('error', 'Invalid email');  // 👈 bỏ flash (lý do là phải consistent style với validator khi phát hiện lỗi; Lý do khác có thể là flash không giúp giữ các oldInput ?)
        return res.redirect('/login');  // 💫
        */

        //Dòng code trên không dùng, phải uniform style với express-validator là return a rendering to view 
        //do đó ở đây không return res.redirect mà sửa thành return res.render() giống như khi express-validator phát hiện có lỗi field 
        //copy paste return của !errors.isEmpty(), because in the end we have an error of invalid email as well
        return res.status(422).render('auth/login', { //I return the rendering here
            path: '/login',
            pageTitle: 'Login',
            errorMessage: 'Invalid email',   //✍️ VD email: vietkhang92@gmail.com không có trong CSDL, password:122344
            oldInput:{
              email:eml,
              password:pw
            },
            validationErrors:[] //keep the old values but don't mark anything as CSS red
            //validationErrors:[{param:'email',param:'password'}]  //sẽ giúp CSS style box
        });
      }
      bcrypt
        .compare(pw, user.password)
        .then(doMatch => {
          if (doMatch) {
            req.session.isLoggedIn = true; //the key moment! session.isLoggedIn đóng vai trò như cache trên MongoDB giúp cho database khỏi phải tra cứu nhiều lần. Nhưng lúc này session chưa được establish vì đây chỉ là ĐK đủ, phải có ĐK cần là req.session.save
            req.session.user = user;
            //hàm save rất quan trọng, sessionID được lưu trong browser's cookie, còn session data được lưu trên server typically in database 
            //https://stackoverflow.com/questions/26531143/sessions-wont-save-in-node-js-without-req-session-save
            return req.session.save(err => {
              //save done! THH SESSION IS OFFICIALLY ESTABLISH!!! res.redirect('/') Khi req mới tới '/' bạn có thể truy cập session này chính bạn (user) chứ không ai khác đang isLoggedIn
              console.log(err);
              //Thumb of rulw: res sẽ nằm trong cb của save()
              res.redirect('/');   //ok, at GET / bạn sẽ thấy  req.session.isLoggedIn = true; và req.session.user
            });
          }
          // req.flash('error', 'Invalid password.');
          // res.redirect('/login');  // 💫
          return res.status(422).render('auth/login', { //I return the rendering here
              path: '/login',
              pageTitle: 'Login',
              errorMessage: 'Invalid password',   //✍️ VD email: test3@test.com có trong CSDL để qua được email checking, password:12234222
              oldInput:{
                email:eml,
                password:pw
              },
              validationErrors:[] //keep the old values but don't mark anything as CSS red
              //validationErrors:[{param:'email',param:'password'}]  //sẽ giúp CSS style box
          });
        })
        .catch(err => {
          console.log(err);
          res.redirect('/login');    // 💫
        });
    })
    .catch(err => console.log(err)); // if the database operation fails because we don't have read access because the database server is down temporarily, anything like that, then we make it into this catch block. Sau đó error sẽ tới 404 middleware
    /*
        Cũng như express validator, Catch by the way collects all errors that are thrown by any prior then blocks, so if we had more than then block in our chain here, catch would fire on any error thrown in any then block or any operation executed in a then block, that's just a side note.
    */ 
};

exports.postSignup = (req, res, next) => {
  console.log("HEY, POSTSIGNUP here")
  const email = req.body.email;  //isEmail //👉 true!
  const password = req.body.password;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());

    //🍽
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: errors.array()[0].msg, //đây là điều kiện để hộp báo lỗi hiện lên
      oldInput: {
        email: email,
        password: password,
        confirmPassword: req.body.confirmPassword
      },
      validationErrors : errors.array()  //I receive the full array of error objects
    });
  }

  //dùng bcrupt để mã hóa password, lúc login thì sẽ bcrypt.compare() để so trùng password nhập với password CSDL
  bcrypt
    .hash(password, 12)
    .then(hashedPassword => {
      //dĩ nhiên là lưu document mới vào MongoDB which is the document store
      const user = new User({
        email: email,
        password: hashedPassword,
        cart: { items: [] }
      });
      return user.save(); //ok xem Mongoose debug log thấy users.insertOne({})
    })
    .then(result => {
        
        /* you could also redirect immediately and not wait for this to be sent because you're not really relying on that being sent */
        
        //pass a javascript object where you configure the email you want to send

        //Don't wait for email sending completely then redirect to login, because we have a lot of requests coming. We should implement sendMail and redirect at the same time
           /// cần phải kết thúc req-res cycle trước khi sendMail() để đáp ứng client nhanh chóng, và sẵn sàng nhận req mới
           /// tác giả dùng res.redirect trước return transporter.sendMail() thì sendMail sẽ không block redirect, mà at the same time
        transporter.sendMail({//hàm này sẽ trả về a Promise object, so I will use then and catch sau sendEmail nhưng cách này lồng then vào then, nên lựa chọn khác là sẽ "return" sendMail() sau đó then kế tiếp sẽ redirect một cách đảm bảo mail đã sent 
            //tuy nhiên tui chọn không chờ mail sent thì mới redirect
            to:email,  //gửi email cho người vừa signup thành công
            //DEFAULT_FROM_EMAIL : 'you@domain.com',
            from: 'vietkhang92@gmail.com', //Nếu không có thì Error: Empty from email address (required)
            subject:"Signup succeeded!", 
            html:'<h1>You successfully signed up!</h1>'
        },function(err,info){
          if(err){
            console.log(err);
          }
          else{
              console.log('Message sent');
              //với res.json thì được gợi ý là success:
              // res.json({
              //   status:200,
              //   message:"A link sent to your email"
              // })
          }
        });  //nếu để redirect sau return thì unreachable code
        //Demo: sign up user mới với real email, sau đó được redirect tới login, check email 
        //in that e-mail account, you should have an e-mail from shop@nodecomplete.com with that message.
        res.redirect('/login'); //so this will send and at the same time you redirect. Nên để trước sendEmail vì khi mail bị vấn đề là không redirect được, bị spinning
    })  
    //GỬI nodemailer dễ bị các lỗi sau:
    /*
      //💢 Lỗi 1 : VD đã đăng ký vietkhang92@gmail.com thành công nhưng chưa nhận email vì ReferenceError: transport is not defined
      //💢 Lỗi 2: https://stackoverflow.com/questions/73473648/solvederror-connect-econnrefused-127-0-0-1587-nodemailer-nodejs
        /// 🍒 Lý do của Lỗi 2 là chưa kích hoạt hàm sendgridTransport() bên trong nodemailer.createTransport()
      //💢Lỗi 3: Sau khi lỗi 2 sửa thành công thì Error: the from address does not match a verified Sender Indentity. Mail cannot be sent until this error is resolved. . Visit https://docs.sendgrid.com/for-developers/sending-email/sender-identity   to see the Sender Identity requirements
    */
    .catch(err => {
      //catch any err
      console.log(err);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};

exports.getReset = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  //🍽
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message           
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect('/reset');
    }
    const token = buffer.toString('hex');
    User.findOne({ email: req.body.email })
      .then(user => {
        if (!user) {
          req.flash('error', 'No account with that email found.');
          return res.redirect('/reset');
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then(result => {
        res.redirect('/');
        transporter.sendMail({
          to: req.body.email,
          from: 'shop@node-complete.com',
          subject: 'Password reset',
          html: `
            <p>You requested a password reset</p>
            <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>
          `
        });
      })
      .catch(err => {
        console.log(err);
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then(user => {
      let message = req.flash('error');
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }

      //🍽
      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'New Password',
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId
  })
    .then(user => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then(hashedPassword => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then(result => {
      res.redirect('/login');
    })
    .catch(err => {
      console.log(err);
    });
};
