import mongoose from "mongoose";

const Schema = mongoose.Schema;

const eventSchema = new Schema(
  {
    _id: Schema.Types.ObjectId,
    user: { type: Schema.ObjectId, ref: "user", required: true },
    order: { type: Schema.ObjectId, ref: "order", required: false },
   // series: { type: Schema.ObjectId, ref: "eventSeries", required: false },
    title: { type: String, required: true },
    description: { type: String, required: false },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    allDay: { type: Boolean, required: true, default: false },
    location: { type: String, required: false },
    color: { type: String, required: true, default: "#000000" },
    createdAt: { type: Date, required: true, default: Date.now() },
    updatedAt: { type: Date, required: true, default: Date.now() },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("event", eventSchema);
