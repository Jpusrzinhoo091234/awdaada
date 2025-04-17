// Elementos DOM
const addProductForm = document.getElementById('add-product-form');
const productsList = document.getElementById('products-list');
const adminCartItems = document.getElementById('admin-cart-items');

// Estado da aplicação
let products = [];
let cart = [];

// Inicialização
// Adicionar ao início do arquivo, após as declarações de variáveis existentes
let currentUser = null;

// Modificar a função de inicialização
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAccess();
    loadProducts();
    loadCart();
    renderProductsList();
    renderAdminCart();
    setupEventListeners();
});

// Adicionar esta nova função
function checkAdminAccess() {
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // Verificar se o usuário está logado e é admin
    if (!currentUser || !currentUser.isAdmin) {
        // Redirecionar para a página de login
        window.location.href = 'login.html';
    }
}

// Adicionar à função setupEventListeners
function setupEventListeners() {
    if (addProductForm) {
        addProductForm.addEventListener('submit', addProduct);
    }
    
    // Logout
    const logoutBtn = document.querySelector('.admin-header .logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
}

// Adicionar esta nova função
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// Carregar produtos do localStorage
function loadProducts() {
    const storedProducts = localStorage.getItem('products');
    if (storedProducts) {
        products = JSON.parse(storedProducts);
    } else {
        products = [];
    }
}

// Salvar produtos no localStorage
function saveProducts() {
    localStorage.setItem('products', JSON.stringify(products));
}

// Carregar carrinho do localStorage
function loadCart() {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
        cart = JSON.parse(storedCart);
    } else {
        cart = [];
    }
}

// Salvar carrinho no localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Renderizar lista de produtos
function renderProductsList() {
    if (!productsList) return;
    
    if (products.length === 0) {
        productsList.innerHTML = '<p>Nenhum produto cadastrado.</p>';
        return;
    }
    
    productsList.innerHTML = '';
    
    products.forEach(product => {
        const productItem = document.createElement('div');
        productItem.className = 'admin-list-item';
        productItem.innerHTML = `
            <div class="admin-item-emoji">${product.emoji}</div>
            <div class="admin-item-info">
                <div class="admin-item-name">${product.name}</div>
                <div class="admin-item-price">R$ ${product.price.toFixed(2)}</div>
                <div class="admin-item-category">Categoria: ${getCategoryName(product.category)}</div>
            </div>
            <div class="admin-item-actions">
                <button class="edit-btn" data-id="${product.id}">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="delete-btn" data-id="${product.id}">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
            <div class="edit-form" id="edit-form-${product.id}">
                <div class="form-group">
                    <label for="edit-name-${product.id}">Nome</label>
                    <input type="text" id="edit-name-${product.id}" value="${product.name}" required>
                </div>
                <div class="form-group">
                    <label for="edit-price-${product.id}">Preço (R$)</label>
                    <input type="number" id="edit-price-${product.id}" value="${product.price}" step="0.01" min="0" required>
                </div>
                <div class="form-group">
                    <label for="edit-emoji-${product.id}">Emoji</label>
                    <input type="text" id="edit-emoji-${product.id}" value="${product.emoji}" required>
                </div>
                <div class="form-group">
                    <label for="edit-category-${product.id}">Categoria</label>
                    <select id="edit-category-${product.id}" required>
                        <option value="jogos" ${product.category === 'jogos' ? 'selected' : ''}>Jogos</option>
                        <option value="recargas" ${product.category === 'recargas' ? 'selected' : ''}>Recargas</option>
                        <option value="seguidores" ${product.category === 'seguidores' ? 'selected' : ''}>Seguidores</option>
                        <option value="giftcards" ${product.category === 'giftcards' ? 'selected' : ''}>Gift Cards</option>
                        <option value="contas" ${product.category === 'contas' ? 'selected' : ''}>Contas & Skins</option>
                    </select>
                </div>
                <button type="button" class="btn-primary save-edit-btn" data-id="${product.id}">Salvar Alterações</button>
                <button type="button" class="btn-secondary cancel-edit-btn" data-id="${product.id}">Cancelar</button>
            </div>
        `;
        productsList.appendChild(productItem);
    });
    
    // Adicionar event listeners aos botões
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', toggleEditForm);
    });
    
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', deleteProduct);
    });
    
    document.querySelectorAll('.save-edit-btn').forEach(button => {
        button.addEventListener('click', saveProductEdit);
    });
    
    document.querySelectorAll('.cancel-edit-btn').forEach(button => {
        button.addEventListener('click', toggleEditForm);
    });
}

