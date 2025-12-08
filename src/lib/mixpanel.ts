import mixpanel from "mixpanel-browser";

const MIXPANEL_TOKEN = "6b318b0444bec1f86c2c056802028ef9";

let initialized = false;

export function initMixpanel() {
  if (initialized || typeof window === "undefined") return;

  try {
    mixpanel.init(MIXPANEL_TOKEN, {
      debug: true,
      track_pageview: "full-url",
      persistence: "localStorage",
      ignore_dnt: true,
      autocapture: {
        pageview: true,
        click: true,
        input: true,
        scroll: true,
        submit: true,
      },
      record_sessions_percent: 100,
    });

    initialized = true;
    console.log("[Mixpanel] Initialized successfully");
  } catch (error) {
    console.error("[Mixpanel] Initialization failed:", error);
  }
}

export function identifyUser(userId: string, properties?: {
  email?: string;
  name?: string;
  credits?: number;
  role?: string;
  createdAt?: string;
}) {
  if (typeof window === "undefined") return;

  console.log("[Mixpanel] Identifying user:", userId);
  mixpanel.identify(userId);

  if (properties) {
    mixpanel.people.set({
      $email: properties.email,
      $name: properties.name,
      credits: properties.credits,
      role: properties.role,
      $created: properties.createdAt,
    });
    console.log("[Mixpanel] User properties set:", properties);

    // Track a user identified event to ensure data flows
    mixpanel.track("User Identified", {
      user_id: userId,
      email: properties.email,
    });
  }
}

export function resetUser() {
  if (typeof window === "undefined") return;
  console.log("[Mixpanel] Resetting user");
  mixpanel.reset();
}

export function trackSignUp(properties: {
  userId: string;
  email: string;
  signupMethod: "email" | "google" | "apple";
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}) {
  if (typeof window === "undefined") return;

  mixpanel.track("Sign Up", {
    user_id: properties.userId,
    email: properties.email,
    signup_method: properties.signupMethod,
    utm_source: properties.utmSource,
    utm_medium: properties.utmMedium,
    utm_campaign: properties.utmCampaign,
  });
}

export function trackSignIn(properties: {
  userId: string;
  loginMethod: "email" | "google" | "apple";
  success: boolean;
}) {
  if (typeof window === "undefined") return;

  mixpanel.track("Sign In", {
    user_id: properties.userId,
    login_method: properties.loginMethod,
    success: properties.success,
  });
}

export function trackPurchase(properties: {
  userId: string;
  transactionId: string;
  revenue: number;
  currency: string;
  creditsPurchased: number;
  packageName: string;
}) {
  if (typeof window === "undefined") return;

  mixpanel.track("Purchase", {
    user_id: properties.userId,
    transaction_id: properties.transactionId,
    revenue: properties.revenue,
    currency: properties.currency,
    credits_purchased: properties.creditsPurchased,
    package_name: properties.packageName,
  });

  mixpanel.people.track_charge(properties.revenue, {
    transaction_id: properties.transactionId,
    credits_purchased: properties.creditsPurchased,
  });
}

export function trackConversion(properties: {
  userId: string;
  conversionType: "image_processed";
  sceneName: string;
  sceneId: string;
  creditCost: number;
}) {
  if (typeof window === "undefined") return;

  mixpanel.track("Conversion", {
    user_id: properties.userId,
    conversion_type: properties.conversionType,
    scene_name: properties.sceneName,
    scene_id: properties.sceneId,
    credit_cost: properties.creditCost,
  });
}

export function trackImageProcessed(properties: {
  userId: string;
  imageId: string;
  sceneName: string;
  sceneId: string;
  creditCost: number;
  processingTime?: number;
}) {
  if (typeof window === "undefined") return;

  mixpanel.track("Image Processed", {
    user_id: properties.userId,
    image_id: properties.imageId,
    scene_name: properties.sceneName,
    scene_id: properties.sceneId,
    credit_cost: properties.creditCost,
    processing_time_ms: properties.processingTime,
  });
}

export function trackError(properties: {
  errorType: string;
  errorMessage: string;
  errorCode?: string;
  pageUrl?: string;
  userId?: string;
}) {
  if (typeof window === "undefined") return;

  mixpanel.track("Error", {
    error_type: properties.errorType,
    error_message: properties.errorMessage,
    error_code: properties.errorCode,
    page_url: properties.pageUrl || window.location.href,
    user_id: properties.userId,
  });
}

export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  mixpanel.track(eventName, properties);
}

export { mixpanel };
