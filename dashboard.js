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
        // Fórmula de Mifflin-St Jeor:
        // Homens: (10 * Peso) + (6.25 * Altura) - (5 * Idade) + 5
        // Mulheres: (10 * Peso) + (6.25 * Altura) - (5 * Idade) - 161
        if (sexo === 'M') {
            return (10 * peso) + (6.25 * altura) - (5 * idade) + 5;
        } else if (sexo === 'F') {
            return (10 * peso) + (6.25 * altura) - (5 * idade) - 161;
        }
        return 0;
    }

    /**
     * Calcula as Calorias de Manutenção e a Meta de Emagrecimento.
     * @param {number} tmb TMB calculada.
     * @param {string} atividade Nível de atividade ('sedentario', 'leve', 'moderada', 'intensa').
     * @returns {{manutencao: number, meta: number}}
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
            cardProgress.classList.add('hidden'); // Esconde o card de progresso se não houver meta
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
        
        // 3. Atualiza o Progresso Hoje
        atualizarProgressoDiario(meta);
    }

    /**
     * Calcula o total de calorias consumidas hoje e atualiza a barra de progresso.
     * @param {number} metaDiaria A meta de calorias definida no perfil.
     */
    function atualizarProgressoDiario(metaDiaria) {
        const hoje = window.getTodayDateString();
        // Filtra as refeições de hoje
        const refeicoesHoje = window.appState.refeicoes.filter(r => r.data === hoje);
        // Soma as calorias
        const totalCalorias = refeicoesHoje.reduce((acc, curr) => acc + Number(curr.calorias), 0);
        
        // Atualiza o DOM (Progress Card)
        if (!cardProgress) return;

        cardProgress.classList.remove('hidden');
        cardProgress.querySelector('#meta-do-dia').textContent = metaDiaria;
        cardProgress.querySelector('#consumido-do-dia').textContent = totalCalorias;
        
        // Cálculo da Porcentagem
        const porcentagem = (totalCalorias / metaDiaria) * 100;
        const progresso = Math.min(porcentagem, 200); // Limita a 200% para visual

        progressInner.style.width = `${progresso}%`;
        
        // Controle da cor de Alerta e Mensagem
        progressInner.classList.remove('over-limit');
        if (porcentagem > 100) {
            progressInner.classList.add('over-limit');
            progressText.textContent = `❌ ${totalCalorias - metaDiaria} kcal acima da meta!`;
        } else {
            progressText.textContent = `${metaDiaria - totalCalorias} kcal restantes para a meta.`;
        }
        
        // Ação do botão
        cardLink.href = 'registro.html';
    }


    // ===============================================
    // 3. Event Listeners
    // ===============================================

    if (perfilForm) {
        // Envio do formulário
        perfilForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Coleta os dados do formulário
            const novoPerfil = {
                sexo: document.getElementById('sexo').value,
                idade: Number(document.getElementById('idade').value),
                peso: Number(document.getElementById('peso').value),
                altura: Number(document.getElementById('altura').value),
                atividade: document.getElementById('atividade').value,
                // A metaDiaria será calculada e adicionada em exibirResultados()
            };

            // Salva o novo perfil no appState e LocalStorage
            window.appState.perfil = novoPerfil;
            saveData('nutriportal_perfil', novoPerfil);

            // Recalcula e exibe os resultados
            exibirResultados();

            alert('Perfil e Metas salvos com sucesso!');
        });
    }

    // Inicializa o formulário e a exibição de resultados
    carregarFormulario();
});