const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const { kv } = require('@vercel/kv');

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// JWT Secret (em produção, usar variável de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || 'capacita_arapiraca_secret_2025';

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const token = req.cookies.authToken || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// Função para ler os cursos do Vercel KV
async function readCourses() {
  try {
    const courses = await kv.get('courses');
    return courses || [];
  } catch (error) {
    console.error('Error reading courses from Vercel KV:', error);
    return [];
  }
}

// Função para escrever os cursos no Vercel KV
async function writeCourses(coursesData) {
  try {
    await kv.set('courses', coursesData);
    return true;
  } catch (error) {
    console.error('Error writing courses to Vercel KV:', error);
    return false;
  }
}

// Função para ler os usuários do Vercel KV
async function readUsers() {
  try {
    const users = await kv.get('users');
    return users || [];
  } catch (error) {
    console.error('Error reading users from Vercel KV:', error);
    return [];
  }
}

// Função para escrever os usuários no Vercel KV
async function writeUsers(usersData) {
  try {
    await kv.set('users', usersData);
    return true;
  } catch (error) {
    console.error('Error writing users to Vercel KV:', error);
    return false;
  }
}

// Função para ler os alunos/atiradores do Vercel KV
async function readStudents() {
  try {
    const students = await kv.get('students');
    return students || [];
  } catch (error) {
    console.error('Error reading students from Vercel KV:', error);
    return [];
  }
}

// Função para escrever os alunos/atiradores no Vercel KV
async function writeStudents(studentsData) {
  try {
    await kv.set('students', studentsData);
    return true;
  } catch (error) {
    console.error('Error writing students to Vercel KV:', error);
    return false;
  }
}

// Função para ler as empresas do Vercel KV
async function readCompanies() {
  try {
    const companies = await kv.get('companies');
    return companies || [];
  } catch (error) {
    console.error('Error reading companies from Vercel KV:', error);
    return [];
  }
}

// Função para escrever as empresas no Vercel KV
async function writeCompanies(companiesData) {
  try {
    await kv.set('companies', companiesData);
    return true;
  } catch (error) {
    console.error('Error writing companies to Vercel KV:', error);
    return false;
  }
}

// Função para gerar um ID único
function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Função auxiliar para criar hash de tokens
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// ===== ROTAS DE AUTENTICAÇÃO =====

