const { Resend } = require("resend");
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const ejs = require("ejs");
const { convert } = require("html-to-text");

// Created on first use, so the app still starts if RESEND_API_KEY is missing.
let resend;
function getResend() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.username = user.username;
    this.url = url;
    this.from = `${process.env.NAME} <${process.env.EMAIL_FROM}>`;
  }

  // Renders an email template and sends it through Resend.
  // Throws a user-friendly error if the email could not be sent; the full
  // details from Resend are written to the server log.
  async send(template, subject) {
    const html = await ejs.renderFile(
      `${__dirname}/../views/emails/${template}.ejs`,
      {
        username: this.username,
        url: this.url,
        subject,
      }
    );

    let result;
    try {
      result = await getResend().emails.send({
        from: this.from,
        to: this.to,
        subject,
        html,
        text: convert(html),
      });
    } catch (err) {
      result = { error: err };
    }

    if (result.error) {
      console.error(`Email "${subject}" to ${this.to} failed:`, result.error);
      throw new Error(
        "Sorry, we couldn't send the email right now. Please try again in a few minutes."
      );
    }
    console.log(`Email "${subject}" sent to ${this.to} (id ${result.data.id})`);
    return result.data;
  }

  async sendWelcome(title) {
    await this.send("welcome", `Welcome to ${title}`);
  }

  async sendPasswordReset() {
    await this.send(
      "passwordReset",
      "Your password reset token (valid for only 10 minutes)"
    );
  }

  async sendPasswordChange() {
    await this.send("passwordChanged", "Your password has been changed");
  }
};
