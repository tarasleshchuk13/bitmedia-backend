const axios = require('axios')
const Transaction = require('../models/transaction.model')

class TransactionService {
    
    isLoadingTransactions = false
    
    async loadTransactions() {
        const transactionCountInDB = await Transaction.countDocuments()
        
        if (transactionCountInDB === 0) {
            const lastBlockNumber = await this.getLastBlockNumber()
            await this.loadTransactionsFromLastBlocks(lastBlockNumber, 1000)
        }
        
        setInterval(async () => {
            if (this.isLoadingTransactions) {
                return
            }
            
            const transactionWithMaxBlockNumberInDB = await Transaction
                .findOne()
                .sort({ blockNumber: -1 })
            
            const maxBlockNumberInDB = transactionWithMaxBlockNumberInDB.blockNumber
            const lastBlockNumber = await this.getLastBlockNumber()
            
            if (lastBlockNumber > maxBlockNumberInDB) {
                const newBlocksCount = lastBlockNumber - maxBlockNumberInDB
                await this.addConfirmationsToRow(newBlocksCount)
                await this.loadTransactionsFromLastBlocks(lastBlockNumber, newBlocksCount)
            }
        }, 1000 * 20)
    }
    
    async loadTransactionsFromLastBlocks(lastBlockNumber, blocksCount) {
        this.isLoadingTransactions = true
        
        for (let i = lastBlockNumber - blocksCount + 1; i <= lastBlockNumber; i++) {
            const url = `https://api.etherscan.io/api?module=proxy&action=eth_getBlockByNumber&tag=${i.toString(16)}&boolean=true&apikey=${process.env.ETHERSCAN_API_KEY}`
            const blockData = await axios.get(url)
            const transactions = blockData.data?.result?.transactions
            const blockNumber = +blockData.data?.result?.number
            
            if (!transactions) {
                continue
            }
            
            for (let transaction of transactions) {
                const newTransaction = new Transaction({
                    transactionId: transaction.hash,
                    senderAddress: transaction.from,
                    recipientsAddress: transaction.to,
                    blockNumber,
                    blockConfirmationsCount: lastBlockNumber - i,
                    date: new Date(+blockData.data.result.timestamp * 1000),
                    value: +transaction.value / 1e18,
                    transactionFee: +transaction.gasPrice / 1e18
                })
                
                await newTransaction.save()
            }
        }
        
        this.isLoadingTransactions = false
    }
    
    async addConfirmationsToRow(confirmationsCount) {
        await Transaction.updateMany(
            {},
            { $inc: { blockConfirmationsCount: confirmationsCount } },
            { multi: true }
        )
    }
    
    async getLastBlockNumber() {
        const url = `https://api.etherscan.io/api?module=proxy&action=eth_blockNumber&apikey=${process.env.ETHERSCAN_API_KEY}`
        const lastBlockData = await axios.get(url)
        return +lastBlockData.data.result
    }
    
    async getTransaction(queryParams) {
        let findOptions = {}
        
        if (queryParams.address) {
            findOptions = {
                $or: [
                    { senderAddress: queryParams.address },
                    { recipientsAddress: queryParams.address }
                ]
            }
        } else if (queryParams.blockNumber) {
            findOptions = { blockNumber: queryParams.blockNumber }
        } else if (queryParams.transactionId) {
            findOptions = { transactionId: queryParams.transactionId }
        }
    
        const transactionCount = await Transaction.countDocuments(findOptions)
        const transactions = await Transaction
            .find(findOptions)
            .limit(queryParams.limit)
            .skip(queryParams.skip)
    
        return {
            transactionCount,
            transactions
        }
    }
    
}

module.exports = new TransactionService()
