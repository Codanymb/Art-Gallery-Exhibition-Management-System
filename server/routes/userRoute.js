const express = require("express");
const { authenticatedUser,  Admin} = require("../middleware/authMiddleware")
const {deleteAccount, getAllUser }= require ("../controllers/userManagementController");
const router = express.Router();

router.delete("/delete", authenticatedUser, deleteAccount);
router.get("/get",  Admin, getAllUser);

module.exports = router;

