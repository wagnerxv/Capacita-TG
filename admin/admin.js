class AdminDashboard {
    constructor() {
        this.apiUrl = '/api';
        this.courses = [];
        this.filteredCourses = [];
        this.currentCourse = null;
        this.isEditing = false;
        this.students = [];
        this.filteredStudents = [];
        this.companies = [];
        this.filteredCompanies = [];
        this.currentSection = 'courses';
        
        this.init();
    }

    init() {
        // Verifica se o usuário está logado
        if (!this.isLoggedIn()) {
            window.location.href = 'index.html';
            return;
        }

        this.setupEventListeners();
        this.loadCourses();
        this.loadStudents();
        this.loadCompanies();
    }

    setupEventListeners() {
        // Logout
        document.getElementById('logoutBtn').addEventListener('click', this.logout.bind(this));

        // Botão de adicionar curso
        document.getElementById('addCourseBtn').addEventListener('click', () => {
            this.openCourseModal();
        });

        // Listeners para a nova aba de ordenação
        document.getElementById('saveOrderBtn').addEventListener('click', this.saveOrder.bind(this));

        // Modal controls
        document.getElementById('closeModal').addEventListener('click', this.closeCourseModal.bind(this));
        document.getElementById('cancelBtn').addEventListener('click', this.closeCourseModal.bind(this));

        // Form submission
        document.getElementById('courseForm').addEventListener('submit', this.handleFormSubmit.bind(this));

        // Delete modal
        document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
            this.hideModal('deleteModal');
        });
        document.getElementById('confirmDeleteBtn').addEventListener('click', this.confirmDelete.bind(this));

        // Filters
        document.getElementById('pageFilter').addEventListener('change', this.applyFilters.bind(this));
        document.getElementById('sortFilter').addEventListener('change', this.applyFilters.bind(this));
        document.getElementById('searchInput').addEventListener('input', this.applyFilters.bind(this));

        // Image preview
        document.getElementById('courseImageUrl').addEventListener('input', this.updateImagePreview.bind(this));

        // Button text customization
        document.getElementById('buttonTextSelect').addEventListener('change', this.handleButtonTextChange.bind(this));

        // Clickable stats for area details
        document.querySelectorAll('.clickable-stat').forEach(stat => {
            stat.addEventListener('click', (e) => {
                const area = e.currentTarget.dataset.area;
                this.showAreaDetails(area);
            });
        });
        // Navigation tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.switchSection(section);
            });
        });

        // Student filters
        document.getElementById('studentCityFilter')?.addEventListener('change', this.applyStudentFilters.bind(this));
        document.getElementById('studentSearchInput')?.addEventListener('input', this.applyStudentFilters.bind(this));
        document.getElementById('situacaoMilitarFilter')?.addEventListener('change', this.applyStudentFilters.bind(this));
        document.getElementById('tiroDeGuerraFilter')?.addEventListener('change', this.applyStudentFilters.bind(this));


        // Company filters
        document.getElementById('companyCityFilter')?.addEventListener('change', this.applyCompanyFilters.bind(this));
        document.getElementById('companySearchInput')?.addEventListener('input', this.applyCompanyFilters.bind(this));

        // Modal close buttons for new modals
        document.getElementById('closeStudentModal')?.addEventListener('click', () => this.hideModal('studentModal'));
        document.getElementById('closeStudentDetailsBtn')?.addEventListener('click', () => this.hideModal('studentModal'));
        document.getElementById('closeCompanyModal')?.addEventListener('click', () => this.hideModal('companyModal'));
        document.getElementById('closeCompanyDetailsBtn')?.addEventListener('click', () => this.hideModal('companyModal'));

        // Area details modal
        document.getElementById('closeAreaDetailsModal')?.addEventListener('click', () => this.hideModal('areaDetailsModal'));
        document.getElementById('closeAreaDetailsBtn')?.addEventListener('click', () => this.hideModal('areaDetailsModal'));

        // Close modals on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('active');
                }
            });
        });

        // Import form
        document.getElementById('importForm')?.addEventListener('submit', this.handleImportSubmit.bind(this));
    }

    handleButtonTextChange() {
        const select = document.getElementById('buttonTextSelect');
        const customInput = document.getElementById('customButtonText');
        
        if (select.value === 'custom') {
            customInput.style.display = 'block';
            customInput.required = true;
        } else {
            customInput.style.display = 'none';
            customInput.required = false;
            customInput.value = '';
        }
    }

    showAreaDetails(area) {
        const areaNames = {
            'empreend.html': 'Empreendedorismo',
            'primeiroemprego.html': 'Primeiro Emprego',
            'novoemp.html': 'Novo Emprego',
            'financ.html': 'Educação Financeira',
            'habitos.html': 'Hábitos Saudáveis'
        };
        
        const areaName = areaNames[area] || 'Área Desconhecida';
        const areaCourses = this.courses.filter(course => course.page === area);
        const activeCourses = areaCourses.length; // Todos são considerados ativos por enquanto
        
        // Ordenar cursos por data de criação (mais recentes primeiro)
        const recentCourses = areaCourses
            .sort((a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now()))
            .slice(0, 5);
        
        // Última atualização (curso mais recente)
        const lastUpdate = areaCourses.length > 0 
            ? new Date(Math.max(...areaCourses.map(c => new Date(c.createdAt || Date.now())))).toLocaleDateString('pt-BR')
            : 'Nenhuma';
        
        // Preencher modal
        document.getElementById('areaDetailsTitle').textContent = `Detalhes - ${areaName}`;
        document.getElementById('areaTotalCourses').textContent = areaCourses.length;
        document.getElementById('areaActiveCourses').textContent = activeCourses;
        document.getElementById('areaLastUpdate').textContent = lastUpdate;
        
        // Preencher lista de cursos recentes
        const recentCoursesList = document.getElementById('recentCoursesList');
        if (recentCourses.length === 0) {
            recentCoursesList.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 2rem;">Nenhum curso encontrado nesta área.</p>';
        } else {
            recentCoursesList.innerHTML = recentCourses.map(course => `
                <div class="recent-course-item">
                    <div class="recent-course-info">
                        <div class="recent-course-title">${this.escapeHtml(course.title)}</div>
                        <div class="recent-course-category">${this.escapeHtml(course.category)}</div>
                    </div>
                    <div class="recent-course-date">
                        ${new Date(course.createdAt || Date.now()).toLocaleDateString('pt-BR')}
                    </div>
                </div>
            `).join('');
        }
        
        this.showModal('areaDetailsModal');
    }
    isLoggedIn() {
        const loggedIn = localStorage.getItem('adminLoggedIn');
        const loginTime = localStorage.getItem('adminLoginTime');
        
        if (!loggedIn || !loginTime) return false;
        
        // Checa se o login foi feito há mais de 24 horas
        const now = Date.now();
        const loginTimestamp = parseInt(loginTime);
        const twentyFourHours = 24 * 60 * 60 * 1000;
        
        if (now - loginTimestamp > twentyFourHours) {
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminLoginTime');
            return false;
        }
        
        return true;
    }

    logout() {
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminLoginTime');
        window.location.href = 'index.html';
    }

    async loadCourses() {
        try {
            this.showLoading(true);
            const response = await fetch(`${this.apiUrl}/courses`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.courses = await response.json();
            this.filteredCourses = [...this.courses];
            this.renderCourses();
            this.updateStats();
        } catch (error) {
            console.error('Error loading courses:', error);
            this.showToast('Erro ao carregar cursos. Verifique se a API está funcionando.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showLoading(show) {
        const loadingState = document.getElementById('loadingState');
        const table = document.getElementById('coursesTable');
        
        if (show) {
            loadingState.style.display = 'block';
            table.style.display = 'none';
        } else {
            loadingState.style.display = 'none';
            table.style.display = 'table';
        }
    }

    renderCourses() {
        const tbody = document.getElementById('coursesTableBody');
        const emptyState = document.getElementById('emptyState');
        
        if (this.filteredCourses.length === 0) {
            tbody.innerHTML = '';
            emptyState.style.display = 'block';
            document.getElementById('coursesTable').style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        document.getElementById('coursesTable').style.display = 'table';

        tbody.innerHTML = this.filteredCourses.map(course => `
            <tr>
                <td>
                    <div style="max-width: 300px;">
                        <strong>${this.escapeHtml(course.title)}</strong>
                    </div>
                </td>
                <td>${this.escapeHtml(course.category)}</td>
                <td>
                    <span class="page-badge ${this.getPageClass(course.page)}">
                        ${this.getPageDisplayName(course.page)}
                    </span>
                </td>
                <td>
                    <span class="status-badge">Ativo</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-secondary btn-icon-only" onclick="adminDashboard.editCourse('${course.id}')" title="Editar">
                            ✏️
                        </button>
                        <button class="btn btn-danger btn-icon-only" onclick="adminDashboard.deleteCourse('${course.id}')" title="Excluir">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderReorderList() {
        const reorderList = document.getElementById('reorderList');
        const reorderLoadingState = document.getElementById('reorderLoadingState');
        const reorderEmptyState = document.getElementById('reorderEmptyState');
    
        if (this.courses.length === 0) {
            reorderEmptyState.style.display = 'block';
            reorderList.style.display = 'none';
            reorderLoadingState.style.display = 'none';
            return;
        }
    
        reorderEmptyState.style.display = 'none';
        reorderList.style.display = 'block';
        reorderList.innerHTML = this.courses.map(course => `
            <li class="reorder-list-item" draggable="true" data-id="${course.id}">
                <span class="reorder-list-handle">☰</span>
                <span class="reorder-list-title">${this.escapeHtml(course.title)}</span>
            </li>
        `).join('');
    
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        const list = document.getElementById('reorderList');
        let dragSrcEl = null;
    
        list.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('reorder-list-item')) {
                e.target.classList.add('dragging');
                dragSrcEl = e.target;
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', e.target.innerHTML);
            }
        });
    
        list.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const target = e.target.closest('.reorder-list-item');
            if (target && target !== dragSrcEl && !target.classList.contains('dragging')) {
                const rect = target.getBoundingClientRect();
                const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
                list.insertBefore(dragSrcEl, next && target.nextSibling || target);
            }
        });
    
        list.addEventListener('dragend', (e) => {
            e.target.classList.remove('dragging');
        });
    }

    async saveOrder() {
        const reorderList = document.getElementById('reorderList');
        const orderedIds = Array.from(reorderList.children).map(item => item.dataset.id);
    
        try {
            this.showButtonLoading('saveOrderBtn', true);
            const response = await fetch(`${this.apiUrl}/courses/reorder`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ orderedIds })
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            const newCourses = await response.json();
            this.courses = newCourses;
            this.filteredCourses = [...newCourses];
            this.renderCourses(); // Atualize a tabela na aba principal
            this.showToast('Ordem dos cursos salva com sucesso!');
        } catch (error) {
            console.error('Error saving order:', error);
            this.showToast('Erro ao salvar a ordem. Tente novamente.', 'error');
        } finally {
            this.showButtonLoading('saveOrderBtn', false);
        }
    }

    updateStats() {
        const total = this.courses.length;
        const empreend = this.courses.filter(c => c.page === 'empreend.html').length;
        const job = this.courses.filter(c => c.page === 'primeiroemprego.html').length;
        const finance = this.courses.filter(c => c.page === 'financ.html').length;
        const newjob = this.courses.filter(c => c.page === 'novoemp.html').length;
        const habitos = this.courses.filter(c => c.page === 'habitos.html').length;

        document.getElementById('totalCourses').textContent = total;
        document.getElementById('empreendCourses').textContent = empreend;
        document.getElementById('jobCourses').textContent = job;
        document.getElementById('financeCourses').textContent = finance;
        document.getElementById('NewjobCourses').textContent = newjob;
        document.getElementById('habitosCourses').textContent = habitos;
        
    }

    applyFilters() {
        const pageFilter = document.getElementById('pageFilter').value;
        const sortFilter = document.getElementById('sortFilter').value;
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();

        this.filteredCourses = this.courses.filter(course => {
            const matchesPage = !pageFilter || course.page === pageFilter;
            const matchesSearch = !searchTerm || 
                course.title.toLowerCase().includes(searchTerm) ||
                course.category.toLowerCase().includes(searchTerm) ||
                course.description.toLowerCase().includes(searchTerm);

            return matchesPage && matchesSearch;
        });

        // Aplicar ordenação
        this.applySorting(sortFilter);

        this.renderCourses();
    }

    applySorting(sortFilter) {
        const [field, direction] = sortFilter.split('_');
        
        this.filteredCourses.sort((a, b) => {
            let valueA, valueB;
            
            switch (field) {
                case 'title':
                    valueA = a.title.toLowerCase();
                    valueB = b.title.toLowerCase();
                    break;
                case 'category':
                    valueA = a.category.toLowerCase();
                    valueB = b.category.toLowerCase();
                    break;
                case 'created':
                default:
                    valueA = new Date(a.createdAt || a.id || 0);
                    valueB = new Date(b.createdAt || b.id || 0);
                    break;
            }
            
            if (direction === 'asc') {
                return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
            } else {
                return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
            }
        });
    }
    openCourseModal(course = null) {
        this.currentCourse = course;
        this.isEditing = !!course;

        const modal = document.getElementById('courseModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('courseForm');

        modalTitle.textContent = this.isEditing ? 'Editar Curso' : 'Adicionar Novo Curso';

        if (this.isEditing) {

            document.getElementById('courseTitle').value = course.title;
            document.getElementById('courseCategory').value = course.category;
            document.getElementById('courseDescription').value = course.description;
            document.getElementById('courseImageUrl').value = course.imageUrl;
            document.getElementById('courseUrl').value = course.courseUrl;
            document.getElementById('downloadUrl').value = course.downloadUrl || '';
            document.getElementById('coursePage').value = course.page;
            
            // Configurar texto do botão
            const buttonText = course.buttonText || 'Inscreva-se';
            const buttonTextSelect = document.getElementById('buttonTextSelect');
            const customButtonText = document.getElementById('customButtonText');
            
            // Verificar se é um texto personalizado
            const predefinedOptions = ['Inscreva-se', 'Baixar', 'Saiba mais', 'Começar agora', 'Acessar curso'];
            if (predefinedOptions.includes(buttonText)) {
                buttonTextSelect.value = buttonText;
                customButtonText.style.display = 'none';
                customButtonText.required = false;
            } else {
                buttonTextSelect.value = 'custom';
                customButtonText.value = buttonText;
                customButtonText.style.display = 'block';
                customButtonText.required = true;
            }
            
            this.updateImagePreview();
        } else {
            form.reset();
            document.getElementById('imagePreview').style.display = 'none';
            document.getElementById('customButtonText').style.display = 'none';
            document.getElementById('customButtonText').required = false;
        }

        this.showModal('courseModal');
    }

    closeCourseModal() {
        this.hideModal('courseModal');
        this.currentCourse = null;
        this.isEditing = false;
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const courseData = {
            title: formData.get('title'),
            category: formData.get('category'),
            description: formData.get('description'),
            imageUrl: formData.get('imageUrl'),
            courseUrl: formData.get('courseUrl'),
            page: formData.get('page'),
            
            downloadUrl: formData.get('downloadUrl') || null // Salva null se o campo estiver vazio
        };

        // Configurar texto do botão
        const buttonTextSelect = formData.get('buttonTextSelect');
        if (buttonTextSelect === 'custom') {
            courseData.buttonText = formData.get('customButtonText');
        } else {
            courseData.buttonText = buttonTextSelect;
        }
        // Validação dos dados do curso
        if (!this.validateCourseData(courseData)) {
            return;
        }

        try {
            this.showButtonLoading('saveBtn', true);

            let response;
            if (this.isEditing) {
                response = await fetch(`${this.apiUrl}/courses/${this.currentCourse.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(courseData)
                });
            } else {
                response = await fetch(`${this.apiUrl}/courses`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(courseData)
                });
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const savedCourse = await response.json();
            
            if (this.isEditing) {
                const index = this.courses.findIndex(c => c.id === this.currentCourse.id);
                this.courses[index] = savedCourse;
                this.showToast('Curso atualizado com sucesso!');
            } else {
                this.courses.push(savedCourse);
                this.showToast('Curso adicionado com sucesso!');
            }

            this.filteredCourses = [...this.courses];
            this.renderCourses();
            this.updateStats();
            this.closeCourseModal();

        } catch (error) {
            console.error('Error saving course:', error);
            this.showToast('Erro ao salvar curso. Tente novamente.', 'error');
        } finally {
            this.showButtonLoading('saveBtn', false);
        }
    }

    validateCourseData(data) {
        const requiredFields = ['title', 'category', 'description', 'imageUrl', 'courseUrl', 'page'];
        
        for (const field of requiredFields) {
            if (!data[field] || data[field].trim() === '') {
                this.showToast(`O campo ${this.getFieldDisplayName(field)} é obrigatório.`, 'error');
                return false;
            }
        }

        // Validar texto do botão personalizado
        if (data.buttonText && data.buttonText.trim() === '') {
            this.showToast('O texto do botão não pode estar vazio.', 'error');
            return false;
        }
        // Validar URLs
        try {
            new URL(data.imageUrl);
            new URL(data.courseUrl);
        } catch (error) {
            this.showToast('Por favor, insira URLs válidas.', 'error');
            return false;
        }

        return true;
    }

    editCourse(courseId) {
        const course = this.courses.find(c => c.id === courseId);
        if (course) {
            this.openCourseModal(course);
        }
    }

    deleteCourse(courseId) {
        const course = this.courses.find(c => c.id === courseId);
        if (course) {
            this.currentCourse = course;
            document.getElementById('deleteCourseTitle').textContent = course.title;
            this.showModal('deleteModal');
        }
    }

    async confirmDelete() {
        if (!this.currentCourse) return;

        try {
            this.showButtonLoading('confirmDeleteBtn', true);

            const response = await fetch(`${this.apiUrl}/courses/${this.currentCourse.id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.courses = this.courses.filter(c => c.id !== this.currentCourse.id);
            this.filteredCourses = [...this.courses];
            this.renderCourses();
            this.updateStats();
            this.hideModal('deleteModal');
            this.showToast('Curso excluído com sucesso!');

        } catch (error) {
            console.error('Error deleting course:', error);
            this.showToast('Erro ao excluir curso. Tente novamente.', 'error');
        } finally {
            this.showButtonLoading('confirmDeleteBtn', false);
        }
    }

    updateImagePreview() {
        const imageUrl = document.getElementById('courseImageUrl').value;
        const preview = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');

        if (imageUrl && this.isValidUrl(imageUrl)) {
            previewImg.src = imageUrl;
            preview.style.display = 'block';
        } else {
            preview.style.display = 'none';
        }
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    hideModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
        document.body.style.overflow = '';
    }

    showButtonLoading(buttonId, show) {
        const button = document.getElementById(buttonId);
        const btnText = button.querySelector('.btn-text');
        const btnLoading = button.querySelector('.btn-loading');

        if (show) {
            btnText.style.display = 'none';
            btnLoading.style.display = 'flex';
            button.disabled = true;
        } else {
            btnText.style.display = 'block';
            btnLoading.style.display = 'none';
            button.disabled = false;
        }
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('successToast');
        const toastMessage = document.getElementById('toastMessage');
        
        toastMessage.textContent = message;
        
        if (type === 'error') {
            toast.style.background = '#dc3545';
        } else {
            toast.style.background = '#28a745';
        }

        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    getPageClass(page) {
        const pageMap = {
            'empreend.html': 'empreend',
            'primeiroemprego.html': 'primeiro',
            'novoemp.html': 'novo',
            'financ.html': 'financ',
            'habitos.html': 'habitos'
        };
        return pageMap[page] || 'default';
    }

    getPageDisplayName(page) {
        const pageMap = {
            'empreend.html': 'Empreendedorismo',
            'primeiroemprego.html': 'Primeiro Emprego',
            'novoemp.html': 'Novo Emprego',
            'financ.html': 'Ed. Financeira',
            'habitos.html': 'Hábitos Saudáveis'
        };
        return pageMap[page] || page;
    }

    getFieldDisplayName(field) {
        const fieldMap = {
            'title': 'Título',
            'category': 'Categoria',
            'description': 'Descrição',
            'imageUrl': 'URL da Imagem',
            'courseUrl': 'URL do Curso',
            'page': 'Página'
        };
        return fieldMap[field] || field;
    }

    escapeHtml(text) {
        if (typeof text !== 'string') {
            return '';
        }
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    // Navigation methods
    switchSection(section) {
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.section === section);
        });
        document.querySelectorAll('.content-section').forEach(content => {
            content.classList.toggle('active', content.id === `${section}Section`);
        });
        if (section === 'reorder') {
            this.renderReorderList();
        }
    }


    // Students methods
    async loadStudents() {
        try {
            this.showStudentsLoading(true);
            const response = await fetch(`${this.apiUrl}/students`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.students = await response.json();
            this.filteredStudents = [...this.students];
            this.renderStudents();
            this.updateStudentsStats();
        } catch (error) {
            console.error('Error loading students:', error);
            this.showToast('Erro ao carregar alunos.', 'error');
        } finally {
            this.showStudentsLoading(false);
        }
    }

    showStudentsLoading(show) {
        const loadingState = document.getElementById('studentsLoadingState');
        const table = document.getElementById('studentsTable');
        
        if (show) {
            loadingState.style.display = 'block';
            table.style.display = 'none';
        } else {
            loadingState.style.display = 'none';
            table.style.display = 'table';
        }
    }

    renderStudents() {
        const tbody = document.getElementById('studentsTableBody');
        const emptyState = document.getElementById('studentsEmptyState');
        
        if (this.filteredStudents.length === 0) {
            tbody.innerHTML = '';
            emptyState.style.display = 'block';
            document.getElementById('studentsTable').style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        document.getElementById('studentsTable').style.display = 'table';

        tbody.innerHTML = this.filteredStudents.map(student => {
            const registrationDate = new Date(student.dataRegistro);
            const isRecent = (Date.now() - registrationDate.getTime()) < (7 * 24 * 60 * 60 * 1000); // 7 days
            const isAtirador = student.situacao_militar === 'matriculado e servindo';
            const rowClass = isAtirador ? 'atirador-row' : '';

            return `
            <tr class="${rowClass}">
                <td>
                    <div class="user-info">
                        <div class="user-name">${this.escapeHtml(student.nome)}</div>
                        <div class="user-email">${this.escapeHtml(student.email)}</div>
                        ${isAtirador ? '<span class="atirador-badge">Atirador</span>' : ''}
                    </div>
                </td>
                <td>
                    <span class="city-badge">${this.escapeHtml(student.cidade)}</span>
                </td>
                <td>
                    <span class="age-info">${student.idade || 'N/A'}</span>
                </td>
                <td>
                    ${this.escapeHtml(student.situacao_militar || 'N/A')}
                    ${student.tiro_guerra ? `<br><small>(${this.escapeHtml(student.tiro_guerra)})</small>` : ''}
                </td>
                <td>
                    <div class="date-info">
                        ${registrationDate.toLocaleDateString('pt-BR')}
                        <br>
                        <small>${registrationDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</small>
                    </div>
                </td>
                <td>
                    <span class="status-badge ${isRecent ? 'recent' : 'active'}">
                        ${isRecent ? 'Novo' : 'Ativo'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-primary btn-icon-only" onclick="adminDashboard.viewStudent('${student.id}')" title="Ver Detalhes">
                            👁️
                        </button>
                    </div>
                </td>
            </tr>
        `;
        }).join('');
    }

    updateStudentsStats() {
        const total = this.students.length;
        const thisMonth = this.students.filter(s => {
            const registrationDate = new Date(s.dataRegistro);
            const now = new Date();
            return registrationDate.getMonth() === now.getMonth() && 
                   registrationDate.getFullYear() === now.getFullYear();
        }).length;

        document.getElementById('totalStudents').textContent = total;
        document.getElementById('studentsThisMonth').textContent = thisMonth;
    }

    applyStudentFilters() {
        const cityFilter = document.getElementById('studentCityFilter').value;
        const situacaoMilitarFilter = document.getElementById('situacaoMilitarFilter').value;
        const tiroDeGuerraFilter = document.getElementById('tiroDeGuerraFilter').value;
        const searchTerm = document.getElementById('studentSearchInput').value.toLowerCase();

        this.filteredStudents = this.students.filter(student => {
            const matchesCity = !cityFilter || student.cidade === cityFilter;
            const matchesSituacao = !situacaoMilitarFilter || student.situacao_militar === situacaoMilitarFilter;
            const matchesTg = !tiroDeGuerraFilter || student.tiro_guerra === tiroDeGuerraFilter;
            const matchesSearch = !searchTerm || 
                student.nome.toLowerCase().includes(searchTerm) ||
                (student.email && student.email.toLowerCase().includes(searchTerm));

            return matchesCity && matchesSituacao && matchesTg && matchesSearch;
        });

        this.renderStudents();
    }


    viewStudent(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (student) {
            this.showStudentDetails(student);
        }
    }

    showStudentDetails(student) {
        const detailsContainer = document.getElementById('studentDetails');
        const isAtirador = student.situacao_militar === 'matriculado e servindo';

        detailsContainer.innerHTML = `
            <div class="detail-row">
                <div class="detail-label">Nome Completo</div>
                <div class="detail-value">${this.escapeHtml(student.nome)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Cidade</div>
                <div class="detail-value">${this.escapeHtml(student.cidade)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Email</div>
                <div class="detail-value">${this.escapeHtml(student.email)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Idade</div>
                <div class="detail-value">${this.escapeHtml(student.idade || 'Não informado')}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Telefone</div>
                <div class="detail-value">${this.escapeHtml(student.telefone || 'Não informado')}</div>
            </div>
            <div class="detail-row ${isAtirador ? 'atirador-highlight' : ''}">
                <div class="detail-label">Situação Militar</div>
                <div class="detail-value">${this.escapeHtml(student.situacao_militar || 'Não informado')}</div>
            </div>
            ${isAtirador ? `
            <div class="detail-row atirador-highlight">
                <div class="detail-label">Tiro de Guerra</div>
                <div class="detail-value">${this.escapeHtml(student.tiro_guerra || 'Não informado')}</div>
            </div>` : ''}
            <div class="detail-row">
                <div class="detail-label">Habilidades</div>
                <div class="detail-value multiline">${this.escapeHtml(student.habilidades || 'Não informado')}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Experiência</div>
                <div class="detail-value multiline">${this.escapeHtml(student.experiencia || 'Não informado')}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Formação</div>
                <div class="detail-value multiline">${this.escapeHtml(student.formacao || 'Não informado')}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Data de Registro</div>
                <div class="detail-value">${new Date(student.dataRegistro).toLocaleString('pt-BR')}</div>
            </div>
        `;
        this.showModal('studentModal');
    }

    // Companies methods
    async loadCompanies() {
        try {
            this.showCompaniesLoading(true);
            const response = await fetch(`${this.apiUrl}/companies`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.companies = await response.json();
            this.filteredCompanies = [...this.companies];
            this.renderCompanies();
            this.updateCompaniesStats();
        } catch (error) {
            console.error('Error loading companies:', error);
            this.showToast('Erro ao carregar empresas.', 'error');
        } finally {
            this.showCompaniesLoading(false);
        }
    }

    showCompaniesLoading(show) {
        const loadingState = document.getElementById('companiesLoadingState');
        const table = document.getElementById('companiesTable');
        
        if (show) {
            loadingState.style.display = 'block';
            table.style.display = 'none';
        } else {
            loadingState.style.display = 'none';
            table.style.display = 'table';
        }
    }

    renderCompanies() {
        const tbody = document.getElementById('companiesTableBody');
        const emptyState = document.getElementById('companiesEmptyState');
        
        if (this.filteredCompanies.length === 0) {
            tbody.innerHTML = '';
            emptyState.style.display = 'block';
            document.getElementById('companiesTable').style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        document.getElementById('companiesTable').style.display = 'table';

        tbody.innerHTML = this.filteredCompanies.map(company => {
            const registrationDate = new Date(company.dataRegistro);
            const isRecent = (Date.now() - registrationDate.getTime()) < (7 * 24 * 60 * 60 * 1000); // 7 days
            
            return `
            <tr>
                <td>
                    <div class="company-info">
                        <div class="company-name">${this.escapeHtml(company.nomeEmpresa)}</div>
                        <div class="company-email">${this.escapeHtml(company.email)}</div>
                    </div>
                </td>
                <td>
                    <span class="city-badge">${this.escapeHtml(company.cidade)}</span>
                </td>
                <td>
                    <div class="date-info">
                        ${registrationDate.toLocaleDateString('pt-BR')}
                        <br>
                        <small>${registrationDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</small>
                    </div>
                </td>
                <td>
                    <span class="status-badge ${isRecent ? 'recent' : 'active'}">
                        ${isRecent ? 'Nova' : 'Ativa'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-primary btn-icon-only" onclick="adminDashboard.viewCompany('${company.id}')" title="Ver Detalhes">
                            👁️
                        </button>
                    </div>
                </td>
            </tr>
        `;
        }).join('');
    }

    updateCompaniesStats() {
        const total = this.companies.length;
        const thisMonth = this.companies.filter(c => {
            const registrationDate = new Date(c.dataRegistro);
            const now = new Date();
            return registrationDate.getMonth() === now.getMonth() && 
                   registrationDate.getFullYear() === now.getFullYear();
        }).length;

        document.getElementById('totalCompanies').textContent = total;
        document.getElementById('companiesThisMonth').textContent = thisMonth;
    }

    applyCompanyFilters() {
        const cityFilter = document.getElementById('companyCityFilter').value;
        const searchTerm = document.getElementById('companySearchInput').value.toLowerCase();

        this.filteredCompanies = this.companies.filter(company => {
            const matchesCity = !cityFilter || company.cidade === cityFilter;
            const matchesSearch = !searchTerm || 
                company.nomeEmpresa.toLowerCase().includes(searchTerm) ||
                company.email.toLowerCase().includes(searchTerm);

            return matchesCity && matchesSearch;
        });

        this.renderCompanies();
    }

    viewCompany(companyId) {
        const company = this.companies.find(c => c.id === companyId);
        if (company) {
            this.showCompanyDetails(company);
        }
    }

    showCompanyDetails(company) {
        const detailsContainer = document.getElementById('companyDetails');
        detailsContainer.innerHTML = `
            <div class="detail-row">
                <div class="detail-label">Nome da Empresa</div>
                <div class="detail-value">${this.escapeHtml(company.nomeEmpresa)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Cidade</div>
                <div class="detail-value">${this.escapeHtml(company.cidade)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Email</div>
                <div class="detail-value">${this.escapeHtml(company.email)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Necessidades/Informações</div>
                <div class="detail-value multiline">${this.escapeHtml(company.informacoes || 'Não informado')}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Data de Registro</div>
                <div class="detail-value">${new Date(company.dataRegistro).toLocaleString('pt-BR')}</div>
            </div>
        `;
        this.showModal('companyModal');
    }

    async handleImportSubmit(e) {
        e.preventDefault();

        const fileInput = document.getElementById('importFile');
        const passwordInput = document.getElementById('importPassword');
        const importBtn = document.getElementById('importBtn');
        const resultsDiv = document.getElementById('importResults');
        const resultsContent = document.getElementById('importResultsContent');

        if (!fileInput.files[0]) {
            this.showToast('Por favor, selecione um arquivo JSON', 'error');
            return;
        }

        if (!passwordInput.value) {
            this.showToast('Por favor, digite uma senha para os usuários', 'error');
            return;
        }

        try {
            // Mostrar loading
            this.showButtonLoading('importBtn', true);
            resultsDiv.style.display = 'none';

            // Ler o arquivo JSON
            const fileContent = await this.readFileAsText(fileInput.files[0]);
            const jsonData = JSON.parse(fileContent);

            // Enviar para o servidor
            const response = await fetch(`${this.apiUrl}/admin/import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    data: jsonData,
                    password: passwordInput.value
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao importar dados');
            }

            const result = await response.json();

            // Mostrar resultados
            this.displayImportResults(result.results);
            resultsDiv.style.display = 'block';

            // Recarregar dados
            await this.loadCourses();
            await this.loadStudents();
            await this.loadCompanies();

            this.showToast('Importação concluída com sucesso!');

            // Limpar formulário
            document.getElementById('importForm').reset();

        } catch (error) {
            console.error('Error importing data:', error);
            this.showToast(error.message || 'Erro ao importar dados', 'error');
        } finally {
            this.showButtonLoading('importBtn', false);
        }
    }

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Erro ao ler arquivo'));
            reader.readAsText(file);
        });
    }

    displayImportResults(results) {
        const resultsContent = document.getElementById('importResultsContent');

        let html = '<div class="import-results-grid">';

        // Students
        if (results.students.success > 0 || results.students.failed > 0) {
            html += `
                <div class="result-card ${results.students.failed > 0 ? 'has-errors' : 'success'}">
                    <h4>Alunos</h4>
                    <p class="result-success">Importados com sucesso: ${results.students.success}</p>
                    ${results.students.failed > 0 ? `<p class="result-error">Falhas: ${results.students.failed}</p>` : ''}
                    ${results.students.errors.length > 0 ? `
                        <details>
                            <summary>Ver erros</summary>
                            <ul class="error-list">
                                ${results.students.errors.map(err => `<li>${this.escapeHtml(err)}</li>`).join('')}
                            </ul>
                        </details>
                    ` : ''}
                </div>
            `;
        }

        // Users
        if (results.users.success > 0 || results.users.failed > 0) {
            html += `
                <div class="result-card ${results.users.failed > 0 ? 'has-errors' : 'success'}">
                    <h4>Usuários</h4>
                    <p class="result-success">Importados com sucesso: ${results.users.success}</p>
                    ${results.users.failed > 0 ? `<p class="result-error">Falhas: ${results.users.failed}</p>` : ''}
                    ${results.users.errors.length > 0 ? `
                        <details>
                            <summary>Ver erros</summary>
                            <ul class="error-list">
                                ${results.users.errors.map(err => `<li>${this.escapeHtml(err)}</li>`).join('')}
                            </ul>
                        </details>
                    ` : ''}
                </div>
            `;
        }

        // Courses
        if (results.courses.success > 0 || results.courses.failed > 0) {
            html += `
                <div class="result-card ${results.courses.failed > 0 ? 'has-errors' : 'success'}">
                    <h4>Cursos</h4>
                    <p class="result-success">Importados com sucesso: ${results.courses.success}</p>
                    ${results.courses.failed > 0 ? `<p class="result-error">Falhas: ${results.courses.failed}</p>` : ''}
                    ${results.courses.errors.length > 0 ? `
                        <details>
                            <summary>Ver erros</summary>
                            <ul class="error-list">
                                ${results.courses.errors.map(err => `<li>${this.escapeHtml(err)}</li>`).join('')}
                            </ul>
                        </details>
                    ` : ''}
                </div>
            `;
        }

        // Companies
        if (results.companies.success > 0 || results.companies.failed > 0) {
            html += `
                <div class="result-card ${results.companies.failed > 0 ? 'has-errors' : 'success'}">
                    <h4>Empresas</h4>
                    <p class="result-success">Importados com sucesso: ${results.companies.success}</p>
                    ${results.companies.failed > 0 ? `<p class="result-error">Falhas: ${results.companies.failed}</p>` : ''}
                    ${results.companies.errors.length > 0 ? `
                        <details>
                            <summary>Ver erros</summary>
                            <ul class="error-list">
                                ${results.companies.errors.map(err => `<li>${this.escapeHtml(err)}</li>`).join('')}
                            </ul>
                        </details>
                    ` : ''}
                </div>
            `;
        }

        html += '</div>';
        resultsContent.innerHTML = html;
    }
}

// Inicializa o dashboard quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});