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

    const productSchema = new Schema({
        companyName: { type: String, required: true },
        companyEmail: { type: String, required: true , match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/ },
        productName: { type: String, required: true },
        productDescription: { type: String },
        productQuantity: { type: Number, required: true, min: 1 },
        createdAt: { type: Date, default: Date.now} // adiciona data/hora de criação
    });

    const product = model('Product', productSchema);

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
