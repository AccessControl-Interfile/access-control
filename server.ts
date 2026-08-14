import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, updatePassword, createUserWithEmailAndPassword } from 'firebase/auth';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const firebaseConfig = {
  apiKey: "AIzaSyAkI1Ybt1JiMip8wcuVpSxCs93nCsqtKRU",
  authDomain: "access-control-001.firebaseapp.com",
  databaseURL: "https://access-control-001-default-rtdb.firebaseio.com",
  projectId: "access-control-001",
  storageBucket: "access-control-001.firebasestorage.app",
  messagingSenderId: "285032281412",
  appId: "1:285032281412:web:39b08b3485e71f38441311",
  measurementId: "G-G60DQPWCCJ"
};

function generateTempPassword(): string {
  const lettersUpper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lettersLower = "abcdefghijkmnopqrstuvwxyz";
  const numbers = "23456789";
  const specials = "!@#$%&*";

  let pass = "Tmp#";
  for (let i = 0; i < 2; i++) pass += lettersUpper.charAt(Math.floor(Math.random() * lettersUpper.length));
  for (let i = 0; i < 2; i++) pass += lettersLower.charAt(Math.floor(Math.random() * lettersLower.length));
  for (let i = 0; i < 2; i++) pass += numbers.charAt(Math.floor(Math.random() * numbers.length));
  pass += specials.charAt(Math.floor(Math.random() * specials.length));

  return pass;
}

// API Route: Reset user password
app.post('/api/reset-password', async (req, res) => {
  try {
    const { email, currentAuthPassword, currentTempPassword } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const newTempPassword = generateTempPassword();

    const candidates = Array.from(new Set([
      currentAuthPassword,
      currentTempPassword,
      'InterFile123$$',
      'Interfile123$$',
      'InterFile123',
      'Interfile123',
      '123456'
    ].filter((p): p is string => Boolean(p) && typeof p === 'string')));

    const tempAppName = `ResetApp-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const secondaryApp = initializeApp(firebaseConfig, tempAppName);
    const secondaryAuth = getAuth(secondaryApp);

    let updatedInAuth = false;
    for (const cand of candidates) {
      try {
        const cred = await signInWithEmailAndPassword(secondaryAuth, cleanEmail, cand);
        if (cred.user) {
          await updatePassword(cred.user, newTempPassword);
          await secondaryAuth.signOut();
          updatedInAuth = true;
          break;
        }
      } catch (err) {
        // tenta proximo candidato
      }
    }

    if (!updatedInAuth) {
      try {
        const cred = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, newTempPassword);
        if (cred.user) {
          await secondaryAuth.signOut();
          updatedInAuth = true;
        }
      } catch (createErr) {
        console.error("Fall-through createUserWithEmailAndPassword error:", createErr);
      }
    }

    try {
      await deleteApp(secondaryApp);
    } catch (e) {
      // ignore
    }

    return res.json({
      success: true,
      tempPassword: newTempPassword,
      updatedInAuth
    });
  } catch (error: any) {
    console.error('Erro na API /api/reset-password:', error);
    return res.status(500).json({ error: error?.message || 'Erro ao resetar senha.' });
  }
});

// API Route: Update user password in Firebase Authenticator directly
app.post('/api/update-user-password', async (req, res) => {
  try {
    const { email, newPassword, currentPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email e nova senha são obrigatórios.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const tempAppName = `UpdatePassApp-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const secondaryApp = initializeApp(firebaseConfig, tempAppName);
    const secondaryAuth = getAuth(secondaryApp);

    const candidates = Array.from(new Set([
      currentPassword,
      newPassword,
      'InterFile123$$',
      'Interfile123$$',
      '123456'
    ].filter((p): p is string => Boolean(p) && typeof p === 'string')));

    let updatedInAuth = false;
    for (const cand of candidates) {
      try {
        const cred = await signInWithEmailAndPassword(secondaryAuth, cleanEmail, cand);
        if (cred.user) {
          await updatePassword(cred.user, newPassword);
          await secondaryAuth.signOut();
          updatedInAuth = true;
          break;
        }
      } catch (err) {
        // tenta proximo candidato
      }
    }

    if (!updatedInAuth) {
      try {
        const cred = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, newPassword);
        if (cred.user) {
          await secondaryAuth.signOut();
          updatedInAuth = true;
        }
      } catch (createErr) {
        console.error("createUserWithEmailAndPassword error in update-user-password:", createErr);
      }
    }

    try {
      await deleteApp(secondaryApp);
    } catch (e) {
      // ignore
    }

    return res.json({ success: true, updatedInAuth });
  } catch (error: any) {
    console.error('Erro na API /api/update-user-password:', error);
    return res.status(500).json({ error: error?.message || 'Erro ao atualizar senha no Authenticator.' });
  }
});

// API Route: Sync user password during login
app.post('/api/sync-password', async (req, res) => {
  try {
    const { email, password, candidatePasswords } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const candidates = Array.from(new Set([
      ...(candidatePasswords || []),
      'InterFile123$$'
    ].filter((p): p is string => Boolean(p) && typeof p === 'string')));

    const tempAppName = `SyncApp-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const secondaryApp = initializeApp(firebaseConfig, tempAppName);
    const secondaryAuth = getAuth(secondaryApp);

    let synced = false;
    for (const cand of candidates) {
      try {
        const cred = await signInWithEmailAndPassword(secondaryAuth, cleanEmail, cand);
        if (cred.user) {
          await updatePassword(cred.user, password);
          await secondaryAuth.signOut();
          synced = true;
          break;
        }
      } catch (e) {
        // tenta proximo candidato
      }
    }

    try {
      await deleteApp(secondaryApp);
    } catch (e) {
      // ignore
    }

    return res.json({ success: synced });
  } catch (error: any) {
    console.error('Erro na API /api/sync-password:', error);
    return res.status(500).json({ error: error?.message || 'Erro ao sincronizar senha.' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
