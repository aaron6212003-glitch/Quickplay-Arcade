import { auth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, GoogleAuthProvider, signInWithPopup } from './firebase.js';
import { db, doc, setDoc, getDoc } from './firebase.js';

const modal = document.getElementById('auth-modal');
const btnLoginTrigger = document.getElementById('btn-login-trigger');
const btnClose = document.getElementById('auth-close');
const btnSubmit = document.getElementById('auth-submit');
const toggleLink = document.getElementById('auth-toggle-link');
const toggleText = document.getElementById('auth-toggle-text');
const title = document.getElementById('auth-title');
const errorMsg = document.getElementById('auth-error');

const inputUsername = document.getElementById('auth-username');
const inputEmail = document.getElementById('auth-email');
const inputPassword = document.getElementById('auth-password');
const authContainer = document.getElementById('auth-container');

let isSignupMode = false;

// Toggle Modal
if (btnLoginTrigger) {
  btnLoginTrigger.addEventListener('click', () => {
    modal.style.display = 'flex';
    errorMsg.style.display = 'none';
  });
}

if (btnClose) {
  btnClose.addEventListener('click', () => {
    modal.style.display = 'none';
  });
}

// Toggle Login / Signup
if (toggleLink) {
  toggleLink.addEventListener('click', (e) => {
    e.preventDefault();
    isSignupMode = !isSignupMode;
    errorMsg.style.display = 'none';
    
    if (isSignupMode) {
      title.innerText = 'Create Account';
      btnSubmit.innerText = 'Sign Up';
      toggleText.innerText = 'Already have an account?';
      toggleLink.innerText = 'Log In';
      inputUsername.style.display = 'block';
    } else {
      title.innerText = 'Log In';
      btnSubmit.innerText = 'Log In';
      toggleText.innerText = 'Don\'t have an account?';
      toggleLink.innerText = 'Sign Up';
      inputUsername.style.display = 'none';
    }
  });
}

// Handle Submit
if (btnSubmit) {
  btnSubmit.addEventListener('click', async () => {
    const email = inputEmail.value.trim();
    const password = inputPassword.value;
    const username = inputUsername.value.trim();
    
    if (!email || !password || (isSignupMode && !username)) {
      errorMsg.innerText = 'Please fill out all fields.';
      errorMsg.style.display = 'block';
      return;
    }
    
    btnSubmit.innerText = 'Loading...';
    btnSubmit.disabled = true;
    errorMsg.style.display = 'none';

    try {
      if (isSignupMode) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await updateProfile(user, { displayName: username });
        
        // Create user profile in Firestore
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          username: username,
          email: email,
          totalPoints: 0,
          gamesPlayed: 0,
          joinDate: new Date(),
          badges: ["new"] // Give them a starter badge!
        });

        // Force DOM update since onAuthStateChanged fired too early
        if (authContainer) {
          authContainer.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:flex-end;">
              <span style="font-size:0.85rem; color:#cbd5e1; font-weight:700;">Welcome,</span>
              <span style="font-weight:900; color:#38BDF8;">${username || user.displayName || 'Player'}</span>
            </div>
            <div style="display:flex; gap:8px;">
              <a href="profile.html" class="btn btn--primary" style="padding: 6px 12px; font-size: 0.8rem;">Profile</a>
              <button class="btn btn--outline" id="btn-logout" style="padding: 6px 12px; font-size: 0.8rem;">Log Out</button>
            </div>
          `;
          document.getElementById('btn-logout').addEventListener('click', () => { signOut(auth); });
        }
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Check if they have a profile, if not (e.g. created before this update), backfill it
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
          await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            username: user.displayName || "Player",
            email: user.email,
            totalPoints: 0,
            gamesPlayed: 0,
            joinDate: new Date(),
            badges: ["pioneer"] // Give old users a special pioneer badge
          });
        }
      }
      
      modal.style.display = 'none';
      inputEmail.value = '';
      inputPassword.value = '';
      inputUsername.value = '';
      
      // Prevent browser auto-fill from leaking into the search bar
      setTimeout(() => {
        const searchInput = document.getElementById('search-input');
        if (searchInput && searchInput.value === username) {
          searchInput.value = '';
          searchInput.dispatchEvent(new Event('input'));
        }
      }, 500);
      
    } catch (error) {
      console.error(error);
      errorMsg.innerText = error.message.replace('Firebase: ', '');
      errorMsg.style.display = 'block';
    } finally {
      btnSubmit.innerText = isSignupMode ? 'Sign Up' : 'Log In';
      btnSubmit.disabled = false;
    }
  });
}

// Handle Google Social Sign-In
const btnGoogleLogin = document.getElementById('btn-google-login');
if (btnGoogleLogin) {
  btnGoogleLogin.addEventListener('click', async () => {
    if (errorMsg) errorMsg.style.display = 'none';
    btnGoogleLogin.disabled = true;
    const oldText = btnGoogleLogin.innerHTML;
    btnGoogleLogin.innerHTML = 'Connecting Google...';
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if they have a Firestore document, if not, create it
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          username: user.displayName || "Player",
          email: user.email,
          totalPoints: 0,
          gamesPlayed: 0,
          joinDate: new Date(),
          badges: ["new"]
        });
      }
      
      if (modal) modal.style.display = 'none';
    } catch (error) {
      console.error(error);
      if (errorMsg) {
        errorMsg.innerText = error.message.replace('Firebase: ', '');
        errorMsg.style.display = 'block';
      }
    } finally {
      btnGoogleLogin.disabled = false;
      btnGoogleLogin.innerHTML = oldText;
    }
  });
}

// Listen for Auth State
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
    if (authContainer) {
      authContainer.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:flex-end;">
          <span style="font-size:0.85rem; color:#cbd5e1; font-weight:700;">Welcome,</span>
          <span style="font-weight:900; color:#38BDF8;">${user.displayName || 'Player'}</span>
        </div>
        <div style="display:flex; gap:8px;">
          <a href="profile.html" class="btn btn--primary" style="padding: 6px 12px; font-size: 0.8rem;">Profile</a>
          <button class="btn btn--outline" id="btn-logout" style="padding: 6px 12px; font-size: 0.8rem;">Log Out</button>
        </div>
      `;
      
      document.getElementById('btn-logout').addEventListener('click', () => {
        signOut(auth);
      });
    }
  } else {
    // User is signed out
    if (authContainer) {
      authContainer.innerHTML = `
        <button class="btn btn--outline" id="btn-login-trigger" style="padding: 8px 16px;">Log In</button>
      `;
      
      document.getElementById('btn-login-trigger').addEventListener('click', () => {
        modal.style.display = 'flex';
        errorMsg.style.display = 'none';
      });
    }
  }
});

// ── Register PWA Service Worker ──────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('[PWA] Service Worker registered successfully with scope:', reg.scope);
      })
      .catch((err) => {
        console.error('[PWA] Service Worker registration failed:', err);
      });
  });
}
