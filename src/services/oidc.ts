import { UserManager, WebStorageStateStore } from "oidc-client-ts";

let userManager: UserManager | null = null;

function createUserManager(): UserManager {
  if (userManager) return userManager;

  const authority =
    import.meta.env.VITE_OIDC_AUTHORITY || "https://auth.jawafdehi.org";
  const client_id = import.meta.env.VITE_OIDC_CLIENT_ID || "";
  // The token audience (the IdP's project/resource id) is supplied via env, not
  // hardcoded. When set, request its `:aud` scope so the access token's `aud`
  // carries the id the API validates against. NOTE: the scope URN below is the
  // current provider's (Zitadel) format — revisit if the IdP changes.
  const audience = import.meta.env.VITE_OIDC_AUDIENCE || "";
  const origin = window.location.origin;

  const scope = ["openid", "profile", "email"];
  if (audience) {
    scope.push(`urn:zitadel:iam:org:project:id:${audience}:aud`);
  }

  userManager = new UserManager({
    authority,
    client_id,
    redirect_uri: `${origin}/portal/callback`,
    post_logout_redirect_uri: `${origin}/portal/login`,
    response_type: "code",
    scope: scope.join(" "),
    // Pull the flattened `roles` claim (and profile) from the userinfo endpoint
    // into user.profile so the SPA can gate the UI without a Django round-trip.
    loadUserInfo: true,
    userStore: new WebStorageStateStore({ store: window.localStorage }),
    automaticSilentRenew: true,
  });

  return userManager;
}

export function getUserManager(): UserManager {
  return createUserManager();
}

export const oidcConfig = {
  get userManager() {
    return getUserManager();
  },
  onSigninCallback: () => {
    // Strip the ?code&state query params so a refresh on /portal/callback does
    // not re-process a spent authorization code. Path-level navigation is done
    // by the CaseworkCallback component (which is React Router-aware).
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};

export async function getAccessToken(): Promise<string | null> {
  const um = getUserManager();
  const user = await um.getUser();
  return user && !user.expired ? user.access_token : null;
}
