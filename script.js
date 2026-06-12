const { createApp, ref, computed, onMounted, watch } = Vue;

createApp({
    setup() {
        const transactions = ref([]);
        const description = ref('');
        const amount = ref(0);
        const type = ref('expense');
        const category = ref('');
        const currentFilter = ref('all');
        const isDark = ref(false);
        let chart = null;

        const categories = {
            income: ['Зарплата', 'Фриланс', 'Подарок', 'Инвестиции', 'Другое'],
            expense: ['Еда', 'Транспорт', 'Жильё', 'Здоровье', 'Развлечения', 'Покупки', 'Другое']
        };

        const initCategory = () => {
            if (type.value === 'income') category.value = categories.income[0];
            else category.value = categories.expense[0];
        };
        watch(type, initCategory);
        initCategory();

        const loadData = () => {
            const saved = localStorage.getItem('finance_tracker');
            if (saved) transactions.value = JSON.parse(saved);
            const savedTheme = localStorage.getItem('finance_theme');
            if (savedTheme === 'dark') {
                isDark.value = true;
                document.documentElement.setAttribute('data-theme', 'dark');
            }
        };

        const saveData = () => {
            localStorage.setItem('finance_tracker', JSON.stringify(transactions.value));
        };

        const totalIncome = computed(() => 
            transactions.value.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
        );
        const totalExpense = computed(() => 
            transactions.value.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
        );
        const balance = computed(() => totalIncome.value - totalExpense.value);

        const filteredTransactions = computed(() => {
            const filtered = currentFilter.value === 'all' 
                ? transactions.value 
                : transactions.value.filter(t => t.type === currentFilter.value);
            return [...filtered].reverse();
        });

        const addTransaction = () => {
            if (!description.value.trim() || amount.value <= 0) {
                alert('Заполните описание и сумму');
                return;
            }
            const newTrans = {
                id: Date.now(),
                description: description.value,
                amount: amount.value,
                type: type.value,
                category: category.value,
                date: new Date().toISOString()
            };
            transactions.value.push(newTrans);
            saveData();
            description.value = '';
            amount.value = 0;
            initCategory();
            updateChart();
        };

        const deleteTransaction = (id) => {
            transactions.value = transactions.value.filter(t => t.id !== id);
            saveData();
            updateChart();
        };

        const updateChart = () => {
            const ctx = document.getElementById('expenseChart').getContext('2d');
            const expenses = transactions.value.filter(t => t.type === 'expense');
            const catMap = {};
            for (let cat of categories.expense) catMap[cat] = 0;
            expenses.forEach(e => { catMap[e.category] += e.amount; });
            const labels = categories.expense;
            const data = labels.map(l => catMap[l]);
            if (chart) chart.destroy();
            chart = new Chart(ctx, {
                type: 'pie',
                data: { labels, datasets: [{ data, backgroundColor: ['#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#ec4899','#6b7280'] }] },
                options: { responsive: true, maintainAspectRatio: true }
            });
        };

        const toggleTheme = () => {
            isDark.value = !isDark.value;
            if (isDark.value) {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('finance_theme', 'dark');
            } else {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('finance_theme', 'light');
            }
        };

        const filtersList = [
            { value: 'all', label: 'Все' },
            { value: 'income', label: 'Доходы' },
            { value: 'expense', label: 'Расходы' }
        ];

        onMounted(() => {
            loadData();
            updateChart();
        });

        watch(transactions, () => updateChart(), { deep: true });

        return {
            transactions,
            description,
            amount,
            type,
            category,
            currentFilter,
            isDark,
            categories,
            totalIncome,
            totalExpense,
            balance,
            filteredTransactions,
            filtersList,
            addTransaction,
            deleteTransaction,
            toggleTheme
        };
    }
}).mount('#app');