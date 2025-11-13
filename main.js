// main.js

document.addEventListener('DOMContentLoaded', () => {
    // ===============================================
    // 1. Variáveis Globais e Funções Utilitárias
    // ===============================================

    /**
     * @returns {string} A data de hoje no formato YYYY-MM-DD.
     */
    function getTodayDateString() {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * Carrega dados do LocalStorage, ou retorna um objeto padrão se não existirem.
     * @param {string} key A chave para o LocalStorage.
     * @param {object} defaultData Dados a serem retornados se a chave não for encontrada.
     * @returns {object} Os dados carregados.
     */
    function loadData(key, defaultData) {
        const data = localStorage.getItem(key);
        try {
            return data ? JSON.parse(data) : defaultData;
        } catch (e) {
            console.error(`Erro ao carregar/parsear ${key}:`, e);
            return defaultData;
        }
    }

    /**
     * Salva dados no LocalStorage.
     * @param {string} key A chave para o LocalStorage.
     * @param {object} data Os dados a serem salvos.
     */
    function saveData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    // Inicialização do estado do App
    window.appState = {
        perfil: loadData('nutriportal_perfil', null),
        refeicoes: loadData('nutriportal_refeicoes', []), // {data: 'YYYY-MM-DD', descricao: '...', calorias: 500, tipo: 'almoco', id: 'uuid'}
        ui: loadData('nutriportal_ui', {
            darkMode: false,
            fontSize: 'normal' // 'normal', 'large', 'small'
        }),
    };
    
    // Define as funções globais para que outros scripts as utilizem
    window.getTodayDateString = getTodayDateString;
    window.saveData = saveData;
    window.loadData = loadData;

    // ===============================================
    // 2. Funcionalidades de UI (Modo Escuro, Fonte)
    // ===============================================

    /**
     * Aplica o estado de UI salvo ao corpo (body) do documento.
     */
    function applyUIState() {
        const { darkMode, fontSize } = window.appState.ui;

        // Modo Escuro
        document.body.classList.toggle('dark-mode', darkMode);
        
        // Tamanho da Fonte
        document.body.classList.remove('font-large', 'font-small');
        if (fontSize === 'large') {
            document.body.classList.add('font-large');
        } else if (fontSize === 'small') {
            document.body.classList.add('font-small');
        }

        // Sidebar - Marca o item ativo
        const path = window.location.pathname.split('/').pop();
        document.querySelectorAll('.sidebar nav a').forEach(a => {
            a.classList.remove('active');
            if (a.getAttribute('href') === path) {
                a.classList.add('active');
            } else if (path === 'index.html' && a.getAttribute('href') === 'index.html') {
                 a.classList.add('active');
            }
        });
        
        // Exibir a data de hoje no Dashboard
        const todayDateEl = document.getElementById('today-date');
        if (todayDateEl) {
            todayDateEl.textContent = `Hoje: ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
        }
    }

    // Inicializa a UI
    applyUIState();

    // Event Listeners para Controles Visuais
    
    // Toggle Dark Mode
    const toggleDarkModeBtn = document.getElementById('toggle-dark-mode');
    if (toggleDarkModeBtn) {
        toggleDarkModeBtn.addEventListener('click', () => {
            window.appState.ui.darkMode = !window.appState.ui.darkMode;
            saveData('nutriportal_ui', window.appState.ui);
            applyUIState();
        });
    }

    // Font Size Increase
    const fontSizeIncreaseBtn = document.getElementById('font-size-increase');
    if (fontSizeIncreaseBtn) {
        fontSizeIncreaseBtn.addEventListener('click', () => {
            window.appState.ui.fontSize = window.appState.ui.fontSize === 'normal' ? 'large' : 'large';
            saveData('nutriportal_ui', window.appState.ui);
            applyUIState();
        });
    }

    // Font Size Decrease
    const fontSizeDecreaseBtn = document.getElementById('font-size-decrease');
    if (fontSizeDecreaseBtn) {
        fontSizeDecreaseBtn.addEventListener('click', () => {
            window.appState.ui.fontSize = window.appState.ui.fontSize === 'normal' ? 'small' : 'small';
            saveData('nutriportal_ui', window.appState.ui);
            applyUIState();
        });
    }

    // ===============================================
    // 3. Funcionalidade de Limpar Dados
    // ===============================================

    const novoUsuarioBtn = document.getElementById('novo-usuario-btn');
    if (novoUsuarioBtn) {
        novoUsuarioBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja limpar TODOS os seus dados (Perfil, Refeições, Progresso)? Esta ação é irreversível.')) {
                localStorage.removeItem('nutriportal_perfil');
                localStorage.removeItem('nutriportal_refeicoes');
                localStorage.removeItem('nutriportal_ui'); // Poderia manter, mas limpar tudo é mais seguro
                alert('Dados limpos com sucesso! Redirecionando para a página inicial.');
                window.location.href = 'index.html'; // Redireciona para recarregar o app
            }
        });
    }

});