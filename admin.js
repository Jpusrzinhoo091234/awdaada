// Admin Panel JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in and is admin
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || !currentUser.isAdmin) {
        window.location.href = 'login.html';
        return;
    }
    
    // Update admin name
    document.getElementById('admin-name').textContent = currentUser.name;
    
    // Initialize data
    initializeData();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial data
    loadDashboard();
    loadProducts();
    loadOrders();
    loadUsers();
    
    // Functions
    function initializeData() {
        // Initialize products if not exists
        if (!localStorage.getItem('products')) {
            const defaultProducts = [
                {
                    id: 1,
                    name: 'Minecraft Premium',
                    price: 99.99,
                    category: 'jogos',
                    emoji: '🎮'
                },
                {
                    id: 2,
                    name: 'Gift Card Steam R$50',
                    price: 55.00,
                    category: 'giftcards',
                    emoji: '🎁'
                },
                {
                    id: 3,
                    name: '1000 Seguidores Instagram',
                    price: 29.99,
                    category: 'seguidores',
                    emoji: '👥'
                },
                {
                    id: 4,
                    name: 'Recarga Free Fire 1000 Diamantes',
                    price: 49.99,
                    category: 'recargas',
                    emoji: '💎'
                },
                {
                    id: 5,
                    name: 'Conta Netflix Premium',
                    price: 25.00,
                    category: 'contas',
                    emoji: '📺'
                }
            ];
            localStorage.setItem('products', JSON.stringify(defaultProducts));
        }
        
        // Initialize orders if not exists
        if (!localStorage.getItem('orders')) {
            localStorage.setItem('orders', JSON.stringify([]));
        }
    }
    
    function setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const tabId = this.dataset.tab;
                showTab(tabId);
            });
        });
        
        // Logout
        document.getElementById('admin-logout-btn').addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
        
        // Add product button
        document.getElementById('add-product-btn').addEventListener('click', function() {
            showProductModal();
        });
        
        // Product form submit
        document.getElementById('product-form').addEventListener('submit', function(e) {
            e.preventDefault();
            saveProduct();
        });
        
        // Close modals
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', function() {
                closeModals();
            });
        });
        
        // Order status filter
        document.getElementById('order-status-filter').addEventListener('change', function() {
            loadOrders();
        });
        
        // Window click to close modals
        window.addEventListener('click', function(e) {
            if (e.target.classList.contains('admin-modal')) {
                closeModals();
            }
        });
    }
    
    function showTab(tabId) {
        // Hide all tabs
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show selected tab
        document.getElementById(`${tabId}-tab`).classList.add('active');
        
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        document.querySelector(`.nav-link[data-tab="${tabId}"]`).classList.add('active');
    }
    
    function logout() {
        // Clear current user
        localStorage.removeItem('currentUser');
        
        // Redirect to login
        window.location.href = 'login.html';
    }
    
    function loadDashboard() {
        // Load counts
        const products = JSON.parse(localStorage.getItem('products')) || [];
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        document.getElementById('total-products').textContent = products.length;
        document.getElementById('total-orders').textContent = orders.length;
        document.getElementById('total-users').textContent = users.length;
        
        // Calculate revenue
        const revenue = orders
            .filter(order => order.status === 'completed' || order.status === 'approved')
            .reduce((total, order) => total + order.total, 0);
        
        document.getElementById('total-revenue').textContent = `R$ ${revenue.toFixed(2)}`;
        
        // Load recent sales
        const recentSales = document.getElementById('recent-sales');
        recentSales.innerHTML = '';
        
        // Sort orders by date (newest first)
        const recentOrders = [...orders]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);
        
        recentOrders.forEach(order => {
            const saleItem = document.createElement('div');
            saleItem.className = 'sale-item';
            
            const date = new Date(order.date);
            const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
            
            saleItem.innerHTML = `
                <div class="sale-info">
                    <div class="sale-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="sale-details">
                        <h4>${order.customerName}</h4>
                        <p>${formattedDate}</p>
                    </div>
                </div>
                <div class="sale-amount">R$ ${order.total.toFixed(2)}</div>
            `;
            
            recentSales.appendChild(saleItem);
        });
        
        if (recentOrders.length === 0) {
            recentSales.innerHTML = '<p>Nenhuma venda recente</p>';
        }
    }
    
    function loadProducts() {
        const products = JSON.parse(localStorage.getItem('products')) || [];
        const tableBody = document.getElementById('products-table-body');
        tableBody.innerHTML = '';
        
        products.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.id}</td>
                <td>${product.emoji} ${product.name}</td>
                <td>R$ ${product.price.toFixed(2)}</td>
                <td>${getCategoryName(product.category)}</td>
                <td>
                    <button class="btn-action btn-edit" data-id="${product.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn-action btn-delete" data-id="${product.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Add event listeners to buttons
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = parseInt(this.dataset.id);
                editProduct(productId);
            });
        });
        
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = parseInt(this.dataset.id);
                deleteProduct(productId);
            });
        });
    }
    
    function loadOrders() {
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        const tableBody = document.getElementById('orders-table-body');
        const statusFilter = document.getElementById('order-status-filter').value;
        
        tableBody.innerHTML = '';
        
        // Filter orders by status
        let filteredOrders = orders;
        if (statusFilter !== 'all') {
            filteredOrders = orders.filter(order => order.status === statusFilter);
        }
        
        // Sort orders by date (newest first)
        filteredOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        filteredOrders.forEach(order => {
            const row = document.createElement('tr');
            
            const date = new Date(order.date);
            const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
            
            row.innerHTML = `
                <td>${order.id}</td>
                <td>${order.customerName}</td>
                <td>${formattedDate}</td>
                <td>R$ ${order.total.toFixed(2)}</td>
                <td><span class="status-badge status-${order.status}">${getStatusName(order.status)}</span></td>
                <td>
                    <button class="btn-action btn-view" data-id="${order.id}"><i class="fas fa-eye"></i></button>
                    ${order.status === 'pending' ? `
                        <button class="btn-action btn-approve" data-id="${order.id}"><i class="fas fa-check"></i></button>
                        <button class="btn-action btn-deny" data-id="${order.id}"><i class="fas fa-times"></i></button>
                    ` : ''}
                    ${order.status === 'approved' ? `
                        <button class="btn-action btn-chat" data-id="${order.id}"><i class="fas fa-comments"></i></button>
                        <button class="btn-action btn-complete" data-id="${order.id}"><i class="fas fa-check-double"></i></button>
                    ` : ''}
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Add event listeners to buttons
        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', function() {
                const orderId = parseInt(this.dataset.id);
                viewOrder(orderId);
            });
        });
        
        document.querySelectorAll('.btn-approve').forEach(btn => {
            btn.addEventListener('click', function() {
                const orderId = parseInt(this.dataset.id);
                approveOrder(orderId);
            });
        });
        
        document.querySelectorAll('.btn-deny').forEach(btn => {
            btn.addEventListener('click', function() {
                const orderId = parseInt(this.dataset.id);
                denyOrder(orderId);
            });
        });
        
        document.querySelectorAll('.btn-chat').forEach(btn => {
            btn.addEventListener('click', function() {
                const orderId = parseInt(this.dataset.id);
                openChatForOrder(orderId);
            });
        });
        
        document.querySelectorAll('.btn-complete').forEach(btn => {
            btn.addEventListener('click', function() {
                const orderId = parseInt(this.dataset.id);
                completeOrder(orderId);
            });
        });
    }
    
    function loadUsers() {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const tableBody = document.getElementById('users-table-body');
        tableBody.innerHTML = '';
        
        users.forEach(user => {
            const row = document.createElement('tr');
            
            const createdAt = new Date(user.createdAt);
            const formattedCreatedAt = `${createdAt.getDate().toString().padStart(2, '0')}/${(createdAt.getMonth() + 1).toString().padStart(2, '0')}/${createdAt.getFullYear()}`;
            
            const lastLogin = new Date(user.lastLogin);
            const formattedLastLogin = `${lastLogin.getDate().toString().padStart(2, '0')}/${(lastLogin.getMonth() + 1).toString().padStart(2, '0')}/${lastLogin.getFullYear()}`;
            
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.username}</td>
                <td>${formattedCreatedAt}</td>
                <td>${formattedLastLogin}</td>
                <td>
                    <button class="btn-action btn-view-user" data-id="${user.id}"><i class="fas fa-eye"></i></button>
                    ${!user.isAdmin ? `<button class="btn-action btn-delete-user" data-id="${user.id}"><i class="fas fa-trash"></i></button>` : ''}
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Add event listeners to buttons
        document.querySelectorAll('.btn-view-user').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = parseInt(this.dataset.id);
                viewUser(userId);
            });
        });
        
        document.querySelectorAll('.btn-delete-user').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = parseInt(this.dataset.id);
                deleteUser(userId);
            });
        });
    }
    
    function showProductModal(product = null) {
        const modal = document.getElementById('product-modal');
        const modalTitle = document.getElementById('product-modal-title');
        const form = document.getElementById('product-form');
        
        // Reset form
        form.reset();
        
        if (product) {
            // Edit mode
            modalTitle.textContent = 'Editar Produto';
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-category').value = product.category;
            document.getElementById('product-emoji').value = product.emoji;
            form.dataset.id = product.id;
        } else {
            // Add mode
            modalTitle.textContent = 'Adicionar Produto';
            delete form.dataset.id;
        }
        
        modal.style.display = 'block';
    }
    
    function saveProduct() {
        const form = document.getElementById('product-form');
        const name = document.getElementById('product-name').value;
        const price = parseFloat(document.getElementById('product-price').value);
        const category = document.getElementById('product-category').value;
        const emoji = document.getElementById('product-emoji').value;
        
        const products = JSON.parse(localStorage.getItem('products')) || [];
        
        if (form.dataset.id) {
            // Edit mode
            const id = parseInt(form.dataset.id);
            const index = products.findIndex(p => p.id === id);
            
            if (index !== -1) {
                products[index] = {
                    id,
                    name,
                    price,
                    category,
                    emoji
                };
            }
        } else {
            // Add mode
            const id = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
            
            products.push({
                id,
                name,
                price,
                category,
                emoji
            });
        }
        
        localStorage.setItem('products', JSON.stringify(products));
        closeModals();
        loadProducts();
        loadDashboard();
    }
    
    function editProduct(productId) {
        const products = JSON.parse(localStorage.getItem('products')) || [];
        const product = products.find(p => p.id === productId);
        
        if (product) {
            showProductModal(product);
        }
    }
    
    function deleteProduct(productId) {
        if (confirm('Tem certeza que deseja excluir este produto?')) {
            const products = JSON.parse(localStorage.getItem('products')) || [];
            const filteredProducts = products.filter(p => p.id !== productId);
            
            localStorage.setItem('products', JSON.stringify(filteredProducts));
            loadProducts();
            loadDashboard();
        }
    }
    
    function viewOrder(orderId) {
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        const order = orders.find(o => o.id === orderId);
        
        if (order) {
            const modal = document.getElementById('order-modal');
            
            document.getElementById('order-id').textContent = order.id;
            document.getElementById('order-customer').textContent = order.customerName;
            
            const date = new Date(order.date);
            const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
            document.getElementById('order-date').textContent = formattedDate;
            
            document.getElementById('order-status').textContent = getStatusName(order.status);
            document.getElementById('order-status').className = `status-badge status-${order.status}`;
            
            const itemsBody = document.getElementById('order-items-body');
            itemsBody.innerHTML = '';
            
            order.items.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>R$ ${item.price.toFixed(2)}</td>
                    <td>R$ ${(item.price * item.quantity).toFixed(2)}</td>
                `;
                itemsBody.appendChild(row);
            });
            
            document.getElementById('order-total').textContent = order.total.toFixed(2);
            
            // Show/hide action buttons based on status
            const approveBtn = document.getElementById('approve-order-btn');
            const denyBtn = document.getElementById('deny-order-btn');
            const chatBtn = document.getElementById('chat-with-customer-btn');
            
            if (order.status === 'pending') {
                approveBtn.style.display = 'inline-block';
                denyBtn.style.display = 'inline-block';
                chatBtn.style.display = 'none';
            } else if (order.status === 'approved') {
                approveBtn.style.display = 'none';
                denyBtn.style.display = 'none';
                chatBtn.style.display = 'inline-block';
            } else {
                approveBtn.style.display = 'none';
                denyBtn.style.display = 'none';
                chatBtn.style.display = 'none';
            }
            
            // Set up action buttons
            approveBtn.onclick = function() {
                approveOrder(order.id);
                closeModals();
            };
            
            denyBtn.onclick = function() {
                denyOrder(order.id);
                closeModals();
            };
            
            chatBtn.onclick = function() {
                openChatForOrder(order.id);
                closeModals();
            };
            
            modal.style.display = 'block';
        }
    }
    
    function viewUser(userId) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.id === userId);
        
        if (user) {
            const modal = document.getElementById('user-modal');
            
            document.getElementById('user-id').textContent = user.id;
            document.getElementById('user-name').textContent = user.name;
            document.getElementById('user-username').textContent = user.username;
            document.getElementById('user-email').textContent = user.email || 'N/A';
            
            const createdAt = new Date(user.createdAt);
            const formattedCreatedAt = `${createdAt.getDate().toString().padStart(2, '0')}/${(createdAt.getMonth() + 1).toString().padStart(2, '0')}/${createdAt.getFullYear()}`;
            document.getElementById('user-created').textContent = formattedCreatedAt;
            
            const lastLogin = new Date(user.lastLogin);
            const formattedLastLogin = `${lastLogin.getDate().toString().padStart(2, '0')}/${(lastLogin.getMonth() + 1).toString().padStart(2, '0')}/${lastLogin.getFullYear()} ${lastLogin.getHours().toString().padStart(2, '0')}:${lastLogin.getMinutes().toString().padStart(2, '0')}`;
            document.getElementById('user-last-login').textContent = formattedLastLogin;
            
            // Get user orders
            const orders = JSON.parse(localStorage.getItem('orders')) || [];
            const userOrders = orders.filter(o => o.userId === userId);
            
            document.getElementById('user-orders-count').textContent = userOrders.length;
            
            // Calculate total spent
            const totalSpent = userOrders
                .filter(order => order.status === 'completed' || order.status === 'approved')
                .reduce((total, order) => total + order.total, 0);
            
            document.getElementById('user-total-spent').textContent = `R$ ${totalSpent.toFixed(2)}`;
            
            // Load user orders
            const ordersBody = document.getElementById('user-orders-body');
            ordersBody.innerHTML = '';
            
            userOrders.forEach(order => {
                const row = document.createElement('tr');
                
                const date = new Date(order.date);
                const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
                
                row.innerHTML = `
                    <td>${order.id}</td>
                    <td>${formattedDate}</td>
                    <td>R$ ${order.total.toFixed(2)}</td>
                    <td><span class="status-badge status-${order.status}">${getStatusName(order.status)}</span></td>
                `;
                
                ordersBody.appendChild(row);
            });
            
            if (userOrders.length === 0) {
                ordersBody.innerHTML = '<tr><td colspan="4">Nenhum pedido encontrado</td></tr>';
            }
            
            modal.style.display = 'block';
        }
    }
    
    function deleteUser(userId) {
        if (confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const filteredUsers = users.filter(u => u.id !== userId);
            
            localStorage.setItem('users', JSON.stringify(filteredUsers));
            loadUsers();
            loadDashboard();
        }
    }
    
    function approveOrder(orderId) {
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        const orderIndex = orders.findIndex(o => o.id === orderId);
        
        if (orderIndex !== -1) {
            orders[orderIndex].status = 'approved';
            localStorage.setItem('orders', JSON.stringify(orders));
            
            // Create chat for this order
            createChatForOrder(orders[orderIndex]);
            
            loadOrders();
            loadDashboard();
            
            // Show success message
            showNotification('Pedido aprovado com sucesso!', 'success');
        }
    }
    
    function denyOrder(orderId) {
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        const orderIndex = orders.findIndex(o => o.id === orderId);
        
        if (orderIndex !== -1) {
            orders[orderIndex].status = 'denied';
            localStorage.setItem('orders', JSON.stringify(orders));
            
            loadOrders();
            loadDashboard();
            
            // Show success message
            showNotification('Pedido negado com sucesso!', 'error');
        }
    }
    
    function completeOrder(orderId) {
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        const orderIndex = orders.findIndex(o => o.id === orderId);
        
        if (orderIndex !== -1) {
            orders[orderIndex].status = 'completed';
            localStorage.setItem('orders', JSON.stringify(orders));
            
            loadOrders();
            loadDashboard();
            
            // Show success message
            showNotification('Pedido concluído com sucesso!', 'success');
        }
    }
    
    function openChatForOrder(orderId) {
        // Find chat for this order
        const chats = JSON.parse(localStorage.getItem('chats')) || [];
        const chat = chats.find(c => c.orderId === orderId);
        
        if (chat) {
            // Switch to chat tab
            showTab('chat');
            
            // Select this chat
            setTimeout(() => {
                const chatItem = document.querySelector(`.chat-item[data-chat-id="${chat.id}"]`);
                if (chatItem) {
                    chatItem.click();
                }
            }, 100);
        } else {
            // Create new chat
            const orders = JSON.parse(localStorage.getItem('orders')) || [];
            const order = orders.find(o => o.id === orderId);
            
            if (order) {
                const newChat = createChatForOrder(order);
                
                // Switch to chat tab
                showTab('chat');
                
                // Select this chat
                setTimeout(() => {
                    const chatItem = document.querySelector(`.chat-item[data-chat-id="${newChat.id}"]`);
                    if (chatItem) {
                        chatItem.click();
                    }
                }, 100);
            }
        }
    }
    
    function createChatForOrder(order) {
        // Check if chat already exists
        const chats = JSON.parse(localStorage.getItem('chats')) || [];
        const existingChat = chats.find(c => c.orderId === order.id);
        
        if (existingChat) {
            return existingChat;
        }
        
        // Create new chat
        const newChat = {
            id: Date.now(),
            orderId: order.id,
            userId: order.userId,
            userName: order.customerName,
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            online: false,
            completed: false,
            messages: []
        };
        
        // Add welcome message
        newChat.messages.push({
            id: Date.now(),
            content: `Olá ${order.customerName}! Seu pedido #${order.id} foi aprovado. Estamos aqui para ajudar com qualquer dúvida.`,
            sender: 'admin',
            timestamp: new Date().toISOString(),
            read: false
        });
        
        // Add to chats
        chats.push(newChat);
        localStorage.setItem('chats', JSON.stringify(chats));
        
        return newChat;
    }
    
    function closeModals() {
        document.querySelectorAll('.admin-modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }
    
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `admin-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : 'fa-info-circle'}"></i>
            </div>
            <div class="notification-message">${message}</div>
        `;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Hide notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            
            // Remove from DOM after animation
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    function getCategoryName(category) {
        const categories = {
            'jogos': 'Jogos',
            'giftcards': 'Gift Cards',
            'seguidores': 'Seguidores',
            'recargas': 'Recargas',
            'contas': 'Contas'
        };
        
        return categories[category] || category;
    }
    
    function getStatusName(status) {
        const statuses = {
            'pending': 'Pendente',
            'approved': 'Aprovado',
            'completed': 'Concluído',
            'denied': 'Negado',
            'cancelled': 'Cancelado'
        };
        
        return statuses[status] || status;
    }
});

