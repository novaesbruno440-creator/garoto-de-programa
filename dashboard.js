// dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    // Certifique-se de que o main.js foi carregado e as variáveis globais estão disponíveis
    if (!window.appState || !window.saveData) return;

    const perfilForm = document.getElementById('perfil-form');
    const resultados = {
        tmb: document.getElementById('tmb-resultado'),
        manutencao: document.getElementById('manutencao-resultado'),
        meta: document.getElementById('meta-resultado'),
    };
    const progressInner = document.getElementById('progress-inner');
    const progressText = document.getElementById('progress-text');
    const cardProgress = document.getElementById('card-progress');
    const cardLink = document.getElementById('card-link');
    
    // Elementos IA
    const aiCard = document.getElementById('ai-meal-plan-card');
    const aiMetaDisplay = document.getElementById('ai-meta-display');
    const btnGeneratePlan = document.getElementById('btn-generate-plan');
    const aiPlanResult = document.getElementById('ai-plan-result');
    
    // ===============================================
    // 1. Funções de Cálculo (TMB e Meta)
    // ===============================================

    /**
     * Calcula a Taxa Metabólica Basal (TMB) usando a fórmula de Mifflin-St Jeor.
     * @param {string} sexo 'M' ou 'F'.
     * @param {number} peso Peso em kg.
     * @param {number} altura Altura em cm.
     * @param {number} idade Idade em anos.
     * @returns {number} TMB em kcal.
     */
    function calcularTMB(sexo, peso, altura, idade) {
        if (sexo === 'M') {
            return (10 * peso) + (6.25 * altura) - (5 * idade) + 5;
        } else if (sexo === 'F') {
            return (10 * peso) + (6.25 * altura) - (5 * idade) - 161;
        }
        return 0;
    }

    /**
     * Calcula as Calorias de Manutenção e a Meta de Emagrecimento.
     */
    function calcularMetas(tmb, atividade) {
        const fatorAtividade = {
            'sedentario': 1.2,
            'leve': 1.375,
            'moderada': 1.55,
            'intensa': 1.725
        };

        const fator = fatorAtividade[atividade] || 1.2;
        const manutencao = tmb * fator;
        // Meta de emagrecimento: déficit de 500 kcal
        const meta = manutencao - 500; 

        return {
            manutencao: Math.round(manutencao),
            meta: Math.max(Math.round(meta), 1000) // Garante um mínimo razoável de 1000 kcal
        };
    }

    // ===============================================
    // 2. Renderização e Persistência
    // ===============================================

    /**
     * Preenche os campos do formulário com os dados do perfil salvo.
     */
    function carregarFormulario() {
        const perfil = window.appState.perfil;
        if (perfil) {
            document.getElementById('sexo').value = perfil.sexo || '';
            document.getElementById('idade').value = perfil.idade || '';
            document.getElementById('peso').value = perfil.peso || '';
            document.getElementById('altura').value = perfil.altura || '';
            document.getElementById('atividade').value = perfil.atividade || 'sedentario';
        }
        // Calcula e exibe os resultados ao carregar
        exibirResultados(); 
    }

    /**
     * Calcula e exibe a TMB, Manutenção, e Meta no Dashboard.
     */
    function exibirResultados() {
        const perfil = window.appState.perfil;
        
        // Limpa resultados se não houver perfil
        if (!perfil || !perfil.peso || !perfil.altura || !perfil.idade) {
            Object.values(resultados).forEach(el => el.textContent = '--');
            cardProgress.classList.add('hidden');
            if(aiCard) aiCard.classList.add('hidden');
            return;
        }

        // 1. Cálculos
        const tmb = calcularTMB(perfil.sexo, Number(perfil.peso), Number(perfil.altura), Number(perfil.idade));
        const { manutencao, meta } = calcularMetas(tmb, perfil.atividade);

        // Atualiza o perfil com a meta calculada
        window.appState.perfil.metaDiaria = meta;
        saveData('nutriportal_perfil', window.appState.perfil);

        // 2. Exibe Resultados
        resultados.tmb.textContent = `${Math.round(tmb)} kcal`;
        resultados.manutencao.textContent = `${manutencao} kcal`;
        resultados.meta.textContent = `${meta} kcal`;
        
        // Exibe card de IA
        if(aiCard) {
            aiCard.classList.remove('hidden');
            aiMetaDisplay.textContent = meta;
        }
        
        // 3. Atualiza o Progresso Hoje
        atualizarProgressoDiario(meta);
    }

    /**
     * Calcula o total de calorias consumidas hoje e atualiza a barra de progresso.
     */
    function atualizarProgressoDiario(metaDiaria) {
        const hoje = window.getTodayDateString();
        const refeicoesHoje = window.appState.refeicoes.filter(r => r.data === hoje);
        const totalCalorias = refeicoesHoje.reduce((acc, curr) => acc + Number(curr.calorias), 0);
        
        if (!cardProgress) return;

        cardProgress.classList.remove('hidden');
        cardProgress.querySelector('#meta-do-dia').textContent = metaDiaria;
        cardProgress.querySelector('#consumido-do-dia').textContent = totalCalorias;
        
        const porcentagem = (totalCalorias / metaDiaria) * 100;
        const progresso = Math.min(porcentagem, 200);

        progressInner.style.width = `${progresso}%`;
        
        progressInner.classList.remove('over-limit');
        if (porcentagem > 100) {
            progressInner.classList.add('over-limit');
            progressText.textContent = `❌ ${totalCalorias - metaDiaria} kcal acima da meta!`;
        } else {
            progressText.textContent = `${metaDiaria - totalCalorias} kcal restantes para a meta.`;
        }
        
        cardLink.href = 'registro.html';
    }


    // ===============================================
    // 3. Event Listeners e IA
    // ===============================================

    if (perfilForm) {
        perfilForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const novoPerfil = {
                sexo: document.getElementById('sexo').value,
                idade: Number(document.getElementById('idade').value),
                peso: Number(document.getElementById('peso').value),
                altura: Number(document.getElementById('altura').value),
                atividade: document.getElementById('atividade').value,
            };

            window.appState.perfil = novoPerfil;
            saveData('nutriportal_perfil', novoPerfil);

            exibirResultados();
            alert('Perfil e Metas salvos com sucesso!');
        });
    }
    
    // Funcionalidade IA: Gerar Cardápio
    if (btnGeneratePlan) {
        btnGeneratePlan.addEventListener('click', async () => {
            const perfil = window.appState.perfil;
            if (!perfil || !perfil.metaDiaria) {
                alert("Por favor, configure seu perfil primeiro.");
                return;
            }

            // Feedback Visual de Carregamento
            const originalText = btnGeneratePlan.innerHTML;
            btnGeneratePlan.innerHTML = '<span class="ai-loading"></span> Gerando sugestões...';
            btnGeneratePlan.disabled = true;
            aiPlanResult.classList.remove('hidden');
            aiPlanResult.innerHTML = '<p>A IA está pensando em opções deliciosas para você...</p>';

            try {
                // Prompt para o Gemini
                const prompt = `Atue como um nutricionista. Minha meta diária é de aproximadamente ${perfil.metaDiaria} calorias. Crie uma sugestão de cardápio simples e saudável para um dia (Café da Manhã, Almoço, Lanche, Jantar) em Português do Brasil. Use formato HTML simples com <ul> e <li>. Não inclua texto introdutório, apenas o cardápio.`;
                
                // Chamada da API (função global em main.js)
                const resposta = await window.fetchGeminiResponse(prompt);
                
                // Renderizar resposta
                aiPlanResult.innerHTML = `<h4>💡 Sugestão para Hoje</h4>${resposta}`;

            } catch (error) {
                console.error(error);
                aiPlanResult.innerHTML = `<p style="color: var(--color-alert)">Desculpe, ocorreu um erro ao consultar a IA. Tente novamente.</p>`;
            } finally {
                btnGeneratePlan.innerHTML = originalText;
                btnGeneratePlan.disabled = false;
            }
        });
    }

    // Inicializa o formulário e a exibição de resultados
    carregarFormulario();
});