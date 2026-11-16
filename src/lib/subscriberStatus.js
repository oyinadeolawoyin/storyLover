// Remembers, in this browser only, that the visitor has joined the list.
// Used so a returning subscriber is not asked to subscribe again.
// (Kept separate from commenterIdentity on purpose: leaving an email on a comment is not subscribing.)
const KEY = 'storylover_subscribed'

export function isSubscribed() {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function markSubscribed() {
  try {
    localStorage.setItem(KEY, '1')
  } catch {
    // storage blocked: they will just see the form again next time
  }
}