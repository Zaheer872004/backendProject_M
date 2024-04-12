import { email_pass_key, email_address_name } from "../serverConfig.js";
import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // upgrade later with STARTTLS
  requireTLS: true,
  auth: {
    user: email_address_name,
    pass: email_pass_key,
  },
});

// export class message {
//     constructor(from, to, subject = "For Verification mail", fullName, user_id, html = `<p> Hii ${fullName}, please click here to <a href="http://localhost:8000/verify?id=${user_id}"> verify </a> your mail </p>`) {
//         this.from = from;
//         this.to = to;
//         this.subject = subject;
//         this.text = text;
//         this.html = html;
//     }
// }

export const createMessage = (to, fullName, user_id) => {
  return {
    from: email_address_name,
    to: to,
    subject: "Email Verification",
    html: `<p> Hii ${fullName}, please click here to <a href="http://localhost:8000/api/v1/users/verify?id=${user_id}"> verify </a> your mail </p>`,
  };
};

export const sendVerificationEmail = async (to, fullName, userId) => {
    const message = createMessage(to, fullName, userId);
    try {
      const info = await transporter.sendMail(message);
      console.log(`Email sent successfully: ${info.host}`);
    } catch (error) {
      console.error("Error sending verification email:", error);
      throw new Error("Failed to send verification email");
    }
  };
