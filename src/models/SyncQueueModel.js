const mongoose = require('mongoose');

const SyncQueueSchema = new mongoose.Schema({
  collectionName: String, // mudei para não conflitar com a palavra reservada 'collection'
  action: String,
  payload: Object,
  attempts: { type: Number, default: 0 },
  lastError: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = SyncQueueSchema;