const userInput = document.getElementById('usuario');
const passwordInput = document.getElementById('password');
const button = document.getElementById('button');
const loginError = document.getElementById('loginError');

// ===== VERIFICAÇÃO DE AUTENTICAÇÃO =====
const user = JSON.parse(localStorage.getItem('user'));

if (user) {
    window.location.href = 'dashboard.html';
}

async function login() {
    const username = userInput.value;
    const password = passwordInput.value;

    const response = await fetch("https://wayne-industries-project-7cpu.onrender.com/login", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })

    const data  = await response.json();

    if(!response.ok){
        showLoginError(data.error);
        return
    }
    
    localStorage.setItem("user", JSON.stringify(data));
    window.location.href = '/frontend/dashboard.html';
}

button.addEventListener('click', login);

[userInput, passwordInput].forEach(input => {
    input.addEventListener('keydown', (e) => {
        if(e.key === 'Enter'){
            login();
        }
    });
});

// Função para mostrar erro
function showLoginError(message) {
    loginError.textContent = message;
    loginError.classList.add('show-error');

    // Remover após 4 segundos
    setTimeout(() => {
        loginError.classList.remove('show-error'); 
        loginError.textContent = '';
    } , 5000);
}