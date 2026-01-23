const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Controller de Autenticação
 */
class AuthController {

  /**
   * Login do usuário
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validações básicas
      if (!email || !password) {
        return res.status(400).json({
          error: 'Dados inválidos',
          message: 'Email e senha são obrigatórios'
        });
      }

      // Buscar usuário por email
      const user = await User.findOne({
        where: {
          email: email.toLowerCase().trim(),
          isActive: true
        }
      });

      if (!user) {
        return res.status(401).json({
          error: 'Credenciais inválidas',
          message: 'Email ou senha incorretos'
        });
      }

      // Verificar senha
      const isPasswordValid = await user.checkPassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: 'Credenciais inválidas',
          message: 'Email ou senha incorretos'
        });
      }

      // Gerar token JWT
      const token = user.generateToken();

      // Retornar dados do usuário e token
      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token: token
      });

    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao realizar login'
      });
    }
  }

  /**
   * Logout (invalidar token) - opcional, pois tokens JWT são stateless
   * Na prática, o logout é feito removendo o token do lado do cliente
   */
  static async logout(req, res) {
    try {
      // Como JWT é stateless, o logout é feito apenas no cliente
      // Aqui podemos implementar uma blacklist de tokens se necessário
      res.json({
        success: true,
        message: 'Logout realizado com sucesso'
      });
    } catch (error) {
      console.error('Erro no logout:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao realizar logout'
      });
    }
  }

  /**
   * Verificar se o token é válido e retornar dados do usuário
   */
  static async verifyToken(req, res) {
    try {
      // O middleware verifyToken já validou o token e colocou req.user
      const user = await User.findByPk(req.user.id, {
        attributes: ['id', 'name', 'email', 'role', 'isActive'],
        where: { isActive: true }
      });

      if (!user) {
        return res.status(401).json({
          error: 'Usuário não encontrado',
          message: 'Usuário associado ao token não existe mais'
        });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });

    } catch (error) {
      console.error('Erro na verificação do token:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao verificar token'
      });
    }
  }

  /**
   * Refresh token - gerar novo token baseado no atual
   */
  static async refreshToken(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        where: { isActive: true }
      });

      if (!user) {
        return res.status(401).json({
          error: 'Usuário não encontrado',
          message: 'Usuário não existe mais'
        });
      }

      const newToken = user.generateToken();

      res.json({
        success: true,
        token: newToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });

    } catch (error) {
      console.error('Erro ao renovar token:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao renovar token'
      });
    }
  }

  /**
   * Obter perfil do usuário atual
   */
  static async getProfile(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt'],
        where: { isActive: true }
      });

      if (!user) {
        return res.status(404).json({
          error: 'Usuário não encontrado',
          message: 'Perfil não encontrado'
        });
      }

      res.json({
        success: true,
        user: user.toJSON()
      });

    } catch (error) {
      console.error('Erro ao obter perfil:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao obter perfil'
      });
    }
  }
}

module.exports = AuthController;
