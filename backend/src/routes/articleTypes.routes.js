import { Router } from 'express';
import { getDB } from '../db.js';
import { authRequired } from '../auth.js';

const router = Router();

router.get('/', authRequired, (req, res) => {
  res.json(getDB().articleTypes);
});

export default router;
