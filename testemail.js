// Sends one test email through Resend, to check the API key and sending domain.
// Usage: node testemail.js you@example.com
const { Resend } = require("resend");
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const to = process.argv[2];
if (!to) {
  console.error("Usage: node testemail.js you@example.com");
  process.exit(1);
}

(async () => {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: `${process.env.NAME} <${process.env.EMAIL_FROM}>`,
    to,
    subject: "YelpCamp test email",
    text: "If you can read this, YelpCamp can send email through Resend.",
    html: "<strong>If you can read this, YelpCamp can send email through Resend.</strong>",
  });
  if (error) {
    console.error("Send failed:", error);
    process.exit(1);
  }
  console.log("Sent! Resend email id:", data.id);
})();
