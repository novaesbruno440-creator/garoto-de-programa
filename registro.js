// registro.js

// Importa funções do main.js: saveToStorage, loadFromStorage, loadUserProfile

document.addEventListener('DOMContentLoaded', () => {
    const registroForm = document.getElementById('registro-form');
    const listaRefeicoes = document.getElementById('lista-refeicoes');
    const today = new Date().toDateString();
    
    let isEditing = false;
    let editingId = null;

    /**
     * Funções de Dados de Refeições
     */
    
    // Carrega todas as refeições
    function loadMeals() {
        return loadFromStorage(MEALS_KEY) || [];
    }
    
    // Salva todas as refeições
    function saveMeals(meals) {
        saveToStorage(MEALS_KEY, meals);
    }
    
    // Filtra as refeições do dia atual
    function getTodayMeals() {
        return loadMeals().filter(meal => new Date(meal.date).toDateString() === today);
    }

    /**
     * Funções de UI
     */
    
    // Renderiza a lista de refeições
    function renderMealList() {
        const todayMeals = getTodayMeals();
        listaRefeicoes.innerHTML = ''; // Limpa a lista
        
        if (todayMeals.length === 0) {
            listaRefeicoes.innerHTML = `
                <div class="empty-state">
                    <p>Você ainda não registrou nada hoje.</p>
                    <p style="margin-top: 5px;">Use o formulário para começar!</p>
                </div>
            `;
            updateDailySummary(0); // Atualiza o resumo para zero
            return;
        }

        let totalCalorias = 0;

        todayMeals.forEach(meal => {
            totalCalorias += meal.calorias;
            
            const mealTypeMap = {
                'cafe': 'Café da Manhã',
                'almoco': 'Almoço',
                'janta': 'Jantar',
                'lanche': 'Lanche'
            };

            const listItem = document.createElement('li');
            listItem.className = 'meal-item';
            listItem.dataset.id = meal.id;
            
            listItem.innerHTML = `
                <div class="meal-details">
                    <span class="meal-type">${mealTypeMap[meal.tipo]}</span>
                    <span class="meal-description">${meal.descricao}</span>
                    <span class="meal-calorias">${meal.calorias} kcal</span>
                </div>
                <div class="meal-actions">
                    <button class="edit-btn" data-id="${meal.id}" title="Editar">✏️</button>
                    <button class="delete-btn" data-id="${meal.id}" title="Excluir">🗑️</button>
                </div>
            `;
            listaRefeicoes.appendChild(listItem);
        });
        
        // Atualiza o resumo calórico e metas após renderizar
        updateDailySummary(totalCalorias);

        // Adiciona listeners para edição e exclusão
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', handleEdit);
        });
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', handleDelete);
        });
    }

    // Atualiza os cards de resumo diário
    function updateDailySummary(consumed) {
        const userProfile = loadUserProfile();
        const goal = userProfile.metas?.meta || null;
        
        document.getElementById('consumo-diario-registro').textContent = consumed;
        document.getElementById('meta-diaria').textContent = goal ? `${goal} kcal` : '--';
        
        const remainingEl = document.getElementById('calorias-restantes');
        
        if (goal) {
            const remaining = goal - consumed;
            remainingEl.textContent = `${remaining} kcal`;
            remainingEl.style.color = remaining >= 0 ? 'var(--primary-dark)' : 'var(--color-alert)';
        } else {
            remainingEl.textContent = '--';
            remainingEl.style.color = 'var(--text-secondary)';
        }
    }


    /**
     * Handlers de Ação
     */

    // Handler de Submissão do Formulário
    registroForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const descricao = document.getElementById('descricao').value.trim();
        const calorias = Number(document.getElementById('calorias').value);
        const tipo = document.getElementById('tipo').value;

        const newMeal = {
            id: isEditing ? editingId : Date.now(), // Usa o ID existente na edição
            descricao,
            calorias,
            tipo,
            date: new Date().toISOString()
        };

        let allMeals = loadMeals();

        if (isEditing) {
            // Edição: encontra e substitui o item
            const index = allMeals.findIndex(meal => meal.id === editingId);
            if (index !== -1) {
                allMeals[index] = newMeal;
            }
            alert('Refeição editada com sucesso!');
        } else {
            // Novo Registro: adiciona o item
            allMeals.push(newMeal);
            alert('Refeição registrada com sucesso!');
        }
        
        saveMeals(allMeals);
        registroForm.reset();
        
        // Finaliza o modo de edição
        resetFormMode(); 
        
        renderMealList();
    });
    
    // Handler de Edição
    function handleEdit(e) {
        const id = Number(e.currentTarget.dataset.id);
        const mealToEdit = loadMeals().find(meal => meal.id === id);
        
        if (mealToEdit) {
            // 1. Pré-preenche o formulário
            document.getElementById('descricao').value = mealToEdit.descricao;
            document.getElementById('calorias').value = mealToEdit.calorias;
            document.getElementById('tipo').value = mealToEdit.tipo;
            
            // 2. Entra no modo de edição
            isEditing = true;
            editingId = id;
            document.querySelector('.btn[type="submit"]').textContent = '✔️ Salvar Alterações';
            document.getElementById('cancelar-edicao').classList.remove('hidden');
            
            // Rola para o topo do formulário no mobile
            document.getElementById('descricao').focus(); 
        }
    }
    
    // Handler de Exclusão
    function handleDelete(e) {
        const id = Number(e.currentTarget.dataset.id);

        if (confirm('Tem certeza que deseja excluir esta refeição?')) {
            let allMeals = loadMeals();
            // Filtra, mantendo apenas as refeições que NÃO têm o ID excluído
            const updatedMeals = allMeals.filter(meal => meal.id !== id);
            
            saveMeals(updatedMeals);
            
            // Se estiver editando o item que foi excluído, reseta o formulário
            if (editingId === id) {
                resetFormMode();
            }
            
            alert('Refeição excluída com sucesso.');
            renderMealList();
        }
    }
    
    // Reseta o estado do formulário para "novo registro"
    function resetFormMode() {
        isEditing = false;
        editingId = null;
        document.querySelector('.btn[type="submit"]').textContent = '➕ Registrar';
        document.getElementById('cancelar-edicao').classList.add('hidden');
        registroForm.reset();
    }
    
    // Listener para o botão "Cancelar Edição"
    document.getElementById('cancelar-edicao')?.addEventListener('click', () => {
        resetFormMode();
    });

    /**
     * Inicialização
     */
    renderMealList();
});
