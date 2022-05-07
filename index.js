require('dotenv').config();
require('ejs');
const mysql = require('mysql2/promise');
const express = require('express');
const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', './views');

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
    console.log(`Server is running: http://localhost:${process.env.PORT || 8080}`);
  })
}).catch((error) => {
  throw new Error(error)
});

app.get('/', async (req, res) => {
  try{
    const sql = 'SELECT * FROM contatos';
    const response = await connection.execute(sql);

    res.render('index.ejs', { contatos: response[0] });
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
});

//CREATE
app.post('/contato', async (req, res) => {
  const { nome, sobrenome, telefone, email, senha } = req.body;

  try {
    await connection.execute(
      'INSERT INTO contatos (nome, sobrenome, telefone, email, senha) VALUES (?, ?, ?, ?, ?)',
      [nome, sobrenome, telefone, email, senha]
    );
    res.status(201).send();
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
  const { nome, sobrenome, telefone, email, senha } = req.body;

  if (!id) return res.status(400).send({ message: 'Id is required' });

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
