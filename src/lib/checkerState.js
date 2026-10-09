// What the Story Clarity Checker remembers in the visitor's own browser.
// Every call is wrapped in try/catch because storage can be blocked (private mode, strict settings).

const KEYS = {
    tried: 'sc:tried',
    subscribed: 'sc:subscribed',
    rated: 'sc:rated',
    draft: 'sc:draft',
  }
  
  const read = (key) => {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  }
  const write = (key, value) => {
    try {
      localStorage.setItem(key, value)
    } catch {
      /* storage unavailable, the checker still works for this visit */
    }
  }
  const remove = (key) => {
    try {
      localStorage.removeItem(key)
    } catch {
      /* ignore */
    }
  }
  
  export const hasTried = () => read(KEYS.tried) === '1'
  export const markTried = () => write(KEYS.tried, '1')
  
  // Call markSubscribed() anywhere a visitor successfully subscribes (e.g. in subscribeForm.jsx)
  // so the site stops asking them to subscribe.
  export const isSubscribed = () => read(KEYS.subscribed) === '1'
  export const markSubscribed = () => write(KEYS.subscribed, '1')
  
  export const hasRated = () => read(KEYS.rated) === '1'
  export const markRated = () => write(KEYS.rated, '1')
  
  // Their answers so far, so they can pause and come back.
  export function loadDraft() {
    try {
      return JSON.parse(read(KEYS.draft)) ?? null
    } catch {
      return null
    }
  }
  export const saveDraft = (draft) => write(KEYS.draft, JSON.stringify(draft))
  export const clearDraft = () => remove(KEYS.draft)