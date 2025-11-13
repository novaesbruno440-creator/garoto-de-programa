// progresso.js

document.addEventListener('DOMContentLoaded', () => {
    if (!window.appState || !window.saveData || typeof Chart === 'undefined') {
        console.error("Progresso.js: Dependências (appState ou Chart.js) não carregadas.");
        return;
    }
    
    // ===============================================
    // 1. Funções de Agregação de Dados
    // ===============================================

    /**
     * Retorna um array com os últimos 7 dias (incluindo hoje) no formato YYYY-MM-DD.
     * @returns {Array<string>} Array de datas.
     */
    function getLast7Days() {
        const dates = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            dates.push(d.toISOString().split('T')[0]);
        }
        return dates;
    }

    /**
     * Agrega as calorias consumidas por dia para os últimos 7 dias.
     * @param {Array<string>} last7Days Array de datas no formato YYYY-MM-DD.
     * @returns {{dates: Array<string>, consumo: Array<number>, meta: Array<number>}}
     */
    function getWeeklyData(last7Days) {
        const allRefeicoes = window.appState.refeicoes;
        const metaDiaria = window.appState.perfil ? (window.appState.perfil.metaDiaria || 2000) : 2000;
        
        // Mapeia o consumo para cada data
        const consumptionMap = allRefeicoes.reduce((acc, refeicao) => {
            acc[refeicao.data] = (acc[refeicao.data] || 0) + Number(refeicao.calorias);
            return acc;
        }, {});
        
        const consumo = [];
        const meta = [];
        const labels = []; // Labels formatadas (ex: "Qui, 09/Nov")

        last7Days.forEach(dateStr => {
            const date = new Date(dateStr + 'T00:00:00'); // Adiciona T00:00:00 para evitar problemas de fuso
            const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
            const dayMonth = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
            
            labels.push(`${dayName}, ${dayMonth}`);
            consumo.push(consumptionMap[dateStr] || 0);
            meta.push(metaDiaria);
        });

        return { labels, consumo, meta };
    }

    // ===============================================
    // 2. Renderização do Gráfico (Chart.js)
    // ===============================================

    /**
     * Cria e renderiza o gráfico de consumo semanal.
     * @param {object} data Dados do gráfico (labels, consumo, meta).
     */
    function renderizarGrafico(data) {
        const ctx = document.getElementById('consumoChart').getContext('2d');
        
        // Destrói a instância anterior se existir (para evitar vazamento de memória e conflitos)
        if (window.progressoChart) {
            window.progressoChart.destroy();
        }

        window.progressoChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Consumo (kcal)',
                        data: data.consumo,
                        backgroundColor: window.appState.ui.darkMode ? '#34d399' : '#4caf50', // Cor do primária (verde)
                        borderColor: window.appState.ui.darkMode ? '#6ee7b7' : '#388e3c',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        type: 'line', // Linha para a meta
                        label: 'Meta Diária',
                        data: data.meta,
                        borderColor: '#ef4444', // Cor de alerta/contraste
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        borderWidth: 2,
                        tension: 0.3,
                        pointRadius: 0,
                        fill: false,
                        yAxisID: 'y'
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: window.appState.ui.darkMode ? '#f3f4f6' : '#333'
                        }
                    },
                    title: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Calorias (kcal)',
                            color: window.appState.ui.darkMode ? '#f3f4f6' : '#333'
                        },
                        ticks: {
                            color: window.appState.ui.darkMode ? '#f3f4f6' : '#333'
                        },
                        grid: {
                             color: window.appState.ui.darkMode ? 'rgba(243, 244, 246, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: window.appState.ui.darkMode ? '#f3f4f6' : '#333'
                        },
                        grid: {
                             color: window.appState.ui.darkMode ? 'rgba(243, 244, 246, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                }
            }
        });
    }
    
    // ===============================================
    // 3. Renderização de Metas
    // ===============================================

    /**
     * Atualiza os cards de meta vs consumo de hoje.
     */
    function atualizarMetasHoje() {
        const hoje = window.getTodayDateString();
        const perfil = window.appState.perfil;
        const metaDiaria = perfil ? (perfil.metaDiaria || 0) : 0;
        
        const refeicoesHoje = window.appState.refeicoes.filter(r => r.data === hoje);
        const totalConsumido = refeicoesHoje.reduce((acc, curr) => acc + Number(curr.calorias), 0);
        
        // Atualiza o DOM
        const metaHojeProgEl = document.getElementById('meta-hoje-prog');
        const consumidoHojeProgEl = document.getElementById('consumido-hoje-prog');
        
        if (metaHojeProgEl) metaHojeProgEl.textContent = metaDiaria || '--';
        if (consumidoHojeProgEl) consumidoHojeProgEl.textContent = totalConsumido;
        
        // Aplica estilo de alerta se exceder
        if (totalConsumido > metaDiaria && metaDiaria > 0) {
            consumidoHojeProgEl.style.color = 'var(--color-alert)';
        } else {
            consumidoHojeProgEl.style.color = 'var(--primary-color)';
        }
    }


    // ===============================================
    // 4. Inicialização
    // ===============================================

    const last7Days = getLast7Days();
    const weeklyData = getWeeklyData(last7Days);
    
    renderizarGrafico(weeklyData);
    atualizarMetasHoje();
    
    // Adiciona um listener para quando o Modo Escuro for alterado, o gráfico ser renderizado novamente com cores atualizadas
    const darkModeBtn = document.getElementById('toggle-dark-mode');
    if (darkModeBtn) {
        darkModeBtn.addEventListener('click', () => {
             // Pequeno timeout para garantir que o body.dark-mode já foi aplicado
            setTimeout(() => renderizarGrafico(weeklyData), 50); 
        });
    }

});