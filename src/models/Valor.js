import { Schema, model, models } from 'mongoose';

const valorSchema = new Schema({
  userId:  { type: String, required: true },
  guildId: { type: String, required: true },
  valor:   { type: Number, default: 0 },
}, { timestamps: true });

valorSchema.index({ userId: 1, guildId: 1 }, { unique: true });

export default models.Valor || model('Valor', valorSchema);
