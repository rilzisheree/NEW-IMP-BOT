import { Schema, model, models } from 'mongoose';

const valorChannelSchema = new Schema({
  guildId:   { type: String, required: true, unique: true },
  channelId: { type: String, required: true },
}, { timestamps: true });

export default models.ValorChannel || model('ValorChannel', valorChannelSchema);
