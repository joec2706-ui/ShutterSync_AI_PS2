const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');

// Ensure users file exists with initial demo users
function initStorage() {
  if (!fs.existsSync(USERS_FILE)) {
    const defaultUsers = [
      {
        id: 'usr_demo_1',
        name: 'Aarav Sharma',
        email: 'demo@scholarship.org',
        passwordHash: hashPassword('password123'),
        createdAt: new Date().toISOString(),
        profile: {
          fullName: 'Aarav Sharma',
          age: 20,
          stateOfResidence: 'Maharashtra',
          domicileState: 'Maharashtra',
          category: 'OBC',
          gender: 'Male',
          disability: 'No',
          course: 'B.E. Computer Engineering',
          courseLevel: 'Undergraduate',
          yearOfStudy: 3,
          institution: 'Government College of Engineering',
          annualIncome: 200000,
          additionalInfo: 'Interested in technical & state merit scholarships.',
          documents: {
            aadhaar: true,
            incomeCertificate: true,
            bonafideCertificate: true,
            marksheet: true,
            bankPassbook: true
          }
        },
        wallet: [
          {
            id: 'doc_1',
            documentType: 'incomeCertificate',
            label: 'Income Certificate',
            fileName: 'income_cert_2025.pdf',
            uploadedAt: new Date().toISOString(),
            extracted: {
              extractedIncome: 200000,
              name: 'Aarav Sharma',
              state: 'Maharashtra'
            },
            verified: true
          },
          {
            id: 'doc_2',
            documentType: 'domicileCertificate',
            label: 'Domicile Certificate',
            fileName: 'domicile_mh.pdf',
            uploadedAt: new Date().toISOString(),
            extracted: {
              name: 'Aarav Sharma',
              state: 'Maharashtra'
            },
            verified: true
          }
        ]
      },
      {
        id: 'usr_demo_2',
        name: 'Priya Patel',
        email: 'priya@scholarship.org',
        passwordHash: hashPassword('password123'),
        createdAt: new Date().toISOString(),
        profile: {
          fullName: 'Priya Patel',
          age: 21,
          stateOfResidence: 'Gujarat',
          domicileState: 'Gujarat',
          category: 'General',
          gender: 'Female',
          disability: 'No',
          course: 'B.Tech Information Technology',
          courseLevel: 'Undergraduate',
          yearOfStudy: 2,
          institution: 'Gujarat Technological University',
          annualIncome: 450000,
          documents: {
            aadhaar: true,
            marksheet: true,
            bonafideCertificate: true
          }
        },
        wallet: []
      }
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2), 'utf8');
  }
}

function hashPassword(password) {
  const salt = 'scholarship_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    timestamp: Date.now()
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

function verifyToken(token) {
  try {
    const raw = Buffer.from(token, 'base64').toString('utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

function loadUsers() {
  try {
    initStorage();
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save users:', err);
  }
}

class AuthService {
  constructor() {
    initStorage();
  }

  register({ email, password, name, profile = {} }) {
    const users = loadUsers();
    const cleanEmail = String(email || '').trim().toLowerCase();
    
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please provide a valid email address.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('An account with this email already exists. Please log in.');
    }

    const newUser = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      name: (name || cleanEmail.split('@')[0]).trim(),
      email: cleanEmail,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
      profile: profile || {},
      wallet: []
    };

    users.push(newUser);
    saveUsers(users);

    const token = generateToken(newUser);
    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        profile: newUser.profile,
        wallet: newUser.wallet
      },
      token
    };
  }

  login({ email, password }) {
    const users = loadUsers();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const target = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!target) {
      throw new Error('Invalid email or password.');
    }

    const hashed = hashPassword(password);
    if (target.passwordHash !== hashed) {
      throw new Error('Invalid email or password.');
    }

    const token = generateToken(target);
    return {
      user: {
        id: target.id,
        name: target.name,
        email: target.email,
        profile: target.profile || {},
        wallet: target.wallet || []
      },
      token
    };
  }

  getUserById(id) {
    const users = loadUsers();
    const user = users.find(u => u.id === id);
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      profile: user.profile || {},
      wallet: user.wallet || []
    };
  }

  updateProfile(userId, newProfile) {
    const users = loadUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) throw new Error('User not found.');

    users[index].profile = {
      ...users[index].profile,
      ...newProfile
    };
    saveUsers(users);

    return users[index].profile;
  }

  updateWallet(userId, wallet) {
    const users = loadUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) throw new Error('User not found.');

    users[index].wallet = wallet;
    saveUsers(users);

    return users[index].wallet;
  }
}

module.exports = {
  authService: new AuthService(),
  verifyToken
};
