const mongoose = require('mongoose');

const { Schema } = mongoose;

const PostTypeBSchema = new Schema({
	communityId: {
		type: String,
	}, 
	communityName: {
		type: String,
	},
	title: {
		type: String,
		require: true,
	}, 
	desc: {
		type: String,
		max: true,
	}, 
	imagenPostTypeB: {
		public_id: {
			type: String,
			default: '',
		},
		secure_url: {
			type: String,
			default: '',
		}
	}, 
	likes: {
		type: Array,
		default: [],
	}, 
	comentarios: {
		type: Array, 
		default: [],
	},
	typePost: {
		type: String,
		default: 'PostTypeB'
	}
});

module.exports = mongoose.model('postTypeBs', PostTypeBSchema);