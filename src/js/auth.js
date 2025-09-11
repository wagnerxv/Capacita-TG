// Sistema de Autenticação do Capacita Arapiraca
class AuthSystem {
    constructor() {
        this.apiUrl = '/api';
        this.currentUser = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            await this.checkAuthStatus();
            this.setupEventListeners();
            this.isInitialized = true;
        } catch (error) {
            console.error('Erro ao inicializar sistema de autenticação:', error);
        }
    }

    // Verificar status de autenticação
    async checkAuthStatus() {
        try {
            const response = await fetch(`${this.apiUrl}/auth/verify`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                this.updateUI(true);
                return true;
            } else {
                this.currentUser = null;
                this.updateUI(false);
                return false;
            }
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            this.currentUser = null;
            this.updateUI(false);
            return false;
        }
    }

    // Configurar event listeners
    setupEventListeners() {
        // Botões de login no header
        const headerLoginBtn = document.getElementById('headerLoginBtn');
        const mobileLoginBtn = document.getElementById('mobileLoginBtn');

        if (headerLoginBtn) {
            headerLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleHeaderLoginClick();
            });
        }

        if (mobileLoginBtn) {
            mobileLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleHeaderLoginClick();
            });
        }

        // Event listeners para modais
        this.setupModalEventListeners();
    }

    // Configurar event listeners dos modais
    setupModalEventListeners() {
        // Fechar modais clicando no overlay
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.hideModal(overlay.id);
                }
            });
        });

        // Botões dos modais
        const modalButtons = {
            'modalAcessarSistema': () => this.handleSystemAccess(),
            'modalLogout': () => this.showModal('logoutConfirmModal'),
            'cancelLogout': () => this.hideModal('logoutConfirmModal'),
            'confirmLogout': () => this.performLogout(),
            'closeSuccessModal': () => this.hideModal('successModal'),
            'confirmSystemAccess': () => this.hideModal('systemAccessModal'),
            'goToLogin': () => window.location.href = 'entrar.html',
            'cancelLogin': () => this.hideModal('loginRequiredModal')
        };

        Object.entries(modalButtons).forEach(([id, handler]) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('click', handler);
            }
        });
    }

    // Lidar com clique no botão de login do header
    handleHeaderLoginClick() {
        if (this.currentUser) {
            this.showUserProfileModal();
        } else {
            window.location.href = 'entrar.html';
        }
    }

    // Mostrar modal do perfil do usuário
    showUserProfileModal() {
        if (!this.currentUser) return;

        document.getElementById('modalUserName').textContent = this.currentUser.nome;
        document.getElementById('modalUserEmail').textContent = this.currentUser.email;
        document.getElementById('modalUserType').textContent = 
            this.currentUser.tipoUsuario === 'atirador' ? 'Candidato' : 'Empregador';
        
        this.showModal('userProfileModal');
    }

    // Lidar com acesso ao sistema
    handleSystemAccess() {
        this.hideModal('userProfileModal');
        
        // Redirecionar baseado no tipo de usuário
        if (this.currentUser.tipoUsuario === 'empregador') {
            // Redirecionar para dashboard do empregador
            window.location.href = '/dashboard/empregador.html';
        } else {
            // Redirecionar para dashboard do candidato
            window.location.href = '/dashboard/candidato.html';
        }
    }

    // Realizar logout
    async performLogout() {
        try {
            const response = await fetch(`${this.apiUrl}/auth/logout`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.currentUser = null;
                this.updateUI(false);
                this.hideModal('logoutConfirmModal');
                this.showSuccessModal('Logout Realizado', 'Você foi desconectado com sucesso!');
                
                // Redirecionar para página inicial após 2 segundos
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            } else {
                throw new Error('Erro ao fazer logout');
            }
        } catch (error) {
            console.error('Erro no logout:', error);
            this.showErrorModal('Erro', 'Não foi possível fazer logout. Tente novamente.');
        }
    }

    // Atualizar interface do usuário
    updateUI(isLoggedIn) {
        const headerLoginBtn = document.getElementById('headerLoginBtn');
        const mobileLoginBtn = document.getElementById('mobileLoginBtn');
        const cadastreSeLink = document.getElementById('cadastre-se-link');
        const verPerfilContainer = document.getElementById('ver-perfil-container');

        if (isLoggedIn && this.currentUser) {
            // Atualiza os botões principais de login/perfil
            if (headerLoginBtn) {
                headerLoginBtn.innerHTML = `
                    <div class="user-info-header">
                        <span class="user-name-header">${this.getDisplayName()}</span>
                        <span class="user-type-header">${this.getUserTypeDisplay()}</span>
                    </div>
                `;
                headerLoginBtn.classList.add('logged-in');
            }

            if (mobileLoginBtn) {
                mobileLoginBtn.innerHTML = `
                    <div class="user-info-header">
                        <span class="user-name-header">${this.getDisplayName()}</span>
                        <span class="user-type-header">${this.getUserTypeDisplay()}</span>
                    </div>
                `;
                mobileLoginBtn.classList.add('logged-in');
            }

            // Oculta "Cadastre-se" e mostra "Ver Perfil"
            if (cadastreSeLink) {
                cadastreSeLink.style.display = 'none';
            }
            if (verPerfilContainer) {
                const perfilUrl = this.currentUser.tipoUsuario === 'empregador' 
                    ? '/dashboard/empregador.html' 
                    : '/dashboard/candidato.html';
                verPerfilContainer.innerHTML = `<a href="${perfilUrl}" class="nav-link">Ver Perfil</a>`;
            }

        } else {
            // Restaura o estado de deslogado
            if (headerLoginBtn) {
                headerLoginBtn.textContent = 'Acessar';
                headerLoginBtn.classList.remove('logged-in');
            }

            if (mobileLoginBtn) {
                mobileLoginBtn.textContent = 'Acessar';
                mobileLoginBtn.classList.remove('logged-in');
            }

            // Mostra "Cadastre-se" e limpa "Ver Perfil"
            if (cadastreSeLink) {
                cadastreSeLink.style.display = 'list-item';
            }
            if (verPerfilContainer) {
                verPerfilContainer.innerHTML = '';
            }
        }
    }

    // Obter nome para exibição
    getDisplayName() {
        if (!this.currentUser) return '';
        const nameParts = this.currentUser.nome.split(' ');
        return nameParts.length > 1 ? `${nameParts[0]} ${nameParts[1]}` : nameParts[0];
    }

    // Obter tipo de usuário para exibição
    getUserTypeDisplay() {
        if (!this.currentUser) return '';
        return this.currentUser.tipoUsuario === 'atirador' ? 'Candidato' : 'Empregador';
    }

    // Métodos de modal
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    showSuccessModal(title, message) {
        const titleElement = document.getElementById('successTitle');
        const messageElement = document.getElementById('successMessage');
        
        if (titleElement) titleElement.textContent = title;
        if (messageElement) messageElement.textContent = message;
        
        this.showModal('successModal');
    }

    showErrorModal(title, message) {
        // Implementar modal de erro se necessário
        alert(`${title}: ${message}`);
    }

    // Métodos públicos para uso externo
    isLoggedIn() {
        return !!this.currentUser;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    requireAuth() {
        if (!this.isLoggedIn()) {
            this.showModal('loginRequiredModal');
            return false;
        }
        return true;
    }
}

// Inicializar sistema de autenticação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.authSystem = new AuthSystem();
});

// Exportar para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthSystem;
}