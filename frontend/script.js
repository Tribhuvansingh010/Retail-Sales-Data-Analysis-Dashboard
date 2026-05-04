let salesData = [];
let customersData = [];
let productsData = [];

let filteredSales = [];
let filteredCustomers = [];
let filteredProducts = [];

let isSearching = false;

// TABLE
function createTable(tableId, data) {
    const table = document.getElementById(tableId);
    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");

    thead.innerHTML = "";
    tbody.innerHTML = "";

    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const tr = document.createElement("tr");

    headers.forEach(h => {
        const th = document.createElement("th");
        th.textContent = h.replace(/_/g, " ");
        tr.appendChild(th);
    });

    thead.appendChild(tr);

    data.forEach(row => {
        const tr = document.createElement("tr");
        headers.forEach(h => {
            const td = document.createElement("td");
            td.textContent = row[h];
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

//  SUMMARY
function updateSummary() {
    const totalRevenue = filteredSales.reduce(
        (sum, s) => sum + Number(s.revenue || 0), 0
    );

    document.querySelector("#total-sales p").textContent = `₹${totalRevenue}`;
    document.querySelector("#total-customers p").textContent =
        new Set(filteredSales.map(s => s.customer_id)).size;
    document.querySelector("#total-products p").textContent =
        new Set(filteredSales.map(s => s.product_id)).size;
}

//  SEARCH & RESET
function performSearch() {
    isSearching = true;

    const value = document.getElementById("search-input").value.toLowerCase();

    filteredSales = salesData.filter(s =>
        Object.values(s).join(" ").toLowerCase().includes(value)
    );

    filteredCustomers = customersData.filter(c =>
        Object.values(c).join(" ").toLowerCase().includes(value)
    );

    filteredProducts = productsData.filter(p =>
        Object.values(p).join(" ").toLowerCase().includes(value)
    );

    createTable("sales-table", filteredSales);
    createTable("customers-table", filteredCustomers);
    createTable("products-table", filteredProducts);
    updateSummary();
}

document.getElementById("search-btn").onclick = performSearch;

document.getElementById("reset-btn").onclick = () => {
    document.getElementById("search-input").value = "";
    isSearching = false;

    filteredSales = [...salesData];
    filteredCustomers = [...customersData];
    filteredProducts = [...productsData];

    createTable("sales-table", filteredSales);
    createTable("customers-table", filteredCustomers);
    createTable("products-table", filteredProducts);
    updateSummary();
    recreateCharts();
};

//CHART HANDLING 
function recreateCharts() {
    ["productsChart", "salesChart", "customersChart"].forEach(id => {
        const oldCanvas = document.getElementById(id);
        const newCanvas = oldCanvas.cloneNode(true);
        oldCanvas.parentNode.replaceChild(newCanvas, oldCanvas);
    });
    createCharts();
}

function createCharts() {
    // PRODUCT REVENUE
    const productRevenue = {};
    salesData.forEach(s => {
        productRevenue[s.product_id] =
            (productRevenue[s.product_id] || 0) + Number(s.revenue || 0);
    });

    new Chart(document.getElementById("productsChart"), {
        type: "bar",
        data: {
            labels: Object.keys(productRevenue),
            datasets: [{
                label: "Revenue",
                data: Object.values(productRevenue),
                backgroundColor: "#3b82f6"
            }]
        }
    });

    //MONTHLY SALES
    const monthlyRevenue = {};
    salesData.forEach(s => {
        if (!s.order_date) return;

        const [m, d, y] = s.order_date.split("/");
        const key = `${y}-${m.padStart(2, "0")}`;

        monthlyRevenue[key] =
            (monthlyRevenue[key] || 0) + Number(s.revenue || 0);
    });

    new Chart(document.getElementById("salesChart"), {
        type: "line",
        data: {
            labels: Object.keys(monthlyRevenue),
            datasets: [{
                label: "Revenue",
                data: Object.values(monthlyRevenue),
                fill: true,
                borderColor: "#10b981",
                backgroundColor: "rgba(16,185,129,0.2)"
            }]
        }
    });

    //REGION
    const regionCount = {};
    customersData.forEach(c => {
        if (!c.city) return;

        const city = c.city.trim().toLowerCase();
        regionCount[city] = (regionCount[city] || 0) + 1;
    });

    new Chart(document.getElementById("customersChart"), {
        type: "pie",
        data: {
            labels: Object.keys(regionCount).map(c => c.toUpperCase()),
            datasets: [{
                data: Object.values(regionCount),
                backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"]
            }]
        }
    });
}

//DATA LOADING
async function loadData() {
    try {
        const [sales, customers, products] = await Promise.all([
            fetch("data/sales.json?" + Date.now()).then(r => r.json()),
            fetch("data/customers.json?" + Date.now()).then(r => r.json()),
            fetch("data/products.json?" + Date.now()).then(r => r.json())
        ]);

        salesData = sales;
        customersData = customers;
        productsData = products;

        filteredSales = [...salesData];
        filteredCustomers = [...customersData];
        filteredProducts = [...productsData];

        createTable("sales-table", filteredSales);
        createTable("customers-table", filteredCustomers);
        createTable("products-table", filteredProducts);

        updateSummary();
        recreateCharts();
    } catch (err) {
        console.error("Error loading data");
    }
}

loadData();

// FILE UPLOAD 
const uploadForm = document.getElementById("upload-form");

if (uploadForm) {
    uploadForm.addEventListener("submit", async e => {
        e.preventDefault();

        const input = document.getElementById("file-input");
        const status = document.getElementById("upload-status");

        if (!input.files.length) {
            status.textContent = " Select file first";
            return;
        }

        const formData = new FormData();
        for (let f of input.files) {
            formData.append("file", f);
        }

        try {
            const res = await fetch("/upload", {
                method: "POST",
                body: formData
            });

            if (res.ok) {
                status.textContent = " Upload successful";
                setTimeout(loadData, 1500);
            } else {
                status.textContent = " Upload failed";
            }
        } catch (err) {
            status.textContent = " Server not running";
        }

        input.value = "";
    });
}