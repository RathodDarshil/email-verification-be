const express = require("express");
const router = express.Router();

const verifyUserController = require("../Controllers/verifyUser");

router.get("/verify", verifyUserController.verify_user);
router.post("/signup", verifyUserController.signup);
router.get("/jwt-verify", verifyUserController.jwtVerify);

module.exports = router;
