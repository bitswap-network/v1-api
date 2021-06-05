import { model, Schema, Document } from "mongoose";

export interface depthDoc extends Document {
  timestamp: Date;
  marketBuy: number;
  marketSell: number;
  asks: { price: number; quantity: number }[];
  bids: { price: number; quantity: number }[];
}

const depthSchema = new Schema<depthDoc>({
  timestamp: { type: Date, default: new Date() },
  marketBuy: { type: Number, required: true },
  marketSell: { type: Number, required: true },
  asks: [{ price: { type: Number }, quantity: { type: Number } }],
  bids: [{ price: { type: Number }, quantity: { type: Number } }],
});
const Depth = model<depthDoc>("Depth", depthSchema);

export default Depth;
