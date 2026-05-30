import { auth, db, doc, updateDoc, increment, getDoc } from './firebase.js?v=12';

// ── NATIVE OR WEB ENVIRONMENT DETECTION ──────────────────────────────────────
export const isNative = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();

// Global VIP subscription state cached globally on the window
window.isPlayhausVip = false;

// Official Google AdMob Test Ad Units for iOS
const AD_UNITS = {
  banner: 'ca-app-pub-3940256099942544/2934735716',
  interstitial: 'ca-app-pub-3940256099942544/4411468910',
  rewarded: 'ca-app-pub-3940256099942544/1712485313'
};

// ── ADMOB ENUMS ─────────────────────────────────────────────────────────────
// Custom local AdMob enums to avoid importing bare modules in standard browser environments
export const BannerAdPosition = {
  TOP_CENTER: "TOP_CENTER",
  CENTER: "CENTER",
  BOTTOM_CENTER: "BOTTOM_CENTER"
};

export const BannerAdSize = {
  BANNER: "BANNER",
  FULL_BANNER: "FULL_BANNER",
  LARGE_BANNER: "LARGE_BANNER",
  MEDIUM_RECTANGLE: "MEDIUM_RECTANGLE",
  LEADERBOARD: "LEADERBOARD",
  ADAPTIVE_BANNER: "ADAPTIVE_BANNER",
  SMART_BANNER: "SMART_BANNER"
};

export const RewardAdPluginEvents = {
  Loaded: "onRewardedVideoAdLoaded",
  FailedToLoad: "onRewardedVideoAdFailedToLoad",
  Showed: "onRewardedVideoAdShowed",
  FailedToShow: "onRewardedVideoAdFailedToShow",
  Dismissed: "onRewardedVideoAdDismissed",
  Rewarded: "onRewardedVideoAdReward"
};

// ── MONETIZATION INITIALIZATION ──────────────────────────────────────────────
export async function initMonetization() {
  console.log(`[Playhaus Monetization] Environment detected: ${isNative ? 'Native Capacitor iOS' : 'Web Browser'}`);
  
  if (isNative) {
    try {
      // Initialize AdMob via Capacitor Plugins window global
      const AdMob = window.Capacitor?.Plugins?.AdMob;
      if (AdMob) {
        await AdMob.initialize({
          requestTrackingAuthorization: true,
        });
        console.log("[Playhaus Monetization] Native AdMob initialized.");
      } else {
        console.error("[Playhaus Monetization] Native AdMob plugin not found on window.Capacitor.Plugins.");
      }
    } catch (err) {
      console.error("[Playhaus Monetization] AdMob init error:", err);
    }
  }
}

// ── VIP & MEMBERSHIP SUBSCRIPTION CHECKS ─────────────────────────────────────
export async function checkVipStatus(user) {
  if (!user) {
    window.isPlayhausVip = false;
    return false;
  }

  // 1. Fast path: Check Firestore cached VIP state
  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      if (data.isVip) {
        window.isPlayhausVip = true;
        console.log("[Playhaus Monetization] Active VIP membership found in Firestore cache.");
        hideBannerAd();
        return true;
      }
    }
  } catch (err) {
    console.error("[Playhaus Monetization] Firestore VIP check error:", err);
  }

  // 2. Native path: Verify active subscription entitlement via RevenueCat
  if (isNative) {
    try {
      const Purchases = window.Capacitor?.Plugins?.Purchases;
      if (!Purchases) {
        throw new Error("Purchases plugin not found on window.Capacitor.Plugins");
      }
      
      // Configure once dynamically on demand
      try {
        await Purchases.configure({
          apiKey: "appl_playhaus_sandbox_key", // Placeholder Apple API key
          appUserID: user.uid
        });
      } catch (e) {
        // Already configured
      }

      const customerInfoResponse = await Purchases.getCustomerInfo();
      // Ensure compatibility with different versions of the RevenueCat plugin response structure
      const customerInfo = customerInfoResponse.customerInfo || customerInfoResponse;
      const hasVip = customerInfo.entitlements.active['vip_membership'] !== undefined;
      window.isPlayhausVip = hasVip;

      // Update Firestore cached value so web & native loads stay in sync
      await updateDoc(doc(db, "users", user.uid), { isVip: hasVip });
      
      if (hasVip) {
        console.log("[Playhaus Monetization] Verified active VIP entitlement via App Store!");
        hideBannerAd();
      }
      return hasVip;
    } catch (err) {
      console.error("[Playhaus Monetization] RevenueCat customerInfo verification failed:", err);
    }
  }

  window.isPlayhausVip = false;
  return false;
}

// ── BANNER ADS (BOTTOM OF THE APP) ───────────────────────────────────────────
let bannerLoaded = false;

