import mongoose, { Schema, Document } from 'mongoose';

export interface ILocation extends Document {
  userId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  timestamp: Date;
}

const LocationSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  coordinates: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.models.Location || mongoose.model<ILocation>('Location', LocationSchema);