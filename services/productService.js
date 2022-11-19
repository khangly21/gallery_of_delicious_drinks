const Product = require('../models/product');
//https://www.mongodb.com/docs/manual/reference/method/db.collection.find/ find() "returns documents" nhưng thực chất là "a returned cursor" trỏ tới tất cả documents thỏa query filter. Do đó 
//https://www.mongodb.com/docs/manual/reference/method/db.collection.find/#std-label-crud-read-cursor
//Clear examples: https://www.geeksforgeeks.org/mongodb-cursor/

const productServiceEntity={
    //parameter/query/condition 👈 tìm mọi documents thỏa điều kiện này
    //Xem lại: default object rỗng tim_co_dieu_kien: async (condition={})=>{   
    tim_co_dieu_kien: async (condition)=>{ //thỏa 2 TH condition là empty document {} hay object không rỗng
        return await Product.find(condition); 
    },
    tim_co_dieu_kien_de_phan_trang: async (condition,page,item_per_page)=>{ //thỏa 2 TH condition là empty document {} hay object không rỗng
        return await Product.find(condition)
        //https://stackoverflow.com/questions/71690051/mongoose-skip-based-on-parameter-value
                            .skip((page-1)*item_per_page)   //cursor.skip(Number) nếu page>=1 , cursor.skip(NaN) nếu page=undefined với http://localhost:3000/
                            //Nếu skip(string) thì sao? https://stackoverflow.com/questions/71690051/mongoose-skip-based-on-parameter-value
                            //I also want to limit the amount of items I retrieve though, so that I don't just skip the items of previous pages but for the current page, I also only fetch as many items as I want to display
                            //The limit method as the name suggests limits the amount of data we fetch
                            .limit(item_per_page); //cursor.skip(NaN) nếu page=undefined với http://localhost:3000/ và limit(2) 
    },
    tim_theo_ID: async (productId)=>{
        return await Product.findById(productId);   
    },
}

module.exports=productServiceEntity; 