// Chat functionality for admin panel
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the admin page
    if (document.querySelector('.admin-container')) {
        // Initialize chat
        setupAdminChat();
        
        // Update notification badge
        updateChatNotificationBadge();
        
        // Check for new messages every 5 seconds
        setInterval(updateChatNotificationBadge, 5000);
    }
    
    function setupAdminChat() {
        // DOM elements
        const chatList = document.getElementById('chat-list');
        const chatMessages = document.getElementById('chat-messages');
        const chatInput = document.getElementById('chat-message-input');
        const sendButton = document.getElementById('send-message-btn');
        const chatFilter = document.getElementById('chat-filter');
        const searchChat = document.getElementById('search-chat');
        const viewOrderBtn = document.getElementById('view-order-btn');
        const markCompletedBtn = document.getElementById('mark-completed-btn');
        
        // Current selected chat
        let currentChatId = null;
        
        // Event listeners
        chatFilter.addEventListener('change', renderChatList);
        searchChat.addEventListener('input', renderChatList);
        
        sendButton.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        viewOrderBtn.addEventListener('click', function() {
            if (currentChatId) {
                const chats = JSON.parse(localStorage.getItem('chats')) || [];
                const chat = chats.find(c => c.id === currentChatId);
                
                if (chat) {
                    // Find order
                    const orders = JSON.parse(localStorage.getItem('orders')) || [];
                    const order = orders.find(o => o.id === chat.orderId);
                    
                    if (order) {
                        viewOrder(order.id);
                    }
                }
            }
        });
        
        markCompletedBtn.addEventListener('click', function() {
            if (currentChatId) {
                const chats = JSON.parse(localStorage.getItem('chats')) || [];
                const chatIndex = chats.findIndex(c => c.id === currentChatId);
                
                if (chatIndex !== -1) {
                    // Mark chat as completed
                    chats[chatIndex].completed = true;
                    localStorage.setItem('chats', JSON.stringify(chats));
                    
                    // Update UI
                    renderChatList();
                    renderChatMessages(currentChatId);
                    
                    // Show notification
                    showNotification('Chat marcado como concluído!', 'success');
                }
            }
        });
        
        // Initial render
        renderChatList();
        
        // Check for new messages every 3 seconds
        setInterval(checkForNewMessages, 3000);
        
        // Functions
        function renderChatList() {
            const chats = JSON.parse(localStorage.getItem('chats')) || [];
            const filterValue = chatFilter.value;
            const searchValue = searchChat.value.toLowerCase();
            
            // Clear chat list
            chatList.innerHTML = '';
            
            // Filter chats
            let filteredChats = chats;
            
            if (filterValue === 'active') {
                filteredChats = chats.filter(chat => !chat.completed);
            } else if (filterValue === 'completed') {
                filteredChats = chats.filter(chat => chat.completed);
            }
            
            // Search filter
            if (searchValue) {
                filteredChats = filteredChats.filter(chat => 
                    chat.userName.toLowerCase().includes(searchValue) || 
                    chat.orderId.toString().includes(searchValue)
                );
            }
            
            // Sort chats by last activity (newest first)
            filteredChats.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
            
            // Render chats
            filteredChats.forEach(chat => {
                const chatItem = document.createElement('div');
                chatItem.className = `chat-item ${chat.completed ? 'completed' : ''} ${currentChatId === chat.id ? 'active' : ''}`;
                chatItem.dataset.chatId = chat.id;
                
                // Get last message
                const lastMessage = chat.messages.length > 0 ? 
                    chat.messages[chat.messages.length - 1] : null;
                
                // Format last activity time
                const lastActivity = new Date(chat.lastActivity);
                const now = new Date();
                let timeString;
                
                if (lastActivity.toDateString() === now.toDateString()) {
                    // Today - show time
                    timeString = `${lastActivity.getHours().toString().padStart(2, '0')}:${lastActivity.getMinutes().toString().padStart(2, '0')}`;
                } else if (lastActivity.toDateString() === new Date(now.setDate(now.getDate() - 1)).toDateString()) {
                    // Yesterday
                    timeString = 'Ontem';
                } else {
                    // Other days - show date
                    timeString = `${lastActivity.getDate().toString().padStart(2, '0')}/${(lastActivity.getMonth() + 1).toString().padStart(2, '0')}`;
                }
                
                // Count unread messages
                const unreadCount = chat.messages.filter(msg => !msg.read && msg.sender !== 'admin').length;
                
                chatItem.innerHTML = `
                    <div class="chat-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="chat-info">
                        <div class="chat-header">
                            <h4>${chat.userName}</h4>
                            <span class="chat-time">${timeString}</span>
                        </div>
                        <div class="chat-preview">
                            <p>${lastMessage ? (lastMessage.sender === 'admin' ? 'Você: ' : '') + lastMessage.content : 'Novo chat'}</p>
                            ${unreadCount > 0 ? `<span class="chat-badge">${unreadCount}</span>` : ''}
                        </div>
                        <div class="chat-meta">
                            <span class="chat-order">Pedido #${chat.orderId}</span>
                            ${chat.online ? '<span class="chat-status online">Online</span>' : ''}
                            ${chat.completed ? '<span class="chat-status completed">Concluído</span>' : ''}
                        </div>
                    </div>
                `;
                
                chatItem.addEventListener('click', function() {
                    selectChat(chat.id);
                });
                
                chatList.appendChild(chatItem);
            });
            
            if (filteredChats.length === 0) {
                chatList.innerHTML = `
                    <div class="no-chats">
                        <i class="fas fa-comments"></i>
                        <p>Nenhum chat encontrado</p>
                    </div>
                `;
            }
        }
        
        function selectChat(chatId) {
            // Update current chat
            currentChatId = chatId;
            
            // Update UI
            document.querySelectorAll('.chat-item').forEach(item => {
                item.classList.remove('active');
            });
            
            const chatItem = document.querySelector(`.chat-item[data-chat-id="${chatId}"]`);
            if (chatItem) {
                chatItem.classList.add('active');
            }
            
            // Enable input
            chatInput.disabled = false;
            sendButton.disabled = false;
            
            // Render messages
            renderChatMessages(chatId);
            
            // Mark messages as read
            markMessagesAsRead(chatId);
        }
        
        function renderChatMessages(chatId) {
            const chats = JSON.parse(localStorage.getItem('chats')) || [];
            const chat = chats.find(c => c.id === chatId);
            
            if (!chat) {
                chatMessages.innerHTML = `
                    <div class="no-chat-selected">
                        <i class="fas fa-comments"></i>
                        <p>Selecione um chat para começar</p>
                    </div>
                `;
                return;
            }
            
            // Update header
            document.getElementById('chat-user-name').textContent = chat.userName;
            document.getElementById('chat-user-status').textContent = chat.online ? 'Online' : 'Offline';
            document.getElementById('chat-user-status').className = `chat-user-status ${chat.online ? 'online' : 'offline'}`;
            
            // Show/hide buttons
            viewOrderBtn.style.display = 'inline-block';
            markCompletedBtn.style.display = chat.completed ? 'none' : 'inline-block';
            
            // Clear messages
            chatMessages.innerHTML = '';
            
            if (chat.messages.length === 0) {
                chatMessages.innerHTML = `
                    <div class="chat-date-divider">Início da conversa - ${formatDate(new Date(chat.createdAt))}</div>
                    <div class="message message-system">
                        <p class="message-content">Chat iniciado para o pedido #${chat.orderId}</p>
                    </div>
                `;
                return;
            }
            
            // Group messages by date
            const messagesByDate = {};
            chat.messages.forEach(message => {
                const date = new Date(message.timestamp).toDateString();
                if (!messagesByDate[date]) {
                    messagesByDate[date] = [];
                }
                messagesByDate[date].push(message);
            });
            
            // Render messages by date
            Object.keys(messagesByDate).forEach(date => {
                // Add date divider
                const divider = document.createElement('div');
                divider.className = 'chat-date-divider';
                divider.textContent = formatDate(new Date(date));
                chatMessages.appendChild(divider);
                
                // Render messages for this date
                messagesByDate[date].forEach(message => {
                    const messageEl = document.createElement('div');
                    messageEl.className = `message ${message.sender === 'admin' ? 'message-outgoing' : 'message-incoming'}`;
                    
                    const time = new Date(message.timestamp);
                    const timeString = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
                    
                    messageEl.innerHTML = `
                        <p class="message-content">${message.content}</p>
                        <div class="message-time">
                            ${timeString}
                            ${message.sender === 'admin' ? `
                                <span class="message-status">
                                    <i class="fas ${message.read ? 'fa-check-double' : 'fa-check'}"></i>
                                </span>
                            ` : ''}
                        </div>
                    `;
                    
                    chatMessages.appendChild(messageEl);
                });
            });
            
            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        
        function sendMessage() {
            if (!currentChatId || !chatInput.value.trim()) return;
            
            const chats = JSON.parse(localStorage.getItem('chats')) || [];
            const chatIndex = chats.findIndex(c => c.id === currentChatId);
            
            if (chatIndex === -1) return;
            
            // Create message object
            const message = {
                id: Date.now(),
                content: chatInput.value.trim(),
                sender: 'admin',
                timestamp: new Date().toISOString(),
                read: false
            };
            
            // Add message to chat
            chats[chatIndex].messages.push(message);
            
            // Update last activity
            chats[chatIndex].lastActivity = new Date().toISOString();
            
            // Save chats to localStorage
            localStorage.setItem('chats', JSON.stringify(chats));
            
            // Clear input
            chatInput.value = '';
            
            // Render messages
            renderChatMessages(currentChatId);
            
            // Update chat list
            renderChatList();
        }
        
        function markMessagesAsRead(chatId) {
            const chats = JSON.parse(localStorage.getItem('chats')) || [];
            const chatIndex = chats.findIndex(c => c.id === chatId);
            
            if (chatIndex === -1) return;
            
            let updated = false;
            
            // Mark all messages as read
            chats[chatIndex].messages.forEach(message => {
                if (!message.read && message.sender !== 'admin') {
                    message.read = true;
                    updated = true;
                }
            });
            
            if (updated) {
                // Save chats to localStorage
                localStorage.setItem('chats', JSON.stringify(chats));
                
                // Update notification badge
                updateChatNotificationBadge();
                
                // Update chat list
                renderChatList();
            }
        }
        
        function checkForNewMessages() {
            // Get all chats
            const chats = JSON.parse(localStorage.getItem('chats')) || [];
            
            // Check if any chat has new messages
            const hasNewMessages = chats.some(chat => 
                chat.messages.some(msg => !msg.read && msg.sender !== 'admin')
            );
            
            if (hasNewMessages) {
                // Update notification badge
                updateChatNotificationBadge();
                
                // Update chat list
                renderChatList();
                
                // If a chat is selected, update messages
                if (currentChatId) {
                    renderChatMessages(currentChatId);
                    markMessagesAsRead(currentChatId);
                }
            }
        }
        
        function formatDate(date) {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (date.toDateString() === today.toDateString()) {
                return 'Hoje';
            }
            
            if (date.toDateString() === yesterday.toDateString()) {
                return 'Ontem';
            }
            
            return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
        }
    }
    
    function updateChatNotificationBadge() {
        const chats = JSON.parse(localStorage.getItem('chats')) || [];
        const unreadCount = chats.reduce((count, chat) => {
            return count + (chat.messages.filter(msg => !msg.read && msg.sender !== 'admin').length);
        }, 0);
        
        const chatBadge = document.querySelector('.nav-link[data-tab="chat"] .nav-badge');
        if (chatBadge) {
            chatBadge.textContent = unreadCount;
            chatBadge.style.display = unreadCount > 0 ? 'inline-flex' : 'none';
        }
    }
});