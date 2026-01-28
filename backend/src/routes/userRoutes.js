const express = require('express');
const UserController = require('../controllers/userController');
const { verifyToken, requireAdminMaster } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas de usuários requerem autenticação e role admin_master
router.use(verifyToken);
router.use(requireAdminMaster);

// Endpoint de debug para testar criação de usuário (sem middleware)
router.post('/debug-create', async (req, res) => {
  console.log('🐛 DEBUG ENDPOINT - Body recebido:', JSON.stringify(req.body, null, 2));
  console.log('🐛 DEBUG ENDPOINT - Headers:', req.headers);

  const { name, email, password, role } = req.body;
  console.log('🐛 DEBUG ENDPOINT - Campos extraídos:', { name, email, role });

  res.json({
    received: { name, email, role },
    headers: {
      authorization: req.headers.authorization ? 'Present' : 'Missing',
      'content-type': req.headers['content-type']
    }
  });
});

// Rotas de gerenciamento de usuários
router.get('/', UserController.getAllUsers);
router.get('/:id', UserController.getUserById);
router.post('/', UserController.createUser);
router.put('/:id', UserController.updateUser);
router.delete('/:id', UserController.deleteUser); // Exclusão permanente
router.patch('/:id/deactivate', UserController.deactivateUser); // Desativar (soft delete)
router.patch('/:id/reactivate', UserController.reactivateUser);

module.exports = router;