export async function showBannerAd() {
  if (!isNative) return;
  if (window.isPlayhausVip) {
    console.log("[Playhaus Monetization] VIP User detected. Skipping Banner Ad.");
    return;
  }

  try {
    const AdMob = window.Capacitor?.Plugins?.AdMob;
    if (!AdMob) throw new Error("AdMob plugin not found on window.Capacitor.Plugins");
    
    await AdMob.showBanner({
      adId: AD_UNITS.banner,
      position: BannerAdPosition.BOTTOM_CENTER,
      size: BannerAdSize.BANNER,
      margin: 0,
      isTesting: true
    });
    bannerLoaded = true;
    console.log("[Playhaus AdMob] Banner Ad displayed successfully.");
  } catch (err) {
    console.error("[Playhaus AdMob] Failed to load banner ad:", err);
  }
}

export async function hideBannerAd() {
  if (!isNative || !bannerLoaded) return;
  
  try {
    const AdMob = window.Capacitor?.Plugins?.AdMob;
    if (AdMob) {
      await AdMob.removeBanner();
      bannerLoaded = false;
      console.log("[Playhaus AdMob] Banner Ad removed.");
    }
  } catch (err) {
    console.error("[Playhaus AdMob] Failed to remove banner ad:", err);
  }
}

// ── INTERSTITIAL ADS (BETWEEN MINI-GAMES) ─────────────────────────────────────
export async function showInterstitialAd() {
  if (window.isPlayhausVip) {
    console.log("[Playhaus Monetization] VIP User detected. Skipping Interstitial Ad.");
    return false;
  }

  if (!isNative) {
    console.log("[Playhaus Monetization] Standard Web. Skipping Interstitial Ad.");
    return false;
  }

  try {
    const AdMob = window.Capacitor?.Plugins?.AdMob;
    if (!AdMob) throw new Error("AdMob plugin not found on window.Capacitor.Plugins");

    await AdMob.prepareInterstitial({
      adId: AD_UNITS.interstitial,
      isTesting: true
    });
    await AdMob.showInterstitial();
    console.log("[Playhaus AdMob] Full screen Interstitial Ad closed.");
    return true;
  } catch (err) {
    console.error("[Playhaus AdMob] Interstitial failed to load:", err);
    return false;
  }
}

// ── REWARDED ADS (WATCH AD TO EARN +10 GEMS) ─────────────────────────────────
export async function showRewardedAd(onRewardedSuccess) {
  if (!isNative) {
    // Fallback: Elegant 5-second simulated video player overlay for Web
    return simulateAdWatch(onRewardedSuccess);
  }

  try {
    const AdMob = window.Capacitor?.Plugins?.AdMob;
    if (!AdMob) throw new Error("AdMob plugin not found on window.Capacitor.Plugins");
    
    // Preparation
    await AdMob.prepareRewardVideoAd({
      adId: AD_UNITS.rewarded,
      isTesting: true
    });

    // Wire up reward event listener
    const rewardListener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, async (reward) => {
      console.log("[Playhaus AdMob] Reward Earned! Crediting gems...", reward);
      await onRewardedSuccess();
      rewardListener.remove();
    });

    await AdMob.showRewardVideoAd();
    return true;
  } catch (err) {
    console.error("[Playhaus AdMob] Rewarded Video failed to load:", err);
    // If native fails, fallback to sandbox watch simulator to ensure zero block
    return simulateAdWatch(onRewardedSuccess);
  }
}

// ── IN-APP PURCHASES & SUBSCRIPTIONS (REVENUECAT / STOREKIT) ─────────────────
export async function purchaseGems(productId, gemAmount, onSuccess, onError) {
  if (!isNative) {
    return simulateStoreKitCheckout(productId, gemAmount, onSuccess, onError);
  }

  try {
    const Purchases = window.Capacitor?.Plugins?.Purchases;
    if (!Purchases) throw new Error("Purchases plugin not found on window.Capacitor.Plugins");
    
    // Configure once dynamically on demand
    try {
      await Purchases.configure({
        apiKey: "appl_playhaus_sandbox_key",
        appUserID: auth.currentUser.uid
      });
    } catch (e) {}

    // Fetch store product object first
    const productsResponse = await Purchases.getProducts({ productIdentifiers: [productId] });
    const products = productsResponse.products || [];
    const product = products.find(p => p.identifier === productId);
    if (!product) {
      throw new Error(`Product ${productId} not found in StoreKit catalog.`);
    }

    const purchaseResponse = await Purchases.purchaseStoreProduct({ product });
    const customerInfo = purchaseResponse.customerInfo || purchaseResponse;
    
    await onSuccess(gemAmount);
  } catch (err) {
    console.error("[Playhaus Purchases] Purchase failed:", err);
    if (err.userCancelled) {
      console.log("[Playhaus Purchases] User cancelled App Store sheet.");
    } else {
      onError(err.message || "App Store transaction failed.");
    }
  }
}

