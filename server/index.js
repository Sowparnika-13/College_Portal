import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock database
const users = [
  {
    id: 1,
    email: 'student@example.com',
    password: bcrypt.hashSync('password123', 10),
    firstName: 'John',
    lastName: 'Doe',
    role: 'student',
  },
  {
    id: 2,
    email: 'faculty@example.com',
    password: bcrypt.hashSync('password123', 10),
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'faculty',
  },
];

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    
    req.user = user;
    next();
  });
};

// Routes
// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    
    // Check if user already exists
    if (users.some(user => user.email === email)) {
      return res.status(400).json({ message: 'User with that email already exists' });
    }
    
    // Create new user
    const newUser = {
      id: users.length + 1,
      email,
      password: bcrypt.hashSync(password, 10),
      firstName,
      lastName,
      role,
    };
    
    users.push(newUser);
    
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = users.find(user => user.email === email);
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Create token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    // Return user info (without password) and token
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.status(200).json({ message: 'Token is valid', user: req.user });
});

// Dashboard route
app.get('/api/dashboard', authenticateToken, (req, res) => {
  // Get user data
  const userData = users.find(user => user.id === req.user.id);
  
  if (!userData) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  // Mock dashboard data
  const dashboardData = {
    user: {
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
    },
    stats: {
      attendance: 92.5,
      upcomingEvents: 3,
      todayClasses: 4,
      newAnnouncements: 7,
    },
  };
  
  res.json(dashboardData);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});