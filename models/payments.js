import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
  orderId: String,
  name: String,
  email: String,
  phone: String,
  amount: Number,
  status: String, // SUCCESS / FAILED / PENDING
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);
