import nodemailer from 'nodemailer';

// Create a transporter object using your email service (Gmail in this case)
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use Gmail for this example (or use your SMTP provider)
  auth: {
    user: process.env.EMAIL_SERVICE, // Your Gmail email address
    pass: process.env.EMAIL_PASSWORD, // Your Gmail password or app-specific password
  },
});

export default transporter;
