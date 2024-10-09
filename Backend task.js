// Initialize the Database

const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const app = express();


mongoose.connect('mongodb://localhost:27017/transactionsDB', { useNewUrlParser: true, useUnifiedTopology: true });


const transactionSchema = new mongoose.Schema({
    title: String,
    description: String,
    price: Number,
    category: String,
    sold: Boolean,
    dateOfSale: Date
});

const Transaction = mongoose.model('Transaction', transactionSchema);

app.get('/seed-database', async (req, res) => {
    try {
        const { data } = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
        await Transaction.insertMany(data);
        res.status(200).send('Database seeded successfully');
    } catch (error) {
        res.status(500).send('Error seeding database: ' + error.message);
    }
});


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

//API to List All Transactions

app.get('/transactions', async (req, res) => {
    const { page = 1, perPage = 10, search = '', month } = req.query;

    const query = {
        dateOfSale: { $gte: new Date(`2023-${month}-01`), $lt: new Date(`2023-${month}-31`) },
        $or: [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { price: { $regex: search, $options: 'i' } }
        ]
    };

    try {
        const transactions = await Transaction.find(query)
            .skip((page - 1) * perPage)
            .limit(parseInt(perPage));
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// API for statistics
app.get('/statistics', async (req, res) => {
    const { month } = req.query;

    try {
        const totalSold = await Transaction.countDocuments({ sold: true, dateOfSale: { $gte: new Date(`2023-${month}-01`), $lt: new Date(`2023-${month}-31`) } });
        const totalNotSold = await Transaction.countDocuments({ sold: false, dateOfSale: { $gte: new Date(`2023-${month}-01`), $lt: new Date(`2023-${month}-31`) } });
        const totalSaleAmount = await Transaction.aggregate([
            { $match: { sold: true, dateOfSale: { $gte: new Date(`2023-${month}-01`), $lt: new Date(`2023-${month}-31`) } } },
            { $group: { _id: null, total: { $sum: "$price" } } }
        ]);
        res.json({ totalSold, totalNotSold, totalSaleAmount: totalSaleAmount[0]?.total || 0 });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});



 // API for bar chart

app.get('/bar-chart', async (req, res) => {
    const { month } = req.query;

    const priceRanges = [
        { range: '0-100', min: 0, max: 100 },
        { range: '101-200', min: 101, max: 200 },
       
    ];

    try {
        const priceData = await Promise.all(priceRanges.map(async (range) => {
            const count = await Transaction.countDocuments({
                price: { $gte: range.min, $lte: range.max },
                dateOfSale: { $gte: new Date(`2023-${month}-01`), $lt: new Date(`2023-${month}-31`) }
            });
            return { range: range.range, count };
        }));
        res.json(priceData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// API for pie chart
app.get('/pie-chart', async (req, res) => {
    const { month } = req.query;

    try {
        const categoryData = await Transaction.aggregate([
            {
                $match: { dateOfSale: { $gte: new Date(`2023-${month}-01`), $lt: new Date(`2023-${month}-31`) } }
            },
            {
                $group: { _id: "$category", count: { $sum: 1 } }
            }
        ]);
        res.json(categoryData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

