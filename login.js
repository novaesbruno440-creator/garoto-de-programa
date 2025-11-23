// login.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const createAccountBtn = document.getElementById('btn-create-account');

    // Verifica se já está logado
    if (window.appState && window.appState.auth && window.appState.auth.isAuthenticated) {
        window.location.href = 'index.html';
        return;
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            // Simulação de Autenticação
            // Em um app real, isso iria para um backend
            if (email && password) {
                const fakeUser = {
                    name: email.split('@')[0], // Usa a parte antes do @ como nome
                    email: email,
                    id: 'user_' + new Date().getTime()
                };

                // Atualiza estado global
                window.appState.auth = {
                    isAuthenticated: true,
                    user: fakeUser
                };

                // Salva persistência
                window.saveData('nutriportal_auth', window.appState.auth);

                // Feedback visual rápido
                const btn = loginForm.querySelector('button[type="submit"]');
                const originalText = btn.textContent;
                btn.textContent = 'Entrando...';
                btn.style.backgroundColor = 'var(--primary-dark)';

                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 800);
            }
        });
    }

    if (createAccountBtn) {
        createAccountBtn.addEventListener('click', () => {
            // Fluxo de criação de conta
            // Como este é um protótipo front-end, vamos simular criando uma sessão nova e limpa
            
            const novoUsuarioConfirm = confirm("Criar uma nova conta irá iniciar um novo perfil vazio. Deseja continuar?");
            
            if (novoUsuarioConfirm) {
                 // Limpa dados antigos para começar do zero
                 localStorage.removeItem('nutriportal_perfil');
                 localStorage.removeItem('nutriportal_refeicoes');
                 
                 const fakeUser = {
                    name: 'Novo Usuário',
                    email: 'novo@nutriportal.com',
                    id: 'new_user_' + new Date().getTime()
                };

                window.appState.auth = {
                    isAuthenticated: true,
                    user: fakeUser
                };
                window.saveData('nutriportal_auth', window.appState.auth);
                
                window.location.href = 'index.html';
            }
        });
    }
});