import { model, Schema, Document } from "mongoose";

export interface orderDoc extends Document {
  username: string;
  created: Date;
  orderID: string;
  orderSide: string;
  orderType: string;
  etherQuantity: number;
  orderQuantity: number;
  orderPrice: number;
  fees: number | undefined;
  execPrice: number | undefined;
  orderQuantityProcessed: number;
  complete: boolean;
  error: string | undefined;
  completeTime: Date | undefined;
}

const orderSchema = new Schema<orderDoc>({
  username: { type: String, required: true },
  created: { type: Date, default: new Date() },
  orderID: { type: String, required: true },
  orderSide: { type: String, required: true, enum: ["buy", "sell"] },
  orderType: { type: String, required: true, enum: ["limit", "market"] },
  orderQuantity: { type: Number, required: true },
  etherQuantity: { type: Number },
  orderPrice: { type: Number },
  execPrice: { type: Number },
  fees: { type: Number },
  orderQuantityProcessed: { type: Number },
  complete: { type: Boolean, default: false },
  error: { type: String, default: undefined },
  completeTime: { type: Date },
});
const Order = model<orderDoc>("Order", orderSchema);

export default Order;
