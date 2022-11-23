const Router = require('express')
const router = new Router()
const transactionController = require('../controllers/transaction.controller')

router.get('/', transactionController.getTransaction)

module.exports = router
