import 'dotenv/config'; // carrega as variaveis de ambiente do .env
import express from 'express';
import cors from 'cors';
// Importar os modelos e a função de sincronização do banco de dados
import { sequelize, Product, Company, ONG, Donation, syncDatabase } from './database/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sequelize, Product, Company, ONG, Donation, syncDatabase } from './database/index.js'; // Importar Company e ONG

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
// Rota para Cadastrar Nova Empresa (POST /companies) - AGORA COM SENHA
app.post('/companies', async (req, res) => {
    try {
        const { name, email, password, phone, street, city, state, zipCode, contactPerson, cnpj } = req.body;

        // Validações básicas
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Nome, E-mail e Senha são obrigatórios.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres.' });
        }

        // Criptografar a senha
        const hashedPassword = await bcrypt.hash(password, 10); // 10 é o salt rounds

        const newCompany = await Company.create({
            name,
            email,
            password: hashedPassword, // Salva a senha criptografada
            phone,
            street,
            city,
            state,
            zipCode,
            contactPerson,
            cnpj
        });
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

// Rota para Cadastrar Nova ONG (POST /ongs) - Similar à de empresa
app.post('/ongs', async (req, res) => {
    try {
        const { name, email, password, phone, street, city, state, zipCode, contactPerson, areaOfFocus } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Nome, E-mail e Senha são obrigatórios.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newONG = await ONG.create({
            name,
            email,
            password: hashedPassword,
            phone,
            street,
            city,
            state,
            zipCode,
            contactPerson,
            areaOfFocus
        });
        res.status(201).json({ message: 'ONG cadastrada com sucesso!', ong: newONG });
    } catch (error) {
        console.error('Erro ao cadastrar ONG:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'ONG com este nome ou e-mail já existe.' });
        }
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(err => err.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Erro interno do servidor ao cadastrar ONG.' });
    }
});

// Rota de Login
app.post('/login', async (req, res) => {
    const { email, password, userType } = req.body; // userType pode ser 'company' ou 'ong'

    if (!email || !password || !userType) {
        return res.status(400).json({ message: 'E-mail, senha e tipo de usuário são obrigatórios.' });
    }

    try {
        let user;
        if (userType === 'company') {
            user = await Company.findOne({ where: { email } });
        } else if (userType === 'ong') {
            user = await ONG.findOne({ where: { email } });
        } else {
            return res.status(400).json({ message: 'Tipo de usuário inválido.' });
        }

        if (!user) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        // Comparar a senha fornecida com a senha hash do banco de dados
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        // Gerar token JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, userType: userType },
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // Token expira em 1 hora
        );

        // Retornar o token e algumas informações do usuário
        res.status(200).json({
            message: 'Login bem-sucedido!',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                userType: userType
            }
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro interno do servidor durante o login.' });
    }
});

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato: Bearer TOKEN

    if (token == null) {
        return res.status(401).json({ message: 'Token de autenticação ausente.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error('Erro na verificação do token:', err);
            return res.status(403).json({ message: 'Token inválido ou expirado.' });
        }
        req.user = user; // Anexa as informações do usuário ao objeto request
        next(); // Prossegue para a próxima função middleware/rota
    });
};