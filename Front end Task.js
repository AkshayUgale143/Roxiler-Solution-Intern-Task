
// Create Transactions Table 

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TransactionsTable = () => {
    const [transactions, setTransactions] = useState([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [month, setMonth] = useState('03');

    useEffect(() => {
        axios.get(`/transactions`, { params: { page, search, month } })
            .then(response => setTransactions(response.data))
            .catch(error => console.error(error));
    }, [page, search, month]);

    return (
        <div>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transactions..." />
            <select value={month} onChange={e => setMonth(e.target.value)}>
                {/* Month options */}
            </select>
            <table>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Price</th>
                        <th>Date of Sale</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map(transaction => (
                        <tr key={transaction._id}>
                            <td>{transaction.title}</td>
                            <td>{transaction.description}</td>
                            <td>{transaction.price}</td>
                            <td>{transaction.dateOfSale}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button onClick={() => setPage(page - 1)} disabled={page === 1}>Previous</button>
            <button onClick={() => setPage(page + 1)}>Next</button>
        </div>
    );
};

export default TransactionsTable;


//Chart Components

import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import axios from 'axios';

const BarChart = ({ month }) => {
    const [chartData, setChartData] = useState({});

    useEffect(() => {
        axios.get(`/bar-chart`, { params: { month } })
            .then(response => {
                const labels = response.data.map(item => item.range);
                const data = response.data.map(item => item.count);
                setChartData({
                    labels,
                    datasets: [
                        {
                            label: 'Price Range',
                            data,
                            backgroundColor: 'rgba(75, 192, 192, 0.6)'
                        }
                    ]
                });
            })
            .catch(error => console.error(error));
    }, [month]);

    return (
        <div>
            <Bar data={chartData} />
        </div>
    );
};

export default BarChart;


