
    // URL do backend - para demo local assume localhost:3000
    const API_BASE_URL = 'https://projetoa3-orzo.onrender.com';

    const productForm = document.getElementById('product-form');   
    const formMessage = document.getElementById('form-message');     
    const productList = document.getElementById('product-list');    
    const loadingMessage = document.getElementById('loading-message');

    // Função para validar email simples                                   
    function isValidEmail(email) {                                         
      const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      return re.test(email);
    }

    // Envia o produto para o backend
    productForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      formMessage.textContent = '';
      formMessage.className = 'message';

      const companyName = document.getElementById('companyName').value.trim();
      const companyEmail = document.getElementById('companyEmail').value.trim();
      const productName = document.getElementById('productName').value.trim();
      const productDescription = document.getElementById('productDescription').value.trim();
      const productQuantity = document.getElementById('productQuantity').value.trim();

      if (!companyName || !companyEmail || !productName || !productQuantity) {
        formMessage.textContent = 'Por favor, preencha todos os campos obrigatórios.';
        formMessage.classList.add('error');
        return;
      }
      if (!isValidEmail(companyEmail)) {
        formMessage.textContent = 'Por favor, informe um e-mail válido.';
        formMessage.classList.add('error');
        return;
      }
      if (!/^\d+$/.test(productQuantity)) {
        formMessage.textContent = 'Quantidade deve ser um número inteiro.';
        formMessage.classList.add('error');
        return;
      }

      const payload = {
        companyName,
        companyEmail,
        productName,
        productDescription,
        productQuantity: Number(productQuantity),
      };

      try {
        const response = await fetch(API_BASE_URL + '/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao salvar produto');
        }

        formMessage.textContent = 'Produto cadastrado com sucesso!';
        formMessage.classList.add('success');
        productForm.reset();
        loadProducts();
      } catch (error) {
        formMessage.textContent = error.message;
        formMessage.classList.add('error');
      }
    });

    // Carrega produtos do backend e apresenta na lista
    async function loadProducts() {
      loadingMessage.style.display = 'block';
      productList.innerHTML = '';

      try {
        const response = await fetch(API_BASE_URL + '/products', {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });
        if (!response.ok) throw new Error('Falha ao carregar dados');
        const data = await response.json();

        if (data.length === 0) {
          productList.innerHTML = '<li>Nenhum produto disponível no momento.</li>';
        } else {
          productList.innerHTML = data.map(p => `
            <li>
              <div class="product-title">${p.productName} <small>(Qtd: ${p.productQuantity})</small></div>
              <div><strong>Empresa:</strong> ${p.companyName} - ${p.companyEmail}</div>
              <div class="product-description">${p.productDescription || '<em>Sem descrição</em>'}</div>
              <div><small>Publicado em ${new Date(p.createdAt).toLocaleDateString()}</small></div>
            </li>
          `).join('');
        }
      } catch (e) {
        productList.innerHTML = '<li>Erro ao carregar produtos. Tente novamente.</li>';
      } finally {
        loadingMessage.style.display = 'none';
      }
    }

    // Carrega produtos ao iniciar a página
    window.addEventListener('load', () => {
      loadProducts();
    });

    const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');

if (loginForm) { // Verifica se o formulário de login existe na página
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        loginMessage.textContent = '';
        loginMessage.className = 'message';

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        const userType = document.getElementById('userType').value.trim();

        if (!email || !password || !userType) {
            loginMessage.textContent = 'Por favor, preencha todos os campos.';
            loginMessage.classList.add('error');
            return;
        }

        try {
            const response = await fetch(API_BASE_URL + '/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ email, password, userType }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro no login.');
            }

            // Login bem-sucedido: Armazenar o token JWT
            localStorage.setItem('jwtToken', data.token);
            localStorage.setItem('userType', data.user.userType); // Para saber se é empresa ou ONG
            localStorage.setItem('userName', data.user.name); // Para exibir o nome do usuário

            loginMessage.textContent = 'Login bem-sucedido! Redirecionando...';
            loginMessage.classList.add('success');

            // Redirecionar após o login (ex: para uma página de dashboard ou a mesma página)
            setTimeout(() => {
                // Você pode recarregar a página para mostrar conteúdo específico
                window.location.reload();
                // Ou redirecionar para outra página: window.location.href = '/dashboard.html';
            }, 1500);

        } catch (error) {
            console.error('Erro de login:', error);
            loginMessage.textContent = error.message || 'Erro inesperado no login.';
            loginMessage.classList.add('error');
        }
    });
}


// Exemplo de como incluir o token em requisições protegidas
// Modifique a função loadProducts() para enviar o token (se ela for protegida)
async function loadProducts() {
    // ... (restante do código) ...

    const token = localStorage.getItem('jwtToken');
    const headers = { 'Accept': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`; // Adiciona o token no cabeçalho
    }

    try {
        const response = await fetch(API_BASE_URL + '/products', {
            method: 'GET',
            headers: headers, // Use os cabeçalhos com ou sem token
        });
        // ... (restante do código) ...
    } catch (e) {
        // ...
    } finally {
        // ...
    }
}


// Lógica para verificar o login ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('jwtToken');
    const userType = localStorage.getItem('userType');
    const userName = localStorage.getItem('userName');

    if (token && userType && userName) {
        // Usuário está logado, você pode esconder o formulário de login
        const loginSection = document.getElementById('login-section');
        if (loginSection) loginSection.style.display = 'none';

        // E mostrar um "Bem-vindo" ou o conteúdo protegido
        console.log(`Bem-vindo(a), ${userName} (${userType})!`);
        // Aqui você pode carregar dados específicos para o tipo de usuário
    } else {
        // Usuário não logado, talvez mostrar apenas a tela de login
        const productFormSection = document.getElementById('company-section');
        if (productFormSection) productFormSection.style.display = 'none'; // Esconde o formulário de cadastro de produtos
        // ... e outras seções que dependem do login
    }

    loadProducts(); // Carrega os produtos, agora com possível token
});

// Lógica de logout (um botão de logout)
const logoutButton = document.getElementById('logout-button'); // Adicione um botão de logout no HTML
if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('userType');
        localStorage.removeItem('userName');
        window.location.reload(); // Recarrega a página para voltar ao estado "não logado"
    });
}