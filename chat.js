// Chat System for CartoonMax
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const chatList = document.getElementById('chat-list');
    const chatMessages = document.getElementById('chat-messages');
    const chatUserName = document.getElementById('chat-user-name');
    const chatUserStatus = document.getElementById('chat-user-status');
    const chatMessageInput = document.getElementById('chat-message-input');
    const sendMessageBtn = document.getElementById('send-message-btn');
    const chatFilter = document.getElementById('chat-filter');
    const searchChat = document.getElementById('search-chat');
    const viewOrderBtn = document.getElementById('view-order-btn');
    const markCompletedBtn = document.getElementById('mark-completed-btn');
    const chatNotification = document.getElementById('chat-notification');
    
    // Chat Data
    let chats = [];
    let currentChat = null;
    let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    
    // Initialize chat system
    initializeChat();
    
    // Event Listeners
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', sendMessage);
    }
    
    if (chatMessageInput) {
        chatMessageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    
    if (chatFilter) {
        chatFilter.addEventListener('change', filterChats);
    }
    
    if (searchChat) {
        searchChat.addEventListener('input', searchChats);
    }
    
    if (viewOrderBtn) {
        viewOrderBtn.addEventListener('click', viewOrder);
    }
    
    if (markCompletedBtn) {
        markCompletedBtn.addEventListener('click', markChatCompleted);
    }
    
    // Functions
    function initializeChat() {
        // Load chats from localStorage
        chats = JSON.parse(localStorage.getItem('chats')) || [];
        
        // Check for new messages
        const unreadCount = chats.reduce((count, chat) => {
            return count + (chat.messages.filter(msg => !msg.read && msg.sender !== 'admin').length);
        }, 0);
        
        // Update notification badge
        updateNotificationBadge(unreadCount);
        
        // Render chat list
        renderChatList();
        
        // Set up polling for new messages (simulating real-time)
        setInterval(checkForNewMessages, 5000);
    }
    
    function renderChatList() {
        if (!chatList) return;
        
        // Clear chat list
        chatList.innerHTML = '';
        
        // Filter chats based on selected filter
        let filteredChats = chats;
        if (chatFilter) {
            const filterValue = chatFilter.value;
            if (filterValue === 'active') {
                filteredChats = chats.filter(chat => !chat.completed);
            } else if (filterValue === 'completed') {
                filteredChats = chats.filter(chat => chat.completed);
            }
        }
        
        // Filter by search term
        if (searchChat && searchChat.value) {
            const searchTerm = searchChat.value.toLowerCase();
            filteredChats = filteredChats.filter(chat => 
                chat.userName.toLowerCase().includes(searchTerm) || 
                chat.orderId.toString().includes(searchTerm)
            );
        }
        
        // Sort chats by last message time (newest first)
        filteredChats.sort((a, b) => {
            const aTime = a.messages.length ? new Date(a.messages[a.messages.length - 1].timestamp) : new Date(a.createdAt);
            const bTime = b.messages.length ? new Date(b.messages[b.messages.length - 1].timestamp) : new Date(b.createdAt);
            return bTime - aTime;
        });
        
        // Render each chat item
        filteredChats.forEach(chat => {
            const lastMessage = chat.messages.length ? chat.messages[chat.messages.length - 1] : null;
            const unreadCount = chat.messages.filter(msg => !msg.read && msg.sender !== 'admin').length;
            
            const chatItem = document.createElement('div');
            chatItem.className = `chat-item ${currentChat && currentChat.id === chat.id ? 'active' : ''}`;
            chatItem.dataset.chatId = chat.id;
            
            const lastActivity = lastMessage ? new Date(lastMessage.timestamp) : new Date(chat.createdAt);
            const timeString = formatChatTime(lastActivity);
            
            chatItem.innerHTML = `
                <div class="chat-item-avatar">
                    <i class="fas fa-user"></i>
                    <span class="status-indicator ${chat.online ? 'status-online' : 'status-offline'}"></span>
                </div>
                <div class="chat-item-info">
                    <h4 class="chat-item-name">${chat.userName} <small>#${chat.orderId}</small></h4>
                    <p class="chat-item-preview">${lastMessage ? lastMessage.content : 'Novo pedido'}</p>
                </div>
                <div>
                    <div class="chat-item-time">${timeString}</div>
                    ${unreadCount ? `<div class="chat-item-badge">${unreadCount}</div>` : ''}
                </div>
            `;
            
            chatItem.addEventListener('click', () => selectChat(chat.id));
            chatList.appendChild(chatItem);
        });
        
        // If no chats, show message
        if (filteredChats.length === 0) {
            chatList.innerHTML = '<div class="no-chats">Nenhum chat encontrado</div>';
        }
    }
    
    function selectChat(chatId) {
        // Find the chat
        const chat = chats.find(c => c.id === chatId);
        if (!chat) return;
        
        // Update current chat
        currentChat = chat;
        
        // Update UI
        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const chatItem = document.querySelector(`.chat-item[data-chat-id="${chatId}"]`);
        if (chatItem) {
            chatItem.classList.add('active');
        }
        
        // Update chat header
        if (chatUserName) {
            chatUserName.textContent = `${chat.userName} - Pedido #${chat.orderId}`;
        }
        
        if (chatUserStatus) {
            chatUserStatus.textContent = chat.online ? 'Online' : 'Offline';
            chatUserStatus.className = chat.online ? 'chat-user-status online' : 'chat-user-status offline';
        }
        
        // Enable chat input
        if (chatMessageInput) {
            chatMessageInput.disabled = false;
            chatMessageInput.focus();
        }
        
        if (sendMessageBtn) {
            sendMessageBtn.disabled = false;
        }
        
        // Update order buttons
        if (viewOrderBtn) {
            viewOrderBtn.dataset.orderId = chat.orderId;
        }
        
        if (markCompletedBtn) {
            markCompletedBtn.textContent = chat.completed ? 'Reabrir Chat' : 'Marcar como Concluído';
            markCompletedBtn.className = chat.completed ? 'btn-small btn-warning' : 'btn-small btn-success';
        }
        
        // Render messages
        renderMessages();
        
        // Mark messages as read
        markMessagesAsRead();
    }
    
    function renderMessages() {
        if (!chatMessages || !currentChat) return;
        
        // Clear messages
        chatMessages.innerHTML = '';
        
        if (currentChat.messages.length === 0) {
            chatMessages.innerHTML = `
                <div class="chat-date-divider">Início da conversa - ${formatDate(new Date(currentChat.createdAt))}</div>
                <div class="message message-system">
                    <p class="message-content">Chat iniciado para o pedido #${currentChat.orderId}</p>
                </div>
            `;
            return;
        }
        
        // Group messages by date
        const messagesByDate = {};
        currentChat.messages.forEach(message => {
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
        if (!currentChat || !chatMessageInput || !chatMessageInput.value.trim()) return;
        
        // Create message object
        const message = {
            id: Date.now(),
            content: chatMessageInput.value.trim(),
            sender: 'admin',
            timestamp: new Date().toISOString(),
            read: false
        };
        
        // Add message to current chat
        currentChat.messages.push(message);
        
        // Update last activity
        currentChat.lastActivity = new Date().toISOString();
        
        // Save chats to localStorage
        saveChats();
        
        // Clear input
        chatMessageInput.value = '';
        
        // Render messages
        renderMessages();
        
        // Render chat list to update preview
        renderChatList();
    }
    
    function markMessagesAsRead() {
        if (!currentChat) return;
        
        // Mark all messages as read
        let unreadFound = false;
        currentChat.messages.forEach(message => {
            if (!message.read && message.sender !== 'admin') {
                message.read = true;
                unreadFound = true;
            }
        });
        
        if (unreadFound) {
            // Save chats to localStorage
            saveChats();
            
            // Update notification badge
            const unreadCount = chats.reduce((count, chat) => {
                return count + (chat.messages.filter(msg => !msg.read && msg.sender !== 'admin').length);
            }, 0);
            
            updateNotificationBadge(unreadCount);
            
            // Render chat list to update unread badges
            renderChatList();
        }
    }
    
    function filterChats() {
        renderChatList();
    }
    
    function searchChats() {
        renderChatList();
    }
    
    function viewOrder() {
        if (!currentChat) return;
        
        // Open order modal
        const orderId = currentChat.orderId;
        const orderModal = document.getElementById('order-modal');
        
        if (orderModal) {
            // Find order in localStorage
            const orders = JSON.parse(localStorage.getItem('orders')) || [];
            const order = orders.find(o => o.id === orderId);
            
            if (order) {
                // Populate order modal
                document.getElementById('order-id').textContent = order.id;
                document.getElementById('order-customer').textContent = order.customerName;
                document.getElementById('order-date').textContent = formatDate(new Date(order.date));
                document.getElementById('order-status').textContent = order.status;
                
                // Populate order items
                const orderItemsBody = document.getElementById('order-items-body');
                orderItemsBody.innerHTML = '';
                
                order.items.forEach(item => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${item.name}</td>
                        <td>${item.quantity}</td>
                        <td>R$ ${item.price.toFixed(2)}</td>
                        <td>R$ ${(item.price * item.quantity).toFixed(2)}</td>
                    `;
                    orderItemsBody.appendChild(row);
                });
                
                // Set total
                document.getElementById('order-total').textContent = order.total.toFixed(2);
                
                // Show modal
                orderModal.style.display = 'block';
            }
        }
    }
    
    function markChatCompleted() {
        if (!currentChat) return;
        
        // Toggle completed status
        currentChat.completed = !currentChat.completed;
        
        // Update button text
        if (markCompletedBtn) {
            markCompletedBtn.textContent = currentChat.completed ? 'Reabrir Chat' : 'Marcar como Concluído';
            markCompletedBtn.className = currentChat.completed ? 'btn-small btn-warning' : 'btn-small btn-success';
        }
        
        // Add system message
        const message = {
            id: Date.now(),
            content: currentChat.completed ? 'Chat marcado como concluído pelo administrador' : 'Chat reaberto pelo administrador',
            sender: 'system',
            timestamp: new Date().toISOString(),
            read: true
        };
        
        currentChat.messages.push(message);
        
        // Save chats to localStorage
        saveChats();
        
        // Render messages
        renderMessages();
        
        // Render chat list to update filter
        renderChatList();
    }
    
    function checkForNewMessages() {
        // In a real application, this would be a server request
        // For this demo, we'll simulate new messages randomly
        
        // 10% chance of new message in a random chat
        if (Math.random() < 0.1 && chats.length > 0) {
            // Select a random chat
            const randomChat = chats[Math.floor(Math.random() * chats.length)];
            
            // Create a new message
            const message = {
                id: Date.now(),
                content: getRandomMessage(),
                sender: 'user',
                timestamp: new Date().toISOString(),
                read: false
            };
            
            // Add message to chat
            randomChat.messages.push(message);
            
            // Update online status (50% chance)
            randomChat.online = Math.random() < 0.5;
            
            // Save chats to localStorage
            saveChats();
            
            // Update UI if needed
            if (currentChat && currentChat.id === randomChat.id) {
                renderMessages();
                markMessagesAsRead();
            }
            
            // Update notification badge
            const unreadCount = chats.reduce((count, chat) => {
                return count + (chat.messages.filter(msg => !msg.read && msg.sender !== 'admin').length);
            }, 0);
            
            updateNotificationBadge(unreadCount);
            
            // Render chat list to update preview
            renderChatList();
        }
    }
    
    function updateNotificationBadge(count) {
        if (chatNotification) {
            chatNotification.textContent = count;
            chatNotification.style.display = count > 0 ? 'inline-flex' : 'none';
        }
    }
    
    function saveChats() {
        localStorage.setItem('chats', JSON.stringify(chats));
    }
    
    // Helper Functions
    function formatChatTime(date) {
        const now = new Date();
        const diff = now - date;
        
        // If less than a day, show time
        if (diff < 24 * 60 * 60 * 1000) {
            return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        }
        
        // If less than a week, show day
        if (diff < 7 * 24 * 60 * 60 * 1000) {
            const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            return days[date.getDay()];
        }
        
        // Otherwise show date
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
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
    
    function getRandomMessage() {
        const messages = [
            'Olá, gostaria de saber quando meu pedido será entregue?',
            'Preciso de ajuda com meu pedido',
            'O produto que recebi está com problema',
            'Obrigado pelo atendimento!',
            'Posso fazer uma troca?',
            'Quanto tempo demora para entregar?',
            'Vocês têm outros produtos similares?',
            'Gostaria de adicionar mais um item ao meu pedido',
            'Como faço para rastrear meu pedido?',
            'Preciso do código de ativação do produto'
        ];
        
        return messages[Math.floor(Math.random() * messages.length)];
    }
    
    // Create chat when order is approved
    window.createChatForOrder = function(order) {
        // Check if chat already exists for this order
        if (chats.some(chat => chat.orderId === order.id)) {
            return;
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