// frontend/js/app.js - CÓDIGO FINAL CON NAVEGACIÓN SUAVE

document.addEventListener('DOMContentLoaded', function() {

    // --- 1. LÓGICA DEL MENÚ LATERAL (SIDEBAR) ---
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar-menu');

    // Abrir/Cerrar menú con el botón de hamburguesa
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            document.body.classList.toggle('sidebar-open');
        });
    }

    // NUEVO: Cerrar menú al hacer clic en un enlace y navegar suavemente
    if (sidebar) {
        const navLinks = sidebar.querySelectorAll('.sidebar-nav a');
        navLinks.forEach(link => {
            link.addEventListener('click', function(event) {
                event.preventDefault(); // Prevenir la navegación inmediata
                const href = this.href;

                // Si el menú está abierto, ciérralo y navega después de la animación
                if (document.body.classList.contains('sidebar-open')) {
                    document.body.classList.remove('sidebar-open');
                    // Esperar a que termine la animación de cierre (300ms)
                    setTimeout(() => {
                        window.location.href = href;
                    }, 300);
                } else {
                    // Si el menú ya está cerrado, navega inmediatamente
                    window.location.href = href;
                }
            });
        });
    }

    // --- 2. REFERENCIAS A ELEMENTOS DEL DOM ---
    const tablaCuerpo = document.getElementById('cuerpo-tabla-pacientes');
    const btnAgregarPaciente = document.getElementById('btn-agregar-paciente');
    const modal = document.getElementById('modal-formulario');
    const modalTitulo = document.getElementById('modal-titulo');
    const cerrarModal = modal.querySelector('.cerrar-modal');
    const formulario = document.getElementById('formulario-agregar');
    const btnGuardarFormulario = document.getElementById('btn-guardar-formulario');
    const mensajeDiv = document.getElementById('mensaje-formulario');
    const inputBusqueda = document.getElementById('input-busqueda-unificada');
    const btnLogout = document.getElementById('btn-logout');
    
    let editingPacienteId = null;

    // --- 3. LÓGICA DE SEGURIDAD Y SESIÓN ---
    fetch('../backend/api_check_session.php')
        .then(response => response.json())
        .then(data => {
            if (!data.loggedIn) {
                window.location.href = 'login.html';
            } else {
                cargarPacientes();
            }
        });
    
    // --- 4. EVENT LISTENERS ---
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            fetch('../backend/api_logout.php')
                .then(() => window.location.href = 'login.html');
        });
    }

    if (tablaCuerpo) {
        tablaCuerpo.addEventListener('click', function(event) {
            const target = event.target;
            if (target.classList.contains('boton-editar')) {
                const pacienteId = target.dataset.id;
                handleEdit(pacienteId);
            } else {
                const fila = target.closest('tr');
                if (fila && fila.dataset.pacienteId) {
                    const pacienteId = fila.dataset.pacienteId;
                    window.location.href = `paciente_detalle.html?id=${pacienteId}`;
                }
            }
        });
    }
    
    if (btnAgregarPaciente) {
        btnAgregarPaciente.addEventListener('click', () => {
            formulario.reset();
            modalTitulo.textContent = 'Agregar Nuevo Propietario y Paciente';
            btnGuardarFormulario.textContent = 'Guardar Paciente';
            editingPacienteId = null;
            mensajeDiv.style.display = 'none';
            modal.style.display = 'flex';
        });
    }

    if (formulario) {
        formulario.addEventListener('submit', function(event) {
            event.preventDefault();
            const datosPropietario = {
                nombre: document.getElementById('nombre-propietario').value,
                apellido: document.getElementById('apellido-propietario').value,
                telefono: document.getElementById('telefono-propietario').value,
                email: document.getElementById('email-propietario').value,
                direccion: document.getElementById('direccion-propietario').value
            };
            const datosPaciente = {
                nombre: document.getElementById('nombre-paciente').value,
                especie: document.getElementById('especie-paciente').value,
                raza: document.getElementById('raza-paciente').value,
                sexo: document.getElementById('sexo-paciente').value,
                fecha_nacimiento: document.getElementById('fecha-nacimiento-paciente').value,
                color: document.getElementById('color-paciente').value
            };
            let url = editingPacienteId ? '../backend/api_update_paciente.php' : '../backend/api_agregar_paciente.php';
            let body = { propietario: datosPropietario, paciente: datosPaciente };
            if (editingPacienteId) { body.paciente_id = editingPacienteId; }

            fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
            .then(response => response.json())
            .then(data => {
                mensajeDiv.className = data.error ? 'mensaje error' : 'mensaje exito';
                mensajeDiv.textContent = data.error || data.mensaje;
                mensajeDiv.style.display = 'block';
                if (!data.error) {
                    setTimeout(() => {
                        modal.style.display = 'none';
                        cargarPacientes();
                    }, 1500);
                }
            });
        });
    }

    if (cerrarModal) cerrarModal.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (event) => {
        if (event.target == modal) modal.style.display = 'none';
    });
    if (inputBusqueda) {
        inputBusqueda.addEventListener('keyup', () => {
            const valorBusqueda = inputBusqueda.value.trim();
            cargarPacientes(isNaN(valorBusqueda) ? '' : valorBusqueda, isNaN(valorBusqueda) ? valorBusqueda : '');
        });
    }

    // --- 5. FUNCIONES ---
    function cargarPacientes(id = '', nombre = '') {
        const url = `../backend/api_pacientes.php?id=${id}&nombre=${nombre}`;
        fetch(url)
            .then(response => response.json())
            .then(data => {
                tablaCuerpo.innerHTML = '';
                if (data.length === 0) {
                    tablaCuerpo.innerHTML = '<tr><td colspan="6" style="text-align:center;">No se encontraron pacientes.</td></tr>';
                    return;
                }
                data.forEach(paciente => {
                    const fila = `
                        <tr data-paciente-id="${paciente.id}">
                            <td>${paciente.id}</td>
                            <td>${paciente.nombre_paciente}</td>
                            <td>${paciente.especie}</td>
                            <td>${paciente.raza || 'N/A'}</td>
                            <td>${paciente.nombre_propietario} ${paciente.apellido_propietario}</td>
                            <td>
                                <button class="boton-editar" data-id="${paciente.id}">Editar</button>
                            </td>
                        </tr>
                    `;
                    tablaCuerpo.innerHTML += fila;
                });
            });
    }

    function handleEdit(pacienteId) {
        fetch(`../backend/api_get_single_paciente.php?id=${pacienteId}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) { alert(data.error); return; }
                document.getElementById('nombre-propietario').value = data.nombre_propietario;
                document.getElementById('apellido-propietario').value = data.apellido_propietario;
                document.getElementById('telefono-propietario').value = data.telefono;
                document.getElementById('email-propietario').value = data.email;
                document.getElementById('direccion-propietario').value = data.direccion;
                document.getElementById('nombre-paciente').value = data.nombre_paciente;
                document.getElementById('especie-paciente').value = data.especie;
                document.getElementById('raza-paciente').value = data.raza;
                document.getElementById('sexo-paciente').value = data.sexo;
                document.getElementById('fecha-nacimiento-paciente').value = data.fecha_nacimiento;
                document.getElementById('color-paciente').value = data.color;
                modalTitulo.textContent = 'Editar Datos del Paciente';
                btnGuardarFormulario.textContent = 'Guardar Cambios';
                editingPacienteId = pacienteId;
                modal.style.display = 'flex';
            });
    }
});
