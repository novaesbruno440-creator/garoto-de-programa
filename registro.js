// registro.js

document.addEventListener('DOMContentLoaded', () => {
    if (!window.appState || !window.saveData) return;

    const registroForm = document.getElementById('registro-form');
    const listaRefeicoesEl = document.getElementById('lista-refeicoes');
    const totalConsumidoEl = document.getElementById('total-consumido-registro');
    const metaHojeEl = document.getElementById('meta-hoje-registro');
    const cancelarEdicaoBtn = document.getElementById('cancelar-edicao');
    const hoje = window.getTodayDateString();

    let isEditing = false;
    let editingId = null;

    // ===============================================
    // 1. Funções de Manipulação de Dados
    // ===============================================

    /**
     * Renderiza o item da lista de refeições.
     * @param {object} refeicao O objeto refeição.
     * @returns {string} O HTML do item da lista.
     */
    function createMealItemHTML(refeicao) {
        const tipoLabel = {
            'cafe': 'Café da Manhã',
            'almoco': 'Almoço',
            'janta': 'Jantar',
            'lanche': 'Lanche/Outro',
        }[refeicao.tipo] || 'Refeição';
        
        // Garante que o ID exista para edição/remoção
        const id = refeicao.id || new Date().getTime().toString(); 
        refeicao.id = id; 

        return `
            <li class="meal-item" data-id="${id}">
                <div class="meal-details">
                    <span class="meal-type">${tipoLabel}</span>
                    <span class="meal-description">${refeicao.descricao}</span>
                    <span class="meal-calorias">${refeicao.calorias} kcal</span>
                </div>
                <div class="meal-actions">
                    <button class="edit-btn" data-id="${id}" title="Editar Refeição">✏️</button>
                    <button class="delete-btn" data-id="${id}" title="Remover Refeição">🗑️</button>
                </div>
            </li>
        `;
    }

    /**
     * Renderiza toda a lista de refeições de hoje.
     */
    function renderizarListaRefeicoes() {
        const refeicoesHoje = window.appState.refeicoes.filter(r => r.data === hoje);
        listaRefeicoesEl.innerHTML = ''; // Limpa a lista
        
        if (refeicoesHoje.length === 0) {
            listaRefeicoesEl.innerHTML = '<p class="empty-state">Nenhuma refeição registrada para hoje.</p>';
        } else {
            refeicoesHoje.forEach(refeicao => {
                listaRefeicoesEl.innerHTML += createMealItemHTML(refeicao);
            });
        }
        
        atualizarTotalConsumido(refeicoesHoje);
        
        // Adiciona event listeners para os botões de ação após a renderização
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => editarRefeicao(btn.dataset.id));
        });
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => removerRefeicao(btn.dataset.id));
        });
    }

    /**
     * Atualiza o display do total de calorias consumidas hoje.
     * @param {Array<object>} refeicoesHoje O array de refeições de hoje.
     */
    function atualizarTotalConsumido(refeicoesHoje) {
        const total = refeicoesHoje.reduce((acc, curr) => acc + Number(curr.calorias), 0);
        totalConsumidoEl.textContent = total;
        
        // Atualiza a Meta de Hoje
        const meta = window.appState.perfil ? (window.appState.perfil.metaDiaria || 'Defina no Perfil') : 'Defina no Perfil';
        metaHojeEl.textContent = meta === 'Defina no Perfil' ? meta : `${meta} kcal`;
        
        // Estiliza o total se a meta for excedida (opcional, requer CSS adicional)
        if (typeof meta === 'number' && total > meta) {
             totalConsumidoEl.parentElement.classList.add('over-limit');
        } else {
             totalConsumidoEl.parentElement.classList.remove('over-limit');
        }
    }

    /**
     * Remove uma refeição pelo ID.
     * @param {string} id O ID da refeição a ser removida.
     */
    function removerRefeicao(id) {
        if (confirm('Tem certeza que deseja remover esta refeição?')) {
            window.appState.refeicoes = window.appState.refeicoes.filter(r => r.id !== id);
            window.saveData('nutriportal_refeicoes', window.appState.refeicoes);
            renderizarListaRefeicoes(); // Atualiza a lista
        }
    }

    /**
     * Prepara o formulário para editar uma refeição.
     * @param {string} id O ID da refeição a ser editada.
     */
    function editarRefeicao(id) {
        const refeicao = window.appState.refeicoes.find(r => r.id === id);
        if (!refeicao) return;

        // Preenche o formulário
        document.getElementById('descricao').value = refeicao.descricao;
        document.getElementById('calorias').value = refeicao.calorias;
        document.getElementById('tipo').value = refeicao.tipo;

        // Muda para o modo de edição
        isEditing = true;
        editingId = id;
        registroForm.querySelector('button[type="submit"]').textContent = 'Salvar Edição';
        cancelarEdicaoBtn.classList.remove('hidden');

        // Rola a tela para o formulário
        registroForm.scrollIntoView({ behavior: 'smooth' });
    }
    
    /**
     * Limpa o formulário e retorna ao modo de registro.
     */
    function resetFormulario() {
        registroForm.reset();
        isEditing = false;
        editingId = null;
        registroForm.querySelector('button[type="submit"]').textContent = 'Registrar';
        cancelarEdicaoBtn.classList.add('hidden');
    }

    // ===============================================
    // 2. Event Listeners
    // ===============================================
    
    // Submissão do Formulário
    if (registroForm) {
        registroForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const novaRefeicao = {
                descricao: document.getElementById('descricao').value,
                calorias: Number(document.getElementById('calorias').value),
                tipo: document.getElementById('tipo').value,
                data: hoje,
            };

            if (isEditing) {
                // Modo Edição: Atualiza o item existente
                const index = window.appState.refeicoes.findIndex(r => r.id === editingId);
                if (index !== -1) {
                    // Mantém o ID original
                    window.appState.refeicoes[index] = { ...novaRefeicao, id: editingId }; 
                }
                alert('Refeição atualizada!');
            } else {
                // Modo Registro: Adiciona novo item
                novaRefeicao.id = new Date().getTime().toString(); // ID único
                window.appState.refeicoes.push(novaRefeicao);
                alert('Refeição registrada!');
            }

            window.saveData('nutriportal_refeicoes', window.appState.refeicoes);
            renderizarListaRefeicoes();
            resetFormulario();
        });
    }
    
    // Botão Cancelar Edição
    if (cancelarEdicaoBtn) {
        cancelarEdicaoBtn.addEventListener('click', resetFormulario);
    }

    // ===============================================
    // 3. Inicialização
    // ===============================================

    renderizarListaRefeicoes();
});