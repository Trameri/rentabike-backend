import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export function requireAuth(req,res,next){
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if(!token) return res.status(401).json({ error: 'No token' });
  try{
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  }catch(e){
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Middleware per verificare che l'utente sia admin o superadmin
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
}

// Middleware per verificare che l'utente sia superadmin
export function requireSuperAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'SuperAdmin access required' });
  }
  
  next();
}
