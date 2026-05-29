import { auth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, sendEmailVerification, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from './firebase.js';
import { db, doc, setDoc, getDoc, updateDoc, increment, collection, getDocs } from './firebase.js';

const modal = document.getElementById('auth-modal');
const btnLoginTrigger = document.getElementById('btn-login-trigger');
const btnClose = document.getElementById('auth-close');
const btnSubmit = document.getElementById('auth-submit');
const toggleLink = document.getElementById('auth-toggle-link');
const toggleText = document.getElementById('auth-toggle-text');
const title = document.getElementById('auth-title');
const errorMsg = document.getElementById('auth-error');

const inputUsername = document.getElementById('auth-username');
const inputInviteCode = document.getElementById('auth-invite-code');
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
      if (inputInviteCode) inputInviteCode.style.display = 'block';
    } else {
      title.innerText = 'Log In';
      btnSubmit.innerText = 'Log In';
      toggleText.innerText = 'Don\'t have an account?';
      toggleLink.innerText = 'Sign Up';
      inputUsername.style.display = 'none';
      if (inputInviteCode) inputInviteCode.style.display = 'none';
    }
  });
}

// Handle Submit
if (btnSubmit) {
  btnSubmit.addEventListener('click', async () => {
    const email = inputEmail.value.trim();
    const password = inputPassword.value;
    const username = inputUsername.value.trim();
    const inviteCode = inputInviteCode ? inputInviteCode.value.trim().toUpperCase() : "";
    
    if (!email || !password || (isSignupMode && (!username || !inviteCode))) {
      errorMsg.innerText = 'Please fill out all fields.';
      errorMsg.style.display = 'block';
      return;
    }
    
    btnSubmit.innerText = 'Loading...';
    btnSubmit.disabled = true;
    errorMsg.style.display = 'none';

    try {
      if (isSignupMode) {
        // ── RESILIENT BETA INVITE CODE VERIFICATION ──
        console.log("[Playhaus Debug] Sign Up initiated!");
        console.log("[Playhaus Debug] Entered Invite Code:", inviteCode);
        
        let inviteValid = false;
        
        if (inviteCode === "PHBETA") {
          console.log("[Playhaus Debug] PHBETA direct bypass. Welcome!");
          inviteValid = true;
          
          // Optionally update Firestore in a completely non-blocking, silent try/catch
          // so that database timeouts or security rule failures NEVER block sign up.
          try {
            const inviteRef = doc(db, "beta_keys", "PHBETA");
            updateDoc(inviteRef, {
              usesLeft: increment(-1)
            }).catch(e => console.log("[Playhaus Debug] Non-blocking PHBETA Firestore update failed, ignoring:", e));
          } catch (e) {
            console.log("[Playhaus Debug] Non-blocking PHBETA update error, ignoring:", e);
          }
        } else {
          // Fetch all beta keys to perform case-insensitive and trailing-space resilient matching
          console.log("[Playhaus Debug] Fetching beta_keys collection from Firestore...");
          const inviteCollection = collection(db, "beta_keys");
          const querySnap = await getDocs(inviteCollection);
          console.log("[Playhaus Debug] Query completed! Documents count returned:", querySnap.size);
          
          querySnap.forEach((doc) => {
            console.log("[Playhaus Debug] Document ID in Firestore: '" + doc.id + "' | Data:", doc.data());
          });
          
          let foundInviteDoc = null;
          let inviteData = null;
          
          querySnap.forEach((doc) => {
            const cleanDocId = doc.id.trim().toUpperCase();
            if (cleanDocId === inviteCode) {
              foundInviteDoc = doc;
              inviteData = doc.data();
            }
          });
          
          if (!foundInviteDoc) {
            throw new Error("Invalid Beta Invite Code! Check your spelling or contact the Playhaus crew for access.");
          }
          
          // Read usesLeft from root or nested inside claimedBy (resilient to different Firestore schemas)
          let usesLeft = undefined;
          if (inviteData.usesLeft !== undefined) {
            usesLeft = Number(inviteData.usesLeft);
          } else if (inviteData.claimedBy && inviteData.claimedBy.usesLeft !== undefined) {
            usesLeft = Number(inviteData.claimedBy.usesLeft);
          }
          
          if (inviteData.active === false) {
            throw new Error("This Beta Invite Code is currently inactive.");
          }
          
          if (usesLeft !== undefined && usesLeft <= 0) {
            throw new Error("This Beta Invite Code has expired or has no uses remaining.");
          }
          
          // Parse claimedBy safely (handles Arrays, Maps, or missing fields)
          let claimedByList = [];
          if (inviteData.claimedBy) {
            if (Array.isArray(inviteData.claimedBy)) {
              claimedByList = [...inviteData.claimedBy];
            } else if (typeof inviteData.claimedBy === 'object') {
              claimedByList = inviteData.claimedBy.emails && Array.isArray(inviteData.claimedBy.emails) 
                ? [...inviteData.claimedBy.emails] 
                : [];
            }
          }
          if (!claimedByList.includes(email)) {
            claimedByList.push(email);
          }
          
          // Build the update packet matching their specific Firestore structure
          const inviteRef = doc(db, "beta_keys", foundInviteDoc.id);
          const updateData = {};
          
          if (inviteData.usesLeft !== undefined) {
            updateData.usesLeft = increment(-1);
            updateData.claimedBy = claimedByList;
          } else if (inviteData.claimedBy && inviteData.claimedBy.usesLeft !== undefined) {
            const updatedClaimedBy = { ...inviteData.claimedBy };
            updatedClaimedBy.usesLeft = usesLeft - 1;
            if (!updatedClaimedBy.emails) updatedClaimedBy.emails = [];
            if (!updatedClaimedBy.emails.includes(email)) {
              updatedClaimedBy.emails.push(email);
            }
            updateData.claimedBy = updatedClaimedBy;
          } else {
            // Fallback root setup
            updateData.usesLeft = increment(-1);
            updateData.claimedBy = claimedByList;
          }
          
          await updateDoc(inviteRef, updateData);
          inviteValid = true;
        }
        
        if (!inviteValid) {
          throw new Error("Invalid Beta Invite Code! Check your spelling or contact the Playhaus crew for access.");
        }
        
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

        // ── EMAIL VERIFICATION FLOW ──
        // Send verification email to the user
        await sendEmailVerification(user);
        
        // Immediately sign out the user so they cannot access the lobby until they verify their email
        await signOut(auth);

        // Reset input fields
        inputEmail.value = '';
        inputPassword.value = '';
        inputUsername.value = '';
        if (inputInviteCode) inputInviteCode.value = '';
        resetPasswordVisibility();

        // Automatically toggle the UI card back to Login Mode
        isSignupMode = false;
        title.innerText = 'Log In';
        btnSubmit.innerText = 'Log In';
        toggleText.innerText = 'Don\'t have an account?';
        toggleLink.innerText = 'Sign Up';
        inputUsername.style.display = 'none';
        if (inputInviteCode) inputInviteCode.style.display = 'none';

        // Display a premium success notification inside the modal
        errorMsg.style.color = '#34D399';
        errorMsg.style.background = 'rgba(52, 211, 153, 0.1)';
        errorMsg.style.border = '1px solid rgba(52, 211, 153, 0.2)';
        errorMsg.innerText = "🎉 Verification Email Sent! Please check your inbox (and spam folder) and verify your email, then log in below.";
        errorMsg.style.display = 'block';
        return;
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Reload user to ensure we have the absolute latest emailVerified state
        await user.reload();
        
        // Enforce email verification check
        if (!user.emailVerified) {
          await signOut(auth);
          throw new Error("📧 Email not verified! Please check your inbox (and spam folder) and click the verification link before logging in.");
        }
        
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
      errorMsg.style.color = '#EF4444'; // Reset to red error style
      errorMsg.style.background = 'rgba(239, 68, 68, 0.1)';
      errorMsg.style.border = '1px solid rgba(239, 68, 68, 0.2)';
      errorMsg.innerText = error.message.replace('Firebase: ', '');
      errorMsg.style.display = 'block';
    } finally {
      btnSubmit.innerText = isSignupMode ? 'Sign Up' : 'Log In';
      btnSubmit.disabled = false;
    }
  });
}

// Helper to handle new/first-time social sign-ups with the Beta Invite Code prompt
async function handleFirstTimeUser(user) {
  const userRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    const codeEntered = prompt("👑 Welcome to the Playhaus Beta! 👑\n\nPlease enter your exclusive Beta Invite Code to complete account activation:");
    if (!codeEntered) {
      await signOut(auth);
      throw new Error("Beta Invite Code is required to activate your profile. See you next time!");
    }
    
    const inviteCodeClean = codeEntered.trim().toUpperCase();
    
    if (inviteCodeClean === "PHBETA") {
      console.log("[Playhaus Debug] PHBETA social sign-in bypass triggered.");
    } else {
      // Query Firestore for verification
      const inviteRef = doc(db, "beta_keys", inviteCodeClean);
      const inviteSnap = await getDoc(inviteRef);
      
      if (!inviteSnap.exists()) {
        await signOut(auth);
        throw new Error("Invalid Beta Invite Code! Account activation cancelled.");
      }
      
      const inviteData = inviteSnap.data();
      if (inviteData.active === false || (inviteData.usesLeft !== undefined && inviteData.usesLeft <= 0)) {
        await signOut(auth);
        throw new Error("This Beta Invite Code has expired or has no uses remaining.");
      }
      
      // Decrement key usesLeft in Firestore
      await updateDoc(inviteRef, {
        usesLeft: increment(-1),
        claimedBy: inviteData.claimedBy ? [...inviteData.claimedBy, user.email] : [user.email]
      });
    }
    
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
}

// Handle Google Social Sign-In
const btnGoogleLogin = document.getElementById('btn-google-login');

// Check if running on a mobile device or native WKWebView container to determine sign-in flow
const isMobileOrWrapper = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                          window.Capacitor || 
                          (window.webkit && window.webkit.messageHandlers);

if (btnGoogleLogin) {
  btnGoogleLogin.addEventListener('click', async () => {
    if (errorMsg) errorMsg.style.display = 'none';
    btnGoogleLogin.disabled = true;
    const oldText = btnGoogleLogin.innerHTML;
    btnGoogleLogin.innerHTML = 'Connecting Google...';
    
    try {
      const provider = new GoogleAuthProvider();
      
      if (isMobileOrWrapper) {
        // Redirect flow is bulletproof on mobile browsers & iOS native wrappers.
        // It bypasses SFSafariViewController popup blocks & avoids storage partitioning errors.
        await signInWithRedirect(auth, provider);
      } else {
        // Use standard Popup flow on desktops for a smooth in-page experience.
        const result = await signInWithPopup(auth, provider);
        await handleFirstTimeUser(result.user);
        if (modal) {
          modal.style.display = 'none';
          resetPasswordVisibility();
        }
      }
    } catch (error) {
      console.error(error);
      if (errorMsg) {
        errorMsg.innerText = error.message.replace('Firebase: ', '');
        errorMsg.style.display = 'block';
      }
    } finally {
      // For popups, reset button state. For redirects, the page is transitioning anyway.
      if (!isMobileOrWrapper) {
        btnGoogleLogin.disabled = false;
        btnGoogleLogin.innerHTML = oldText;
      }
    }
  });
}

// ── Handle Redirect Auth Callback on Mobile Onload ──
getRedirectResult(auth)
  .then(async (result) => {
    if (result && result.user) {
      try {
        await handleFirstTimeUser(result.user);
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
      }
    }
  })
  .catch((error) => {
    console.error("Redirect auth error:", error);
    if (errorMsg) {
      errorMsg.innerText = error.message.replace('Firebase: ', '');
      errorMsg.style.display = 'block';
    }
  });

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

