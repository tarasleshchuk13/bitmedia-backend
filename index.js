const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()
const transactionRoute = require('./routes/transaction.route')
const transactionService = require('./services/transaction.service')

const app = express()

app.use(cors())
app.use('/transaction', transactionRoute)

const start = async () => {
    try {
        await mongoose.connect(process.env.DB_URL)
        const PORT = process.env.PORT || 5000
        
        app.listen(PORT, () => {
            console.log('Server started on port', PORT)
        })
        
        await transactionService.loadTransactions()
    } catch (e) {
        console.log(e)
    }
}

start()
