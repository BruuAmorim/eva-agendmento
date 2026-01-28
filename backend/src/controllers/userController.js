const { User } = require('../models');

/**
 * Controller de Gerenciamento de Usuários
 */
class UserController {

  /**
   * Listar todos os usuários (apenas admin_master)
   */
  static async getAllUsers(req, res) {
    try {
      const users = await User.findAll({
        attributes: ['id', 'name', 'email', 'role', 'isActive', 'createdAt', 'updatedAt'],
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        users: users
      });

    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao listar usuários'
      });
    }
  }

  /**
   * Obter usuário por ID
   */
  static async getUserById(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id, {
        attributes: ['id', 'name', 'email', 'role', 'isActive', 'createdAt', 'updatedAt']
      });

      if (!user) {
        return res.status(404).json({
          error: 'Usuário não encontrado',
          message: 'Usuário não existe'
        });
      }

      res.json({
        success: true,
        user: user
      });

    } catch (error) {
      console.error('Erro ao obter usuário:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao obter usuário'
      });
    }
  }

  /**
   * Criar novo usuário
   */
  static async createUser(req, res) {
    try {
      const { name, email, password, role } = req.body;

      console.log('🔍 DEBUG createUser - Input:', { name, email, role }); // DEBUG

      // Validações
      if (!name || !email || !password) {
        return res.status(400).json({
          error: 'Dados inválidos',
          message: 'Nome, email e senha são obrigatórios'
        });
      }

      if (role && !['admin_master', 'moderator', 'user'].includes(role)) {
        console.log('❌ DEBUG - Role inválida:', role); // DEBUG
        return res.status(400).json({
          error: 'Role inválido',
          message: 'Role deve ser admin_master, moderator ou user'
        });
      }

      // Verificar se email já existe
      const existingUser = await User.findOne({ where: { email: email.toLowerCase().trim() } });
      if (existingUser) {
        return res.status(409).json({
          error: 'Email já cadastrado',
          message: 'Já existe um usuário com este email'
        });
      }

      // Garantir que a role seja válida e definida
      const validRoles = ['admin_master', 'moderator', 'user'];
      const userRole = role && validRoles.includes(role) ? role : 'user';

      console.log('🔍 DEBUG - Role final:', userRole); // DEBUG

      // Criar usuário
      const newUser = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: password,
        role: userRole
      });

      console.log('🔍 DEBUG - Usuário criado:', { id: newUser.id, role: newUser.role }); // DEBUG

      // Verificar se o usuário foi realmente criado com a role correta
      const createdUser = await User.findByPk(newUser.id);
      console.log('🔍 DEBUG - Usuário do banco:', { id: createdUser.id, role: createdUser.role }); // DEBUG

      // Retornar usuário criado (sem senha)
      const userResponse = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt
      };

      res.status(201).json({
        success: true,
        message: 'Usuário criado com sucesso',
        user: userResponse
      });

    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao criar usuário'
      });
    }
  }

  /**
   * Atualizar usuário
   */
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { name, email, password, role, isActive } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          error: 'Usuário não encontrado',
          message: 'Usuário não existe'
        });
      }

      // Validações
      if (role && !['admin_master', 'moderator', 'user'].includes(role)) {
        return res.status(400).json({
          error: 'Role inválido',
          message: 'Role deve ser admin_master, moderator ou user'
        });
      }

      // Verificar se email já existe (se foi alterado)
      if (email && email.toLowerCase().trim() !== user.email) {
        const existingUser = await User.findOne({
          where: { email: email.toLowerCase().trim() }
        });
        if (existingUser) {
          return res.status(409).json({
            error: 'Email já cadastrado',
            message: 'Já existe um usuário com este email'
          });
        }
      }

      // Preparar dados para atualização
      const updateData = {};
      if (name) updateData.name = name.trim();
      if (email) updateData.email = email.toLowerCase().trim();
      if (password) updateData.password = password; // Será hashado pelo hook
      if (role) updateData.role = role;
      if (typeof isActive === 'boolean') updateData.isActive = isActive;

      // Atualizar usuário
      await user.update(updateData);

      // Retornar usuário atualizado
      const userResponse = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      res.json({
        success: true,
        message: 'Usuário atualizado com sucesso',
        user: userResponse
      });

    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao atualizar usuário'
      });
    }
  }

  /**
   * Deletar usuário (exclusão permanente do banco)
   */
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          error: 'Usuário não encontrado',
          message: 'Usuário não existe'
        });
      }

      // Impedir que admin_master seja deletado por si mesmo
      if (user.role === 'admin_master' && req.user.id === parseInt(id)) {
        return res.status(400).json({
          error: 'Operação não permitida',
          message: 'Não é possível excluir sua própria conta de administrador'
        });
      }

      // Exclusão permanente do banco de dados
      await user.destroy();

      res.json({
        success: true,
        message: 'Usuário excluído permanentemente com sucesso'
      });

    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao deletar usuário'
      });
    }
  }

  /**
   * Desativar usuário (soft delete)
   */
  static async deactivateUser(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          error: 'Usuário não encontrado',
          message: 'Usuário não existe'
        });
      }

      // Impedir que admin_master seja desativado por si mesmo
      if (user.role === 'admin_master' && req.user.id === parseInt(id)) {
        return res.status(400).json({
          error: 'Operação não permitida',
          message: 'Não é possível desativar sua própria conta de administrador'
        });
      }

      // Soft delete - desativar usuário
      await user.update({ isActive: false });

      res.json({
        success: true,
        message: 'Usuário desativado com sucesso'
      });

    } catch (error) {
      console.error('Erro ao desativar usuário:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao desativar usuário'
      });
    }
  }

  /**
   * Reativar usuário
   */
  static async reactivateUser(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          error: 'Usuário não encontrado',
          message: 'Usuário não existe'
        });
      }

      await user.update({ isActive: true });

      res.json({
        success: true,
        message: 'Usuário reativado com sucesso'
      });

    } catch (error) {
      console.error('Erro ao reativar usuário:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Erro ao reativar usuário'
      });
    }
  }
}

module.exports = UserController;
