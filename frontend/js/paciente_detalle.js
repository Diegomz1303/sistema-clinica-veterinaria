// js/paciente_detalle.js

document.addEventListener('DOMContentLoaded', function() {

    // --- Lógica de Seguridad y Sesión ---
    const btnLogout = document.getElementById('btn-logout');
    fetch('../backend/api_check_session.php')
        .then(response => response.json())
        .then(data => {
            if (!data.loggedIn) {
                window.location.href = 'login.html';
            }
        });
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            fetch('../backend/api_logout.php')
                .then(() => window.location.href = 'login.html');
        });
    }

    // --- Lógica de la Página ---
    const urlParams = new URLSearchParams(window.location.search);
    const pacienteId = urlParams.get('id');
    let historialData = [];

    const formNuevaVisita = document.getElementById('form-nueva-visita');
    const historialContainer = document.getElementById('historial-lista-container');
    const modalVisita = document.getElementById('modal-visita-detalle');
    const cerrarModalVisita = modalVisita.querySelector('.cerrar-modal');

    if (pacienteId) {
        cargarDetallesPaciente(pacienteId);
    } else {
        document.querySelector('main').innerHTML = '<h1>Error: No se proporcionó un ID de paciente.</h1>';
    }

    function cargarDetallesPaciente(id) {
        fetch(`http://localhost/veterinaria-app/backend/api_get_paciente_detalle.php?id=${id}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) throw new Error(data.error);
                historialData = data.historial || [];
                const actualizarCampo = (elId, valor, fallback = 'No disponible') => {
                    const el = document.getElementById(elId);
                    if (el) el.textContent = valor || fallback;
                };
                actualizarCampo('detalle-nombre-paciente', data.nombre);
                actualizarCampo('detalle-especie', data.especie);
                actualizarCampo('detalle-raza', data.raza);
                actualizarCampo('detalle-sexo', data.sexo);
                actualizarCampo('detalle-color', data.color);
                actualizarCampo('detalle-fecha-nacimiento', data.fecha_nacimiento);
                actualizarCampo('detalle-nombre-propietario', `${data.propietario.nombre} ${data.propietario.apellido}`);
                actualizarCampo('detalle-telefono', data.propietario.telefono);
                actualizarCampo('detalle-email', data.propietario.email);
                actualizarCampo('detalle-direccion', data.propietario.direccion);
                historialContainer.innerHTML = '';
                if (historialData.length > 0) {
                    historialData.forEach((visita, index) => {
                        const itemVisita = document.createElement('div');
                        itemVisita.className = 'visita-resumen';
                        itemVisita.dataset.visitaIndex = index;
                        const fecha = new Date(visita.fecha_visita).toLocaleDateString('es-ES');
                        itemVisita.innerHTML = `<h5>${visita.tipo_visita || 'Visita'} - ${visita.motivo_consulta}</h5><span class="fecha">${fecha}</span>`;
                        historialContainer.appendChild(itemVisita);
                    });
                } else {
                    historialContainer.innerHTML = '<p>Este paciente no tiene visitas registradas.</p>';
                }
            });
    }

    // --- Lógica del Modal de Detalles de Visita (CORREGIDO) ---
    historialContainer.addEventListener('click', function(event) {
        const resumen = event.target.closest('.visita-resumen');
        if (!resumen) return;
        const visitaIndex = resumen.dataset.visitaIndex;
        const visita = historialData[visitaIndex];

        if (visita) {
            // Rellenar todos los campos del modal
            document.getElementById('visita-fecha').textContent = new Date(visita.fecha_visita).toLocaleString('es-ES');
            document.getElementById('visita-tipo').textContent = visita.tipo_visita || 'No especificado';
            document.getElementById('visita-motivo').textContent = visita.motivo_consulta;
            document.getElementById('visita-peso').textContent = visita.peso_kg ? `${visita.peso_kg} Kg` : 'No registrado';
            document.getElementById('visita-temperatura').textContent = visita.temperatura ? `${visita.temperatura} °C` : 'No registrado';
            document.getElementById('visita-frec-cardiaca').textContent = visita.frecuencia_cardiaca ? `${visita.frecuencia_cardiaca} ppm` : 'No registrado';
            document.getElementById('visita-frec-resp').textContent = visita.frecuencia_respiratoria ? `${visita.frecuencia_respiratoria} rpm` : 'No registrado';
            document.getElementById('visita-diagnostico').textContent = visita.diagnostico;
            document.getElementById('visita-tratamiento').textContent = visita.tratamiento || 'No especificado';
            document.getElementById('visita-examenes').textContent = visita.examenes_complementarios || 'Ninguno';
            
            // === LÍNEA CORREGIDA ===
            document.getElementById('visita-proxima-cita').textContent = (visita.proxima_cita && visita.proxima_cita !== '0000-00-00') ? new Date(visita.proxima_cita + 'T00:00:00').toLocaleDateString('es-ES') : 'No agendada';
            document.getElementById('visita-doctor').textContent = visita.doctor_encargado || 'No especificado';
            
            // Lógica para renderizar archivos adjuntos
            const listaArchivosDiv = document.getElementById('visita-archivos-lista');
            listaArchivosDiv.innerHTML = ''; 
            if (visita.archivos && visita.archivos.length > 0) {
                visita.archivos.forEach(archivo => {
                    const enlace = document.createElement('a');
                    enlace.href = `../backend/${archivo.ruta_archivo}`; 
                    enlace.textContent = archivo.nombre_original; 
                    enlace.target = '_blank'; 
                    listaArchivosDiv.appendChild(enlace);
                });
            } else {
                listaArchivosDiv.innerHTML = '<p>No hay archivos adjuntos para esta visita.</p>';
            }
            modalVisita.style.display = 'flex';
        }
    });
    
    // Cerrar modal
    cerrarModalVisita.addEventListener('click', () => modalVisita.style.display = 'none');
    window.addEventListener('click', (event) => {
        if (event.target == modalVisita) modalVisita.style.display = 'none';
    });

    // --- Lógica del Formulario para Agregar Nueva Visita ---
    formNuevaVisita.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const formData = new FormData();
        formData.append('paciente_id', pacienteId);
        formData.append('tipo_visita', document.getElementById('tipo-visita').value);
        formData.append('motivo_consulta', document.getElementById('motivo-consulta').value);
        formData.append('diagnostico', document.getElementById('diagnostico').value);
        formData.append('tratamiento', document.getElementById('tratamiento').value);
        formData.append('examenes_complementarios', document.getElementById('examenes-complementarios').value); // Nuevo campo
        formData.append('peso', document.getElementById('peso').value);
        formData.append('temperatura', document.getElementById('temperatura').value);
        formData.append('frecuencia_cardiaca', document.getElementById('frecuencia-cardiaca').value);
        formData.append('frecuencia_respiratoria', document.getElementById('frecuencia-respiratoria').value);
        formData.append('proxima_cita', document.getElementById('proxima-cita').value);
        formData.append('doctor_encargado', document.getElementById('doctor-encargado').value); // Nuevo campo

        const inputArchivos = document.getElementById('archivos');
        for (let i = 0; i < inputArchivos.files.length; i++) {
            formData.append('archivos[]', inputArchivos.files[i]);
        }
        
        const mensajeDiv = document.getElementById('mensaje-visita');
        mensajeDiv.style.display = 'none';

        fetch('http://localhost/veterinaria-app/backend/api_agregar_visita.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                mensajeDiv.textContent = 'Error: ' + data.error;
                mensajeDiv.className = 'mensaje error';
                mensajeDiv.style.display = 'block';
            } else {
                mensajeDiv.textContent = data.mensaje;
                mensajeDiv.className = 'mensaje exito';
                mensajeDiv.style.display = 'block';
                formNuevaVisita.reset();
                cargarDetallesPaciente(pacienteId);
                setTimeout(() => {
                    mensajeDiv.style.display = 'none';
                }, 4000);
            }
        });
    });
});
