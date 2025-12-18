const userInput = document.getElementById('usuario');
const passwordInput = document.getElementById('password');
const button = document.getElementById('button');
const loginError = document.getElementById('loginError');

button.addEventListener('click', async () => {
    const username = userInput.value;
    const password = passwordInput.value;

    const response = await fetch("http://127.0.0.1:5000/login", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })

    const data  = await response.json();

    if(!response.ok){
        loginError.textContent = data.error;
        return
    }
    
    localStorage.setItem("user", JSON.stringify(data));
    window.location.href = '/frontend/dashboard.html';
});