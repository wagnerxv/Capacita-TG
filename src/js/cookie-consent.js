// src/js/cookie-consent.js
document.addEventListener('DOMContentLoaded', () => {
    const COOKIE_CONSENT_KEY = 'user_has_consented_to_cookies';

    // Se o consentimento já foi dado, não faz nada
    if (localStorage.getItem(COOKIE_CONSENT_KEY) === 'true') {
        return;
    }

    // Cria o HTML do banner dinamicamente
    const bannerHTML = `
        <div class="cookie-consent-text">
            <p>Nós utilizamos cookies para melhorar sua experiência em nosso site. Ao continuar navegando, você concorda com a nossa utilização de cookies.</p>
        </div>
        <div class="cookie-consent-buttons">
            <button class="cookie-consent-button" id="cookie-accept-btn">Aceitar</button>
        </div>
    `;

    const banner = document.createElement('div');
    banner.className = 'cookie-consent-banner';
    banner.id = 'cookie-consent-banner';
    banner.innerHTML = bannerHTML;
    document.body.appendChild(banner);

    // Mostra o banner após um breve intervalo
    setTimeout(() => {
        banner.classList.add('active');
    }, 1000);

    // Adiciona o evento de clique ao botão de aceitar
    const acceptButton = document.getElementById('cookie-accept-btn');
    if (acceptButton) {
        acceptButton.addEventListener('click', () => {
            localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
            banner.classList.remove('active');
            
            // Remove o banner do DOM após a animação de saída
            setTimeout(() => {
                banner.remove();
            }, 500);
        });
    }
});