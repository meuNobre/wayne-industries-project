# 🦇 WAYNE INDUSTRIES

> Sistema de Gerenciamento Corporativo de Alta Segurança

[![Live Demo](https://img.shields.io/badge/demo-live-green?style=for-the-badge&logo=vercel)](https://wayne-industries-project.vercel.app/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

**[🚀 Ver Demo ao Vivo](https://wayne-industries-project.vercel.app/)** • **[💻 Quick Start](#-quick-start)** • **[📖 Documentação](#-estrutura-do-projeto)**

---

## 🎯 O Projeto

Sistema Full Stack completo desenvolvido como projeto final do curso de Desenvolvimento Full Stack na **Infinity School**. Simula um ambiente corporativo real com autenticação, controle de acesso por roles e dashboard interativo.

**Por que Wayne Industries?** Porque todo dev precisa de um projeto com temática de super-herói no portfólio. E porque Batman é sinônimo de tecnologia de ponta.

### ✨ Features Principais

- 🔐 **Autenticação Multi-nível** → Employee, Manager e Admin com permissões distintas
- 📊 **Dashboard em Tempo Real** → Estatísticas, gráficos e atividades live
- 🎨 **UI/UX Moderna** → Glassmorphism, dark theme, animações suaves
- 🔄 **CRUD Completo** → Gerenciamento total de recursos e usuários
- 📱 **100% Responsivo** → Mobile-first design
- ⚡ **API REST** → Arquitetura cliente-servidor desacoplada

---

## 🛠️ Stack Tecnológica

### Backend
```
Python 3.8+
Flask (API REST)
MySQL (Banco de dados)
Flask-CORS (Comunicação frontend/backend)
```

### Frontend
```
HTML5
CSS3 
JavaScript 
Chart.js (Visualização de dados)
```

### Por que essa stack?

**Flask** → Leve, direto ao ponto, perfeito para APIs REST  
**JS** → Entender o que está acontecendo antes de usar React  
**MySQL** → Relacional, robusto, amplamente usado no mercado

---

## 🚀 Quick Start

### Pré-requisitos

```bash
Python 3.8+
MySQL Server
```

### 1. Clone o repositório

```bash
git clone https://github.com/meuNobre/wayne-industries-project.git
cd wayne-industries-project
```

### 2. Configure o Backend

```bash
cd backend
# Criar ambiente virtual
python -m venv venv

# Ativar ambiente
# Windows:
venv\Scripts\activate

# Mac/Linux:
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt
```

### 3. Configure o Banco de Dados

```bash
# Entre no MySQL
mysql -u root -p

# Execute o script de criação
mysql -u root -p < backend/database.sql
```

Ou manualmente:

```bash
mysql -u root -p
source backend/database.sql
```

Edite as credenciais em `backend/db.py`:

```python
HOST = "localhost"
USER = "seu_usuario"
PASSWORD = "sua_senha"
DATABASE = "wayne_industries"
```


### 4. Inicie o servidor

```bash
python app.py
```

Backend rodando em `http://localhost:5000` ✅

### 5. Configure o Frontend

Edite `frontend/config.js`:

```javascript
const CONFIG = {
  API_URL: "http://localhost:5000" //Link da API ligada pelo Backend
}
```

### 6. Acesse o sistema

Abra `index.html` no navegador ou use Live Server

**Credenciais padrão (criar no banco):**
```
username: admin
password: admin123
role: admin
```

---

## 📁 Estrutura do Projeto

```
wayne-industries/
│
├── 📂 backend/
│   ├── app.py              # API REST principal
│   ├── db.py               # Conexão MySQL
│   └── requirements.txt    # Dependências Python
│
├── 📂 frontend/
│   ├── index.html          # Tela de login
│   ├── dashboard.html      # Dashboard principal
│   ├── style.css           # Estilos login
│   ├── dashboard.css       # Estilos dashboard
│   ├── users-extra.css     # Estilos gerenciamento usuários
│   ├── login.js            # Lógica autenticação
│   ├── dashboard.js        # Lógica dashboard
│   └── config.js           # Config API
│
└── README.md
```



## 🎭 Sistema de Roles

### 👤 Employee (Funcionário)
```
✅ Visualizar dashboard
✅ Ver lista de recursos
❌ Criar recursos
❌ Editar recursos
❌ Deletar recursos
```

### 👔 Manager (Gerente)
```
✅ Tudo que Employee faz
✅ Criar novos recursos
✅ Editar recursos existentes
❌ Deletar recursos
❌ Gerenciar usuários
```

### 👑 Admin (Administrador)
```
✅ Controle total do sistema
✅ Criar/Editar/Deletar recursos
✅ Criar novos usuários
✅ Editar usuários existentes
✅ Deletar usuários
```

---

## 🗄️ Modelagem do Banco

> Todas as tabelas são criadas automaticamente pelo arquivo `backend/database.sql`

### Tabela `users`

```sql
CREATE TABLE users (
    id INT NOT NULL AUTO_INCREMENT,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('employee', 'manager', 'admin') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Campos:**
- `id` → Identificador único
- `username` → Nome de usuário (único, até 100 caracteres)
- `password` → Senha
- `role` → Nível de acesso (employee, manager, admin)
- `created_at` → Data de criação automática

---

### Tabela `resources`

```sql
CREATE TABLE resources (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Campos:**
- `id` → Identificador único
- `name` → Nome do recurso (até 255 caracteres)
- `description` → Descrição detalhada do recurso
- `status` → Estado atual (active, maintenance, inactive)
- `created_at` → Data de criação automática

---

### Tabela `activity_logs`

```sql
CREATE TABLE activity_logs (
    id INT NOT NULL AUTO_INCREMENT,
    resource_id INT DEFAULT NULL,
    resource_name VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_status VARCHAR(50) DEFAULT NULL,
    new_status VARCHAR(50) DEFAULT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    old_value TEXT,
    new_value TEXT,
    PRIMARY KEY (id),
    KEY idx_user_id (user_id),
    KEY idx_resource_id (resource_id),
    KEY idx_created_at (created_at),
    CONSTRAINT fk_activity_resource
        FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE SET NULL,
    CONSTRAINT fk_activity_user
        FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Campos:**
- `id` → Identificador único
- `resource_id` → Referência ao recurso (NULL se deletado)
- `resource_name` → Nome do recurso no momento da ação
- `action` → Tipo de ação (created, deleted, status_change, etc)
- `old_status` → Status anterior (se aplicável)
- `new_status` → Novo status (se aplicável)
- `user_id` → ID do usuário que executou a ação
- `created_at` → Timestamp da ação
- `old_value` → Valor anterior (mudanças de nome/descrição)
- `new_value` → Novo valor

**Índices:**
- `idx_user_id` → Otimiza buscas por usuário
- `idx_resource_id` → Otimiza buscas por recurso
- `idx_created_at` → Otimiza filtros por data

**Relacionamentos:**
- `fk_activity_resource` → ON DELETE SET NULL (mantém log mesmo se recurso for deletado)
- `fk_activity_user` → Garante integridade referencial com users

---

## 🔌 Endpoints da API

### Autenticação

#### `POST /login`
Autentica usuário no sistema

**Request:**
```json
{
  "username": "bruce.wayne",
  "password": "senha123"
}
```

**Response (200):**
```json
{
  "id": 1,
  "username": "bruce.wayne",
  "role": "admin"
}
```

---

### Recursos

#### `GET /resources`
Lista todos os recursos

**Headers:** `X-User-Id: 1`

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Batmóvel",
    "description": "Veículo tático blindado",
    "status": "active",
    "create_at": "2024-01-15T10:30:00"
  }
]
```

#### `POST /resources`
Cria novo recurso (Manager/Admin)

**Headers:** `X-User-Id: 1`

**Request:**
```json
{
  "name": "Bat-Sinal",
  "description": "Sistema de alerta"
}
```

#### `PUT /resource/:id`
Atualiza recurso (Manager/Admin)

**Headers:** `X-User-Id: 1`

**Request:**
```json
{
  "name": "Batmóvel Mark II",
  "description": "Versão atualizada",
  "status": "active"
}
```

#### `DELETE /resource/:id`
Deleta recurso (Admin apenas)

**Headers:** `X-User-Id: 1`

---

### Dashboard

#### `GET /dashboard/stats`
Retorna estatísticas do sistema

**Headers:** `X-User-Id: 1`

**Query Params:** `?period=7days` (opcional: all, 1hour, 3days, 7days, 30days)

**Response (200):**
```json
{
  "total_resources": 42,
  "total_users": 8,
  "active_resources": 35,
  "resources_by_status": [
    { "status": "active", "count": 35 },
    { "status": "maintenance", "count": 5 },
    { "status": "inactive", "count": 2 }
  ],
  "recent_activities": [...]
}
```

---

### Usuários (Admin apenas)

#### `GET /users`
Lista todos os usuários

**Headers:** `X-User-Id: 1`

#### `POST /users`
Cria novo usuário

**Headers:** `X-User-Id: 1`

**Request:**
```json
{
  "username": "alfred.pennyworth",
  "password": "senha123",
  "role": "manager"
}
```

#### `PUT /users/:id`
Atualiza usuário

#### `DELETE /users/:id`
Deleta usuário (não pode deletar a si mesmo)

---

## 🎨 Features de Design

### Glassmorphism
```css
background: rgba(26, 28, 34, 0.9);
backdrop-filter: blur(20px);
border: 1px solid rgba(230, 230, 230, 0.08);
```

### Sistema de Cores
```css
--primary: #1faa6f     /* Verde Wayne */
--danger: #d61f3a      /* Vermelho para alerta */
--warning: #b2771d     /* Laranja para  manutenção */
--background: #0e0f13  /* Preto profundo */
--surface: #1a1c22     /* Cinza -> cards */
--text: #e6e6e6        /* Branco suave */
```

### Animações
- Fade in dos cards ao carregar
- Hover effects sutis
- Loading spinners
- Smooth transitions
- Slide in dos modais

---

## 🔐 Fluxo de Autenticação

```
1. Usuário digita credenciais
        ↓
2. Frontend envia POST /login
        ↓
3. Backend valida no MySQL
        ↓
4. Se válido, retorna user data
        ↓
5. Frontend guarda no localStorage
        ↓
6. Redirect para dashboard
        ↓
7. Todas as requisições incluem X-User-Id
        ↓
8. Backend valida permissões
```

---

## 🚀 Deploy

### Frontend (Vercel)

1. Configure build settings:
```bash
Build Command: (none)
Output Directory: frontend
```

2. Configure variável `API_URL` apontando para backend em produção

**🌐 Demo ao vivo:** https://wayne-industries-project.vercel.app/

---

## 📚 O Que Aprendi

### Backend
✅ Estruturar API REST escalável  
✅ Implementar sistema de permissões  
✅ Modelar banco de dados relacional  
✅ Validações e tratamento de erros  
✅ CORS e comunicação entre origens

### Frontend
✅ JavaScript (ES6+, Fetch, Promises)  
✅ CSS Grid e Flexbox avançado  
✅ Manipulação do DOM  
✅ LocalStorage e gerenciamento de estado  
✅ Design responsivo mobile-first

### Full Stack
✅ Integração frontend/backend  
✅ Arquitetura cliente-servidor  
✅ Fluxo de autenticação  
✅ CRUD completo  
✅ Deploy de aplicações

---

## 👨‍💻 Autor

**Desenvolvido por:** Nobre  
**Curso:** Desenvolvimento Full Stack  
**Instituição:** Infinity School - Visual Art Creative Center  
**Ano:** 2025


[![Portfolio](https://img.shields.io/badge/🌐_Portfolio-000?style=for-the-badge&logo=vercel&logoColor=61DAFB)](https://portfolio-nobre.discloud.app/)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/joao-miguel-nobre/)

---

## 📄 Licença

Este projeto foi desenvolvido para fins educacionais como parte da avaliação final do curso.

---

**"Não é quem eu sou por dentro, mas o que eu faço que me define."** - Batman Begins

⭐ Se você gostou do projeto, deixe uma estrela!