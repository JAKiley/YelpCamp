// using Twilio SendGrid's v3 Node.js Library
// https://github.com/sendgrid/sendgrid-nodejs
const sgMail = require("@sendgrid/mail");
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
console.log(sgMail);
const msg = {
  to: "wb1dfs@outlook.com",
  from: "admin@rakjab.com",
  subject: "Sending with Twilio SendGrid is Fun",
  text: "and easy to do anywhere, even with Node.js",
  html: "<strong>and easy to do anywhere, even with Node.js</strong>",
};
sgMail.send(msg);
