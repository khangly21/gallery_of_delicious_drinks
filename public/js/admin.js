// file này export tới views >> admin >> product.ejs
// which logic do I want to add?
// I want to react to a click on this delete button
// delete button đang là button type="submit", sẽ thay đổi không còn type submit anymore! 
   /// should be of type button instead
//here, access that button with browser JS 

//định nghĩa hàm, khi file khác như product.ejs imports admin.js này thì admin.js as object, deleteProduct as property which is holding a function-type object 

//this function wraps code block which is simply executes "click"
// this deleteProduct function is a function I can use from inside my product.ejs and therefore html file which is the product of Express_renders_ejs, on that button
/*
    <button class="btn" type="button" onclick="deleteProduct()">Delete</button> 
    Using (), we execute that function when we click on that button
*/

//Khách hàng sử dụng dịch vụ deleteProduct là : views >> admin >> product.ejs với lời gọi hàm deleteProduct(this)
const deleteProduct = (btn) => {
    //just check with browser, khi click button, sẽ hiện log trong browser sau:
    console.log("Clicked!")
    //Now how do I get access to the surrounding elements of delete button
    //I can prove to you that btn is the button by simply logging it.
    console.log(btn);
    // we have accessed to the button
    //with that we can easily get access to the SURROUNDING inputs.

    //btn có parent node là div, áp dụng querySelector trên div này để tới 2 node con có fieldnames là productId và _csrf
    console.log(btn.parentNode.querySelector('[name=productId]'));
    //use the attribute selector (bộ chọn) to find name equal product ID, to extract the DOM element
    //take the value of a DOM element
    console.log(btn.parentNode.querySelector('[name=productId]').value);
    //let's store that, productID in a constant and then let me also store the csrf token
    const prodId=btn.parentNode.querySelector('[name=productId]').value;
    //const csrf=btn.parentNode.querySelector('[name=_csrf]').value;

    // I have to do is I have to find this article based on this button
    /* there is a closest method provided by javascript and you pass a selector to closest which
       gives you the closest element with that selector and the closest ANCESTOR element to be precise
       and there, I will simply use article because I only have one article in my ancestor history here for
       this button,
       so if I select my closest article, that should be the element I want to delete.
    */

    //https://developer.mozilla.org/en-US/docs/Web/API/Element/closest
    const productElement= btn.closest('article') //nếu ghi closet thì báo lỗi is not a function
    
    /*
        Here we can use the fetch method which is a method supported by the browser for sending http requests in order to:
            1. and it's not just for fetching data as the name might suggest, 
            2. it's also for sending data
    */

    //hàm sau trả về Promise object
    fetch('/admin/product/'+ prodId,{
        //set method to delete here, doesn't have to be uppercase but it's a good convention.
        method:'DELETE',
        //ok, we have method has been set to "DELETE"
        // in the headers, we could encode our csrf token because we still need to attach this to our request
        //💢Problem:  right now we are not doing that. We cannot send it in the request body because delete requests don't have a body
        //🍒Solution:good thing is the csurf package which we are using on a server does NOT JUST look into request bodies; it ALSO LOOKS into the query parameters and therefore we could add it there and it ALSO LOOKS into the headers
        headers:{
            //So there we can add a csrf-token header, csrf package will look for this key
            //you'll find all the keys for which it will look in the official doc of the "csrf" package on Github
            // you can add 'csrf-token' and then csrf as a value to attach this to your outgoing request
            //'csrf-token':csrf
        }
        //this will send the request and it will return a promise that allows to listen to the response

    })
    .then(
        //capture the result of Promise
        //log any result we might get
        result=>{
            console.log(result);
            //nhận kết quả thì parse thành JS object
            return result.json() //which throw a new promise or return a new promise. Nên bắt buộc phải có then block để catch giá trị mà promise trả về, nếu không promise pending 
        }
    )
    .then(data=>{
        console.log(data);
        //productElement.remove(); //💢 which is  a function that will not be supported in Internet Explorer, nên phải chọn cách viết khác cho mọi browser 
        productElement.parentNode.removeChild(productElement); //🍒 works in any browser
        /*
           I don't necessarily need that but I want to show you how you could get that data that's getting returned by the server
        */
       /*
            More importantly, I know that either here result.json() or here console.log(data);, does not matter,
            I have a response so the item was deleted on the server
            and now I want to delete it here in the dom (SP bên trong file HTML) as well.

            Trong HTML thì we got access to the button (btn parameter of deleteFile function) on which we clicked right and the button is in the end inside of the
            whole dom element we want to delete, chính là article tag which I want to delete.
       */
    })
    .catch(err=>{
        //log any err we might get
        console.log(err);
    });
    //'/product/:productId' need to replace the productId ( do đó không được ghi chuỗi '/product/:productId') to send req to the same server / current host with this absolute path
    //sẽ gửi req tới server khác nếu: fetch('http://product/:productId)
    //the second argument is an object where you can configure this ❤️ Fetch Request, you can set a bunch of things 
    
};

//✍️ Now one important note by the way, I'm not sending any JSON data with my request here because
   /// it is a delete request without a post body.
//✍️ If it were (hiện tại là không có, giả định ở hiện tại) and that is something we will see in the Rest API section, then I would have to parse (đọc) json data in my backend because there right now and that's just an important note,
//💢Hiện chỉ có 2 parsers đó là express.urlencoded for reading encoded data , which we don't need on server to listen to client sending json data; one for multipart data which we also don't need on server to handle json data
//🍒We would have to add a new body parser that is able to handle json data and extract that from incoming requests
   ///I don't add it here because we don't need it here but we will add it later when we need it.

//So, we have client side code in place. Demo, click "Delete" button after we load the page, and see what we get from 
   /// 💢 problem: kết quả demo thấy route not found (404) , nghĩa là http://localhost:3000/product/5bbbeese... 404 (Not found)
   /// it makes sense because that route is in admin route folder, of course we only get there if our request path starts with /admin,that is what we configure in the app.js file.
   /// 🍒Solution: fetch('/admin/product/'+prodId) thì sẽ là found route, không báo 404 nữa
      ////  click nút Delete:
      ////  I have a response status 200, 
      ////  request body which is a readable stream => ❓ Khó hiểu (cryptic), qua Lab20.3 sẽ giải thích lại (I'll show you how to get to that request body in a second)
    ///💢Problem:  Reload the page, card đó gone luôn. Tuy nhiên tui muốn gone immediately, not after reload
      //// that would be the main idea of doing this behind the scenes.  So how can we make this work? 
      //// 🍒Solution: Lab20.3_manipulate the DOM


