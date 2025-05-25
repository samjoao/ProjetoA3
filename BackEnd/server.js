import 'dotenv/config'; // carrega as variavede ambiente do .env

import express from 'express';
import { connect, Schema, model } from 'mongoose';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;
const databaseUrl = process.env.DATABASE_URL;

const allowedOrigins = [
    'http://localhost:8080',
    'http://localhost:5500',
    'http://doacoesonline.netlify.app'
];

app.use(cors({
    origin: function (origin, callback) {

        if(!origin || allowedOrigins.includes(origin)){
            callback(null, true);
        } else {
            callback(new Error('Não permitido pelo CORS'))
        }
    }
}));

// Middleware para parsear JSON no corpo das requesições

app.use(express.json());

// Conexção com o Banco de Dados MongoDB

connect(databaseUrl)
    .then(() => console.log('Conectado ao MongoDB Atlas!'))
    .catch(err => {
        console.error('Erro ao conectar ao MongoDB:', err.massage);
        process.exit(1); // Sai do processo se nao conseguir conectar ao DB 
    });

    // Definição de Schema e Modelo do Produto

    const productSchema = new mongoose.Schema({
    companyName: { type: String, required: true, trim: true },
    companyEmail: { type: String, required: true, unique: false, trim: true, lowercase: true, match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/ },
    productName: { type: String, required: true, trim: true },
    productDescription: { type: String, default: '', trim: true },
    productQuantity: { type: Number, required: true, min: 1 },
    createdAt: { type: Date, default: Date.now },
    // --- Novos campos potenciais adicionados ao Product Schema ---
    status: {
        type: String,
        enum: ['disponivel', 'reservado', 'doado'],
        default: 'disponivel'
    },
    // Adicione esta linha para referenciar a empresa (se você criar a coleção 'companies')
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company', // 'Company' é o nome do modelo para a coleção de empresas
        required: false // Ou true, se você quiser que todo produto seja associado a uma empresa cadastrada
    }
});

const Product = mongoose.model('Product', productSchema);


// --- NOVO: Definição de Schema e Modelo para Empresas (Company) ---
const companySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/ },
    phone: { type: String, trim: true },
    address: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        zipCode: { type: String, trim: true }
    },
    contactPerson: { type: String, trim: true },
    cnpj: { type: String, unique: true, sparse: true, trim: true },
    registeredAt: { type: Date, default: Date.now }
});

const Company = mongoose.model('Company', companySchema);


// --- NOVO: Definição de Schema e Modelo para ONGs ---
const ongSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/ },
    phone: { type: String, trim: true },
    address: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        zipCode: { type: String, trim: true }
    },
    contactPerson: { type: String, trim: true },
    areaOfFocus: [{ type: String, trim: true }],
    registeredAt: { type: Date, default: Date.now }
});

const ONG = mongoose.model('ONG', ongSchema); // Use 'ONG' como nome do modelo


// --- NOVO: Definição de Schema e Modelo para Doações (Donation) ---
const donationSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Referencia o modelo 'Product'
        required: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company', // Referencia o modelo 'Company'
        required: true
    },
    ongId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ONG', // Referencia o modelo 'ONG'
        required: true
    },
    quantityDonated: {
        type: Number,
        required: true,
        min: 1
    },
    donationDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pendente', 'confirmada', 'cancelada'],
        default: 'pendente'
    }
});

