const express = require ("express");
const { Admin, authenticatedUser } = require("../middleware/authMiddleware");
const { AddProducts , updateProduct, deleteProduct, getAllProducts,getEachProduct} = require("../controllers/ProductController");
const router = express.Router();

router.post("/Add", Admin, AddProducts);
router.put('/update/:product_id', Admin, updateProduct);
router.delete('/delete/:product_id', Admin,deleteProduct);
router.get('/get/',getAllProducts);
//router.get('/:product_id', Admin, getEachProduct);
router.get('/getByID/:product_id', Admin, getEachProduct);
module.exports = router