export async function purchaseVipMembership(onSuccess, onError) {
  if (!isNative) {
    return simulateStoreKitVipCheckout(onSuccess, onError);
  }

  try {
    const Purchases = window.Capacitor?.Plugins?.Purchases;
    if (!Purchases) throw new Error("Purchases plugin not found on window.Capacitor.Plugins");
    
    // Configure once dynamically on demand
    try {
      await Purchases.configure({
        apiKey: "appl_playhaus_sandbox_key",
        appUserID: auth.currentUser.uid
      });
    } catch (e) {}

    const productId = "fun.playhaus.vip_monthly";
    const productsResponse = await Purchases.getProducts({ productIdentifiers: [productId] });
    const products = productsResponse.products || [];
    const product = products.find(p => p.identifier === productId);
    if (!product) {
      throw new Error(`VIP Subscription product ${productId} not found in StoreKit catalog.`);
    }

    const purchaseResponse = await Purchases.purchaseStoreProduct({ product });
    const customerInfo = purchaseResponse.customerInfo || purchaseResponse;
    
    // Verify entitlement state
    const hasVip = customerInfo.entitlements.active['vip_membership'] !== undefined;
    if (hasVip) {
      window.isPlayhausVip = true;
      await updateDoc(doc(db, "users", auth.currentUser.uid), { isVip: true });
      await onSuccess();
    } else {
      onError("Subscription validation failed. Please contact Support.");
    }
  } catch (err) {
    console.error("[Playhaus Purchases] VIP Purchase failed:", err);
    if (err.userCancelled) {
      console.log("[Playhaus Purchases] User cancelled subscription sheet.");
    } else {
      onError(err.message || "App Store subscription failed.");
    }
  }
}

// ── WEB SANDBOX SIMULATORS & PREMIUM VISUAL FALLBACKS ────────────────────────

// 1. Web Watch-Ad Simulator
function simulateAdWatch(onSuccess) {
  const checkoutModal = document.getElementById('checkout-modal');
  const checkoutStatus = document.getElementById('checkout-status');
  const checkoutDesc = document.getElementById('checkout-desc');

  if (!checkoutModal) return false;

  checkoutModal.style.display = 'flex';
  checkoutStatus.innerText = "Loading Reward Video...";
  checkoutDesc.innerText = "Buffering video stream from Google AdMob partner network.";

  setTimeout(() => {
    let countdown = 5;
    checkoutStatus.innerText = `Commercial Playing (${countdown}s)...`;
    checkoutDesc.innerText = "🍿 Watching sponsored game trailer. Earn +10 Gems upon completion!";

    const interval = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        checkoutStatus.innerText = `Commercial Playing (${countdown}s)...`;
      } else {
        clearInterval(interval);
        checkoutModal.style.display = 'none';
        onSuccess();
      }
    }, 1000);
  }, 1200);

  return true;
}

// 2. Web StoreKit Consumable Gems Simulator
function simulateStoreKitCheckout(productId, gemAmount, onSuccess, onError) {
  const checkoutModal = document.getElementById('checkout-modal');
  const checkoutStatus = document.getElementById('checkout-status');
  const checkoutDesc = document.getElementById('checkout-desc');

  if (!checkoutModal) return;

  checkoutModal.style.display = 'flex';
  checkoutStatus.innerText = "Contacting App Store...";
  checkoutDesc.innerText = `Establishing a secure Sandbox checkout connection for pack: "${productId}".`;

  setTimeout(() => {
    checkoutStatus.innerText = "Apple Pay verification active...";
    checkoutDesc.innerText = `Processing simulated Sandbox payment. Please authorize transaction using Face ID / Touch ID.`;

    setTimeout(async () => {
      try {
        await onSuccess(gemAmount);
        checkoutModal.style.display = 'none';
      } catch (err) {
        console.error(err);
        checkoutModal.style.display = 'none';
        onError(err.message);
      }
    }, 3000);
  }, 1500);
}

// 3. Web StoreKit Recurring VIP Subscription Simulator
function simulateStoreKitVipCheckout(onSuccess, onError) {
  const checkoutModal = document.getElementById('checkout-modal');
  const checkoutStatus = document.getElementById('checkout-status');
  const checkoutDesc = document.getElementById('checkout-desc');

  if (!checkoutModal) return;

  checkoutModal.style.display = 'flex';
  checkoutStatus.innerText = "Contacting App Store...";
  checkoutDesc.innerText = "Fetching recurring plan 'fun.playhaus.vip_monthly' ($4.99/mo) sheet.";

  setTimeout(() => {
    checkoutStatus.innerText = "Authorize VIP Club Subscription...";
    checkoutDesc.innerText = "Verify Monthly Subscription: $4.99/month. Double click side button to subscribe via Apple Pay.";

    setTimeout(async () => {
      try {
        window.isPlayhausVip = true;
        await updateDoc(doc(db, "users", auth.currentUser.uid), { isVip: true });
        await onSuccess();
        checkoutModal.style.display = 'none';
      } catch (err) {
        console.error(err);
        checkoutModal.style.display = 'none';
        onError(err.message);
      }
    }, 3500);
  }, 1500);
}
