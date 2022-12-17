import mongoose from "mongoose";

const Schema = mongoose.Schema;

const caregiverSchema = new Schema({

_id: Schema.Types.ObjectId,

user: { type: Schema.ObjectId, ref: "user", required: true },

services: [{ type: Schema.ObjectId, ref: "service", required: false }],

reviews: [{ type: Schema.ObjectId, ref: "review", required: false }],

rating: { type: Number, required: false },


});

// methods

caregiverSchema.methods.getRating = function() {

let rating = 0;

this.reviews.forEach(review => {

rating += review.rating;

});

return rating / this.reviews.length;

};





export default mongoose.model("caregiverInformation", caregiverSchema);