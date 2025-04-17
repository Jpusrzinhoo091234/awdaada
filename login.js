// Elementos DOM
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const tabsContainer = document.getElementById('tabs');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    setupForms();
    checkLoggedIn();
    
    // Criar arquivo de usuários se não existir
    initializeUserDatabase();
});

// Inicializar banco de dados de usuários
function initializeUserDatabase() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Verificar se já existe um admin
    const adminExists = users.some(user => user.isAdmin);
    
    if (!adminExists) {
        // Criar usuário admin padrão
        const adminUser = {
            id: Date.now(),
            name: 'Administrador',
            username: 'admin',
            password: 'admin123',
            isAdmin: true,
            createdAt: new Date().toISOString()
        };
        
        users.push(adminUser);
        localStorage.setItem('users', JSON.stringify(users));
        console.log('Usuário admin criado com sucesso!');
    }
    
    // Exportar usuários para JSON (simulado com localStorage)
    exportUsersToJSON();
}

// Exportar usuários para JSON
function exportUsersToJSON() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Em um ambiente real, aqui você enviaria os dados para um servidor
    // Como estamos usando apenas o frontend, vamos apenas simular isso
    
    // Criar um objeto com data de exportação e usuários
    const exportData = {
        exportedAt: new Date().toISOString(),
        totalUsers: users.length,
        users: users.map(user => ({
            id: user.id,
            name: user.name,
            username: user.username,
            isAdmin: user.isAdmin,
            createdAt: user.createdAt
        })) // Não exportar senhas
    };
    
    // Salvar no localStorage (simulando exportação)
    localStorage.setItem('usersExport', JSON.stringify(exportData));
}

// Configurar abas
function setupTabs() {
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remover classe active de todas as abas
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Adicionar classe active à aba clicada
            btn.classList.add('active');
            const tabId = btn.dataset.tab + '-tab';
            document.getElementById(tabId).classList.add('active');
            
            // Animar o indicador de aba
            if (btn.dataset.tab === 'register') {
                tabsContainer.classList.add('register-active');
            } else {
                tabsContainer.classList.remove('register-active');
            }
        });
    });
}

// Configurar formulários
function setupForms() {
    // Formulário de login
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            
            login(username, password);
        });
    }
    
    // Formulário de cadastro
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('register-name').value;
            const username = document.getElementById('register-username').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm-password').value;
            
            register(name, username, password, confirmPassword);
        });
    }
}

// Verificar se já está logado
function checkLoggedIn() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (currentUser) {
        // Redirecionar para a página apropriada
        if (currentUser.isAdmin) {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'index.html';
        }
    }
}

// Login
function login(username, password) {
    // Buscar usuários cadastrados
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Verificar se o usuário existe
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        // Registrar data do último login
        user.lastLogin = new Date().toISOString();
        localStorage.setItem('users', JSON.stringify(users));
        
        // Salvar usuário atual no localStorage
        localStorage.setItem('currentUser', JSON.stringify({
            id: user.id,
            name: user.name,
            username: user.username,
            isAdmin: user.isAdmin,
            lastLogin: user.lastLogin
        }));
        
        // Exibir mensagem de sucesso
        showSuccess(loginForm, 'Login realizado com sucesso! Redirecionando...');
        
        // Redirecionar para a página apropriada após um breve delay
        setTimeout(() => {
            if (user.isAdmin) {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'index.html';
            }
        }, 1500);
    } else {
        // Exibir mensagem de erro
        showError(loginForm, 'Nome de usuário ou senha incorretos.');
    }
}

// Cadastro
function register(name, username, password, confirmPassword) {
    // Validar senha
    if (password !== confirmPassword) {
        showError(registerForm, 'As senhas não coincidem.');
        return;
    }
    
    if (password.length < 6) {
        showError(registerForm, 'A senha deve ter pelo menos 6 caracteres.');
        return;
    }
    
    // Validar nome de usuário
    if (username.length < 3) {
        showError(registerForm, 'O nome de usuário deve ter pelo menos 3 caracteres.');
        return;
    }
    
    // Buscar usuários cadastrados
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Verificar se o nome de usuário já está em uso
    if (users.some(u => u.username === username)) {
        showError(registerForm, 'Este nome de usuário já está em uso.');
        return;
    }
    
    // Criar novo usuário
    const newUser = {
        id: Date.now(),
        name,
        username,
        password,
        isAdmin: username === 'admin', // Username do admin
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
    };
    
    // Adicionar à lista de usuários
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Exportar usuários para JSON
    exportUsersToJSON();
    
    // Salvar usuário atual no localStorage
    localStorage.setItem('currentUser', JSON.stringify({
        id: newUser.id,
        name: newUser.name,
        username: newUser.username,
        isAdmin: newUser.isAdmin,
        lastLogin: newUser.lastLogin
    }));
    
    // Exibir mensagem de sucesso
    showSuccess(registerForm, 'Cadastro realizado com sucesso! Redirecionando...');
    
    // Redirecionar para a página apropriada após um breve delay
    setTimeout(() => {
        if (newUser.isAdmin) {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'index.html';
        }
    }, 1500);
}

// Exibir mensagem de erro
function showError(form, message) {
    // Verificar se já existe uma mensagem de erro
    let errorElement = form.querySelector('.error-message');
    
    if (!errorElement) {
        // Criar elemento de erro
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        form.appendChild(errorElement);
    }
    
    // Definir mensagem e exibir
    errorElement.textContent = message;
    errorElement.classList.add('show');
    
    // Remover após 3 segundos
    setTimeout(() => {
        errorElement.classList.remove('show');
    }, 3000);
}

// Exibir mensagem de sucesso
function showSuccess(form, message) {
    // Verificar se já existe uma mensagem de sucesso
    let successElement = form.querySelector('.success-message');
    
    if (!successElement) {
        // Criar elemento de sucesso
        successElement = document.createElement('div');
        successElement.className = 'success-message';
        form.appendChild(successElement);
    }
    
    // Definir mensagem e exibir
    successElement.textContent = message;
    successElement.classList.add('show');
}

// Adicionar função para debug e garantir que os formulários funcionem
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM carregado completamente");
    
    // Verificar se os elementos existem
    console.log("Login form:", loginForm);
    console.log("Register form:", registerForm);
    
    // Adicionar event listeners diretamente aos botões
    const loginButton = document.querySelector('#login-form button[type="submit"]');
    const registerButton = document.querySelector('#register-form button[type="submit"]');
    
    if (loginButton) {
        console.log("Login button encontrado");
        loginButton.addEventListener('click', function(e) {
            e.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            console.log("Tentando login com:", username);
            login(username, password);
        });
    }
    
    if (registerButton) {
        console.log("Register button encontrado");
        registerButton.addEventListener('click', function(e) {
            e.preventDefault();
            const name = document.getElementById('register-name').value;
            const username = document.getElementById('register-username').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm-password').value;
            console.log("Tentando cadastro com:", username);
            register(name, username, password, confirmPassword);
        });
    }
    
    // Inicializar as funções originais
    setupTabs();
    setupForms();
    checkLoggedIn();
    initializeUserDatabase();
});