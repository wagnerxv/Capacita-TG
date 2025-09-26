class CourseLoader {
    constructor() {
    this.apiUrl = '/api';
    this.currentPage = this.getCurrentPage();
    this.init();
    }
    
    init() {
    if (this.currentPage) {
    this.loadCourses();
    }
    }
    
    getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop();
    
    // Map of valid course pages
    const validPages = [
    'empreend.html',
    'primeiroemprego.html', 
    'novoemp.html',
    'financ.html',
    'habitos.html'
    ];
    
    return validPages.includes(filename) ? filename : null;
    }
    
    async loadCourses() {
    try {
    const courseGrid = document.querySelector('.course-grid');
    if (!courseGrid) {
    console.warn('Course grid not found on this page');
    return;
    }
    
    // Show loading state
    this.showLoadingState(courseGrid);
    
    const response = await fetch(`${this.apiUrl}/courses/${this.currentPage}`);
    
    if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const courses = await response.json();
    this.renderCourses(courses, courseGrid);
    
    } catch (error) {
    console.error('Error loading courses:', error);
    this.showErrorState(document.querySelector('.course-grid'));
    }
    }
    
    showLoadingState(container) {
    container.innerHTML = `
               <div class="loading-courses">
                   <div class="loading-spinner"></div>
                   <p>Carregando cursos...</p>
               </div>
           `;
    }
    
    showErrorState(container) {
    container.innerHTML = `
               <div class="error-courses">
                   <div class="error-icon">⚠️</div>
                   <h3>Erro ao carregar cursos</h3>
                   <p>Não foi possível carregar os cursos. Verifique sua conexão e tente novamente.</p>
                   <button class="btn btn-primary" onclick="location.reload()">Tentar Novamente</button>
               </div>
           `;
    }
    
    renderCourses(courses, container) {
    if (courses.length === 0) {
    container.innerHTML = `
                   <div class="no-courses">
                       <div class="no-courses-icon">📚</div>
                       <h3>Nenhum curso disponível</h3>
                       <p>Novos cursos serão adicionados em breve.</p>
                   </div>
               `;
    return;
    }
    
    // Clear container and add courses
    container.innerHTML = '';
    
    courses.forEach(course => {
    const courseCard = this.createCourseCard(course);
    container.appendChild(courseCard);
    });
    
    // Add animation to cards
    this.animateCourseCards();
    
    // Proteger links externos após criar os cards
    if (window.authSystem && typeof window.authSystem.protectExternalLinks === 'function') {
        window.authSystem.protectExternalLinks();
    }
    }
    
    createCourseCard(course) {
    const card = document.createElement('div');
    card.className = 'course-card';
    card.setAttribute('data-course-id', course.id);
    
            // Lógica para determinar o texto e o link do botão
            const isDownload = course.downloadUrl && course.downloadUrl.trim() !== '';
            const buttonText = course.buttonText || (isDownload ? 'Baixar' : this.getButtonText(course.courseUrl));
            const buttonUrl = isDownload ? course.downloadUrl : course.courseUrl;
            const downloadAttribute = isDownload ? 'download' : ''; // Adiciona o atributo de download
    
    
    card.innerHTML = `
            <div class="image-container">
                <img src="${this.escapeHtml(course.imageUrl)}"
                      alt="${this.escapeHtml(course.title)}"
                      onerror="this.src='https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg'">
            </div>
            <div class="course-info">
                <h3>${this.escapeHtml(course.title)}</h3>
                <p class="course-category">${this.escapeHtml(course.category)}</p>
                <p>${this.escapeHtml(course.description)}</p>
                 <a href="${this.escapeHtml(buttonUrl)}"
                     target="_blank"
                     class="btn btn-secondary"
                     rel="noopener noreferrer"
                     ${downloadAttribute}>
                     ${this.escapeHtml(buttonText)}
                </a>
            </div>
        `;
    
    return card;
    }
    
    getButtonText(url) {
        if (this.currentPage === 'habitos.html') {
            // Se for um link de download (PDF, DOCX, etc.), continua como "Baixar"
            if (url.includes('download') || url.includes('.pdf') || url.includes('.docx') || url.includes('.xlsx')) {
                return 'Baixar';
            }
            return 'Saiba Mais';
        }
        
        if (url.includes('download') || url.includes('.pdf') || url.includes('.docx') || url.includes('.xlsx')) {
            return 'Baixar';
        }
        return 'Inscreva-se';
    }
    
    animateCourseCards() {
    const cards = document.querySelectorAll('.course-card');
    
    // Use Intersection Observer for better performance
    const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
    if (entry.isIntersecting) {
    setTimeout(() => {
    entry.target.classList.add('animate-card');
    }, index * 100);
    observer.unobserve(entry.target);
    }
    });
    }, {
    threshold: 0.1,
    rootMargin: '50px'
    });
    
    cards.forEach(card => {
    observer.observe(card);
    });
    }
    
    escapeHtml(text) {
    const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
    }
    }
    
    // CSS for loading and error states
    const courseLoaderStyles = `
       .loading-courses,
       .error-courses,
       .no-courses {
           grid-column: 1 / -1;
           text-align: center;
           padding: 3rem 1rem;
           color: #666;
       }
    
       .loading-spinner {
           width: 40px;
           height: 40px;
           border: 3px solid #f3f3f3;
           border-top: 3px solid #4b5320;
           border-radius: 50%;
           animation: spin 1s linear infinite;
           margin: 0 auto 1rem;
       }
    
       @keyframes spin {
           0% { transform: rotate(0deg); }
           100% { transform: rotate(360deg); }
       }
    
       .error-icon,
       .no-courses-icon {
           font-size: 3rem;
           margin-bottom: 1rem;
       }
    
       .error-courses h3,
       .no-courses h3 {
           color: #2e3d28;
           margin-bottom: 0.5rem;
           font-family: 'PT Serif', serif;
       }
    
       .error-courses p,
       .no-courses p {
           margin-bottom: 1.5rem;
           line-height: 1.6;
       }
    
       .course-card {
           opacity: 0;
           transform: translateY(20px);
           transition: all 0.6s ease;
       }
    
       .course-card.animate-card {
           opacity: 1;
           transform: translateY(0);
       }
    `;
    
    // Inject styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = courseLoaderStyles;
    document.head.appendChild(styleSheet);
    
    // Initialize course loader when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        new CourseLoader();
    });