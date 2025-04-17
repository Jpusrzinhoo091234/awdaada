document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the admin page
    if (!document.querySelector('.admin-container')) return;
    
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
    
    // Update chat notification badge
    function updateChatNotificationBadge() {
        const chats = JSON.parse(localStorage.getItem('chats')) || [];
        const unreadCount = chats.reduce((count, chat) => {
            return count + (chat.messages.filter(msg => !msg.read && msg.sender !== 'admin').length);
        }, 0);
        
        const chatBadge = document.querySelector('.nav-link[data-tab="chat"] .notification-badge');
        if (chatBadge) {
            chatBadge.textContent = unreadCount;
            chatBadge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
        }
    }
    
    // Initialize
    updateChatNotificationBadge();
    setInterval(updateChatNotificationBadge, 5000);
    
    // Helper function to show notifications
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
    
    // Function to handle window beforeunload event
    window.addEventListener('beforeunload', function() {
        // If a chat is selected, update the online status to offline
        if (currentChatId) {
            const chats = JSON.parse(localStorage.getItem('chats')) || [];
            const chatIndex = chats.findIndex(c => c.id === currentChatId);
            
            if (chatIndex !== -1) {
                chats[chatIndex].online = false;
                localStorage.setItem('chats', JSON.stringify(chats));
            }
        }
    });
    
    // Function to export chat history
    document.getElementById('export-chat-btn').addEventListener('click', function() {
        if (!currentChatId) {
            showNotification('Selecione um chat para exportar', 'error');
            return;
        }
        
        const chats = JSON.parse(localStorage.getItem('chats')) || [];
        const chat = chats.find(c => c.id === currentChatId);
        
        if (!chat) {
            showNotification('Chat não encontrado', 'error');
            return;
        }
        
        // Format chat for export
        let exportText = `Chat com ${chat.userName} - Pedido #${chat.orderId}\n`;
        exportText += `Iniciado em: ${new Date(chat.createdAt).toLocaleString()}\n\n`;
        
        // Group messages by date
        const messagesByDate = {};
        chat.messages.forEach(message => {
            const date = new Date(message.timestamp).toDateString();
            if (!messagesByDate[date]) {
                messagesByDate[date] = [];
            }
            messagesByDate[date].push(message);
        });
        
        // Add messages by date
        Object.keys(messagesByDate).forEach(date => {
            exportText += `=== ${formatDate(new Date(date))} ===\n\n`;
            
            messagesByDate[date].forEach(message => {
                const time = new Date(message.timestamp);
                const timeString = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
                const sender = message.sender === 'admin' ? 'Atendente' : chat.userName;
                
                exportText += `[${timeString}] ${sender}: ${message.content}\n`;
            });
            
            exportText += '\n';
        });
        
        // Create blob and download
        const blob = new Blob([exportText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-${chat.orderId}-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        showNotification('Chat exportado com sucesso!', 'success');
    });
    
    // Function to delete chat
    document.getElementById('delete-chat-btn').addEventListener('click', function() {
        if (!currentChatId) {
            showNotification('Selecione um chat para excluir', 'error');
            return;
        }
        
        if (confirm('Tem certeza que deseja excluir este chat? Esta ação não pode ser desfeita.')) {
            const chats = JSON.parse(localStorage.getItem('chats')) || [];
            const filteredChats = chats.filter(c => c.id !== currentChatId);
            
            localStorage.setItem('chats', JSON.stringify(filteredChats));
            
            // Reset current chat
            currentChatId = null;
            
            // Update UI
            renderChatList();
            chatMessages.innerHTML = `
                <div class="no-chat-selected">
                    <i class="fas fa-comments"></i>
                    <p>Selecione um chat para começar</p>
                </div>
            `;
            
            // Disable input
            chatInput.disabled = true;
            sendButton.disabled = true;
            
            // Hide buttons
            viewOrderBtn.style.display = 'none';
            markCompletedBtn.style.display = 'none';
            
            showNotification('Chat excluído com sucesso!', 'success');
        }
    });
    
    // Function to handle quick replies
    const quickReplies = [
        'Olá! Como posso ajudar?',
        'Seu pedido foi aprovado e está sendo processado.',
        'Seu pedido foi concluído com sucesso!',
        'Obrigado por entrar em contato conosco.',
        'Estamos verificando seu pedido, um momento por favor.',
        'Você pode fornecer mais detalhes sobre o problema?'
    ];
    
    // Create quick reply buttons
    const quickReplyContainer = document.getElementById('quick-replies');
    
    quickReplies.forEach(reply => {
        const button = document.createElement('button');
        button.className = 'quick-reply-btn';
        button.textContent = reply;
        
        button.addEventListener('click', function() {
            chatInput.value = reply;
            chatInput.focus();
        });
        
        quickReplyContainer.appendChild(button);
    });
    
    // Add custom quick reply
    document.getElementById('add-quick-reply').addEventListener('click', function() {
        const reply = prompt('Digite uma resposta rápida:');
        
        if (reply && reply.trim()) {
            const button = document.createElement('button');
            button.className = 'quick-reply-btn';
            button.textContent = reply.trim();
            
            button.addEventListener('click', function() {
                chatInput.value = reply.trim();
                chatInput.focus();
            });
            
            quickReplyContainer.appendChild(button);
        }
    });
    
    // Function to handle chat search
    document.getElementById('chat-search-btn').addEventListener('click', function() {
        const searchTerm = prompt('Digite o termo de busca:');
        
        if (!searchTerm || !searchTerm.trim()) return;
        
        if (!currentChatId) {
            showNotification('Selecione um chat para buscar', 'error');
            return;
        }
        
        const chats = JSON.parse(localStorage.getItem('chats')) || [];
        const chat = chats.find(c => c.id === currentChatId);
        
        if (!chat) return;
        
        // Find messages that contain the search term
        const matchingMessages = chat.messages.filter(msg => 
            msg.content.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        if (matchingMessages.length === 0) {
            showNotification('Nenhuma mensagem encontrada', 'info');
            return;
        }
        
        // Highlight matching messages
        const allMessages = chatMessages.querySelectorAll('.message');
        allMessages.forEach(msg => msg.classList.remove('highlight'));
        
        matchingMessages.forEach(match => {
            const messageElements = Array.from(allMessages).filter(el => {
                const content = el.querySelector('.message-content').textContent;
                return content === match.content;
            });
            
            messageElements.forEach(el => el.classList.add('highlight'));
        });
        
        // Scroll to first match
        const firstMatch = chatMessages.querySelector('.message.highlight');
        if (firstMatch) {
            firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        showNotification(`${matchingMessages.length} mensagem(ns) encontrada(s)`, 'success');
    });
    
    // Function to handle emoji picker
    document.getElementById('emoji-btn').addEventListener('click', function() {
        const emojiPicker = document.getElementById('emoji-picker');
        emojiPicker.classList.toggle('show');
        
        if (emojiPicker.classList.contains('show') && emojiPicker.children.length === 0) {
            // Common emojis
            const emojis = ['😊', '👍', '🙏', '❤️', '👋', '🎉', '✅', '⭐', '🔥', '💯', '🤔', '😂'];
            
            emojis.forEach(emoji => {
                const button = document.createElement('button');
                button.className = 'emoji-btn';
                button.textContent = emoji;
                
                button.addEventListener('click', function() {
                    chatInput.value += emoji;
                    chatInput.focus();
                    emojiPicker.classList.remove('show');
                });
                
                emojiPicker.appendChild(button);
            });
        }
    });
    
    // Close emoji picker when clicking outside
    document.addEventListener('click', function(e) {
        const emojiPicker = document.getElementById('emoji-picker');
        const emojiBtn = document.getElementById('emoji-btn');
        
        if (emojiPicker.classList.contains('show') && 
            !emojiPicker.contains(e.target) && 
            e.target !== emojiBtn) {
            emojiPicker.classList.remove('show');
        }
    });
});