// Renderizar carrinho no painel admin
function renderAdminCart() {
    if (!adminCartItems) return;
    
    if (cart.length === 0) {
        adminCartItems.innerHTML = '<p>Nenhum item no carrinho.</p>';
        return;
    }
    
    adminCartItems.innerHTML = '';
    
    cart.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (!product) return;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'admin-list-item';
        cartItem.innerHTML = `
            <div class="admin-item-emoji">${product.emoji}</div>
            <div class="admin-item-info">
                <div class="admin-item-name">${product.name}</div>
                <div class="admin-item-price">R$ ${product.price.toFixed(2)}</div>
                <div class="admin-item-quantity">Quantidade: ${item.quantity}</div>
            </div>
            <div class="admin-item-actions">
                <button class="delete-btn remove-from-cart" data-id="${product.id}">
                    <i class="fas fa-trash"></i> Remover
                </button>
            </div>
        `;
        adminCartItems.appendChild(cartItem);
    });
    
    // Adicionar event listeners aos botões de remover do carrinho
    document.querySelectorAll('.remove-from-cart').forEach(button => {
        button.addEventListener('click', removeFromCart);
    });
}

// Adicionar novo produto
function addProduct(event) {
    event.preventDefault();
    
    const nameInput = document.getElementById('product-name');
    const priceInput = document.getElementById('product-price');
    const emojiInput = document.getElementById('product-emoji');
    const categoryInput = document.getElementById('product-category');
    const descriptionInput = document.getElementById('product-description');
    
    const name = nameInput.value.trim();
    const price = parseFloat(priceInput.value);
    const emoji = emojiInput.value.trim();
    const category = categoryInput.value;
    const description = descriptionInput ? descriptionInput.value.trim() : '';
    
    if (!name || isNaN(price) || !emoji || !category) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }
    
    // Gerar ID único
    const id = Date.now();
    
    // Adicionar novo produto
    products.push({
        id,
        name,
        price,
        emoji,
        category,
        description
    });
    
    // Salvar e atualizar
    saveProducts();
    renderProductsList();
    
    // Limpar formulário
    addProductForm.reset();
    
    // Notificação
    alert('Produto adicionado com sucesso!');
}

// Alternar formulário de edição
function toggleEditForm(event) {
    const productId = parseInt(event.target.closest('button').dataset.id);
    const editForm = document.getElementById(`edit-form-${productId}`);
    
    if (editForm) {
        editForm.classList.toggle('active');
    }
}

// Salvar edição de produto
function saveProductEdit(event) {
    const productId = parseInt(event.target.dataset.id);
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex === -1) return;
    
    const nameInput = document.getElementById(`edit-name-${productId}`);
    const priceInput = document.getElementById(`edit-price-${productId}`);
    const emojiInput = document.getElementById(`edit-emoji-${productId}`);
    const categoryInput = document.getElementById(`edit-category-${productId}`);
    
    const name = nameInput.value.trim();
    const price = parseFloat(priceInput.value);
    const emoji = emojiInput.value.trim();
    const category = categoryInput.value;
    
    if (!name || isNaN(price) || !emoji || !category) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }
    
    // Atualizar produto
    products[productIndex] = {
        ...products[productIndex],
        name,
        price,
        emoji,
        category
    };
    
    // Salvar e atualizar
    saveProducts();
    renderProductsList();
    renderAdminCart();
    
    // Notificação
    alert('Produto atualizado com sucesso!');
}

// Excluir produto
function deleteProduct(event) {
    const productId = parseInt(event.target.closest('.delete-btn').dataset.id);
    
    if (!confirm('Tem certeza que deseja excluir este produto?')) {
        return;
    }
    
    // Remover produto
    products = products.filter(p => p.id !== productId);
    
    // Remover do carrinho também
    cart = cart.filter(item => item.id !== productId);
    
    // Salvar e atualizar
    saveProducts();
    saveCart();
    renderProductsList();
    renderAdminCart();
    
    // Notificação
    alert('Produto excluído com sucesso!');
}

// Remover do carrinho
function removeFromCart(event) {
    const productId = parseInt(event.target.closest('.remove-from-cart').dataset.id);
    
    // Remover do carrinho
    cart = cart.filter(item => item.id !== productId);
    
    // Salvar e atualizar
    saveCart();
    renderAdminCart();
    
    // Notificação
    alert('Item removido do carrinho!');
}

// Obter nome da categoria
function getCategoryName(categorySlug) {
    const categories = {
        'jogos': 'Jogos',
        'recargas': 'Recargas',
        'seguidores': 'Seguidores',
        'giftcards': 'Gift Cards',
        'contas': 'Contas & Skins'
    };
    
    return categories[categorySlug] || categorySlug;
}