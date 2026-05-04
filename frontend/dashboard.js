let salesData = [];
let customersData = [];
let productsData = [];

let filteredSales = [];
let filteredCustomers = [];
let filteredProducts = [];

let autoRefreshEnabled = true;
let lastHash = "";

//  TABLE CREATION 
function createTable(tableId, data) {
    const table = document.getElementById(tableId);
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');

    thead.innerHTML = '';
    tbody.innerHTML = '';

    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const headerRow = document.createElement('tr');

    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header.replace(/_/g, " ");
        th.onclick = () => sortTable(tableId, header);
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);

    data.forEach(item => {
        const row = document.createElement('tr');
        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = item[header];
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });
}

//  SORTING
function sortTable(tableId, key) {
    const tableMap = {
        'sales-table': filteredSales,
        'customers-table': filteredCustomers,
        'products-table': filteredProducts
    };

    let dataArray = tableMap[tableId];

    dataArray.sort((a, b) => {
        if (a[key] < b[key]) return -1;
        if (a[key] > b[key]) return 1;
        return 0;
    });

    createTable(tableId, dataArray);
}

// SUMMARY CARD
function updateSummary() {
    const totalRevenue = filteredSales.reduce(
        (sum, s) => sum + Number(s.revenue || 0), 0
    );

    document.querySelector('#total-sales p').textContent = `₹${totalRevenue}`;
    document.querySelector('#total-customers p').textContent =
        new Set(filteredSales.map(s => s.customer_id)).size;
    document.querySelector('#total-products p').textContent =
        new Set(filteredSales.map(s => s.product_id)).size;
}

// SEARCH
function performSearch() {
    autoRefreshEnabled = false;

    const value = document.getElementById('search-input').value.toLowerCase();

    filteredSales = salesData.filter(s =>
        Object.values(s).join(" ").toLowerCase().includes(value)
    );

    filteredCustomers = customersData.filter(c =>
        Object.values(c).join(" ").toLowerCase().includes(value)
    );

    filteredProducts = productsData.filter(p =>
        Object.values(p).join(" ").toLowerCase().includes(value)
    );

    createTable('sales-table', filteredSales);
    createTable('customers-table', filteredCustomers);
    createTable('products-table', filteredProducts);
    updateSummary();
}

document.getElementById('search-btn').addEventListener('click', performSearch);

document.getElementById('search-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') performSearch();
});

document.getElementById('reset-btn').addEventListener('click', () => {
    document.getElementById('search-input').value = "";
    autoRefreshEnabled = true;

    filteredSales = [...salesData];
    filteredCustomers = [...customersData];
    filteredProducts = [...productsData];

    createTable('sales-table', filteredSales);
    createTable('customers-table', filteredCustomers);
    createTable('products-table', filteredProducts);
    updateSummary();
});

//  CHARTS 
function createCharts() {
    // Top Products by Revenue
    const productRevenue = {};
    salesData.forEach(s => {
        const revenue = Number(s.revenue || 0);
        if (!productRevenue[s.product_id]) productRevenue[s.product_id] = 0;
        productRevenue[s.product_id] += revenue;
    });

    const topProducts = Object.entries(productRevenue)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    new Chart(document.getElementById('productsChart'), {
        type: 'bar',
        data: {
            labels: topProducts.map(p => p[0]),
            datasets: [{
                label: "Revenue",
                data: topProducts.map(p => p[1]),
                backgroundColor: "#3b82f6"
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });

    // Monthly Sales Trend
    const monthRevenue = {};
    salesData.forEach(s => {
        if (!s.order_date) return;

        const date = new Date(s.order_date);
        if (isNaN(date)) return;

        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,'0')}`;
        monthRevenue[month] = (monthRevenue[month] || 0) + Number(s.revenue || 0);
    });

    const sortedMonths = Object.keys(monthRevenue).sort();

    new Chart(document.getElementById('salesChart'), {
        type: 'line',
        data: {
            labels: sortedMonths,
            datasets: [{
                label: "Revenue",
                data: sortedMonths.map(m => monthRevenue[m]),
                fill: true,
                borderColor: "#10b981",
                backgroundColor: "rgba(16,185,129,0.2)"
            }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });

    // Customers by Region
    const regionOrders = {};
    salesData.forEach(s => {
        const region = s.region || s.city || "Unknown";
        regionOrders[region] = (regionOrders[region] || 0) + 1;
    });

    new Chart(document.getElementById('customersChart'), {
        type: 'pie',
        data: {
            labels: Object.keys(regionOrders),
            datasets: [{
                data: Object.values(regionOrders),
                backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]
            }]
        }
    });
}

//FETCH JSON
async function loadData() {
    try {
        const [sales, customers, products] = await Promise.all([
            fetch('data/sales.json').then(r => r.json()),
            fetch('data/customers.json').then(r => r.json()),
            fetch('data/products.json').then(r => r.json())
        ]);

        salesData = sales;
        customersData = customers;
        productsData = products;

        filteredSales = [...salesData];
        filteredCustomers = [...customersData];
        filteredProducts = [...productsData];

        createTable('sales-table', filteredSales);
        createTable('customers-table', filteredCustomers);
        createTable('products-table', filteredProducts);

        updateSummary();
        createCharts();
    } catch (err) {
        console.error("Error loading data");
    }
}

loadData();

//AUTO REFRESH 
async function autoRefreshData() {
    if (!autoRefreshEnabled) return;

    try {
        const [sales, customers, products] = await Promise.all([
            fetch("data/sales.json?" + Date.now()).then(r => r.json()),
            fetch("data/customers.json?" + Date.now()).then(r => r.json()),
            fetch("data/products.json?" + Date.now()).then(r => r.json())
        ]);

        const currentHash = JSON.stringify(sales) + JSON.stringify(customers) + JSON.stringify(products);

        if (currentHash !== lastHash) {
            lastHash = currentHash;

            salesData = sales;
            customersData = customers;
            productsData = products;

            filteredSales = [...salesData];
            filteredCustomers = [...customersData];
            filteredProducts = [...productsData];

            createTable('sales-table', filteredSales);
            createTable('customers-table', filteredCustomers);
            createTable('products-table', filteredProducts);
            updateSummary();

            ["productsChart", "salesChart", "customersChart"].forEach(id => {
                const old = document.getElementById(id);
                old.replaceWith(old.cloneNode());
            });

            createCharts();
        }
    } catch (err) {
        console.error("Auto refresh error");
    }
}

// Increased interval
setInterval(autoRefreshData, 15000);

//  MANUAL REFRESH 
document.getElementById('refresh-btn').addEventListener('click', async () => {
    autoRefreshEnabled = true;
    await autoRefreshData();
});

