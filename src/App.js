import React, { useState } from "react";
import Papa from "papaparse";
import "./App.css";

function App() {
    const [data, setData] = useState([]);
    const [salesReport, setSalesReport] = useState(null);
    const [fileError, setFileError] = useState(null);

    // Function to handle file upload
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                const content = reader.result;
                parseCSV(content);
            };
            reader.onerror = () => setFileError("Error reading the file");
            reader.readAsText(file);
        }
    };

    // Parse CSV data
    const parseCSV = (content) => {
        Papa.parse(content, {
            header: true,
            skipEmptyLines: true,
            complete: (result) => {
                const salesData = result.data.map((row) => ({
                    date: row.Date,
                    sku: row.SKU,
                    unitPrice: parseFloat(row["Unit Price"]),
                    quantity: parseInt(row.Quantity),
                    totalPrice: parseFloat(row["Total Price"]),
                }));
                setData(salesData);
                generateSalesReport(salesData);
            },
        });
    };

    // Function to generate the sales report
    const generateSalesReport = (salesData) => {
        // Calculate Total Sales
        const totalSales = salesData.reduce(
            (acc, sale) => acc + sale.totalPrice,
            0
        );

        // Group data by month
        const salesByMonth = {};
        salesData.forEach((sale) => {
            const month = new Date(sale.date).toLocaleString("default", {
                month: "long",
                year: "numeric",
            });
            if (!salesByMonth[month]) salesByMonth[month] = [];
            salesByMonth[month].push(sale);
        });

        // Initialize report structure
        const report = {
            totalSales,
            monthlySales: {},
            mostPopularItem: {},
            highestRevenueItem: {},
            itemStatistics: {},
        };

        // Process monthly data
        Object.keys(salesByMonth).forEach((month) => {
            const monthData = salesByMonth[month];
            const monthTotalSales = monthData.reduce(
                (acc, sale) => acc + sale.totalPrice,
                0
            );

            // Find most popular item (most quantity sold)
            const itemQuantities = {};
            let mostPopular = { quantity: 0, sku: "" };
            monthData.forEach((sale) => {
                if (!itemQuantities[sale.sku]) itemQuantities[sale.sku] = 0;
                itemQuantities[sale.sku] += sale.quantity;

                if (itemQuantities[sale.sku] > mostPopular.quantity) {
                    mostPopular = {
                        quantity: itemQuantities[sale.sku],
                        sku: sale.sku,
                    };
                }
            });

            // Find highest revenue item
            const itemRevenue = {};
            let highestRevenue = { revenue: 0, sku: "" };
            monthData.forEach((sale) => {
                if (!itemRevenue[sale.sku]) itemRevenue[sale.sku] = 0;
                itemRevenue[sale.sku] += sale.totalPrice;

                if (itemRevenue[sale.sku] > highestRevenue.revenue) {
                    highestRevenue = {
                        revenue: itemRevenue[sale.sku],
                        sku: sale.sku,
                    };
                }
            });

            // Min, Max, Average orders for most popular item
            const popularItemData = monthData.filter(
                (sale) => sale.sku === mostPopular.sku
            );
            const orderCounts = popularItemData.map((sale) => sale.quantity);
            const minOrders = Math.min(...orderCounts);
            const maxOrders = Math.max(...orderCounts);
            const avgOrders =
                orderCounts.reduce((sum, count) => sum + count, 0) /
                orderCounts.length;

            // Store the results
            report.monthlySales[month] = monthTotalSales;
            report.mostPopularItem[month] = mostPopular.sku;
            report.highestRevenueItem[month] = highestRevenue.sku;
            report.itemStatistics[month] = {
                minOrders,
                maxOrders,
                avgOrders,
            };
        });

        setSalesReport(report);
    };
    return (
        <div className="App">
            <h1>Sales Report Generator</h1>
            <div className="file-input">
                <span>Upload the data : </span>
                <input
                    type="file"
                    accept=".txt,.csv"
                    onChange={handleFileUpload}
                />
                {fileError && <div style={{ color: "red" }}>{fileError}</div>}
            </div>

            {salesReport && (
                <div className="report-container">
                    <h2>Total Sales: ${salesReport.totalSales.toFixed(2)}</h2>
                    <h3>Monthly Sales Totals:</h3>
                    <table>
                        <thead>
                            <th>Month</th>
                            <th>Sale</th>
                        </thead>
                        <tbody>
                            {Object.keys(salesReport.monthlySales).map(
                                (month) => (
                                    <tr>
                                        <td>{month}</td>
                                        <td>
                                            $
                                            {salesReport.monthlySales[
                                                month
                                            ].toFixed(2)}
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>

                    <h3>Most Popular Item (Most Quantity Sold) per Month:</h3>
                    <table>
                        <thead>
                            <th>Month</th>
                            <th>Most Popular Item</th>
                        </thead>
                        <tbody>
                            {Object.keys(salesReport.mostPopularItem).map(
                                (month) => (
                                    <tr>
                                        <td>{month}</td>
                                        <td>
                                            {salesReport.mostPopularItem[month]}
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>

                    <h3>Items Generating Most Revenue per Month:</h3>
                    <table>
                        <thead>
                            <th>Month</th>
                            <th>Items Generating Most Revenue</th>
                        </thead>
                        <tbody>
                            {Object.keys(salesReport.highestRevenueItem).map(
                                (month) => (
                                    <tr>
                                        <td>{month}</td>
                                        <td>
                                            {
                                                salesReport.highestRevenueItem[
                                                    month
                                                ]
                                            }
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>

                    <h3>
                        Most Popular Item Statistics (Min, Max, Avg Orders):
                    </h3>
                    <table>
                        <thead>
                            <th>Month</th>
                            <th>Minimun Order </th>
                            <th>Maxmimum Order </th>
                            <th>Average Orders </th>
                        </thead>
                        <tbody>
                            {Object.keys(salesReport.itemStatistics).map(
                                (month) => (
                                    <tr>
                                        <td>{month}</td>
                                        <td>
                                            {
                                                salesReport.itemStatistics[
                                                    month
                                                ].minOrders
                                            }
                                        </td>
                                        <td>
                                            {
                                                salesReport.itemStatistics[
                                                    month
                                                ].maxOrders
                                            }
                                        </td>
                                        <td>
                                            {salesReport.itemStatistics[
                                                month
                                            ].avgOrders.toFixed(2)}
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default App;