// POST /api/auth/register - Registro de usuário
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nome, email, senha, tipoUsuario, sexo, situacao_militar, tiro_guerra, ...otherData } = req.body;

    // Validação básica
    if (!nome || !email || !senha || !tipoUsuario) {
      return res.status(400).json({ error: 'Nome, email, senha e tipo de usuário são obrigatórios' });
    }

    if (senha.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
    }

    // Verificar se o email já existe
    const allUsers = await readUsers();
    const existingUser = allUsers.find(user => user.email.toLowerCase() === email.toLowerCase());
    
    if (existingUser) {
      return res.status(409).json({ error: 'Este email já está cadastrado' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 12);

    // Criar usuário
    const newUser = {
      id: generateId(),
      nome,
      email: email.toLowerCase(),
      senha: hashedPassword,
      tipoUsuario,
      sexo: sexo || null,
      situacao_militar: situacao_militar || null,
      tiro_guerra: tiro_guerra || null,
      ...otherData,
      dataRegistro: new Date().toISOString(),
      ativo: true
    };

    // Salvar usuário
    allUsers.push(newUser);
    const success = await writeUsers(allUsers);
    
    if (!success) {
      return res.status(500).json({ error: 'Erro ao salvar usuário' });
    }

    // Também salvar na tabela específica (students ou companies)
    if (tipoUsuario === 'atirador') {
      const students = await readStudents();
      const studentData = {
        id: newUser.id,
        nome,
        cidade: otherData.cidade || '',
        email: email.toLowerCase(),
        telefone: otherData.telefone || '',
        idade: otherData.idade || null,
        escolaridade: otherData.escolaridade || '',
        habilidades: otherData.habilidades || '',
        experiencia: otherData.experiencia || '',
        formacao: otherData.formacao || '',
        sexo: sexo || null,
        situacao_militar: situacao_militar || null,
        tiro_guerra: tiro_guerra || null,
        tipo: 'atirador',
        dataRegistro: newUser.dataRegistro
      };
      students.push(studentData);
      await writeStudents(students);
    } else if (tipoUsuario === 'empregador') {
      const companies = await readCompanies();
      const companyData = {
        id: newUser.id,
        nomeEmpresa: otherData.nomeEmpresa || nome,
        cnpj: otherData.cnpj || '',
        cidade: otherData.cidade || '',
        telefone: otherData.telefone || '',
        email: email.toLowerCase(),
        setor: otherData.setor || '',
        informacoes: otherData.informacoes || '',
        tipo: 'empresa',
        dataRegistro: newUser.dataRegistro
      };
      companies.push(companyData);
      await writeCompanies(companies);
    }

    // Gerar token JWT
    const token = jwt.sign(
      { 
        id: newUser.id, 
        email: newUser.email, 
        tipoUsuario: newUser.tipoUsuario,
        nome: newUser.nome
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Definir cookie
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
    });

    // Retornar dados do usuário (sem senha)
    const { senha: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({
      message: 'Usuário registrado com sucesso',
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/auth/login - Login de usuário
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Validação básica
    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário
    const allUsers = await readUsers();
    const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.ativo);

    if (!user) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(senha, user.senha);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        tipoUsuario: user.tipoUsuario,
        nome: user.nome
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Definir cookie
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
    });

    // Retornar dados do usuário (sem senha)
    const { senha: _, ...userWithoutPassword } = user;
    
    res.json({
      message: 'Login realizado com sucesso',
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== FUNÇÃO PARA ENVIO DE E-MAIL =====
async function sendPasswordResetEmail(userEmail, resetCode, resetLink) {
  let transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS, 
    },
  });

  let mailOptions = {
    from: `"Capacita Arapiraca" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: 'Redefinição de Senha - Capacita Arapiraca',
    html: `
      <div style="background-color: #f8f9fa; margin: 0; padding: 40px 0; font-family: 'Roboto', Arial, sans-serif;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
          <tr>
            <td align="center" style="padding: 40px 0 30px 0; border-bottom: 1px solid #e0e0e0;">
              <img src="https://i.imgur.com/ZZMlQG9.png" alt="Logo Capacita Arapiraca" width="100" style="display: block;" />
              <h1 style="color: #2c3e50; font-family: 'PT Serif', serif; margin: 10px 0 0;">Capacita Arapiraca</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #2c3e50; font-family: 'PT Serif', serif; text-align: center;">Recuperação de Conta</h2>
              <p style="color: #6c757d; font-size: 16px; line-height: 1.6; text-align: center;">Olá! Recebemos uma solicitação para redefinir a senha da sua conta.</p>
              <p style="color: #6c757d; font-size: 16px; line-height: 1.6; text-align: center;">Clique no botão abaixo para criar uma nova senha. O link é válido por <strong>10 minutos</strong>.</p>
              <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 30px auto;">
                <tr>
                  <td align="center" style="background-color: #007BFF; border-radius: 8px;">
                    <a href="${resetLink}" target="_blank" style="font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; display: inline-block; padding: 15px 25px; border-radius: 8px;">Redefinir Senha</a>
                  </td>
                </tr>
              </table>
              <p style="color: #6c757d; font-size: 16px; line-height: 1.6; text-align: center;">Se preferir, pode usar o código abaixo na página de redefinição de senha:</p>
              <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 20px auto;">
                <tr>
                  <td align="center" style="background-color: #ecf0f1; border-radius: 8px; padding: 15px 25px;">
                    <span style="font-size: 32px; font-weight: bold; color: #2c3e50; letter-spacing: 5px;">${resetCode}</span>
                  </td>
                </tr>
              </table>
              <p style="color: #6c757d; font-size: 16px; line-height: 1.6; text-align: center;">Se você não fez esta solicitação, pode ignorar este e-mail.</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="background-color: #2c3e50; color: #bdc3c7; padding: 20px 30px; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px; font-size: 12px;">
              &copy; 2025-2026 Capacita Arapiraca. Todos os direitos reservados.<br>
              Esta é uma mensagem automática, por favor, não responda.
            </td>
          </tr>
        </table>
      </div>
    `,
};

  try {
    await transporter.sendMail(mailOptions);
    console.log('E-mail de redefinição enviado para:', userEmail);
    return true;
  } catch (error) {
    console.error('Erro ao enviar e-mail de redefinição:', error);
    return false;
  }
}

// ===== ROTA PARA SOLICITAR REDEFINIÇÃO DE SENHA =====
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'O e-mail é obrigatório.' });
    }

    const allUsers = await readUsers();
    const userIndex = allUsers.findIndex(u => u.email.toLowerCase() === email.toLowerCase());

    if (userIndex === -1) {
      return res.status(404).json({ error: 'E-mail não cadastrado em nosso sistema.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = hashToken(resetToken);
    const resetCode = crypto.randomInt(100000, 999999).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // Expira em 10 minutos

    allUsers[userIndex].resetToken = hashedToken;
    allUsers[userIndex].resetCode = resetCode;
    allUsers[userIndex].resetCodeExpires = expires.toISOString();
    
    await writeUsers(allUsers);

    const baseUrl = process.env.NODE_ENV === 'production' ? 'https://capacitatg.com.br' : 'http://127.0.0.1:5500';
    const resetLink = `${baseUrl}/entrar.html?token=${resetToken}&email=${encodeURIComponent(email)}`;

    const emailSent = await sendPasswordResetEmail(email, resetCode, resetLink);

    if (emailSent) {
      res.json({ message: 'Se um usuário com este e-mail existir, um link de redefinição será enviado.' });
    } else {
      res.status(500).json({ error: 'Não foi possível enviar o e-mail de redefinição.' });
    }

  } catch (error) {
    console.error('Erro na rota forgot-password:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, resetCode, newPassword, token } = req.body;

    if (!email || !newPassword || (!resetCode && !token)) {
      return res.status(400).json({ error: 'Dados insuficientes para redefinir a senha.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
    }

    const allUsers = await readUsers();
    const userIndex = allUsers.findIndex(u => u.email.toLowerCase() === email.toLowerCase());

    if (userIndex === -1) {
      return res.status(400).json({ error: 'Código ou token inválido ou expirado.' });
    }

    const user = allUsers[userIndex];
    const now = new Date();
    const expires = new Date(user.resetCodeExpires);
    
    let isTokenValid = false;
    if (token) {
        const hashedToken = hashToken(token);
        if (user.resetToken === hashedToken && now <= expires) {
            isTokenValid = true;
        }
    }

    let isCodeValid = false;
    if (resetCode) {
        if (user.resetCode === resetCode && now <= expires) {
            isCodeValid = true;
        }
    }

    if (!isTokenValid && !isCodeValid) {
        allUsers[userIndex].resetToken = null;
        allUsers[userIndex].resetCode = null;
        allUsers[userIndex].resetCodeExpires = null;
        await writeUsers(allUsers);
        return res.status(400).json({ error: 'Código ou token inválido ou expirado.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    allUsers[userIndex].senha = hashedPassword;
    allUsers[userIndex].resetToken = null;
    allUsers[userIndex].resetCode = null;
    allUsers[userIndex].resetCodeExpires = null;

    await writeUsers(allUsers);

    const authToken = jwt.sign(
      { id: user.id, email: user.email, tipoUsuario: user.tipoUsuario, nome: user.nome },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('authToken', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const { senha: _, ...userWithoutPassword } = user;
    res.json({
      message: 'Senha redefinida com sucesso!',
      user: userWithoutPassword,
      token: authToken
    });

  } catch (error) {
    console.error('Erro na rota reset-password:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// POST /api/auth/logout - Logout de usuário
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('authToken');
  res.json({ message: 'Logout realizado com sucesso' });
});

// GET /api/auth/me - Obter dados do usuário logado
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const allUsers = await readUsers();
    const user = allUsers.find(u => u.id === req.user.id && u.ativo);

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Retornar dados do usuário (sem senha)
    const { senha: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });

  } catch (error) {
    console.error('Error getting user data:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/auth/verify - Verificar se o token é válido
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ 
    valid: true, 
    user: {
      id: req.user.id,
      email: req.user.email,
      tipoUsuario: req.user.tipoUsuario,
      nome: req.user.nome
    }
  });
});

// GET /api/courses - Pega todos os cursos
app.get('/api/courses', async (req, res) => {
  try {
    const courses = await readCourses();
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// GET /api/courses/:page - Pega cursos por página
app.get('/api/courses/:page', async (req, res) => {
  try {
    const { page } = req.params;
    const allCourses = await readCourses();
    const filteredCourses = allCourses.filter(course => course.page === page);
    res.json(filteredCourses);
  } catch (error) {
    console.error('Error fetching courses by page:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// POST /api/courses - Adiciona um novo curso
app.post('/api/courses', async (req, res) => {
  try {
    const { title, category, description, imageUrl, courseUrl, page, downloadUrl } = req.body;

    if (!title || !category || !description || !imageUrl || !courseUrl || !page) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const allCourses = await readCourses();
    const newCourse = {
      id: generateId(),
      title,
      category,
      description,
      imageUrl,
      courseUrl,
      page,
      downloadUrl,
      buttonText: req.body.buttonText || 'Inscreva-se',
      createdAt: new Date().toISOString(),
    };

    allCourses.push(newCourse);
    
    const success = await writeCourses(allCourses);
    if (!success) {
      return res.status(500).json({ error: 'Failed to save course' });
    }

    res.status(201).json(newCourse);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// PUT /api/courses/:id - Atualiza um curso
app.put('/api/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, description, imageUrl, courseUrl, page, downloadUrl } = req.body;

    if (!title || !category || !description || !imageUrl || !courseUrl || !page) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const allCourses = await readCourses();
    const courseIndex = allCourses.findIndex(course => course.id === id);

    if (courseIndex === -1) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const updatedCourse = { 
      ...allCourses[courseIndex],
      id, 
      title, 
      category, 
      description, 
      imageUrl, 
      courseUrl, 
      page, 
      downloadUrl,
      buttonText: req.body.buttonText || allCourses[courseIndex].buttonText || 'Inscreva-se',
      updatedAt: new Date().toISOString()
    };
    allCourses[courseIndex] = updatedCourse;
    
    const success = await writeCourses(allCourses);
    if (!success) {
      return res.status(500).json({ error: 'Failed to update course' });
    }

    res.json(updatedCourse);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// DELETE /api/courses/:id - Deleta um curso
app.delete('/api/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const allCourses = await readCourses();
    const courseIndex = allCourses.findIndex(course => course.id === id);

    if (courseIndex === -1) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const deletedCourse = allCourses.splice(courseIndex, 1)[0];
    
    const success = await writeCourses(allCourses);
    if (!success) {
      return res.status(500).json({ error: 'Failed to delete course' });
    }

    res.json({ message: 'Course deleted successfully', course: deletedCourse });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// PUT /api/courses/reorder - Atualiza a ordem dos cursos
app.put('/api/courses/reorder', async (req, res) => {
  try {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ error: 'Ordered IDs must be an array' });
    }

    const allCourses = await readCourses();
    const coursesMap = new Map(allCourses.map(course => [course.id, course]));
    const reorderedCourses = orderedIds.map(id => coursesMap.get(id)).filter(Boolean);

    if (reorderedCourses.length !== allCourses.length) {
      return res.status(400).json({ error: 'Incomplete list of courses provided' });
    }

    const success = await writeCourses(reorderedCourses);
    if (!success) {
      return res.status(500).json({ error: 'Failed to save reordered courses' });
    }

    res.json(reorderedCourses);
  } catch (error) {
    console.error('Error reordering courses:', error);
    res.status(500).json({ error: 'Failed to reorder courses' });
  }
});

// GET /api/students - Pega todos os alunos/atiradores
app.get('/api/students', async (req, res) => {
  try {
    const students = await readStudents();
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// POST /api/students - Adiciona um novo aluno/atirador
app.post('/api/students', async (req, res) => {
  try {
    const { nome, cidade, email, telefone, idade, escolaridade, habilidades, experiencia, formacao } = req.body;

    if (!nome || !cidade || !email || !telefone || !idade || !escolaridade || !habilidades) {
      return res.status(400).json({ error: 'Nome, cidade, email, telefone, idade, escolaridade e habilidades são obrigatórios' });
    }

    const allStudents = await readStudents();
    const existingStudent = allStudents.find(student => student.email === email);
    if (existingStudent) {
      return res.status(409).json({ error: 'Já existe um aluno cadastrado com este email' });
    }

    const newStudent = {
      id: generateId(),
      nome,
      cidade,
      email,
      telefone,
      idade: parseInt(idade),
      escolaridade,
      habilidades,
      experiencia: experiencia || '',
      formacao: formacao || '',
      tipo: 'atirador',
      dataRegistro: new Date().toISOString()
    };

    allStudents.push(newStudent);
    
    const success = await writeStudents(allStudents);
    if (!success) {
      return res.status(500).json({ error: 'Failed to save student' });
    }

    res.status(201).json(newStudent);
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

// GET /api/companies - Pega todas as empresas
app.get('/api/companies', async (req, res) => {
  try {
    const companies = await readCompanies();
    res.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// POST /api/companies - Adiciona uma nova empresa
app.post('/api/companies', async (req, res) => {
  try {
    const { nomeEmpresa, cnpj, cidade, telefone, email, setor, informacoes } = req.body;

    if (!nomeEmpresa || !cnpj || !cidade || !telefone || !email || !setor) {
      return res.status(400).json({ error: 'Nome da empresa, CNPJ, cidade, telefone, email e setor são obrigatórios' });
    }

    const allCompanies = await readCompanies();
    const existingCompany = allCompanies.find(company => company.email === email);
    if (existingCompany) {
      return res.status(409).json({ error: 'Já existe uma empresa cadastrada com este email' });
    }

    const existingCNPJ = allCompanies.find(company => company.cnpj === cnpj);
    if (existingCNPJ) {
      return res.status(409).json({ error: 'Já existe uma empresa cadastrada com este CNPJ' });
    }

    const newCompany = {
      id: generateId(),
      nomeEmpresa,
      cnpj,
      cidade,
      telefone,
      email,
      setor,
      informacoes: informacoes || '',
      tipo: 'empresa',
      dataRegistro: new Date().toISOString()
    };

    allCompanies.push(newCompany);
    
    const success = await writeCompanies(allCompanies);
    if (!success) {
      return res.status(500).json({ error: 'Failed to save company' });
    }

    res.status(201).json(newCompany);
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ error: 'Failed to create company' });
  }
});

// PUT /api/users/:id - Atualiza um usuário (Candidato ou Empresa)
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Garante que o usuário só pode editar o próprio perfil
    if (req.user.id !== id) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }
    
    // Validação dos dados recebidos
    const validationError = validateUserUpdateData(updateData, req.user.tipoUsuario);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const allUsers = await readUsers();
    const userIndex = allUsers.findIndex(u => u.id === id);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Verificar se email já existe (se foi alterado)
    const userToUpdate = allUsers[userIndex];
    if (updateData.email && updateData.email !== userToUpdate.email) {
      const emailExists = allUsers.some(u => u.id !== id && u.email.toLowerCase() === updateData.email.toLowerCase());
      if (emailExists) {
        return res.status(409).json({ error: 'Este email já está sendo usado por outro usuário.' });
      }
    }

    // Atualiza os dados principais do usuário
    Object.assign(userToUpdate, {
      nome: updateData.nome || updateData.nomeEmpresa || userToUpdate.nome,
      email: updateData.email || userToUpdate.email,
      sexo: updateData.sexo || userToUpdate.sexo,
      situacao_militar: updateData.situacao_militar || userToUpdate.situacao_militar,
      tiro_guerra: updateData.tiro_guerra || userToUpdate.tiro_guerra,
      telefone: updateData.telefone || userToUpdate.telefone,
      cidade: updateData.cidade || userToUpdate.cidade,
      ultima_atualizacao: new Date().toISOString()
    });
    
    // Adicionar campos específicos do tipo de usuário
    if (userToUpdate.tipoUsuario === 'empregador') {
      Object.assign(userToUpdate, {
        nomeEmpresa: updateData.nomeEmpresa || userToUpdate.nomeEmpresa,
        cnpj: updateData.cnpj || userToUpdate.cnpj,
        setor: updateData.setor || userToUpdate.setor,
        informacoes: updateData.informacoes || userToUpdate.informacoes
      });
    } else {
      Object.assign(userToUpdate, {
        idade: updateData.idade || userToUpdate.idade,
        escolaridade: updateData.escolaridade || userToUpdate.escolaridade,
        habilidades: updateData.habilidades || userToUpdate.habilidades,
        experiencia: updateData.experiencia || userToUpdate.experiencia,
        formacao: updateData.formacao || userToUpdate.formacao
      });
    }
    
    allUsers[userIndex] = userToUpdate;
    const usersSaved = await writeUsers(allUsers);
    
    if (!usersSaved) {
      return res.status(500).json({ error: 'Erro ao salvar dados do usuário.' });
    }

    // Atualiza a coleção específica (atirador ou empregador)
    if (userToUpdate.tipoUsuario === 'atirador') {
        const students = await readStudents();
        const studentIndex = students.findIndex(s => s.id === id);
        if (studentIndex !== -1) {
          Object.assign(students[studentIndex], {
            nome: userToUpdate.nome,
            email: userToUpdate.email,
            telefone: userToUpdate.telefone,
            cidade: userToUpdate.cidade,
            idade: userToUpdate.idade,
            escolaridade: userToUpdate.escolaridade,
            habilidades: userToUpdate.habilidades,
            experiencia: userToUpdate.experiencia,
            formacao: userToUpdate.formacao,
            sexo: userToUpdate.sexo,
            situacao_militar: userToUpdate.situacao_militar,
            tiro_guerra: userToUpdate.tiro_guerra,
            ultima_atualizacao: userToUpdate.ultima_atualizacao
          });
          await writeStudents(students);
        }
    } else if (userToUpdate.tipoUsuario === 'empregador') {
        const companies = await readCompanies();
        const companyIndex = companies.findIndex(c => c.id === id);
        if (companyIndex !== -1) {
          Object.assign(companies[companyIndex], {
            nomeEmpresa: userToUpdate.nomeEmpresa,
            cnpj: userToUpdate.cnpj,
            email: userToUpdate.email,
            telefone: userToUpdate.telefone,
            cidade: userToUpdate.cidade,
            setor: userToUpdate.setor,
            informacoes: userToUpdate.informacoes,
            ultima_atualizacao: userToUpdate.ultima_atualizacao
          });
          await writeCompanies(companies);
        }
    }
    
    const { senha: _, ...userWithoutPassword } = userToUpdate;
    res.json({ message: 'Perfil atualizado com sucesso!', user: userWithoutPassword });

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor ao atualizar perfil.' });
  }
});

// Função para validar dados de atualização do usuário
function validateUserUpdateData(data, userType) {
  // Validações básicas
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return 'Email inválido.';
  }
  
  if (data.telefone && data.telefone.replace(/\D/g, '').length < 10) {
    return 'Telefone inválido.';
  }
  
  // Validações específicas para empregadores
  if (userType === 'empregador') {
    if (data.cnpj && data.cnpj.replace(/\D/g, '').length !== 14) {
      return 'CNPJ deve ter 14 dígitos.';
    }
    
    if (data.nomeEmpresa && data.nomeEmpresa.trim().length < 2) {
      return 'Nome da empresa deve ter pelo menos 2 caracteres.';
    }
  }
  
  // Validações específicas para candidatos
  if (userType === 'atirador') {
    if (data.nome && data.nome.trim().length < 2) {
      return 'Nome deve ter pelo menos 2 caracteres.';
    }
    
    if (data.idade && (isNaN(data.idade) || data.idade < 16 || data.idade > 100)) {
      return 'Idade deve ser um número entre 16 e 100.';
    }
  }
  
  return null; // Sem erros
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Exporta o app para a Vercel
module.exports = app;