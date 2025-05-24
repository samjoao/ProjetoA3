
    // URL do backend - para demo local assume localhost:3000
    const API_BASE_URL = 'http://localhost:3000';

    const productForm = document.getElementById('product-form');
    const formMessage = document.getElementById('form-message');
    const productList = document.getElementById('product-list');
    const loadingMessage = document.getElementById('loading-message');

    // Função para validar email simples
    function isValidEmail(email) {
      const re = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
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