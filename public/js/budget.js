document.addEventListener('DOMContentLoaded', () => {
    console.log('Budget.js loaded');
    let currentDate = new Date();
    let currentBudget = null;

    // Initialize the budget view
    async function initializeBudget() {
        console.log('Initializing budget');
        try {
            await loadBudget(currentDate);
            setupEventListeners();
        } catch (error) {
            console.error('Error initializing budget:', error);
            document.getElementById('budget-container').innerHTML = 
                '<p style="color: red;">Error loading budget. Please check console.</p>';
        }
    }

    // Load budget for specific month
    async function loadBudget(date) {
        try {
            console.log('Fetching budget for:', date);
            const response = await fetch(`/api/budgets/${date.getFullYear()}/${date.getMonth() + 1}`);
            console.log('Response:', response);
            currentBudget = await response.json();
            console.log('Loaded budget:', currentBudget);
            renderBudget();
        } catch (error) {
            console.error('Error loading budget:', error);
            document.getElementById('budget-container').innerHTML = 
                '<p style="color: red;">Error loading budget. Check console for details.</p>';
        }
    }

    // Render the budget interface
    function renderBudget() {
        const budgetContainer = document.getElementById('budget-container');
        
        const html = `
            <div class="app-container">
                <nav class="sidebar">
                    <div class="logo">
                        <h2>My Budget</h2>
                    </div>
                    <ul class="nav-items">
                        <li class="active"><i class="fas fa-chart-pie"></i> Budget</li>
                        <li><i class="fas fa-chart-line"></i> Reports</li>
                        <li><i class="fas fa-wallet"></i> All Accounts</li>
                    </ul>
                </nav>
                
                <main class="main-content">
                    <div class="budget-header">
                        <div class="month-selector">
                            <button class="month-nav" id="prev-month">&lt;</button>
                            <h2>${currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                            <button class="month-nav" id="next-month">&gt;</button>
                        </div>
                        <div class="ready-to-assign">
                            <span>Ready to Assign</span>
                            <div class="amount">$${currentBudget?.readyToAssign?.toFixed(2) || '0.00'}</div>
                        </div>
                    </div>

                    <div class="budget-toolbar">
                        <div class="toolbar-left">
                            <button class="btn-link" id="add-category-group">+ Category Group</button>
                            <button class="btn-link">Undo</button>
                            <button class="btn-link">Redo</button>
                        </div>
                        <div class="toolbar-right">
                            <button class="btn-primary">Auto-Assign</button>
                        </div>
                    </div>

                    <div class="budget-table-container">
                        <table class="budget-table">
                            <thead>
                                <tr>
                                    <th class="category-col">CATEGORY</th>
                                    <th class="amount-col">ASSIGNED</th>
                                    <th class="amount-col">ACTIVITY</th>
                                    <th class="amount-col">AVAILABLE</th>
                                    <th class="actions-col"></th>
                                </tr>
                            </thead>
                            <tbody>
                                ${currentBudget?.groups.map(group => `
                                    <tr class="group-header" data-group-id="${group._id}">
                                        <td colspan="5">
                                            <div class="group-name">
                                                <span class="collapse-icon">▼</span>
                                                <span class="editable-group-name" contenteditable="true">${group.name}</span>
                                                <button class="btn-link add-category-btn">+ Category</button>
                                            </div>
                                        </td>
                                    </tr>
                                    ${group.categories.map(category => `
                                        <tr class="category-row" data-category-id="${category._id}">
                                            <td class="category-name">
                                                <div class="category-progress">
                                                    <div class="progress-bar" style="width: ${calculateProgress(category)}%"></div>
                                                    <span class="editable-category-name" contenteditable="true">${category.name}</span>
                                                </div>
                                            </td>
                                            <td class="amount-cell">
                                                <input type="number" 
                                                    class="amount-input" 
                                                    value="${category.budgeted}" 
                                                    step="0.01"
                                                    data-category-id="${category._id}">
                                            </td>
                                            <td class="amount-cell ${category.activity < 0 ? 'negative' : ''}">${formatAmount(category.activity)}</td>
                                            <td class="amount-cell ${(category.budgeted + category.activity) < 0 ? 'negative' : ''}">${formatAmount(category.budgeted + category.activity)}</td>
                                            <td class="actions-cell">
                                                <button class="btn-delete" title="Delete category">×</button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                    <tr class="group-total">
                                        <td>Total ${group.name}</td>
                                        <td>${formatAmount(calculateGroupTotal(group, 'budgeted'))}</td>
                                        <td>${formatAmount(calculateGroupTotal(group, 'activity'))}</td>
                                        <td>${formatAmount(calculateGroupTotal(group, 'available'))}</td>
                                        <td></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </main>
            </div>
        `;

        budgetContainer.innerHTML = html;
        setupEventListeners();
    }

    function calculateProgress(category) {
        const spent = Math.abs(category.activity);
        const budgeted = category.budgeted;
        return budgeted > 0 ? (spent / budgeted) * 100 : 0;
    }

    function formatAmount(amount) {
        return `$${Math.abs(amount).toFixed(2)}`;
    }

    function calculateGroupTotal(group, field) {
        if (field === 'available') {
            return group.categories.reduce((sum, cat) => sum + (cat.budgeted + cat.activity), 0);
        }
        return group.categories.reduce((sum, cat) => sum + cat[field], 0);
    }

    // Setup event listeners
    function setupEventListeners() {
        // Month navigation
        document.getElementById('prev-month').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            loadBudget(currentDate);
        });

        document.getElementById('next-month').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            loadBudget(currentDate);
        });

        // Budget amount inputs
        document.querySelectorAll('.amount-input').forEach(input => {
            input.addEventListener('change', async (e) => {
                const categoryId = e.target.dataset.categoryId;
                const newAmount = parseFloat(e.target.value);

                try {
                    const response = await fetch(
                        `/api/budgets/${currentDate.getFullYear()}/${currentDate.getMonth() + 1}/categories/${categoryId}`,
                        {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ budgeted: newAmount })
                        }
                    );
                    currentBudget = await response.json();
                    renderBudget();
                } catch (error) {
                    console.error('Error updating budget:', error);
                }
            });
        });

        // Add new category group
        document.getElementById('add-category-group').addEventListener('click', async () => {
            const groupName = prompt('Enter group name:');
            if (groupName) {
                try {
                    const response = await fetch(`/api/budgets/${currentDate.getFullYear()}/${currentDate.getMonth() + 1}/groups`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: groupName })
                    });
                    currentBudget = await response.json();
                    renderBudget();
                } catch (error) {
                    console.error('Error adding group:', error);
                }
            }
        });

        // Add category to group
        document.querySelectorAll('.add-category-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const groupRow = e.target.closest('.group-header');
                const groupId = groupRow.dataset.groupId;
                const categoryName = prompt('Enter category name:');
                
                if (categoryName) {
                    try {
                        const response = await fetch(
                            `/api/budgets/${currentDate.getFullYear()}/${currentDate.getMonth() + 1}/groups/${groupId}/categories`,
                            {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ name: categoryName })
                            }
                        );
                        currentBudget = await response.json();
                        renderBudget();
                    } catch (error) {
                        console.error('Error adding category:', error);
                    }
                }
            });
        });

        // Delete category
        document.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', async (e) => {
                if (confirm('Are you sure you want to delete this category?')) {
                    const categoryRow = e.target.closest('.category-row');
                    const categoryId = categoryRow.dataset.categoryId;
                    try {
                        const response = await fetch(
                            `/api/budgets/${currentDate.getFullYear()}/${currentDate.getMonth() + 1}/categories/${categoryId}`,
                            { method: 'DELETE' }
                        );
                        currentBudget = await response.json();
                        renderBudget();
                    } catch (error) {
                        console.error('Error deleting category:', error);
                    }
                }
            });
        });

        // Edit category name
        document.querySelectorAll('.editable-category-name').forEach(element => {
            element.addEventListener('blur', async (e) => {
                const categoryRow = e.target.closest('.category-row');
                const categoryId = categoryRow.dataset.categoryId;
                const newName = e.target.textContent;
                
                try {
                    const response = await fetch(
                        `/api/budgets/${currentDate.getFullYear()}/${currentDate.getMonth() + 1}/categories/${categoryId}`,
                        {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name: newName })
                        }
                    );
                    currentBudget = await response.json();
                    renderBudget();
                } catch (error) {
                    console.error('Error updating category name:', error);
                }
            });
        });
    }

    initializeBudget();
}); 