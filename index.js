require('dotenv').config();
require('ejs');
const mysql = require('mysql2/promise');
const express = require('express');
const app = express();
const session = require('express-session');

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', './views');

app.use(session({
	secret: process.env.SECRET, cookie: { maxAge: 60000 }, resave: false, saveUninitialized: false
}));

app.use(express.json());

let connection;

mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
}).then((c) => {
  connection = c;
  app.listen(process.env.PORT || 8080, () => {
    console.info(`Server is running: http://localhost:${process.env.PORT || 8080}`);
  })
}).catch((error) => {
  throw new Error(error)
});

app.get('/', async (req, res) => {
  try {
    const { user } = req.session;
    const sql = 'SELECT * FROM contatos';
    const response = await connection.execute(sql);

    res.render('index.ejs', { user, contatos: response[0] });
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
});

//CREATE
app.post('/contato', async (req, res) => {
  const { nome, sobrenome, telefone, email, senha } = req.body;

  try {
    const response = await connection.execute(
      'INSERT INTO contatos (nome, sobrenome, telefone, email, senha) VALUES (?, ?, ?, ?, ?)',
      [nome, sobrenome, telefone, email, senha]
    );
    const id = response[0].insertId;
    res.status(201).send({
      id
    });
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
});

//READ
app.get('/contato/:id?', async (req, res) => {
  const { id } = req.params;

  try {
    const sql = id ? `SELECT * FROM contatos WHERE id = ${id}` : 'SELECT * FROM contatos';
    const response = await connection.execute(sql);
    res.send(response[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
});

//UPDATE
app.put('/contato/:id', async (req, res) => {
  const { id } = req.params;
  let { nome, sobrenome, telefone, email, senha } = req.body;

  if (!id) return res.status(400).send({ message: 'Id is required' });

  const response = await connection.execute(
    `SELECT * FROM contatos WHERE id = ${id}`
  );

  nome = nome || response[0][0].nome;
  sobrenome = sobrenome || response[0][0].sobrenome;
  telefone = telefone || response[0][0].telefone;
  email = email || response[0][0].email;
  senha = senha || response[0][0].senha;

  try {
    await connection.execute(
      'UPDATE contatos SET nome = ?, sobrenome = ?, telefone = ?, email = ?, senha = ? WHERE id = ?',
      [nome, sobrenome, telefone, email, senha, id]
    );
    res.send();
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
});

//DELETE
app.delete('/contato/:id', async (req, res) => {
  const { id } = req.params;

  if (!id) return res.status(400).send({ message: 'Id is required' });

  try {
    await connection.execute(
      'DELETE FROM contatos WHERE id = ?',
      [id]
    );
    res.send();
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
});

app.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    const sql = `SELECT * FROM contatos WHERE email = '${email}' AND senha = '${senha}'`;
    const response = await connection.execute(sql);

    if (response[0].length > 0) {
      req.session.user = response[0][0];
      res.redirect('/');
    }
    else {
      res.status(401).send({ message: 'Usuário ou senha incorretos' });
    };
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});