const Donation = mongoose.model('Donation', donationSchema); 

    // Rotas da API

    // Rota de Teste (remover)
    app.get(('/', (req, res) => {
        res.send('Servidor Node.js para Doação de produtos está online!');
    }));

    // Rota de cadastrar um novo produto (POST /products)

    app.post('/products', async (req, res) => {
        try {
            const { companyName, companyEmail, productName, productDescription, productQuantity} = req.body;

            // Validaçao básica do lado do servidor (além da validação do mongoose Schema)
            if (!companyName || !companyEmail || !productName || !productQuantity) {
                return res.status(400).json({ message: 'por favor, preencha todos os campos obrigatórios.'});
        }
            if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(companyEmail)) {
                return res.status(400).json({ message: 'Formato de e-mail inválido.'});
        }
             if (isNaN(Number(productQuantity)) || Number(productQuantity) < 1 ){
                return res.status(400).json({ massage: 'Quantidade deve ser um número inteiro positivo.'});
        }

        const newProduct = new product({
            companyName,
            companyEmail,
            productName,
            productDescription,
            productQuantity: Number(productQuantity), // Garante que seja um número
        });

        await newProduct.save();
        res.status(201).json({ message: 'Produto cadastrado com sucesso!', product: newProduct });
    }   catch (error) {
        // Erros de validação do Mongoose ou outros erros
        if (error.name === 'Erro de Validação') {
            const messages = Object.values(error.errors).map(val.massage);
            return res.status(400).json({ message: messages.join(', ')});
        }
        console.error('Erro ao cadastrar produto:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao cadastrar produto.' });
  }
});

// Rota para Listar Todos os Produtos (GET /products)
app.get('/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }); // Ordena do mais novo para o mais antigo
    res.status(200).json(products);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao buscar produtos.' });

    }
    });

    // Rota para Listar Todos os Produtos (GET /products)
app.get('/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }); // Ordena do mais novo para o mais antigo
    res.status(200).json(products);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao buscar produtos.' });
  }
});

// ----------------------------------------------------
// Inicia o Servidor
// ----------------------------------------------------
app.listen(port, () => {
  console.log(`Servidor backend rodando em http://localhost:${port}`);
});

app.post('/companies', async (req, res) => {
    try {
        const { name, email, phone, address, contactPerson, cnpj } = req.body;

        // Validações básicas (você pode adicionar mais conforme necessário)
        if (!name || !email) {
            return res.status(400).json({ message: 'Nome e e-mail da empresa são obrigatórios.' });
        }

        const newCompany = new Company({
            name, email, phone, address, contactPerson, cnpj
        });

        await newCompany.save();
        res.status(201).json({ message: 'Empresa cadastrada com sucesso!', company: newCompany });
    } catch (error) {
        console.error('Erro ao cadastrar empresa:', error);
        if (error.code === 11000) { // Erro de duplicidade (unique: true)
            return res.status(409).json({ message: 'Empresa com este nome ou e-mail já existe.' });
        }
        res.status(500).json({ message: 'Erro interno do servidor ao cadastrar empresa.' });
    }
});

app.get('/companies', async (req, res) => {
    try {
        const companies = await Company.find();
        res.status(200).json(companies);
    } catch (error) {
        console.error('Erro ao buscar empresas:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar empresas.' });
    }
});

app.post('/donations', async (req, res) => {
    try {
        const { productId, companyId, ongId, quantityDonated } = req.body;

        if (!productId || !companyId || !ongId || !quantityDonated) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios para a doação.' });
        }

        // Opcional: Verificar se o produto existe e tem quantidade suficiente
        const product = await Product.findById(productId);
        if (!product || product.productQuantity < quantityDonated) {
            return res.status(400).json({ message: 'Produto não encontrado ou quantidade insuficiente.' });
        }

        // Criar o registro de doação
        const newDonation = new Donation({
            productId, companyId, ongId, quantityDonated
        });

        await newDonation.save();

        // Opcional: Reduzir a quantidade do produto original
        product.productQuantity -= quantityDonated;
        // Se a quantidade chegar a 0, pode-se mudar o status para 'doado'
        if (product.productQuantity === 0) {
            product.status = 'doado';
        }
        await product.save(); // Salva a atualização no produto

        res.status(201).json({ message: 'Doação registrada com sucesso!', donation: newDonation });
    } catch (error) {
        console.error('Erro ao registrar doação:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao registrar doação.' });
    }
});