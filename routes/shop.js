const path = require('path');

const express = require('express');

const shopController = require('../controllers/shop');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/', shopController.getIndex);

router.get('/products', shopController.getProducts);

router.get('/products/:productId', shopController.getProduct);

//I protect the route with isAth

router.get('/cart', isAuth, shopController.getCart);

router.post('/cart', isAuth, shopController.postCart);

router.post('/cart-delete-item', isAuth, shopController.postCartDeleteProduct);

router.post('/create-order', isAuth, shopController.postOrder);

router.get('/orders', isAuth, shopController.getOrders);

router.get('/orders/:orderId', isAuth, shopController.getInvoice); //VD http://localhost:3000/orders/630497604dfeb32b9419bb2c hiện pdf cần xem
//<a href="/orders/<%= order._id %>">Invoice pdf Async</a> </li> <!--ok, absolute path, nghĩa là /orders/<%= order._id %> sẽ gắn trực tiếp vào domain hay computer address là http://localhost-->

//router.get('/ordersSync/:orderId', isAuth, shopController.getInvoiceSync);

module.exports = router;
