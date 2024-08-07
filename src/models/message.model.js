const mongoose = require('mongoose');

const { Schema } = mongoose;

const MessageSchema = new Schema({
	conversationId: {
		type: String,
	},
	sender: {
		type: String,
	},
	text: {
		type: String,
	},
}, { timestamps: true });

module.exports = mongoose.model('Messages', MessageSchema);
