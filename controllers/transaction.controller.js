const transactionService = require('../services/transaction.service')

class TransactionController {
    
    async getTransaction(req, res) {
        try {
            const transactions = await transactionService.getTransaction(req.query)
            res.send(transactions)
        } catch (e) {
            res.status(500).send({ message: 'Server error' })
        }
    }
}

module.exports = new TransactionController()
