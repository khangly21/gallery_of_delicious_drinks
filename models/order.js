const mongoose = require('mongoose');
//Mongoose là MongoDB object modeling tool  (Mentor NgoTuanAnh: là chiến lược để model hóa MongoDB như collection, document thành JS objects)
   ///trong app dùng biến User, nhưng thực tế morgan cho biết Mongoose queries trực tiếp CSDL với biến users
//Ở tầng ứng dụng, nếu nhắc tới "overall/master" controller có thể nghĩ tới Express với các built-in functions
//Ở tầng Router, nhắc tới "MVC" controller (các hàm cung cấp "presentational information" cho view) và "Web API" controller (các hàm cung cấp data)


const Schema = mongoose.Schema;


const orderSchema = new Schema({
  products: [
    {
      product: { type: Object, required: true },
      quantity: { type: Number, required: true }
    }
  ],
  user: {
    email: {
      type: String,
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    }
  }
});

//Models are defined through the Schema interface.
module.exports = mongoose.model('Order', orderSchema);
