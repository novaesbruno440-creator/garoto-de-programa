// main.js

const USER_KEY = 'personalfit_user_data';
const MEALS_KEY = 'personalfit_meals';
const DARK_MODE_KEY = 'personalfit_dark_mode';
const FONT_SIZE_KEY = 'personalfit_font_size';

/**
 * Funções de Armazenamento
 */

// Salva um objeto no LocalStorage
function saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// Carrega um objeto do LocalStorage
function loadFromStorage(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

// Carrega o Perfil do Usuário
function loadUserProfile() {
    return loadFromStorage(USER_KEY) || {};
}

// Salva o Perfil do Usuário
function saveUserProfile(profile) {
    saveToStorage(USER_KEY, profile);
}


/**
 * 1. Controle de Modo Escuro (Dark Mode)
 */
function applyDarkMode(isDark) {
    document.body.classList.toggle('dark-mode', isDark);
    saveToStorage(DARK_MODE_KEY, isDark);
}

function initDarkMode() {
    const isDark = loadFromStorage(DARK_MODE_KEY);
    // Aplica o tema salvo ou o tema do sistema como padrão
    applyDarkMode(isDark === null ? window.matchMedia('(prefers-color-scheme: dark)').matches : isDark);

    const toggleBtn = document.getElementById('toggle-dark-mode');
    if (toggleBtn) {
        toggleBtn.textContent = isDark ? '🌕' : '💡';
        toggleBtn.addEventListener('click', () => {
            const newIsDark = !document.body.classList.contains('dark-mode');
            applyDarkMode(newIsDark);
            toggleBtn.textContent = newIsDark ? '🌕' : '💡';
        });
    }
}


/**
 * 2. Controle de Tamanho da Fonte
 */
function applyFontSize(size) {
    document.body.classList.remove('font-small', 'font-large');
    if (size === 'small') {
        document.body.classList.add('font-small');
    } else if (size === 'large') {
        document.body.classList.add('font-large');
    }
    saveToStorage(FONT_SIZE_KEY, size);
}

function initFontSizeControls() {
    const savedSize = loadFromStorage(FONT_SIZE_KEY) || 'medium';
    applyFontSize(savedSize);

    const decreaseBtn = document.getElementById('font-size-decrease');
    const increaseBtn = document.getElementById('font-size-increase');

    if (decreaseBtn && increaseBtn) {
        decreaseBtn.addEventListener('click', () => {
            const currentSize = loadFromStorage(FONT_SIZE_KEY) || 'medium';
            if (currentSize === 'large') {
                applyFontSize('medium');
            } else if (currentSize === 'medium') {
                applyFontSize('small');
            }
        });

        increaseBtn.addEventListener('click', () => {
            const currentSize = loadFromStorage(FONT_SIZE_KEY) || 'medium';
            if (currentSize === 'small') {
                applyFontSize('medium');
            } else if (currentSize === 'medium') {
                applyFontSize('large');
            }
        });
    }
}


/**
 * 3. Controle de Navegação e Estado de Auth
 */

// Verifica se o usuário está logado
function isAuthenticated() {
    const user = loadUserProfile();
    // Simplesmente verifica se o email e senha estão salvos (simulando autenticação)
    return !!user.email && !!user.password;
}

// Redireciona para o login se não estiver autenticado (páginas internas)
function checkAuthentication(redirectUrl = 'login.html') {
    if (window.location.pathname.includes('login.html')) {
        // Se já está na página de login, não faz nada
        return;
    }
    if (!isAuthenticated()) {
        window.location.href = redirectUrl;
    }
}

// Cria o widget de autenticação no Header
function renderAuthWidget() {
    const authContainer = document.getElementById('auth-container');
    if (!authContainer) return;

    const user = loadUserProfile();
    const isLoggedIn = isAuthenticated();

    authContainer.innerHTML = ''; // Limpa o conteúdo

    if (isLoggedIn) {
        // Usuário Logado
        authContainer.innerHTML = `
            <div class="auth-widget">
                <div class="auth-user-info">
                    <span class="auth-name">${user.email.split('@')[0]}</span>
                    <span class="auth-status">Online</span>
                </div>
                <button class="auth-btn-logout" id="logout-btn" title="Sair da Conta">🚪</button>
            </div>
        `;
        document.getElementById('logout-btn').addEventListener('click', () => {
            // Limpa apenas os dados de autenticação simulados
            saveUserProfile({ ...user, email: '', password: '' });
            window.location.href = 'login.html';
        });

    } else if (!window.location.pathname.includes('login.html')) {
        // Usuário Deslogado (apenas em páginas internas)
        authContainer.innerHTML = `
            <a href="login.html" class="auth-btn-login">Fazer Login</a>
        `;
    }
}

// Adiciona a classe 'active' ao link da página atual na sidebar
function setActiveNavLink() {
    const path = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.sidebar nav a');
    navLinks.forEach(link => {
        if (link.getAttribute('href') === path) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}


/**
 * 4. Limpar Dados (Novo Usuário)
 */
function initClearDataControl() {
    const clearBtn = document.getElementById('novo-usuario-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja limpar TODOS os dados (Perfil e Refeições) e iniciar um Novo Usuário?')) {
                localStorage.removeItem(USER_KEY);
                localStorage.removeItem(MEALS_KEY);
                alert('Dados limpos com sucesso. Redirecionando para o login.');
                window.location.href = 'login.html';
            }
        });
    }
}


/**
 * 5. Data de Hoje
 */
function displayTodayDate() {
    const dateElement = document.getElementById('today-date');
    if (dateElement) {
        const today = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.textContent = today.toLocaleDateString('pt-BR', options);
    }
}


/**
 * Inicialização
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Verifica autenticação antes de tudo
    checkAuthentication();

    // 2. Inicializa funcionalidades de UI
    initDarkMode();
    initFontSizeControls();
    initClearDataControl();
    displayTodayDate();
    setActiveNavLink();
    
    // 3. Renderiza o widget de autenticação (sempre por último)
    renderAuthWidget();
});
