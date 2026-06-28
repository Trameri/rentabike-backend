import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const tempUsers = [
  {
    _id: '507f1f77bcf86cd799439011',
    username: 'superadmin',
    passwordHash: '$2a$10$PVYyK1Jcq8Q7pbcwF3R7bubwjwEi7GPIOB3aJjQJcwgA2yhJxUIXK',
    role: 'superadmin',
    location: null
  },
  {
    _id: '507f1f77bcf86cd799439012',
    username: 'cancano',
    passwordHash: '$2a$10$S6bqyDWCRLR5VPiAKqEbeeKzJoHc6iWR1h5OFkGB7YHd/nyjDe3au',
    role: 'admin',
    location: { _id: '507f1f77bcf86cd799439021', name: 'Cancano', code: 'CAN' }
  },
  {
    _id: '507f1f77bcf86cd799439013',
    username: 'arnoga',
    passwordHash: '$2a$10$NcRkuWY26KJYnSKmf04YO.1uM2W5SYniu3GQNd.4VSoODeJlt2f0y',
    role: 'admin',
    location: { _id: '507f1f77bcf86cd799439022', name: 'Arnoga', code: 'ARN' }
  },
  {
    _id: '507f1f77bcf86cd799439014',
    username: 'campo-sportivo',
    passwordHash: '$2a$10$9/JohTa0YjrVm6Bj20VkGOz9jHOzVX0CESZL84mGGvztBSNSCbBa6',
    role: 'admin',
    location: { _id: '507f1f77bcf86cd799439023', name: 'Campo Sportivo', code: 'CSP' }
  }
];

export async function login(req,res){
  const { username, password } = req.body;
  
  try {
    const user = await User.findOne({ username }).populate('location');
    if (user) {
      const ok = await user.comparePassword(password);
      if(!ok) return res.status(401).json({ error: 'Invalid credentials' });
      const payload = { uid: user._id, username: user.username, role: user.role, locationId: user.location?._id || null, locationCode: user.location?.code || null };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });
      return res.status(200).json({
        message: "Login effettuato con successo",
        token: token,
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
          location: user.location
        }
      });
    }
  } catch (error) {
    console.log('Database non disponibile, uso utenti temporanei');
  }
  
  const tempUser = tempUsers.find(u => u.username === username);
  if (!tempUser) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const ok = await bcrypt.compare(password, tempUser.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const payload = { 
    uid: tempUser._id, 
    username: tempUser.username,
    role: tempUser.role, 
    locationId: tempUser.location?._id || null, 
    locationCode: tempUser.location?.code || null 
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '12h' });
  
  return res.status(200).json({ 
    message: "Login effettuato con successo",
    token: token,
    user: {
      id: tempUser._id,
      username: tempUser.username,
      role: tempUser.role,
      location: tempUser.location
    }
  });
}
