import { Router } from 'express';
import rooms from '../../services/rooms';
import { authenticateToken } from '../../middleware/auth';

const router = Router();

// Protect room endpoints to authenticated users
router.use(authenticateToken);

// Create a new room (optionally with custom id)
router.post('/', (req, res) => {
  const { id } = req.body || {};
  const roomId = rooms.create(id);
  res.status(201).json({ id: roomId });
});

// Get room info
router.get('/:id', (req, res) => {
  const r = rooms.get(req.params.id);
  if (!r) return res.status(404).json({ error: 'ROOM_NOT_FOUND' });
  res.json({ id: req.params.id, occupants: r.participants.size, createdAt: r.createdAt });
});

export default router;
