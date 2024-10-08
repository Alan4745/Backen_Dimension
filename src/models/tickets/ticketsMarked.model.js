const mongoose = require('mongoose');
const { Schema } = mongoose;

const ticketsMarkedSchema = new Schema({
    amountTicketsMarked: {
        type: Number,
        required: true
    },
    location: {
        type: {
            type: String, // 'Point'
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number], // Array de números para coordenadas
            required: true
        }
    },
    idTickets: {
        type: Schema.Types.ObjectId, // referencia a los puntos a marcar en el mapa
        ref: 'Tickets',
        required: true
    },
    redeemed: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const TicketsMarked = mongoose.model('TicketsMarked', ticketsMarkedSchema);

module.exports = { TicketsMarked };
