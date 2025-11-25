// progresso.js

// Importa funções do main.js: loadFromStorage, loadUserProfile

document.addEventListener('DOMContentLoaded', () => {
    
    const userProfile = loadUserProfile();
    const allMeals = loadFromStorage(MEALS_KEY) || [];
    const dailyGoal = userProfile.metas?.meta;

    /**
     * 1. Funções de Cálculo de Dados
     */
    
    // Gera as datas dos últimos 7 dias (incluindo hoje)
    function getLastSevenDays() {
        const dates = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            dates.push(d);
        }
        return dates;
    }

    // Agrega as calorias consumidas para cada dia dos últimos 7 dias
    function getWeeklyConsumption(dates) {
        const consumptionMap = {};
        
        // Inicializa o mapa com 0 para todos os dias
        dates.forEach(date => {
            consumptionMap[date.toDateString()] = 0;
        });

        // Agrega as calorias das refeições
        allMeals.forEach(meal => {
            const mealDate = new Date(meal.date).toDateString();
            if (consumptionMap.hasOwnProperty(mealDate)) {
                consumptionMap[mealDate] += meal.calorias;
            }
        });

        // Retorna o array de consumo na ordem correta
        return dates.map(date => consumptionMap[date.toDateString()]);
    }
    
    // Formata o resumo de hoje para o topo da página
    function updateTodaySummary() {
        const today = new Date().toDateString();
        const mealsToday = allMeals.filter(meal => new Date(meal.date).toDateString() === today);
        const consumedToday = mealsToday.reduce((sum, meal) => sum + meal.calorias, 0);

        const consumedEl = document.getElementById('consumido-hoje-prog');
        const metaEl = document.getElementById('meta-hoje-prog');
        const summaryCard = document.querySelector('.summary-registro-card');
        
        consumedEl.textContent = consumedToday;
        
        if (dailyGoal) {
            metaEl.textContent = dailyGoal;
            
            // Adiciona classe de alerta se excedeu
            if (consumedToday > dailyGoal) {
                summaryCard.style.border = '1px solid var(--color-alert)';
            } else {
                summaryCard.style.border = '1px solid var(--border-color)';
            }
        } else {
            metaEl.textContent = '--';
        }
    }


    /**
     * 2. Lógica do Gráfico (Chart.js)
     */
    function renderChart() {
        const ctx = document.getElementById('consumoChart')?.getContext('2d');
        if (!ctx) return;

        const sevenDays = getLastSevenDays();
        const labels = sevenDays.map(d => d.toLocaleDateString('pt-BR', { weekday: 'short' }));
        const data = getWeeklyConsumption(sevenDays);
        
        // Define o dataset da meta diária
        const goalData = dailyGoal ? Array(7).fill(dailyGoal) : [];
        
        const datasets = [{
            label: 'Consumo (kcal)',
            data: data,
            backgroundColor: 'rgba(52, 211, 153, 0.6)', // Cor primária com transparência
            borderColor: 'var(--primary-dark)',
            borderWidth: 1,
            borderRadius: 5,
        }];
        
        if (dailyGoal) {
             datasets.push({
                label: 'Meta Diária',
                data: goalData,
                type: 'line', // Linha para a meta
                borderColor: 'rgba(255, 99, 132, 1)', // Vermelho suave para meta
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                borderDash: [5, 5], // Linha pontilhada
                borderWidth: 2,
                pointRadius: 0, // Sem pontos na linha da meta
             });
        }


        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: false,
                        text: 'Consumo Calórico Semanal'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Calorias (kcal)'
                        }
                    }
                }
            }
        });
    }

    /**
     * 3. Inicialização
     */
    updateTodaySummary();
    renderChart();
});
