const { Schema, model } = require('mongoose')

const Transaction = new Schema({
    transactionId: String,
    senderAddress: String,
    recipientsAddress: String,
    blockNumber: Number,
    blockConfirmationsCount: Number,
    date: Date,
    value: Number,
    transactionFee: Number
})

module.exports = model('Transaction', Transaction)
