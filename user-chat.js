document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    // Check if we're on the admin page (don't show user chat on admin page)
    if (document.querySelector('.admin-container')) return;
    
    // Create chat interface
    createChatInterface();
    
    // Check for new messages every 5 seconds
    setInterval(checkForNewMessages, 5000);
    
    function createChatInterface() {
        // Create chat button
        const chatButton = document.createElement('div');
        chatButton.className = 'chat-button';
        chatButton.innerHTML = `
            <i class="fas fa-comments"></i>
            <span class="chat-notification-badge" style="display: none;">0</span>
        `;
        document.body.appendChild(chatButton);
        
        // Create chat container
        const chatContainer = document.createElement('div');
        chatContainer.className = 'chat-container';
        chatContainer.innerHTML = `
            <div class="chat-header">
                <h3>Suporte CartoonMax</h3>
                <button class="chat-close-btn"><i class="fas fa-times"></i></button>
            </div>
            <div class="chat-messages"></div>
            <div class="chat-input">
                <textarea placeholder="Digite sua mensagem..."></textarea>
                <button class="chat-send-btn"><i class="fas fa-paper-plane"></i></button>
            </div>
        `;
        document.body.appendChild(chatContainer);
        
        // Event listeners
        chatButton.addEventListener('click', toggleChat);
        chatContainer.querySelector('.chat-close-btn').addEventListener('click', toggleChat);
        
        const sendButton = chatContainer.querySelector('.chat-send-btn');
        const chatInput = chatContainer.querySelector('textarea');
        
        sendButton.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        // Load chat
        loadChat();
    }
    
    function toggleChat() {
        const chatContainer = document.querySelector('.chat-container');
        chatContainer.classList.toggle('active');
        
        if (chatContainer.classList.contains('active')) {
            // Mark messages as read
            markMessagesAsRead();
            
            // Update online status
            updateOnlineStatus(true);
            
            // Focus input
            setTimeout(() => {
                document.querySelector('.chat-container textarea').focus();
            }, 100);
        } else {
            // Update online status when closing chat
            updateOnlineStatus(false);
        }
    }
    
    function loadChat() {
        // Get user's chats
        const chats = JSON.parse(localStorage.getItem('chats')) || [];
        const userChats = chats.filter(chat => chat.userId === currentUser.id);
        
        // If no chats, hide chat button
        if (userChats.length === 0) {
            // Check if user has approved orders
            const orders = JSON.parse(localStorage.getItem('orders')) || [];
            const approvedOrders = orders.filter(order => 
                order.userId === currentUser.id && 
                (order.status === 'approved' || order.status === 'completed')
            );
            
            if (approvedOrders.length === 0) {
                document.querySelector('.chat-button').style.display = 'none';
                return;
            }
        }
        
        // Get latest chat
        const latestChat = userChats.sort((a, b) => 
            new Date(b.lastActivity) - new Date(a.lastActivity)
        )[0];
        
        if (latestChat) {
            renderMessages(latestChat);
            updateChatNotificationBadge();
        } else {
            document.querySelector('.chat-messages').innerHTML = `
                <div class="chat-no-messages">
                    <i class="fas fa-comments"></i>
                    <p>Nenhuma mensagem ainda. Inicie uma conversa!</p>
                </div>
            `;
        }
    }
    
    function renderMessages(chat) {
        const messagesContainer = document.querySelector('.chat-messages');
        messagesContainer.innerHTML = '';
        
        if (chat.messages.length === 0) {
            messagesContainer.innerHTML = `
                <div class="chat-date-divider">Início da conversa</div>
                <div class="chat-system-message">
                    <p>Chat iniciado para o pedido #${chat.orderId}</p>
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
            messagesContainer.appendChild(divider);
            
            // Render messages for this date
            messagesByDate[date].forEach(message => {
                const messageEl = document.createElement('div');
                messageEl.className = `chat-message ${message.sender === 'user' ? 'outgoing' : 'incoming'}`;
                
                const time = new Date(message.timestamp);
                const timeString = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
                
                messageEl.innerHTML = `
                    <div class="message-content">${message.content}</div>
                    <div class="message-time">
                        ${timeString}
                        ${message.sender === 'user' ? `
                            <span class="message-status">
                                <i class="fas ${message.read ? 'fa-check-double' : 'fa-check'}"></i>
                            </span>