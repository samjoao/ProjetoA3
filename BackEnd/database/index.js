import { Sequelize, DataTypes } from 'sequelize';

// Configuração do Sequelize para SQLite
// Usará um arquivo chamado 'database.sqlite'
// Para deploy no Render.com, este arquivo precisará estar em um volume persistente (Disk)
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.SQLITE_STORAGE_PATH || './database.sqlite', // Caminho onde o arquivo SQLite será salvo
    logging: false, // Desabilita logs de SQL no console
});

// Removido duplicata da definição do modelo Company para evitar erro de redeclaração.

// Modelo ONG (Adicione o campo 'password')
// Removido duplicata da definição do modelo ONG para evitar erro de redeclaração.


// ------------------------------------
// 2. Definição dos Modelos (Substituindo Schemas Mongoose)
// ------------------------------------

// Modelo Produto
const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    companyName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    companyEmail: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isEmail: true,
        },
    },
    productName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    productDescription: {
        type: DataTypes.TEXT,
    },
    productQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
        },
    },
    status: {
        type: DataTypes.ENUM('disponivel', 'reservado', 'doado'),
        defaultValue: 'disponivel',
    },
    // createdAt e updatedAt são adicionados por padrão pelo Sequelize
});

// Modelo Empresa
const Company = sequelize.define('Company', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    phone: {
        type: DataTypes.STRING,
    },
    street: {
        type: DataTypes.STRING,
    },
    city: {
        type: DataTypes.STRING,
    },
    state: {
        type: DataTypes.STRING,
    },
    zipCode: {
        type: DataTypes.STRING,
    },
    contactPerson: {
        type: DataTypes.STRING,
    },
    cnpj: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true, // CNPJ pode ser nulo para empresas que não tem
    },
});

// Modelo ONG
const ONG = sequelize.define('ONG', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    phone: {
        type: DataTypes.STRING,
    },
    street: {
        type: DataTypes.STRING,
    },
    city: {
        type: DataTypes.STRING,
    },
    state: {
        type: DataTypes.STRING,
    },
    zipCode: {
        type: DataTypes.STRING,
    },
    contactPerson: {
        type: DataTypes.STRING,
    },
    areaOfFocus: {
        type: DataTypes.STRING, // Poderia ser JSON ou outra tabela para múltiplos valores
        get() { // Getter para converter de string para array
            return this.getDataValue('areaOfFocus') ? this.getDataValue('areaOfFocus').split(';') : [];
        },
        set(val) { // Setter para converter de array para string
            this.setDataValue('areaOfFocus', Array.isArray(val) ? val.join(';') : '');
        }
    },
});

// Modelo Doação
const Donation = sequelize.define('Donation', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    quantityDonated: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
        },
    },
    donationDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    status: {
        type: DataTypes.ENUM('pendente', 'confirmada', 'cancelada'),
        defaultValue: 'pendente',
    },
});

// ------------------------------------
// 3. Definição das Associações
// ------------------------------------

// Um produto pertence a uma empresa
Product.belongsTo(Company, { foreignKey: 'companyId' });
Company.hasMany(Product, { foreignKey: 'companyId' });

// Uma doação pertence a um produto, uma empresa e uma ONG
Donation.belongsTo(Product, { foreignKey: 'productId' });
Product.hasMany(Donation, { foreignKey: 'productId' });

Donation.belongsTo(Company, { foreignKey: 'companyId' });
Company.hasMany(Donation, { foreignKey: 'companyId' });

Donation.belongsTo(ONG, { foreignKey: 'ongId' });
ONG.hasMany(Donation, { foreignKey: 'ongId' });

// Função para sincronizar o banco de dados (criar tabelas se não existirem)
async function syncDatabase() {
    try {
        // { force: true } recria as tabelas a cada vez (bom para desenvolvimento, perigoso em produção)
        // { alter: true } tenta fazer alterações no esquema sem perder dados (melhor para produção)
        await sequelize.sync({ alter: true });
        console.log('Banco de dados sincronizado com sucesso!');
    } catch (error) {
        console.error('Erro ao sincronizar o banco de dados:', error);
        process.exit(1);
    }
}

export { sequelize, Product, Company, ONG, Donation, syncDatabase };