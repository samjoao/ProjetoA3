import 'dotenv/config'; // carrega as variaveis de ambiente do .env
import express from 'express';
import cors from 'cors';
// Importar os modelos e a função de sincronização do banco de dados
import { sequelize, Product, Company, ONG, Donation, syncDatabase } from './database/index.js';

const app = express();
const port = process.env.PORT || 3000;
// DATABASE_URL não é mais necessário para SQLite aqui diretamente, mas SQLITE_STORAGE_PATH é.
// const databaseUrl = process.env.DATABASE_URL; // Não necessário para SQLite com arquivo local

const allowedOrigins = [
    'http://localhost:8080',
    'http://localhost:5500',
    'https://doacoesonline.netlify.app',
    'http://doacoesonline.netlify.app'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Não permitido pelo CORS'));
        }
    }
}));

// Middleware para parsear JSON no corpo das requisições
app.use(express.json());

// Conexão e Sincronização com o Banco de Dados SQLite (via Sequelize)
// Chamamos a função de sincronização ao iniciar o servidor
syncDatabase(); // Chama a função que conecta e cria as tabelas

// ------------------------------------
// Rotas Existentes e Novas Rotas
// ------------------------------------

// Rota para Cadastrar Novo Produto (POST /products)
app.post('/products', async (req, res) => {
    try {
        const { companyName, companyEmail, productName, productDescription, productQuantity } = req.body;

        // Validações básicas do lado do servidor
        if (!companyName || !companyEmail || !productName || !productQuantity) {
            return res.status(400).json({ message: 'Por favor, preencha todos os campos obrigatórios.' });
        }
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(companyEmail)) {
            return res.status(400).json({ message: 'Formato de e-mail inválido.' });
        }
        if (isNaN(Number(productQuantity)) || Number(productQuantity) < 1) {
            return res.status(400).json({ message: 'Quantidade deve ser um número inteiro positivo.' });
        }

        // Tenta encontrar a empresa pelo nome ou e-mail
        // OU, se a empresa for um campo separado na criação, você passaria o companyId
        // Por enquanto, vamos criar o produto com os dados da empresa.
        // Mais tarde, você pode associar Company.id ao Product.companyId
        const newProduct = await Product.create({
            companyName,
            companyEmail,
            productName,
            productDescription,
            productQuantity: Number(productQuantity),
            // status: 'disponivel' (já é o default no modelo)
        });

        res.status(201).json({ message: 'Produto cadastrado com sucesso!', product: newProduct });
    } catch (error) {
        console.error('Erro ao cadastrar produto:', error);
        // Erros de validação do Sequelize
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(err => err.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Erro interno do servidor ao cadastrar produto.' });
    }
});

// Rota para Listar Todos os Produtos (GET /products)
app.get('/products', async (req, res) => {
    try {
        // FindAll para Sequelize
        const products = await Product.findAll({
            order: [['createdAt', 'DESC']] // Ordena do mais novo para o mais antigo
        });
        res.status(200).json(products);
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar produtos.' });
    }
});

// ------------------------------------
// Rotas para Empresas, ONGs e Doações (Exemplos Simples)
// ------------------------------------

// Rota para Cadastrar Nova Empresa (POST /companies)
app.post('/companies', async (req, res) => {
    try {
        const newCompany = await Company.create(req.body);
        res.status(201).json({ message: 'Empresa cadastrada com sucesso!', company: newCompany });
    } catch (error) {
        console.error('Erro ao cadastrar empresa:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'Empresa com este nome ou e-mail já existe.' });
        }
        if (error.name === 'SequelizeValidationError') {
             const messages = error.errors.map(err => err.message);
             return res.status(400).json({ message: messages.join(', ') });
         }
        res.status(500).json({ message: 'Erro interno do servidor ao cadastrar empresa.' });
    }
});

// Rota para Listar Empresas (GET /companies)
app.get('/companies', async (req, res) => {
    try {
        const companies = await Company.findAll();
        res.status(200).json(companies);
    } catch (error) {
        console.error('Erro ao buscar empresas:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar empresas.' });
    }
});

// ... (Adicione rotas semelhantes para ONGs e Donations, usando ONG.create, ONG.findAll, Donation.create, etc.)

// Inicia o servidor Express
app.listen(port, () => {
    console.log(`Servidor backend rodando em http://localhost:${port}`);
});