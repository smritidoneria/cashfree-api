import { connectDB } from "../../lib/mongodb";
import Payment from "../../models/payments";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  // ✅ Always set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // ✅ Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).json({ message: "CORS preflight OK" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { order_id, name, email, phone, amount, collegeYear, date, time } = req.body;


  try {
    await connectDB();

    // Save payment to MongoDB
    const payment = await Payment.create({
      orderId: order_id,
      name,
      email,
      phone,
      amount,
      collegeYear,  // new
      date,         // new
      time,         // new
      status: "SUCCESS",
    });
    const savedPayment = await Payment.findOne({ orderId: order_id });
    if (!savedPayment) {
      console.error("❌ Payment was not saved in MongoDB");
      return res.status(500).json({ error: "Payment not saved in database" });
    }

    console.log("✅ Payment stored successfully:", savedPayment);

    // Send confirmation email
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true, // 465 if using SSL
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"ClearPath to SDE" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Payment Successful - ClearPath to SDE",
      html: `
        <h2>Hi ${name},</h2>
        <p>✅ Your payment of <b>₹${amount}</b> was successful!</p>
        <p>Workshop Details:</p>
        <ul>
          <li>Date: 22nd Sept</li>
          <li>Time: 6-7 PM</li>
        </ul>
        <p>We’ll see you in the session 🚀</p>
      `,
    });

    return res
      .status(200)
      .json({ message: "Payment saved & email sent", payment });
  } catch (err) {
    console.error("❌ Error saving payment:", err);
    return res
      .status(500)
      .json({ error: "Failed to process payment", details: err.message });
  }
}
