import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  vendorId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  deliveryPartnerId?: mongoose.Types.ObjectId;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  deliveryAddress: string;
  status: 'pending' | 'assigned' | 'in-progress' | 'delivered' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    deliveryPartnerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    items: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    deliveryAddress: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'in-progress', 'delivered', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);