const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');

// Get budget for specific month
router.get('/:year/:month', async (req, res) => {
    try {
        const date = new Date(req.params.year, req.params.month - 1);
        let budget = await Budget.findOne({
            month: {
                $gte: new Date(date.getFullYear(), date.getMonth(), 1),
                $lt: new Date(date.getFullYear(), date.getMonth() + 1, 1)
            }
        });

        if (!budget) {
            // Create new budget with default categories
            budget = new Budget({
                month: date,
                readyToAssign: 0,
                groups: [
                    {
                        name: 'Fixed Costs',
                        categories: [
                            { name: 'Taxes', budgeted: 0, activity: 0 },
                            { name: '401k', budgeted: 0, activity: 0 },
                            { name: 'HSA', budgeted: 0, activity: 0 },
                            { name: 'RothIRA', budgeted: 0, activity: 0 },
                            { name: 'Future Fund', budgeted: 0, activity: 0 }
                        ]
                    },
                    {
                        name: 'Necessities',
                        categories: [
                            { name: 'Rent', budgeted: 0, activity: 0 },
                            { name: 'Groceries', budgeted: 0, activity: 0 },
                            { name: 'Boone', budgeted: 0, activity: 0 },
                            { name: 'Bills & Utilities', budgeted: 0, activity: 0 },
                            { name: 'Travel', budgeted: 0, activity: 0 }
                        ]
                    },
                    {
                        name: 'Wants',
                        categories: [
                            { name: 'Food & Drink', budgeted: 0, activity: 0 },
                            { name: 'Entertainment', budgeted: 0, activity: 0 },
                            { name: 'Shopping', budgeted: 0, activity: 0 },
                            { name: 'Health & Fitness', budgeted: 0, activity: 0 }
                        ]
                    }
                ]
            });
            await budget.save();
        }
        res.json(budget);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update category budget
router.patch('/:year/:month/categories/:categoryId', async (req, res) => {
    try {
        const date = new Date(req.params.year, req.params.month - 1);
        const budget = await Budget.findOne({
            month: {
                $gte: new Date(date.getFullYear(), date.getMonth(), 1),
                $lt: new Date(date.getFullYear(), date.getMonth() + 1, 1)
            }
        });

        const category = budget.groups
            .flatMap(g => g.categories)
            .find(c => c._id.toString() === req.params.categoryId);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        if (req.body.budgeted !== undefined) {
            const difference = req.body.budgeted - category.budgeted;
            budget.readyToAssign -= difference;
            category.budgeted = req.body.budgeted;
            category.available = category.budgeted + category.activity;
        }

        await budget.save();
        res.json(budget);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add new category to group
router.post('/:year/:month/groups/:groupId/categories', async (req, res) => {
    try {
        const date = new Date(req.params.year, req.params.month - 1);
        const budget = await Budget.findOne({
            month: {
                $gte: new Date(date.getFullYear(), date.getMonth(), 1),
                $lt: new Date(date.getFullYear(), date.getMonth() + 1, 1)
            }
        });

        const group = budget.groups.find(g => g._id.toString() === req.params.groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        group.categories.push({
            name: req.body.name,
            budgeted: 0,
            activity: 0,
            available: 0
        });

        await budget.save();
        res.json(budget);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add new group
router.post('/:year/:month/groups', async (req, res) => {
    try {
        const date = new Date(req.params.year, req.params.month - 1);
        const budget = await Budget.findOne({
            month: {
                $gte: new Date(date.getFullYear(), date.getMonth(), 1),
                $lt: new Date(date.getFullYear(), date.getMonth() + 1, 1)
            }
        });

        budget.groups.push({
            name: req.body.name,
            categories: []
        });

        await budget.save();
        res.json(budget);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete category
router.delete('/:year/:month/categories/:categoryId', async (req, res) => {
    try {
        const date = new Date(req.params.year, req.params.month - 1);
        const budget = await Budget.findOne({
            month: {
                $gte: new Date(date.getFullYear(), date.getMonth(), 1),
                $lt: new Date(date.getFullYear(), date.getMonth() + 1, 1)
            }
        });

        budget.groups.forEach(group => {
            group.categories = group.categories.filter(
                cat => cat._id.toString() !== req.params.categoryId
            );
        });

        await budget.save();
        res.json(budget);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router; 