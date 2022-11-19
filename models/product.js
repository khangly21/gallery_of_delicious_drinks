const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  imageFilename: {
    type: String,
    //default:''
    //required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  } //Trick: Khi tạo new object, vế phải gán cả đối tượng user thì Mongoose cũng chỉ lấy ObjectId thôi
});

//Models are defined through the Schema interface.
module.exports = mongoose.model('Product', productSchema);



