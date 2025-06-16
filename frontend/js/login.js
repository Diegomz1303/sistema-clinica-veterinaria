// js/login.js

document.addEventListener('DOMContentLoaded', function() {
    
    // --- Verificar si el usuario YA está logueado ---
    fetch('../backend/api_check_session.php')
        .then(response => response.json())
        .then(data => {
            if (data.loggedIn) {
                window.location.href = 'index.html';
            }
        });

    // --- Lógica del Formulario de Login ---
    const loginForm = document.getElementById('login-form');
    const errorMessageDiv = document.getElementById('error-message');
    const loaderOverlay = document.getElementById('loader-overlay');

    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        errorMessageDiv.style.display = 'none';
        loaderOverlay.style.display = 'flex';

        const loginData = {
            username: username,
            password: password
        };

        // --- LÓGICA ACTUALIZADA CON RETARDO MÍNIMO ---

        // 1. Creamos una promesa que representa la petición al servidor
        const fetchPromise = fetch('../backend/api_login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData)
        }).then(response => response.json());

        // 2. Creamos una promesa que representa un retardo mínimo de 1.5 segundos
        const delayPromise = new Promise(resolve => setTimeout(resolve, 1500));

        // 3. Esperamos a que AMBAS promesas se completen
        Promise.all([fetchPromise, delayPromise])
            .then(([data, _]) => { // El resultado del delay no nos importa, usamos '_'
                if (data.success) {
                    // Si el login es exitoso, la redirección ocurrirá.
                    // El loader desaparecerá con la carga de la nueva página.
                    window.location.href = 'index.html';
                } else {
                    // Si hay un error de credenciales, ocultamos el loader y mostramos el error.
                    loaderOverlay.style.display = 'none';
                    errorMessageDiv.textContent = data.error;
                    errorMessageDiv.style.display = 'block';
                }
            })
            .catch(error => {
                // Si hay un error de conexión, también ocultamos el loader y mostramos el error.
                console.error('Error en la petición fetch:', error);
                loaderOverlay.style.display = 'none';
                errorMessageDiv.textContent = 'Error de conexión. Inténtelo de nuevo.';
                errorMessageDiv.style.display = 'block';
            });
    });
});
