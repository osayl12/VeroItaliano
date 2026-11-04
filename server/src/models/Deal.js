import mongoose from 'mongoose';

const i18n = { he: { type: String, default: '' }, ar: { type: String, default: '' } };

const dealSchema = new mongoose.Schema(
  {
    title: i18n,
    description: i18n,
    image: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0, default: null },
    startAt: { type: Date, required: true, default: Date.now },
    endAt: { type: Date, required: true },
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }],
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

dealSchema.pre('validate', function (next) {
  if (this.endAt && this.startAt && this.endAt <= this.startAt) {
    return next(new Error('endAt must be after startAt'));
  }
  next();
});

export default mongoose.model('Deal', dealSchema);
