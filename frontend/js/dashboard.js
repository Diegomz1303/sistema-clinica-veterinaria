// frontend/js/dashboard.js

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. LÓGICA DE SEGURIDAD Y CARGA INICIAL ---
    // Primero, verificamos si el usuario ha iniciado sesión.
    fetch('../backend/api_check_session.php')
        .then(response => response.json())
        .then(data => {
            if (!data.loggedIn) {
                // Si no ha iniciado sesión, lo redirigimos a la página de login.
                window.location.href = 'login.html';
            } else {
                // Si ha iniciado sesión, cargamos todos los datos del dashboard.
                cargarDatosDashboard();
                // Configuramos el menú lateral y el botón de logout
                configurarUI();
            }
        })
        .catch(() => {
            // Si hay un error de conexión, también lo mandamos al login.
            window.location.href = 'login.html';
        });

    // --- 2. FUNCIÓN PRINCIPAL PARA CARGAR Y MOSTRAR DATOS ---
    async function cargarDatosDashboard() {
        try {
            const response = await fetch('../backend/api_get_dashboard_data.php');
            const result = await response.json();

            if (result.success) {
                const data = result.data;
                
                // Llamamos a las funciones específicas para renderizar cada parte del dashboard.
                renderizarKPIs(data.kpis);
                renderizarGraficos(data.charts);
                renderizarListas(data.lists);
            } else {
                console.error('Error al cargar los datos del dashboard:', result.message);
            }
        } catch (error) {
            console.error('Error de conexión:', error);
        }
    }

    // --- 3. FUNCIONES DE RENDERIZADO ---

    function renderizarKPIs(kpis) {
        document.getElementById('kpi-total-pacientes').textContent = kpis.total_pacientes || '0';
        document.getElementById('kpi-visitas-mes').textContent = kpis.visitas_mes || '0';
        document.getElementById('kpi-productos-bajos').textContent = kpis.productos_bajos_stock || '0';
        document.getElementById('kpi-nuevos-pacientes').textContent = kpis.nuevos_pacientes_mes || '0';
    }

    function renderizarGraficos(charts) {
        // Gráfico 1: Tipos de Visita (Torta)
        const ctxVisitas = document.getElementById('chart-tipos-visita').getContext('2d');
        new Chart(ctxVisitas, {
            type: 'doughnut', // Gráfico de tipo dona/torta
            data: {
                labels: charts.tipos_visita.map(item => item.tipo_visita), // Ej: ["Consulta", "Urgencia"]
                datasets: [{
                    label: 'Tipos de Visita',
                    data: charts.tipos_visita.map(item => item.total), // Ej: [50, 20]
                    backgroundColor: ['#d9232d', '#6c757d', '#f0ad4e', '#5cb85c', '#5bc0de'],
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                }
            }
        });

        // Gráfico 2: Productos más usados (Barras Horizontales)
        const ctxProductos = document.getElementById('chart-productos-usados').getContext('2d');
        new Chart(ctxProductos, {
            type: 'bar', // Gráfico de tipo barras
            data: {
                labels: charts.productos_mas_usados.map(item => item.nombre),
                datasets: [{
                    label: 'Cantidad Usada',
                    data: charts.productos_mas_usados.map(item => item.total_usado),
                    backgroundColor: '#d9232d',
                }]
            },
            options: {
                indexAxis: 'y', // Esto hace que las barras sean horizontales
                responsive: true,
                plugins: {
                    legend: {
                        display: false // No necesitamos leyenda para un solo dataset
                    }
                }
            }
        });
    }

    function renderizarListas(lists) {
        // Lista 1: Últimas Visitas
        const tbodyVisitas = document.querySelector('#lista-ultimas-visitas tbody');
        tbodyVisitas.innerHTML = ''; // Limpiamos la tabla
        if (lists.ultimas_visitas.length > 0) {
            lists.ultimas_visitas.forEach(visita => {
                const fecha = new Date(visita.fecha_visita).toLocaleDateString('es-PE');
                const fila = `<tr>
                                <td>${fecha}</td>
                                <td>${visita.nombre_paciente}</td>
                                <td>${visita.motivo_consulta}</td>
                              </tr>`;
                tbodyVisitas.innerHTML += fila;
            });
        } else {
            tbodyVisitas.innerHTML = '<tr><td colspan="3">No hay visitas recientes.</td></tr>';
        }

        // Lista 2: Productos con bajo stock
        const tbodyProductos = document.querySelector('#lista-productos-bajos tbody');
        tbodyProductos.innerHTML = ''; // Limpiamos la tabla
        if (lists.lista_productos_bajos.length > 0) {
            lists.lista_productos_bajos.forEach(producto => {
                const fila = `<tr>
                                <td>${producto.nombre}</td>
                                <td>${producto.stock_actual}</td>
                              </tr>`;
                tbodyProductos.innerHTML += fila;
            });
        } else {
            tbodyProductos.innerHTML = '<tr><td colspan="2">No hay productos bajos de stock.</td></tr>';
        }
    }

    // --- 4. CONFIGURACIÓN DE LA INTERFAZ DE USUARIO ---
    // Esta función reutiliza la lógica del menú que ya tienes en app.js y almacen.js
    function configurarUI() {
        const menuToggle = document.getElementById('menu-toggle');
        const sidebar = document.getElementById('sidebar-menu');

        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                document.body.classList.toggle('sidebar-open');
            });
        }

        if (sidebar) {
            const navLinks = sidebar.querySelectorAll('.sidebar-nav a');
            navLinks.forEach(link => {
                link.addEventListener('click', function(event) {
                    event.preventDefault();
                    const href = this.href;
                    if (document.body.classList.contains('sidebar-open')) {
                        document.body.classList.remove('sidebar-open');
                        setTimeout(() => { window.location.href = href; }, 300);
                    } else {
                        window.location.href = href;
                    }
                });
            });
        }

        const btnLogout = document.getElementById('btn-logout');
        if (btnLogout) {
            btnLogout.addEventListener('click', () => {
                fetch('../backend/api_logout.php')
                    .then(() => window.location.href = 'login.html');
            });
        }
    }
});

// frontend/js/dashboard.js

// ... (código anterior) ...

function renderizarGraficos(charts) {
    // Gráfico 1: Tipos de Visita (Torta)
    const ctxVisitas = document.getElementById('chart-tipos-visita').getContext('2d');
    new Chart(ctxVisitas, {
        type: 'doughnut',
        data: {
            // ... (tus datos de data no cambian) ...
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // <-- AÑADE ESTA LÍNEA
            plugins: {
                legend: {
                    position: 'top',
                }
            }
        }
    });

    // Gráfico 2: Productos más usados (Barras Horizontales)
    const ctxProductos = document.getElementById('chart-productos-usados').getContext('2d');
    new Chart(ctxProductos, {
        type: 'bar',
        data: {
             // ... (tus datos de data no cambian) ...
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false, // <-- AÑADE ESTA LÍNEA TAMBIÉN
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// ... (resto del código) ...