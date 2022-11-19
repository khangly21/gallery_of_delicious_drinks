const Order = require('../models/order');
//https://www.mongodb.com/docs/manual/reference/method/db.collection.find/  find() "returns documents" nhưng thực chất là "a returned cursor" trỏ tới tất cả documents thỏa query filter. Do đó 
//https://www.mongodb.com/docs/manual/reference/method/db.collection.find/#std-label-crud-read-cursor
//Clear examples: https://www.geeksforgeeks.org/mongodb-cursor/

const orderServiceEntity={
    tim_theo_ID: async (orderId)=>{
        return await Order.findById(orderId);   //nếu không return thì then nhận được undefined.then() và app crash
        //xem Mongoose debug log thì thấy Mongoose không chạy findById mà chạy findOne với id
        //thường async/await dùng với return Model.save()
    },

    //parameter/query/condition 👈 tìm mọi documents thỏa điều kiện này rồi trả về cursor pointing them
    tim_co_dieu_kien: async (condition)=>{
        //Mongoose find all thì cho empty document vào làm tham số find({},callback)
        return await Order.find(condition); //nếu Order.find({}) thì trả ra undefined orders
        //When the find() method "returns/gets documents," (thử hover chữ find) the method is actually returning a cursor to the documents.
    },

    create_va_luu_doi_tuong_moi:async (populatedProductId_user,products)=>{
        const order = new Order({
          user: {
            email: populatedProductId_user.email,
            userId: populatedProductId_user       //Schema yêu cầu ObjectId nên dù ghi :user hay :req.user cũng trả ra ObjectId
          },
          products: products
        });
        console.log("Đang lưu trữ đơn hàng, xin chờ đợi");
        return await order.save();
    }
}

module.exports=orderServiceEntity; 