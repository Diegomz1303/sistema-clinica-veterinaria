// js/app.js

document.addEventListener('DOMContentLoaded', function() {

    // --- LÓGICA DE SEGURIDAD Y SESIÓN ---
    fetch('../backend/api_check_session.php')
        .then(response => response.json())
        .then(data => {
            if (!data.loggedIn) {
                window.location.href = 'login.html';
            }
        });
    document.getElementById('btn-logout').addEventListener('click', () => {
        fetch('../backend/api_logout.php')
            .then(() => window.location.href = 'login.html');
    });

    // --- REFERENCIAS AL DOM ---
    const tablaCuerpo = document.getElementById('cuerpo-tabla-pacientes');
    const btnAgregarPaciente = document.getElementById('btn-agregar-paciente');
    const modal = document.getElementById('modal-formulario');
    const modalTitulo = document.getElementById('modal-titulo');
    const cerrarModal = document.querySelector('.cerrar-modal');
    const formulario = document.getElementById('formulario-agregar');
    const btnGuardarFormulario = document.getElementById('btn-guardar-formulario');
    const mensajeDiv = document.getElementById('mensaje-formulario');
    const inputBusqueda = document.getElementById('input-busqueda-unificada');
    
    // Variable para saber si estamos editando o agregando
    let editingPacienteId = null;

    // --- FUNCIÓN PARA CARGAR PACIENTES EN LA TABLA ---
    function cargarPacientes(id = '', nombre = '') {
        const url = `http://localhost/veterinaria-app/backend/api_pacientes.php?id=${id}&nombre=${nombre}`;
        fetch(url)
            .then(response => response.json())
            .then(data => {
                tablaCuerpo.innerHTML = '';
                if (data.length === 0) {
                    tablaCuerpo.innerHTML = '<tr><td colspan="6">No se encontraron pacientes.</td></tr>';
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

    // --- MANEJO DE CLICS EN LA TABLA (VER DETALLES O EDITAR) ---
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

    // --- PREPARAR MODAL PARA EDITAR ---
    function handleEdit(pacienteId) {
        fetch(`../backend/api_get_single_paciente.php?id=${pacienteId}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                    return;
                }
                // Llenar el formulario con los datos existentes
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

                // Cambiar títulos y estado
                modalTitulo.textContent = 'Editar Datos del Paciente';
                btnGuardarFormulario.textContent = 'Guardar Cambios';
                editingPacienteId = pacienteId;
                modal.style.display = 'flex';
            });
    }

    // --- PREPARAR MODAL PARA AGREGAR ---
    btnAgregarPaciente.addEventListener('click', () => {
        formulario.reset();
        modalTitulo.textContent = 'Agregar Nuevo Propietario y Paciente';
        btnGuardarFormulario.textContent = 'Guardar Paciente';
        editingPacienteId = null;
        mensajeDiv.style.display = 'none';
        modal.style.display = 'flex';
    });

    // --- MANEJO DEL ENVÍO DEL FORMULARIO (AGREGAR O EDITAR) ---
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

        let url = '';
        let body = {};

        if (editingPacienteId) {
            // Si estamos editando
            url = '../backend/api_update_paciente.php';
            body = {
                paciente_id: editingPacienteId,
                propietario: datosPropietario,
                paciente: datosPaciente
            };
        } else {
            // Si estamos agregando
            url = '../backend/api_agregar_paciente.php';
            body = {
                propietario: datosPropietario,
                paciente: datosPaciente
            };
        }

        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                mensajeDiv.textContent = data.error;
                mensajeDiv.className = 'mensaje error';
                mensajeDiv.style.display = 'block';
            } else {
                mensajeDiv.textContent = data.mensaje;
                mensajeDiv.className = 'mensaje exito';
                mensajeDiv.style.display = 'block';
                
                setTimeout(() => {
                    modal.style.display = 'none';
                    mensajeDiv.style.display = 'none';
                    cargarPacientes();
                }, 2000);
            }
        });
    });

    // --- Carga inicial y otros listeners ---
    cargarPacientes();
    
    inputBusqueda.addEventListener('keyup', () => {
        const valorBusqueda = inputBusqueda.value.trim();
        if (!isNaN(valorBusqueda) && valorBusqueda !== '') {
            cargarPacientes(valorBusqueda, '');
        } else {
            cargarPacientes('', valorBusqueda);
        }
    });

    cerrarModal.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (event) => {
        if (event.target == modal) modal.style.display = 'none';
    });
});
