// Elementos DOM
const productsContainer = document.getElementById('products-container');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalPrice = document.getElementById('cart-total-price');
const cartCount = document.querySelector('.cart-count');
const checkoutBtn = document.getElementById('checkout-btn');
const categoryCards = document.querySelectorAll('.category-card');
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('nav');

// Elementos de login
const loginLink = document.getElementById('login-link');
const userDropdown = document.getElementById('user-dropdown');
const userName = document.getElementById('user-name');
const logoutBtn = document.getElementById('logout-btn');
const adminLink = document.getElementById('admin-link');

// Estado da aplicação
let products = [];
let cart = [];
let currentCategory = null;
let currentUser = null;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    loadCart();
    loadUser();
    renderProducts();
    renderCart();
    setupEventListeners();
});

// Carregar produtos do localStorage
function loadProducts() {
    const storedProducts = localStorage.getItem('products');
    if (storedProducts) {
        products = JSON.parse(storedProducts);
    } else {
        // Produtos padrão se não houver nenhum no localStorage
        products = [
            { id: 1, name: '720 diamantes', price: 27.90, emoji: '🎮', category: 'jogos' },
            { id: 2, name: 'Recarga R$50', price: 50.00, emoji: '💰', category: 'recargas' },
            { id: 3, name: '1000 seguidores', price: 35.00, emoji: '👥', category: 'seguidores' },
            { id: 4, name: 'Gift Card R$100', price: 100.00, emoji: '🎁', category: 'giftcards' },
            { id: 5, name: 'Conta Premium', price: 45.00, emoji: '🧙', category: 'contas' }
        ];
        localStorage.setItem('products', JSON.stringify(products));
    }
}

// Carregar usuário do localStorage
function loadUser() {
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (currentUser) {
        // Usuário está logado
        if (loginLink) loginLink.style.display = 'none';
        if (userDropdown) userDropdown.style.display = 'block';
        if (userName) userName.textContent = currentUser.name;
        
        // Mostrar link do admin se for admin
        if (currentUser.isAdmin && adminLink) {
            adminLink.style.display = 'block';
        }
    } else {
        // Usuário não está logado
        if (loginLink) loginLink.style.display = 'flex';
        if (userDropdown) userDropdown.style.display = 'none';
    }
}

// Carregar carrinho do localStorage
function loadCart() {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
        cart = JSON.parse(storedCart);
    }
}

// Salvar carrinho no localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

// Atualizar contador do carrinho
function updateCartCount() {
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = totalItems;
}

// Renderizar produtos
function renderProducts() {
    if (!productsContainer) return;
    
    let filteredProducts = products;
    if (currentCategory) {
        filteredProducts = products.filter(product => product.category === currentCategory);
    }
    
    productsContainer.innerHTML = '';
    
    if (filteredProducts.length === 0) {
        productsContainer.innerHTML = '<p class="empty-products">Nenhum produto encontrado nesta categoria.</p>';
        return;
    }
    
    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-emoji">${product.emoji}</div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <div class="product-price">R$ ${product.price.toFixed(2)}</div>
            </div>
            <button class="btn-primary add-to-cart" data-id="${product.id}">Comprar</button>
        `;
        productsContainer.appendChild(productCard);
    });
    
    // Adicionar event listeners aos botões de compra
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', addToCart);
    });
}

// Renderizar carrinho
function renderCart() {
    if (!cartItemsContainer) return;
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart">Seu carrinho está vazio.</p>';
        cartTotalPrice.textContent = 'R$ 0,00';
        return;
    }
    
    cartItemsContainer.innerHTML = '';
    
    let total = 0;
    
    cart.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (!product) return;
        
        const itemTotal = product.price * item.quantity;
        total += itemTotal;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-emoji">${product.emoji}</div>
            <div class="cart-item-info">
                <div class="cart-item-name">${product.name}</div>
                <div class="cart-item-price">R$ ${product.price.toFixed(2)}</div>
            </div>
            <div class="cart-item-quantity">
                <button class="quantity-btn decrease" data-id="${product.id}">-</button>
                <span class="quantity-value">${item.quantity}</span>
                <button class="quantity-btn increase" data-id="${product.id}">+</button>
            </div>
            <button class="remove-item" data-id="${product.id}">
                <i class="fas fa-trash"></i>
            </button>
        `;
        cartItemsContainer.appendChild(cartItem);
    });
    
    cartTotalPrice.textContent = `R$ ${total.toFixed(2)}`;
    
    // Adicionar event listeners aos botões do carrinho
    document.querySelectorAll('.quantity-btn.decrease').forEach(button => {
        button.addEventListener('click', decreaseQuantity);
    });
    
    document.querySelectorAll('.quantity-btn.increase').forEach(button => {
        button.addEventListener('click', increaseQuantity);
    });
    
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', removeFromCart);
    });
}

// Adicionar ao carrinho
function addToCart(event) {
    const productId = parseInt(event.target.dataset.id);
    const product = products.find(p => p.id === productId);
    
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id: productId, quantity: 1 });
    }
    
    saveCart();
    renderCart();
    
    // Animação de adicionado ao carrinho
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = 'Produto adicionado ao carrinho!';
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 2000);
}

// Diminuir quantidade
function decreaseQuantity(event) {
    const productId = parseInt(event.target.dataset.id);
    const itemIndex = cart.findIndex(item => item.id === productId);
    
    if (itemIndex === -1) return;
    
    if (cart[itemIndex].quantity > 1) {
        cart[itemIndex].quantity -= 1;
    } else {
        cart.splice(itemIndex, 1);
    }
    
    saveCart();
    renderCart();
}

// Aumentar quantidade
function increaseQuantity(event) {
    const productId = parseInt(event.target.dataset.id);
    const item = cart.find(item => item.id === productId);
    
    if (!item) return;
    
    item.quantity += 1;
    
    saveCart();
    renderCart();
}

// Remover do carrinho
function removeFromCart(event) {
    const productId = parseInt(event.target.closest('.remove-item').dataset.id);
    const itemIndex = cart.findIndex(item => item.id === productId);
    
    if (itemIndex === -1) return;
    
    cart.splice(itemIndex, 1);
    
    saveCart();
    renderCart();
}

// Finalizar compra
function checkout() {
    if (cart.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }
    
    alert('Compra finalizada com sucesso! Obrigado por comprar na CartoonMax!');
    cart = [];
    saveCart();
    renderCart();
}

// Logout
function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    loadUser();
    
    // Redirecionar para a página inicial se estiver na área de admin
    if (window.location.href.includes('admin.html')) {
        window.location.href = 'index.html';
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Filtrar por categoria
    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            
            // Toggle categoria selecionada
            if (currentCategory === category) {
                currentCategory = null;
                categoryCards.forEach(c => c.classList.remove('active'));
            } else {
                currentCategory = category;
                categoryCards.forEach(c => {
                    if (c.dataset.category === category) {
                        c.classList.add('active');
                    } else {
                        c.classList.remove('active');
                    }
                });
            }
            
            renderProducts();
        });
    });
    
    // Menu mobile
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            nav.classList.toggle('active');
        });
    }
    
    // Botão de finalizar compra
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', checkout);
    }
    
    // Botão "Ver Ofertas"
    const offerBtn = document.querySelector('.hero .btn-primary');
    if (offerBtn) {
        offerBtn.addEventListener('click', () => {
            const productsSection = document.getElementById('produtos');
            if (productsSection) {
                productsSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
    
    // Toggle dropdown do usuário
    if (userName) {
        userName.addEventListener('click', (e) => {
            e.preventDefault();
            userDropdown.classList.toggle('active');
        });
    }
}