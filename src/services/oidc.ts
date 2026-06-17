import { UserManager, WebStorageStateStore } from "oidc-client-ts";

let userManager: UserManager | null = null;

function createUserManager(): UserManager {
  if (userManager) return userManager;

  const authority =
    import.meta.env.VITE_ZITADEL_AUTHORITY || "https://auth.jawafdehi.org";
  const client_id = import.meta.env.VITE_ZITADEL_CLIENT_ID || "";
  const projectAudience =
    import.meta.env.VITE_ZITADEL_PROJECT_ID || "377590446026654060";
  const origin = window.location.origin;

  userManager = new UserManager({
    authority,
    client_id,
    redirect_uri: `${origin}/portal/callback`,
    post_logout_redirect_uri: `${origin}/portal/login`,
    response_type: "code",
    scope: `openid profile email urn:zitadel:iam:org:project:id:${projectAudience}:aud`,
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
