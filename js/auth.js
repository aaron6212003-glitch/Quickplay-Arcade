import { auth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, sendEmailVerification, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from './firebase.js?v=12';
import { db, doc, setDoc, getDoc, updateDoc, increment, collection, getDocs, deleteDoc } from './firebase.js?v=12';

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
    removeOtpOverlay();
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

// ── DYNAMIC OTP OVERLAY SYSTEM ──
const otpContainerHtml = `
  <div id="auth-otp-container" style="text-align: center; width: 100%; display: flex; flex-direction: column; align-items: center;">
    <p style="color: rgba(255,255,255,0.7); font-size: 0.9rem; margin-bottom: 20px; line-height: 1.4;">We sent a 6-digit verification code to <br><strong id="otp-display-email" style="color: #60A5FA;"></strong>. Please enter it below:</p>
    
    <div style="display: flex; gap: 8px; justify-content: center; margin-bottom: 24px;">
      <input type="text" id="otp-1" class="auth-input" pattern="[0-9]*" inputmode="numeric" maxlength="1" style="width: 40px; height: 48px; text-align: center; font-size: 1.4rem; font-weight: 800; border-radius: 8px; margin: 0; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); color: #fff;" />
      <input type="text" id="otp-2" class="auth-input" pattern="[0-9]*" inputmode="numeric" maxlength="1" style="width: 40px; height: 48px; text-align: center; font-size: 1.4rem; font-weight: 800; border-radius: 8px; margin: 0; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); color: #fff;" />
      <input type="text" id="otp-3" class="auth-input" pattern="[0-9]*" inputmode="numeric" maxlength="1" style="width: 40px; height: 48px; text-align: center; font-size: 1.4rem; font-weight: 800; border-radius: 8px; margin: 0; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); color: #fff;" />
      <input type="text" id="otp-4" class="auth-input" pattern="[0-9]*" inputmode="numeric" maxlength="1" style="width: 40px; height: 48px; text-align: center; font-size: 1.4rem; font-weight: 800; border-radius: 8px; margin: 0; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); color: #fff;" />
      <input type="text" id="otp-5" class="auth-input" pattern="[0-9]*" inputmode="numeric" maxlength="1" style="width: 40px; height: 48px; text-align: center; font-size: 1.4rem; font-weight: 800; border-radius: 8px; margin: 0; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); color: #fff;" />
      <input type="text" id="otp-6" class="auth-input" pattern="[0-9]*" inputmode="numeric" maxlength="1" style="width: 40px; height: 48px; text-align: center; font-size: 1.4rem; font-weight: 800; border-radius: 8px; margin: 0; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); color: #fff;" />
    </div>

    <button id="auth-otp-submit" class="auth-submit-btn" style="margin-bottom: 15px; width: 100%;">Verify & Create Account</button>
    
    <p style="font-size: 0.85rem; color: rgba(255,255,255,0.5); margin-bottom: 15px;">
      Didn't receive the code? <a href="#" id="auth-otp-resend" style="color: #60A5FA; text-decoration: none; font-weight: bold;">Resend Code</a>
    </p>
    
    <p style="font-size: 0.85rem; margin-top: 15px; margin-bottom: 0;">
      <a href="#" id="auth-otp-cancel" style="color: rgba(255,255,255,0.6); text-decoration: none;">← Back to Sign Up</a>
    </p>
  </div>
`;

function removeOtpOverlay() {
  const otpContainer = document.getElementById('auth-otp-container');
  if (otpContainer) {
    otpContainer.remove();
  }
  // Restore standard field visibilities
  inputEmail.style.display = 'block';
  const passwordContainer = document.querySelector('.auth-password-container');
  if (passwordContainer) passwordContainer.style.display = 'flex';
  btnSubmit.style.display = 'block';
  const toggleContainer = document.querySelector('.auth-toggle-container');
  if (toggleContainer) toggleContainer.style.display = 'block';
  
  if (isSignupMode) {
    inputUsername.style.display = 'block';
    if (inputInviteCode) inputInviteCode.style.display = 'block';
  }
}

function showOtpOverlay(email, password, username, inviteCode) {
  // Hide standard input fields
  inputUsername.style.display = 'none';
  if (inputInviteCode) inputInviteCode.style.display = 'none';
  inputEmail.style.display = 'none';
  const passwordContainer = document.querySelector('.auth-password-container');
  if (passwordContainer) passwordContainer.style.display = 'none';
  btnSubmit.style.display = 'none';
  const toggleContainer = document.querySelector('.auth-toggle-container');
  if (toggleContainer) toggleContainer.style.display = 'none';
  
  // Inject OTP HTML right inside .auth-card
  const authCard = document.querySelector('.auth-card');
  const existingOtp = document.getElementById('auth-otp-container');
  if (existingOtp) existingOtp.remove();
  
  const div = document.createElement('div');
  div.innerHTML = otpContainerHtml;
  authCard.insertBefore(div.firstElementChild, toggleContainer);
  
  // Update Title and Display Email
  title.innerText = 'Verify Email';
  document.getElementById('otp-display-email').innerText = email;
  
  // Setup inputs auto-focus navigation
  const inputs = [
    document.getElementById('otp-1'),
    document.getElementById('otp-2'),
    document.getElementById('otp-3'),
    document.getElementById('otp-4'),
    document.getElementById('otp-5'),
    document.getElementById('otp-6')
  ];
  
  inputs.forEach((input, index) => {
    input.addEventListener('input', () => {
      input.value = input.value.replace(/[^0-9]/g, '');
      if (input.value.length === 1 && index < 5) {
        inputs[index + 1].focus();
      }
    });
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && input.value.length === 0 && index > 0) {
        inputs[index - 1].focus();
      }
    });
    
    input.addEventListener('paste', (e) => {
      const data = e.clipboardData.getData('text').trim();
      if (/^\d{6}$/.test(data)) {
        for (let i = 0; i < 6; i++) {
          inputs[i].value = data[i];
        }
        inputs[5].focus();
        e.preventDefault();
      }
    });
  });
  
  // Wire up OTP Buttons
  document.getElementById('auth-otp-cancel').addEventListener('click', (e) => {
    e.preventDefault();
    removeOtpOverlay();
    title.innerText = 'Create Account';
  });
  
  document.getElementById('auth-otp-resend').addEventListener('click', async (e) => {
    e.preventDefault();
    const btnResend = document.getElementById('auth-otp-resend');
    btnResend.innerText = 'Sending...';
    btnResend.style.pointerEvents = 'none';
    
    try {
      const freshOtp = Math.floor(100000 + Math.random() * 900000).toString();
      await setDoc(doc(db, "temp_signups", email), {
        email,
        username,
        password,
        otp: freshOtp,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      });
      
      await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: freshOtp, username })
      });
      
      errorMsg.style.color = '#34D399';
      errorMsg.style.background = 'rgba(52, 211, 153, 0.1)';
      errorMsg.style.border = '1px solid rgba(52, 211, 153, 0.2)';
      errorMsg.innerText = '🎉 Verification code resent! Check your inbox.';
      errorMsg.style.display = 'block';
    } catch (err) {
      console.error(err);
      errorMsg.style.color = '#EF4444';
      errorMsg.style.background = 'rgba(239, 68, 68, 0.1)';
      errorMsg.style.border = '1px solid rgba(239, 68, 68, 0.2)';
      errorMsg.innerText = 'Failed to resend code: ' + err.message;
      errorMsg.style.display = 'block';
    } finally {
      setTimeout(() => {
        btnResend.innerText = 'Resend Code';
        btnResend.style.pointerEvents = 'auto';
      }, 5000);
    }
  });
  
  document.getElementById('auth-otp-submit').addEventListener('click', async () => {
    const enteredOtp = inputs.map(i => i.value).join('');
    if (enteredOtp.length < 6) {
      errorMsg.innerText = 'Please enter all 6 digits of the code.';
      errorMsg.style.color = '#EF4444';
      errorMsg.style.background = 'rgba(239, 68, 68, 0.1)';
      errorMsg.style.border = '1px solid rgba(239, 68, 68, 0.2)';
      errorMsg.style.display = 'block';
      return;
    }
    
    const btnOtpSubmit = document.getElementById('auth-otp-submit');
    btnOtpSubmit.innerText = 'Verifying Account...';
    btnOtpSubmit.disabled = true;
    errorMsg.style.display = 'none';
    
    try {
      // Validate OTP from Firestore temp_signups
      const tempRef = doc(db, "temp_signups", email);
      const tempSnap = await getDoc(tempRef);
      
      if (!tempSnap.exists()) {
        throw new Error('Verification session expired. Please go back and sign up again.');
      }
      
      const tempData = tempSnap.data();
      const now = new Date();
      const expiresAt = tempData.expiresAt.toDate();
      
      if (tempData.otp !== enteredOtp || now > expiresAt) {
        throw new Error('Invalid or expired verification code. Please check your email or click Resend.');
      }
      
      // OTP is valid! Finalize sign up in Firebase
      console.log("[Playhaus Debug] OTP Verified! Creating Firebase Auth User...");
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
        badges: ["new"]
      });
      
      // Clean up the temp signup document from Firestore
      await deleteDoc(tempRef);
      
      // Clear overlay and modal
      removeOtpOverlay();
      modal.style.display = 'none';
      inputEmail.value = '';
      inputPassword.value = '';
      inputUsername.value = '';
      resetPasswordVisibility();
      
      console.log("[Playhaus Debug] Sign up completed successfully!");
    } catch (err) {
      console.error(err);
      errorMsg.style.color = '#EF4444';
      errorMsg.style.background = 'rgba(239, 68, 68, 0.1)';
      errorMsg.style.border = '1px solid rgba(239, 68, 68, 0.2)';
      errorMsg.innerText = err.message.replace('Firebase: ', '');
      errorMsg.style.display = 'block';
    } finally {
      btnOtpSubmit.innerText = 'Verify & Create Account';
      btnOtpSubmit.disabled = false;
    }
  });
  
  // Set focus on first box
  inputs[0].focus();
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
        
        // ── GENERATE AND SEND OTP CODE ──
        console.log("[Playhaus Debug] Generating OTP Code...");
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Save OTP and Temporary Registration Details to Firestore
        await setDoc(doc(db, "temp_signups", email), {
          email,
          username,
          password,
          otp,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        });
        
        // Fetch to send-otp serverless function
        console.log("[Playhaus Debug] Dispatching OTP email via serverless function...");
        const response = await fetch('/api/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp, username })
        });
        
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to dispatch verification email. Please try again.');
        }
        
        // Trigger Dynamic UI Transition
        showOtpOverlay(email, password, username, inviteCode);
        return;
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

