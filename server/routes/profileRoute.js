const express = require("express");
const { authenticatedUser } = require("../middleware/authMiddleware")
const {viewProfile, updateProfile}= require ("../controllers/profileController");
const router = express.Router();

router.get("/view", authenticatedUser, viewProfile);
router.put("/Edit", authenticatedUser, updateProfile);

module.exports = router