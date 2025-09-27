const express = require ("express");
const { authenticatedUser , Admin} = require("../middleware/authMiddleware");
const { createCart,addToCart, removeFromCart, viewCart, checkOut, getAllOrders, UserOrder, getEachOrder} = require("../controllers/orderController");
const router = express.Router();

router.post("/create", authenticatedUser, createCart);
router.post("/add", authenticatedUser, addToCart);
router.delete("/delete", authenticatedUser, removeFromCart);
router.get("/view", authenticatedUser, viewCart);
router.post("/buy", authenticatedUser, checkOut);
router.get("/get", Admin, getAllOrders);
router.get("/MyOrder", authenticatedUser, UserOrder);
router.get("/getByID/:order_id", Admin, getEachOrder);


module.exports = router