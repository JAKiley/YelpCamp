const crypto = require("crypto");
const Email = require("../utils/emailHelper");
const helpers = require("../utils/helpers");

const Token = require("../models/token");
const User = require("../models/user");
const adminSecret = process.env.ADMINCODE;
module.exports.renderRegister = (req, res) => {
  res.render("users/register");
};

module.exports.register = async (req, res, next) => {
  try {
    const { email, username, password, adminCode } = req.body;
    if (adminCode === adminSecret) {
      isAdmin = true;
    } else {
      isAdmin = false;
    }
    const user = new User({
      email,
      username,
      isAdmin,
      isVerified: false,
      expires: Date.now(),
    });

    const registeredUser = await User.register(user, password);
    const userToken = new Token({
      _userId: registeredUser._id,
      token: crypto.randomBytes(16).toString("hex"),
    });
    await userToken.save();
    const url = helpers.setUrl(req, "verify", `token?token=${userToken.token}`);
    await new Email(user, url).sendWelcome("YelpCamp");
    req.flash(
      "success",
      `Thanks for registering, ${username}. Please check your email to verify your account. Link expires in 10 minutes`
    );
    // Colts original code where it auto logs in after register.
    // req.login(registeredUser, (err) => {
    //   if (err) return next(err);
    //   req.flash("success", "Welcome to Yelp Camp!");
    //   res.redirect("/campgrounds");
    // });
    return res.redirect("/campgrounds");
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("register");
  }
};

module.exports.verifyFromEmail = async (req, res, next) => {
  const token = await Token.findOne({ token: req.query.token });
  if (!token) {
    req.flash("error", "Token is invalid");
    return res.redirect("/campgrounds");
  }
  const user = await User.findOne({ _id: token._userId });
  console.log(`token user id ${token._userId}`);
  console.log(`user ${user}`);
  user.isVerified = true;
  user.expires = undefined;
  await user.save();
  await token.remove();
  await req.login(user, (err) => {
    req.flash("success", `Welcome to YelpCamp ${user.username}`);
    const redirectUrl = req.session.redirectTo || "/campgrounds";
    delete req.session.redirectTo;
    return res.redirect(redirectUrl);
  });
};

module.exports.renderLogin = (req, res) => {
  res.render("users/login");
};

module.exports.login = (req, res) => {
  const { username } = req.body;
  req.flash("success", "welcome back! " + username);
  const redirectUrl = req.session.returnTo || "/campgrounds";
  delete req.session.returnTo;
  res.redirect(redirectUrl);
};

module.exports.logout = (req, res) => {
  req.logout();
  // req.session.destroy();
  req.flash("success", "Goodbye!");
  res.redirect("/campgrounds");
};
