const express = require('express');
const { check, body } = require('express-validator/check');
//vs const { body } = require('express-validator');  ?

//chú ý : Không cần isAuth 

const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email address.')
      .normalizeEmail() //🌐
      //trả về string||false. THIS does not validate if an input is an email, so you shoudl use isEmail beforehand
    , //isEmail() không thỏa thì dừng , không check tiếp password
    body('password', 'Password has to be valid.') //message làm tham số thứ hai, vì withMessage customize hơn
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim()  //🌐
      
      //we could trim the password to remove excess whitespace
  ],
  authController.postLogin  //nếu để isAuth trước postLogin sẽ có gì xảy ra??
);

router.post(
  '/signup',
  [
    check('email')
      .isEmail()
      .withMessage('Please enter a valid email.')
      
      .custom((value, { req }) => {
        // if (value === 'test@test.com') {
        //   throw new Error('This email address is forbidden.');
        // }
        // return true;
        return User.findOne({ email: value }).then(userDoc => {
          if (userDoc) {
            return Promise.reject(
              'E-Mail exists already, please pick a different one.'   //👈👈 important message
              //giả sử sign up email:"test3@test.com" , pass:222222 sẽ tung msg này ra 
            );
          }
        });
      })
      
      .normalizeEmail() //🌐
      ,

    body(
      'password',
      'Please enter a password with only numbers and text and at least 5 characters.'
    )
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim() //🌐
      ,
      
    body('confirmPassword').trim().custom((value, { req }) => {   //không có { } bao quanh req được không?
      if (value !== req.body.password) {
        throw new Error('Passwords have to match!');
        /*
            The throw statement throws a user-defined exception. Execution of the current function will stop (the statements after throw won't be executed), and control will be passed to the first catch block in the call stack. If no catch block exists among caller functions, the program will terminate.
        */
      }
      return true;
    })
  ],
  authController.postSignup
);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;
