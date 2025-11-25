// auth.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const createAccountBtn = document.getElementById('btn-create-account');
    
    if (loginForm) {
        // Se o usuário já está "logado" (tem dados de login salvos),
        // redireciona para a dashboard.
        if (isAuthenticated()) {
            window.location.href = 'index.html';
            return;
        }

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');

            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();
            
            // Simulação de Login:
            // Salva as credenciais fornecidas no LocalStorage.
            // Em uma aplicação real, você faria uma requisição ao servidor.
            saveUserProfile({ ...loadUserProfile(), email, password });

            alert('Login realizado com sucesso! Redirecionando para o Perfil.');
            window.location.href = 'index.html';
        });
    }
    
    // Simulação de "Criar Nova Conta"
    if (createAccountBtn) {
        createAccountBtn.addEventListener('click', () => {
            alert('A funcionalidade de "Criar Nova Conta" está em desenvolvimento. Por enquanto, use o formulário acima para se cadastrar (o sistema salva o primeiro acesso como seu perfil).');
            // Em um projeto real, aqui você redirecionaria para uma página de cadastro:
            // window.location.href = 'cadastro.html';
        });
    }
});
