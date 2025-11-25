// dashboard.js

// Importa funções do main.js: loadUserProfile, saveUserProfile, saveToStorage, loadFromStorage

document.addEventListener('DOMContentLoaded', () => {
    const perfilForm = document.getElementById('perfil-form');
    const userProfile = loadUserProfile();

    /**
     * Função principal para calcular a TMB e Meta Calórica.
     * Utiliza a fórmula de Harris-Benedict (uma das mais comuns).
     */
    function calculateMetas(sexo, idade, peso, altura, atividade) {
        let tmb;

        // 1. Cálculo da Taxa Metabólica Basal (TMB) - Harris-Benedict Revisada
        if (sexo === 'M') {
            tmb = (13.397 * peso) + (4.799 * altura) - (5.677 * idade) + 88.362;
        } else if (sexo === 'F') {
            tmb = (9.247 * peso) + (3.098 * altura) - (4.330 * idade) + 447.593;
        } else {
            return { tmb: 0, manutencao: 0, meta: 0 };
        }

        // 2. Fatores de Atividade Física para calcular a Manutenção
        const activityFactors = {
            'sedentario': 1.2,
            'leve': 1.375,
            'moderada': 1.55,
            'intensa': 1.725
        };

        const fatorAtividade = activityFactors[atividade] || 1.2;
        
        // 3. Gasto Calórico Total (Manutenção)
        const manutencao = tmb * fatorAtividade;
        
        // 4. Meta de Déficit (Perda de Peso)
        // Déficit de 500 kcal é um valor padrão para perda de peso de ~0.5kg/semana
        const meta = manutencao - 500; 

        return {
            tmb: Math.round(tmb),
            manutencao: Math.round(manutencao),
            meta: Math.round(Math.max(1000, meta)) // Garante um mínimo razoável
        };
    }

    /**
     * Exibe os resultados na tela
     */
    function displayMetas(metas) {
        document.getElementById('tmb-resultado').textContent = `${metas.tmb} kcal`;
        document.getElementById('manutencao-resultado').textContent = `${metas.manutencao} kcal`;
        document.getElementById('meta-resultado').textContent = `${metas.meta} kcal`;
        document.getElementById('ai-meta-display').textContent = `${metas.meta} kcal`;
        
        // Atualiza a barra de progresso
        updateProgressBar(metas.meta);
    }
    
    /**
     * Atualiza a barra de progresso no Dashboard (index.html)
     */
    function updateProgressBar(dailyGoal) {
        const progressCard = document.getElementById('card-progress');
        const progressInner = document.getElementById('progress-inner');
        const consumidoDisplay = document.getElementById('consumido-do-dia');
        const metaDisplay = document.getElementById('meta-do-dia');
        const progressText = document.getElementById('progress-text');
        
        if (!progressCard) return; // Se não estiver no index.html

        const today = new Date().toDateString();
        const allMeals = loadFromStorage(MEALS_KEY) || [];
        
        const mealsToday = allMeals.filter(meal => new Date(meal.date).toDateString() === today);
        const consumedToday = mealsToday.reduce((sum, meal) => sum + meal.calorias, 0);

        if (dailyGoal && dailyGoal > 0) {
            // Mostra o card de progresso se o perfil estiver completo
            progressCard.classList.remove('hidden'); 
            
            const percentage = Math.min(100, (consumedToday / dailyGoal) * 100);
            
            progressInner.style.width = `${percentage}%`;
            consumidoDisplay.textContent = consumedToday;
            metaDisplay.textContent = dailyGoal;
            
            progressInner.classList.remove('over-limit');
            progressText.classList.remove('over-limit');
            
            if (consumedToday > dailyGoal) {
                progressText.textContent = `❌ ${consumedToday - dailyGoal} kcal acima da meta!`;
                progressInner.classList.add('over-limit');
                progressText.classList.add('over-limit');
            } else if (consumedToday === 0) {
                progressText.textContent = `Você ainda não registrou nenhuma refeição hoje.`;
            } else {
                progressText.textContent = `Faltam ${dailyGoal - consumedToday} kcal para a sua meta.`;
            }
            
            // Link para a página de registro
            const cardLink = document.getElementById('card-link');
            if(cardLink) cardLink.href = 'registro.html';

        } else {
            // Esconde o card se o perfil não estiver completo
            progressCard.classList.add('hidden');
            progressText.textContent = 'Defina seu perfil para calcular a meta.';
            consumidoDisplay.textContent = 0;
            metaDisplay.textContent = '--';
        }
    }


    /**
     * 1. Lógica de Submissão e Pré-preenchimento do Formulário
     */
    if (perfilForm) {
        // Pré-preenchimento
        const { sexo, idade, peso, altura, atividade } = userProfile;

        if (sexo) document.getElementById('sexo').value = sexo;
        if (idade) document.getElementById('idade').value = idade;
        if (peso) document.getElementById('peso').value = peso;
        if (altura) document.getElementById('altura').value = altura;
        if (atividade) document.getElementById('atividade').value = atividade;

        // Se o perfil já estiver completo, calcula e exibe as metas no carregamento
        if (sexo && idade && peso && altura && atividade) {
            const metas = calculateMetas(sexo, Number(idade), Number(peso), Number(altura), atividade);
            displayMetas(metas);
        } else {
            // Garante que a barra de progresso será atualizada com meta zero/incompleta
            updateProgressBar(0);
        }
        
        // Listener de Submissão
        perfilForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const newProfile = {
                sexo: document.getElementById('sexo').value,
                idade: Number(document.getElementById('idade').value),
                peso: Number(document.getElementById('peso').value),
                altura: Number(document.getElementById('altura').value),
                atividade: document.getElementById('atividade').value,
                // Mantém os dados de autenticação
                email: userProfile.email, 
                password: userProfile.password 
            };

            const metas = calculateMetas(newProfile.sexo, newProfile.idade, newProfile.peso, newProfile.altura, newProfile.atividade);
            
            // Salva o perfil e as metas
            saveUserProfile({ ...newProfile, metas });
            
            displayMetas(metas);
            
            // Mostra o card de IA após o cálculo da meta
            document.getElementById('ai-meal-plan-card').classList.remove('hidden');

            alert('Perfil e Metas salvos com sucesso!');
        });
    }

    /**
     * 2. Lógica de Sugestão de Cardápio com IA Simulada
     */
    const aiBtn = document.getElementById('btn-generate-plan');
    const aiResultBox = document.getElementById('ai-plan-result');
    
    if (aiBtn) {
        // Verifica se o perfil está completo para mostrar o card de IA
        if (userProfile.metas) {
            document.getElementById('ai-meal-plan-card').classList.remove('hidden');
        }

        aiBtn.addEventListener('click', () => {
            if (!userProfile.metas) {
                alert('Por favor, salve seu Perfil e Metas primeiro.');
                return;
            }
            
            aiBtn.disabled = true;
            aiBtn.innerHTML = '<span class="ai-loading"></span> Gerando Cardápio...';
            aiResultBox.classList.add('hidden');

            const { meta } = userProfile.metas;
            
            // Simulação de delay para a resposta da "IA"
            setTimeout(() => {
                aiBtn.disabled = false;
                aiBtn.innerHTML = 'Gerar Sugestão de Cardápio ✨';
                aiResultBox.classList.remove('hidden');

                // Simulação de sugestão baseada na meta calórica (exemplo)
                const planTitle = `Sugestão de Cardápio (${meta} kcal)`;
                let planList;

                if (meta > 2000) {
                    planList = `
                        <li>Café (500 kcal): Pão integral, ovos mexidos, fruta e café sem açúcar.</li>
                        <li>Almoço (800 kcal): Peito de frango grelhado (150g), arroz integral (1 xícara), salada à vontade e azeite.</li>
                        <li>Lanche (300 kcal): Iogurte natural, granola e mel.</li>
                        <li>Jantar (700 kcal): Salmão assado com batata doce e legumes cozidos.</li>
                    `;
                } else if (meta > 1500) {
                    planList = `
                        <li>Café (400 kcal): Omelete de 2 ovos com queijo e suco natural.</li>
                        <li>Almoço (600 kcal): Salada de frango com folhas verdes e croutons.</li>
                        <li>Lanche (200 kcal): Maçã e punhado de castanhas.</li>
                        <li>Jantar (500 kcal): Sopa de legumes e pão integral.</li>
                    `;
                } else { // meta <= 1500
                    planList = `
                        <li>Café (300 kcal): Iogurte com chia e morangos.</li>
                        <li>Almoço (500 kcal): Salada completa com atum ou ovo cozido.</li>
                        <li>Jantar (400 kcal): Wrap integral de peru e ricota.</li>
                    `;
                }


                aiResultBox.innerHTML = `
                    <h4>${planTitle}</h4>
                    <p style="font-size: 0.9em; margin-bottom: 10px;">Distribuição aproximada das calorias ao longo do dia:</p>
                    <ul>${planList}</ul>
                `;

            }, 2500); // 2.5 segundos de "processamento da IA"
        });
    }
});
