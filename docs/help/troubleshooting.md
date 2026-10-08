+++
title = "Troubleshooting"
weight = 90
+++

# Troubleshooting

## Signing in

"Wrong username or password." Check both. Usernames are not email addresses. If you recently changed your password, use the new one.

"Invalid or expired code." The 6-digit code changes every 30 seconds and depends on your device's clock. Make sure your phone's time is set automatically, then try the next code. A backup code also works.

"Verification failed. Please try again." The check that proves you are not a bot did not pass. Reload the page and try again.

Signed out unexpectedly. Changing your password ends every session. Sign in again.

## Sending

A clock icon that does not go away means the message has not reached the server. Check your connection. The app reconnects on its own and reloads state when it does.

"Upload failed. The file may exceed the size limit." See [Attachments](/help/attachments).

## Notifications

Nothing appears. Check your browser's site settings for goChatHub, and see [Notifications](/help/notifications).

## Messages from the server

The app turns the server's error codes into these situations:

- forbidden: your role does not allow the action, for example deleting a group you do not administer.
- not_found: the room or message no longer exists, or you were removed from it.
- rate_limited: too many attempts in a short time. Wait a minute and try again.
- validation: the server rejected the input, such as a name that is too short.
- internal: something failed on the server. Try again, and tell your administrator if it keeps happening.

## Still stuck

Reload the page. If a new version is waiting, choose Upgrade when the banner appears. If that does not help, send your administrator the time it happened and what you were doing.
