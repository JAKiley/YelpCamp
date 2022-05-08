const express = require("express");
const passport = require("passport");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const helpers = require("../utils/helpers");
const users = require("../controllers/users");

router
  .route("/register")
  .get(users.renderRegister)
  .post(catchAsync(users.register));

router.get("/verify/token", catchAsync(users.verifyFromEmail));

router
  .route("/login")
  .get(users.renderLogin)
  .post(
    catchAsync(helpers.checkIfNotVerified),
    passport.authenticate("local", {
      failureFlash: true,
      failureRedirect: "/login",
    }),
    users.login
  );

router.get("/logout", users.logout);

module.exports = router;
