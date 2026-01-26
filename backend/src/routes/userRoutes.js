const express = require('express');
const UserController = require('../controllers/userController');
const { verifyToken, requireAdminMaster } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas de usuários requerem autenticação e role admin_master
router.use(verifyToken);
router.use(requireAdminMaster);

// Rotas de gerenciamento de usuários
router.get('/', UserController.getAllUsers);
router.get('/:id', UserController.getUserById);
router.post('/', UserController.createUser);
router.put('/:id', UserController.updateUser);
router.delete('/:id', UserController.deleteUser); // Exclusão permanente
router.patch('/:id/deactivate', UserController.deactivateUser); // Desativar (soft delete)
router.patch('/:id/reactivate', UserController.reactivateUser);

module.exports = router;
