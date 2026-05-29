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

// Toggle Password Visibility Logic
const btnTogglePassword = document.getElementById('auth-toggle-password');
function resetPasswordVisibility() {
  if (inputPassword) inputPassword.setAttribute('type', 'password');
  if (btnTogglePassword) btnTogglePassword.textContent = '👁️';
}

if (btnTogglePassword && inputPassword) {
  btnTogglePassword.addEventListener('click', () => {
    const isPassword = inputPassword.getAttribute('type') === 'password';
    inputPassword.setAttribute('type', isPassword ? 'text' : 'password');
    btnTogglePassword.textContent = isPassword ? '🙈' : '👁️';
  });
}

let isSignupMode = false;

// Toggle Modal
if (btnLoginTrigger) {
  btnLoginTrigger.addEventListener('click', () => {
    modal.style.display = 'flex';
    errorMsg.style.display = 'none';
    resetPasswordVisibility();
  });
}

if (btnClose) {
  btnClose.addEventListener('click', () => {
    modal.style.display = 'none';
    resetPasswordVisibility();
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
            <div style="display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); padding:4px 8px; border-radius:12px; box-shadow:inset 0 1px 1px rgba(255,255,255,0.03);">
              <a href="profile.html" class="btn btn--primary" style="padding: 6px 12px; font-size: 0.85rem; font-weight:800; display:flex; align-items:center; gap:6px; border-radius:8px;">
                <span>👾</span>
                <span>${username || user.displayName || 'Profile'}</span>
              </a>
              <a href="locker.html" class="btn btn--outline" style="padding: 6px 12px; font-size: 0.85rem; font-weight:800; display:flex; align-items:center; gap:6px; border-radius:8px; border-color:rgba(255,255,255,0.1); background:rgba(255,255,255,0.02); color:#fff;">
                <span>🎒</span>
                <span>Locker</span>
              </a>
            </div>
          `;
          
          // Sync Mobile Drawer
          const mobileProfile = document.getElementById('mobile-profile-link');
          const mobileLocker = document.getElementById('mobile-locker-link');
          const mobileLogin = document.getElementById('mobile-login-trigger');
          const mobileLogout = document.getElementById('mobile-logout');
          const mobileMenu = document.getElementById('mobile-menu');
          
          if (mobileProfile) mobileProfile.style.display = 'block';
          if (mobileLocker) mobileLocker.style.display = 'block';
          if (mobileLogin) mobileLogin.style.display = 'none';
          if (mobileLogout) {
            mobileLogout.style.display = 'block';
            const newLogout = mobileLogout.cloneNode(true);
            mobileLogout.parentNode.replaceChild(newLogout, mobileLogout);
            newLogout.addEventListener('click', (e) => {
              e.preventDefault();
              signOut(auth);
              mobileMenu?.classList.remove('open');
            });
          }
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
      resetPasswordVisibility();
      
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
      
      if (modal) {
        modal.style.display = 'none';
        resetPasswordVisibility();
      }
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
  // Sync Mobile Drawer
  const mobileProfile = document.getElementById('mobile-profile-link');
  const mobileLocker = document.getElementById('mobile-locker-link');
  const mobileLogin = document.getElementById('mobile-login-trigger');
  const mobileLogout = document.getElementById('mobile-logout');
  const mobileMenu = document.getElementById('mobile-menu');

  if (user) {
    // User is signed in
    if (authContainer) {
      authContainer.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); padding:4px 8px; border-radius:12px; box-shadow:inset 0 1px 1px rgba(255,255,255,0.03);">
          <a href="profile.html" class="btn btn--primary" style="padding: 6px 12px; font-size: 0.85rem; font-weight:800; display:flex; align-items:center; gap:6px; border-radius:8px;">
            <span>👾</span>
            <span>${user.displayName || 'Profile'}</span>
          </a>
          <a href="locker.html" class="btn btn--outline" style="padding: 6px 12px; font-size: 0.85rem; font-weight:800; display:flex; align-items:center; gap:6px; border-radius:8px; border-color:rgba(255,255,255,0.1); background:rgba(255,255,255,0.02); color:#fff;">
            <span>🎒</span>
            <span>Locker</span>
          </a>
        </div>
      `;
    }
    
    if (mobileProfile) mobileProfile.style.display = 'block';
    if (mobileLocker) mobileLocker.style.display = 'block';
    if (mobileLogin) mobileLogin.style.display = 'none';
    if (mobileLogout) {
      mobileLogout.style.display = 'block';
      const newLogout = mobileLogout.cloneNode(true);
      mobileLogout.parentNode.replaceChild(newLogout, mobileLogout);
      newLogout.addEventListener('click', (e) => {
        e.preventDefault();
        signOut(auth);
        mobileMenu?.classList.remove('open');
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

    if (mobileProfile) mobileProfile.style.display = 'none';
    if (mobileLocker) mobileLocker.style.display = 'none';
    if (mobileLogout) mobileLogout.style.display = 'none';
    if (mobileLogin) {
      mobileLogin.style.display = 'block';
      const newLogin = mobileLogin.cloneNode(true);
      mobileLogin.parentNode.replaceChild(newLogin, mobileLogin);
      newLogin.addEventListener('click', (e) => {
        e.preventDefault();
        modal.style.display = 'flex';
        errorMsg.style.display = 'none';
        mobileMenu?.classList.remove('open');
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

// ── Hamburger Menu Toggle ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
    });
  }
});
// Fallback in case DOMContentLoaded already fired
const hamburgerFallback = document.getElementById('hamburger');
const mobileMenuFallback = document.getElementById('mobile-menu');
if (hamburgerFallback && mobileMenuFallback) {
  hamburgerFallback.addEventListener('click', () => {
    mobileMenuFallback.classList.toggle('open');
  });
}

