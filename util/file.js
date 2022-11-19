const fs=require('fs');

//a variable which hold a function which is the code block that we can reuse quickly, often just by making a function call
//file.js khi được import sẽ như object, deleteFile là property which contains a function (trong JS thì func là đối tượng nên nó có thể gán vào biến khác và làm tham số cho hàm khác)

//có 2 cách để assign a function to a variable: https://www.tutorialspoint.com/How-can-we-assign-a-function-to-a-variable-in-JavaScript
    /// https://www.tutorialspoint.com/How-can-we-assign-a-function-to-a-variable-in-JavaScript
       //// create an anonymous function and assign it to the variable as an expression. After that, we will call the anonymous function using the variable
          /*
             var a = function ( x, y ) {
                return x + y;
             }
             let result = a(3, 5);
          */
       //// The second method to assign the function to the variable is the arrow function. It is similar to the above approach, but the difference is that we will create an anonymous function without using the ‘function’ keyword and use an arrow instead.
          /*
              const variable = ( …parameters ) => {
                 // function body
              }
              Variable( parameters ); // invoke the arrow function.
          */

const deleteFile=(filePath)=>{
    //the unlink method, it deletes the name and the file that is connected to the name, so it deletes a file at this path.

    //Important note: fs.unlink is ASYNC method, thay vì dùng then().catch() thì thay thế bằng callback. Vậy kinh nghiệm là với hàm async được ở file riêng để tái sử dụng, thì dùng callback
    //Hover sẽ thấy: async function này không trả ra Promise, mà là void. async
       /// async action là : async removes a file or symbolic link. No arguments other than possible exception given to the COMPLETION CALLBACK 

      // if(filePath){
         //https://stackoverflow.com/questions/49968094/error-enoent-no-such-file-or-directory-unlink
         fs.unlink(filePath,(err)=>{
            // if err goes to this func,  throw it again and then it should bubble up in our DEFAULT express error handler to be able to take over
            if(err){
                console.log("không tìm thấy filePath")
                return; //thoát hàm mà không làm app crash
                //Đừng throw(err) vì nếu filePath là url trên mạng thì không tìm thấy file trong public folder sẽ làm APP CRASH
                //throw(err);  //VD không thấy hình trong public/khoHinhPublic, lý do là card hình đang dùng url trên mạng, chứ không upload hình
                //res.redirect('/admin/products'); //dùng throw(err) thì dòng code này unreachable, vơi lại res thì undefined
             }
            //otherwise I'll not do anything here
            console.log('File deleted!');
 
        })
      // }else{
      //    console.log("no such file or directory to unlink")
      //    throw (new Error("no path"))
      // }
    
}
//I can always call this method to pass in a file path and delete that file.
//we can use that in our admin controller

//Prob: nếu filePath là URL thì báo lỗi không tìm thấy trong thư mục Public 

//export the const at the right of "="
exports.deleteFile=deleteFile;