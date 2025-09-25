import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  amount: { type: Number, required: true },
  collegeYear: { type: String, required: true },  // new field
  date: { type: String, required: true },         // new field
  time: { type: String, required: true },         // new field
  status: { type: String, required: true, default: "PENDING" }, // SUCCESS / FAILED / PENDING
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);
