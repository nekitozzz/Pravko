# Manual Test Plan — Pravko

Comprehensive manual test plan for outsource QA. Covers happy paths, error scenarios, and edge cases.

## Environment Setup

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5296 |
| API | http://localhost:3456/api |
| Logto (auth) | http://localhost:4001 |
| Logto admin | http://localhost:4002 |
| MailPit (email) | http://localhost:4026 |
| MinIO console | http://localhost:4091 |

### Test Accounts

Create two test accounts via sign-up flow:
- **User A** (primary tester): `tester-a@test.local`
- **User B** (secondary tester): `tester-b@test.local`

Verification codes arrive in MailPit at http://localhost:4026.

### Bypass Billing (Local Dev)

New teams have no subscription. To activate for testing:

```bash
docker exec pravko-postgres-1 psql -U pravko -d pravko \
  -c "UPDATE teams SET billing_status = 'active', plan = 'basic' WHERE slug = '<team-slug>';"
```

---

## 1. Homepage & Marketing Pages

### 1.1 Homepage loads correctly
1. Open http://localhost:5296
2. **Expected**: "ПРАВКО." hero with green background renders
3. **Expected**: Navigation shows "ЦЕНЫ", "СРАВНЕНИЕ", "ВОЙТИ", "НАЧАТЬ"
4. **Expected**: No console errors (F12 > Console)

### 1.2 Navigation links work
1. Click "ЦЕНЫ" in header
2. **Expected**: Pricing page loads at `/pricing` with plan cards
3. Click "СРАВНЕНИЕ" dropdown > "Frame.io"
4. **Expected**: Comparison page loads at `/compare/frameio`
5. Navigate back, click "СРАВНЕНИЕ" > "Wipster"
6. **Expected**: Comparison page loads at `/compare/wipster`

### 1.3 Footer links work
1. Scroll to bottom of homepage
2. Click each footer link
3. **Expected**: All links navigate to correct pages, no 404s

### 1.4 Theme toggle
1. Click the moon/sun icon (top-right or in theme toggle)
2. **Expected**: Page switches between light and dark mode
3. **Expected**: Preference persists after page reload

### 1.5 Mobile responsive
1. Open DevTools (F12) > toggle device toolbar (Ctrl+Shift+M)
2. Set width to 375px (iPhone)
3. **Expected**: Navigation collapses to mobile menu
4. **Expected**: Hero text scales down, no horizontal overflow
5. **Expected**: All sections readable and tappable

---

## 2. Authentication

### 2.1 Sign-up — happy path
1. Click "НАЧАТЬ" or "ВОЙТИ"
2. **Expected**: Redirects to Logto sign-in at `localhost:4001`
3. Click "Создать аккаунт" link
4. Enter email `tester-a@test.local`, set password (8+ chars)
5. Open MailPit (http://localhost:4026), find verification code
6. Enter code
7. **Expected**: Redirects to `/dashboard` after sign-up

### 2.2 Sign-in — happy path
1. Sign out first (if signed in)
2. Click "ВОЙТИ"
3. Enter email and password for existing account
4. **Expected**: Redirects to `/dashboard`

### 2.3 Sign-in — wrong password
1. Click "ВОЙТИ"
2. Enter valid email but wrong password
3. **Expected**: Error message shown (Logto handles this)
4. **Expected**: Not redirected to dashboard

### 2.4 Sign-in — non-existent email
1. Click "ВОЙТИ"
2. Enter email that was never registered: `nobody@test.local`
3. **Expected**: Error or "account not found" message

### 2.5 Sign-out
1. While signed in, click user avatar in dashboard header
2. Click "Выйти"
3. **Expected**: Redirected to homepage or sign-in
4. Navigate to http://localhost:5296/dashboard
5. **Expected**: Redirected to sign-in (cannot access dashboard)

### 2.6 Direct dashboard access without auth
1. Clear cookies / use incognito window
2. Navigate to http://localhost:5296/dashboard
3. **Expected**: Redirected to sign-in page

### 2.7 Auth callback with invalid state
1. Navigate to http://localhost:5296/auth/callback?code=fake&state=fake
2. **Expected**: Error handled gracefully, no crash, redirected to sign-in

---

## 3. Team Management

### 3.1 Create team — happy path
1. Sign in as User A
2. If no teams exist: "СОЗДАЙТЕ СВОЮ ПЕРВУЮ КОМАНДУ" should be shown
3. Click "СОЗДАТЬ КОМАНДУ" button
4. Enter team name: "Тестовая команда"
5. Click "СОЗДАТЬ"
6. **Expected**: Redirected to team page `/dashboard/<team-id>`
7. **Expected**: Team name shown in header

### 3.2 Create team — empty name
1. Open create team dialog
2. Leave name field empty
3. Click "СОЗДАТЬ"
4. **Expected**: Validation error, team not created

### 3.3 Create multiple teams
1. Create "Команда 1"
2. Navigate back to dashboard
3. Create "Команда 2"
4. **Expected**: Both teams listed on dashboard
5. **Expected**: Can navigate between them

### 3.4 Team slug uniqueness
1. Create team "Test"
2. Create another team "Test"
3. **Expected**: Second team gets slug `test-1` (auto-incremented)

### 3.5 Delete team — no subscription
1. Navigate to team settings
2. Click "Удалить команду"
3. **Expected**: Confirmation dialog appears
4. Confirm deletion
5. **Expected**: Team deleted, redirected to dashboard

### 3.6 Delete team — with active subscription
1. Activate a subscription on a team (via DB bypass)
2. Try to delete the team
3. **Expected**: Error: "Cannot delete a team with an active subscription"

### 3.7 Team settings — update name
1. Navigate to team settings
2. Change team name
3. Save
4. **Expected**: Name updated in header and settings

---

## 4. Team Members & Invites

### 4.1 Invite member — happy path
1. Sign in as User A (team owner)
2. Go to team settings > Members section
3. Click "Пригласить"
4. Enter User B's email: `tester-b@test.local`
5. Select role: "member"
6. Click send
7. **Expected**: Invite appears in pending list
8. **Expected**: Email sent (check MailPit)
9. Open invite link from email as User B
10. **Expected**: Invite acceptance page shows team name and role
11. Accept invite
12. **Expected**: User B now appears in team members list

### 4.2 Invite — email already a member
1. Try to invite User B again (already a member)
2. **Expected**: Error: "User is already a member of this team"

### 4.3 Invite — wrong email accepts
1. Send invite to `specific@test.local`
2. Sign in as User B (`tester-b@test.local`)
3. Open the invite link
4. **Expected**: Error: email mismatch, cannot accept

### 4.4 Invite — expired (7+ days)
1. Send an invite
2. Manually expire it in DB:
   ```sql
   UPDATE team_invites SET expires_at = NOW() - INTERVAL '1 day' WHERE email = 'target@test.local';
   ```
3. Open invite link
4. **Expected**: "Invite has expired" message

### 4.5 Revoke invite
1. Send an invite
2. In pending invites list, click "Отменить" / revoke
3. **Expected**: Invite removed from list
4. Open the invite link
5. **Expected**: Invalid/not found

### 4.6 Remove member
1. As owner, go to team members
2. Click remove on User B
3. **Expected**: User B removed from members list
4. Sign in as User B
5. **Expected**: Team no longer visible in User B's dashboard

### 4.7 Cannot remove team owner
1. Try to remove the owner from members list
2. **Expected**: Option not available or error: "Cannot remove the team owner"

### 4.8 Change member role
1. As owner, change User B's role from "member" to "admin"
2. **Expected**: Role updates immediately
3. Change back to "viewer"
4. **Expected**: Role updates

### 4.9 Cannot change owner's role
1. Try to change the owner's role
2. **Expected**: Option not available or error: "Cannot change the team owner's role"

### 4.10 Owner cannot leave team
1. As owner, try to leave the team
2. **Expected**: Error: "Team owner cannot leave. Transfer ownership first."

### 4.11 Member leaves team
1. Sign in as User B (member of team)
2. Go to team settings
3. Click "Покинуть команду" / leave
4. **Expected**: Removed from team, redirected to dashboard

### 4.12 Viewer cannot upload
1. Invite User B as "viewer"
2. Sign in as User B
3. Navigate to a project
4. **Expected**: Upload button/zone not shown or disabled
5. Try API call directly:
   ```
   POST /api/projects/<id>/videos
   Authorization: Bearer <token>
   ```
6. **Expected**: 403 error

### 4.13 Viewer cannot create project
1. Sign in as User B with "viewer" role
2. **Expected**: "Создать проект" button not shown or disabled

---

## 5. Projects

### 5.1 Create project — happy path
1. Sign in as owner/member with active subscription
2. Navigate to team page
3. Click "СОЗДАТЬ ПРОЕКТ"
4. Enter name: "Тестовый проект"
5. Click "СОЗДАТЬ"
6. **Expected**: Redirected to project page
7. **Expected**: Upload drop zone visible

### 5.2 Create project — no subscription
1. Create a team without activating subscription
2. Try to create a project
3. **Expected**: Error about subscription required (402)

### 5.3 Create project — empty name
1. Open create project dialog
2. Leave name empty
3. Click "СОЗДАТЬ"
4. **Expected**: Validation error

### 5.4 Project list on team page
1. Create 3 projects
2. Navigate to team page
3. **Expected**: All 3 projects listed with names and video counts (0 initially)

### 5.5 Delete project
1. As admin/owner, find delete option on project
2. Confirm deletion
3. **Expected**: Project removed from list
4. **Expected**: All videos in project also deleted

### 5.6 Delete project as member (insufficient role)
1. Sign in as "member" role
2. Try to delete a project
3. **Expected**: Delete option not shown or 403 error

---

## 6. Video Upload

### 6.1 Upload video — happy path (small file)
1. Navigate to a project
2. Click upload zone or "ЗАГРУЗИТЬ" button
3. Select a small MP4 file (< 50 MiB)
4. **Expected**: Upload progress indicator appears
5. **Expected**: After upload: video status changes to "processing"
6. **Expected**: After transcode: status changes to "ready", thumbnail appears
7. Click on video
8. **Expected**: HLS player loads and plays the video

### 6.2 Upload video — drag and drop
1. Open project page
2. Drag a video file from Finder onto the drop zone
3. **Expected**: Drop zone highlights on drag-over
4. **Expected**: Upload starts on drop

### 6.3 Upload video — large file (multipart)
1. Select a video file > 50 MiB
2. **Expected**: Multipart upload begins (multiple progress chunks)
3. **Expected**: Video eventually reaches "ready" status

### 6.4 Upload — unsupported format
1. Try to upload a `.pdf`, `.jpg`, or `.txt` file
2. **Expected**: Error: "Unsupported video format. Allowed: mp4, mov, webm, mkv, avi."
3. **Expected**: File rejected before upload starts (client-side validation)

### 6.5 Upload — wrong MIME type with video extension
1. Rename a `.txt` file to `.mp4`
2. Try to upload it
3. **Expected**: Either client-side rejection or server-side failure during transcode

### 6.6 Upload — cancel mid-upload
1. Start uploading a large file
2. Click cancel/X on the upload progress
3. **Expected**: Upload aborted
4. **Expected**: Video status set to "failed" or cleaned up

### 6.7 Upload — no subscription
1. Remove subscription from team:
   ```sql
   UPDATE teams SET billing_status = 'not_subscribed' WHERE slug = '<slug>';
   ```
2. Try to upload
3. **Expected**: Error 402: subscription required

### 6.8 Upload — storage limit exceeded
1. Set team to basic plan (100 GiB limit)
2. Set team storage near limit:
   ```sql
   UPDATE teams SET storage_used_bytes = 107374182300 WHERE slug = '<slug>';
   ```
3. Try to upload a video
4. **Expected**: Error 402: "Storage limit reached for the basic plan"

### 6.9 Upload — 0 byte file
1. Create an empty file with .mp4 extension
2. Try to upload it
3. **Expected**: Error: "Video file size must be greater than zero."

### 6.10 Upload — multiple files simultaneously
1. Start uploading file A
2. While A is in progress, start uploading file B (to same or different project)
3. **Expected**: Both uploads tracked independently with separate progress
4. **Expected**: Both videos appear in project after completion

### 6.11 Upload — network interruption
1. Start uploading a large file
2. Disconnect network / throttle to offline in DevTools
3. Wait 5-10 seconds, reconnect
4. **Expected**: Upload retries or shows a clear error
5. **Expected**: Video status reflects failure if unrecoverable

---

## 7. Video Player & Playback

### 7.1 Play video — happy path
1. Navigate to a "ready" video
2. **Expected**: HLS player loads with poster thumbnail
3. Click play
4. **Expected**: Video plays smoothly
5. **Expected**: Seek bar works, can jump to any position

### 7.2 Play video — processing status
1. Click on a video that is still "processing"
2. **Expected**: Processing indicator shown (not a broken player)
3. **Expected**: Player not shown or shows "processing" message

### 7.3 Play video — failed status
1. Click on a video with "failed" status
2. **Expected**: Error message shown with uploadError text
3. **Expected**: No broken player UI

### 7.4 Video metadata edit
1. Open a video
2. Edit the title
3. **Expected**: Title updates
4. Edit the description
5. **Expected**: Description updates

### 7.5 Delete video
1. As admin/owner, click delete on a video
2. **Expected**: Confirmation dialog
3. Confirm
4. **Expected**: Video removed from project list
5. **Expected**: S3 objects cleaned up (raw, hls, thumb)

### 7.6 Delete video — insufficient role
1. Sign in as "member"
2. Try to delete a video
3. **Expected**: Delete option hidden or 403 error (admin required)

### 7.7 Workflow status change
1. Open a video in "review" status
2. Change to "rework"
3. **Expected**: Badge updates to "rework"
4. Change to "done"
5. **Expected**: Badge updates to "done"
6. Navigate to project list
7. **Expected**: Workflow status visible on video card

### 7.8 Video visibility toggle
1. Open video share/settings
2. Set visibility to "private"
3. **Expected**: Video no longer accessible via public URL `/watch/<publicId>`
4. Set visibility back to "public"
5. **Expected**: Video accessible again at `/watch/<publicId>`

### 7.9 Download video
1. Open a ready video
2. Click download button
3. **Expected**: Browser starts downloading the original file
4. **Expected**: Filename matches video title

### 7.10 Download video — no subscription
1. Remove subscription
2. Try to download
3. **Expected**: Error 402: subscription required

---

## 8. Comments

### 8.1 Post comment — happy path
1. Open a ready video
2. Pause at a specific timestamp (e.g., 00:05)
3. Type a comment in the input field
4. Submit
5. **Expected**: Comment appears in the list with timestamp "0:05"
6. **Expected**: Comment marker appears on the video timeline

### 8.2 Click comment timestamp
1. Post a comment at timestamp 00:10
2. Click on the timestamp "0:10" in the comment
3. **Expected**: Video seeks to 00:10

### 8.3 Reply to comment (threading)
1. Click reply on an existing comment
2. Type a reply
3. Submit
4. **Expected**: Reply appears nested under the parent comment

### 8.4 Reply to deleted comment
1. Post a comment, then reply to it
2. Delete the parent comment
3. **Expected**: Reply is also soft-deleted (or orphaned gracefully)

### 8.5 Edit own comment
1. Post a comment
2. Click edit on your own comment
3. Change the text
4. Save
5. **Expected**: Comment text updated

### 8.6 Edit someone else's comment
1. Sign in as User B
2. Try to edit a comment posted by User A
3. **Expected**: Edit option not available or 403 error

### 8.7 Delete own comment
1. Post a comment
2. Click delete on your own comment
3. **Expected**: Comment removed from list (soft-deleted)

### 8.8 Admin deletes another user's comment
1. Sign in as admin/owner
2. Delete a comment posted by a member
3. **Expected**: Comment deleted successfully

### 8.9 Viewer cannot delete other's comments
1. Sign in as viewer
2. **Expected**: Delete option not shown on other users' comments

### 8.10 Resolve comment
1. As a member+, click resolve on a comment
2. **Expected**: Comment marked as resolved (visual indicator)
3. Click resolve again
4. **Expected**: Comment unmarked (toggled back)

### 8.11 Empty comment
1. Try to submit an empty comment (just spaces)
2. **Expected**: Validation prevents submission

### 8.12 Comment on processing video
1. Navigate to a video in "processing" status
2. Try to post a comment
3. **Expected**: Either comment allowed (timestamps may be off) or blocked

### 8.13 Real-time comment updates
1. Open the same video in two browser tabs/windows (same user or different users)
2. Post a comment in Tab 1
3. **Expected**: Comment appears in Tab 2 without refresh (WebSocket push)

---

## 9. Share Links

### 9.1 Create share link — no protection
1. Open a ready video
2. Open share dialog
3. Click "Создать ссылку" (no password, no expiration, no email)
4. **Expected**: Share link generated
5. Copy link
6. Open link in incognito window
7. **Expected**: Video plays for anonymous user

### 9.2 Share link — with password
1. Create a share link with password "test123"
2. Open link in incognito window
3. **Expected**: Password prompt shown
4. Enter correct password "test123"
5. **Expected**: Video loads and plays
6. **Expected**: View count incremented

### 9.3 Share link — wrong password
1. Open a password-protected share link
2. Enter wrong password "wrongpass"
3. **Expected**: Error: "Неверный пароль" or similar
4. **Expected**: Video does not load

### 9.4 Share link — password lockout (5 failed attempts)
1. Open a password-protected share link
2. Enter wrong password 5 times in a row
3. **Expected**: After 5th attempt, locked out for 10 minutes
4. **Expected**: Even correct password rejected during lockout
5. Wait 10 minutes (or update DB to clear lockout)
6. Enter correct password
7. **Expected**: Access granted

### 9.5 Share link — password too long (> 256 chars)
1. Create a share link with a password longer than 256 characters
2. **Expected**: Error: "Password is too long"

### 9.6 Share link — with expiration
1. Create a share link with expiration: 1 day
2. Open link immediately
3. **Expected**: Video loads
4. Manually expire in DB:
   ```sql
   UPDATE share_links SET expires_at = NOW() - INTERVAL '1 hour' WHERE token = '<token>';
   ```
5. Open link again
6. **Expected**: "Link expired" message

### 9.7 Share link — with email restriction
1. Create a share link restricted to `allowed@test.local`
2. Open link in incognito (not signed in)
3. **Expected**: Prompted to sign in
4. Sign in as `allowed@test.local`
5. **Expected**: Video loads
6. Sign in as `other@test.local`
7. **Expected**: Access denied (email mismatch)

### 9.8 Share link — delete
1. Create a share link
2. Copy the link URL
3. Delete the share link from the dialog
4. Open the copied URL
5. **Expected**: "Link not found" message

### 9.9 Share link — video deleted after link creation
1. Create a share link for a video
2. Delete the video
3. Open the share link
4. **Expected**: Error or "video not found" message

### 9.10 Share link — video set to private
1. Create a share link for a public video
2. Change video visibility to "private"
3. Open the share link
4. **Expected**: Share link should still work (share links bypass visibility for link holders)

### 9.11 Share link — download toggle
1. Create a share link with "Allow download" enabled
2. Open link as guest
3. **Expected**: Download button visible
4. Create another link with download disabled
5. Open that link
6. **Expected**: No download button

### 9.12 Share link — view count
1. Create a share link
2. Note the view count (should be 0)
3. Access the link 3 times (different incognito sessions or clear grants)
4. Check view count in share dialog
5. **Expected**: View count = 3

### 9.13 Share link — grant expiration (24 hours)
1. Access a share link, get the grant
2. Manually expire the grant in DB:
   ```sql
   UPDATE share_access_grants SET expires_at = NOW() - INTERVAL '1 hour' WHERE share_link_id = '<id>';
   ```
3. Try to access playback
4. **Expected**: Grant expired, must re-authenticate (enter password again if applicable)

---

## 10. Guest Comments (via Share Links)

### 10.1 Guest comment — happy path
1. Open a share link as unauthenticated user
2. Enter guest name: "Иван Тестов"
3. Type a comment at a timestamp
4. Submit
5. **Expected**: Comment appears with guest name
6. **Expected**: Comment visible to team members on the video

### 10.2 Guest comment — empty name
1. Open a share link
2. Leave guest name empty
3. Try to post a comment
4. **Expected**: Error: "Guest name is required (1-100 characters)"

### 10.3 Guest comment — name too long (> 100 chars)
1. Enter a guest name with 101+ characters
2. Try to post a comment
3. **Expected**: Error: "Guest name is required (1-100 characters)"

### 10.4 Guest comment — max name length (100 chars)
1. Enter exactly 100 characters as guest name
2. Post a comment
3. **Expected**: Comment posted successfully

### 10.5 Guest reply to existing comment
1. As guest, open a share link to a video that has comments
2. Click reply on a comment
3. Post reply
4. **Expected**: Reply appears nested under parent

---

## 11. Public Video Page (`/watch/<publicId>`)

### 11.1 View public video — happy path
1. Set a video to visibility="public" and status="ready"
2. Navigate to `/watch/<publicId>`
3. **Expected**: Video page loads with player
4. **Expected**: Comment sidebar/section visible

### 11.2 View public video — not ready
1. Navigate to `/watch/<publicId>` for a video in "processing" status
2. **Expected**: Error or "video not available" page

### 11.3 View public video — private visibility
1. Set video visibility to "private"
2. Navigate to `/watch/<publicId>`
3. **Expected**: Error or "video not available" page

### 11.4 View public video — non-existent publicId
1. Navigate to `/watch/nonexistent_id_12345`
2. **Expected**: 404 or "video not found" page

### 11.5 Comment on public video — authenticated
1. Sign in
2. Open `/watch/<publicId>`
3. Post a comment
4. **Expected**: Comment posted with your username

### 11.6 Comment on public video — not authenticated
1. Open `/watch/<publicId>` in incognito
2. Try to post a comment
3. **Expected**: Prompted to sign in

---

## 12. Billing & Subscription

### 12.1 View billing page
1. As team owner, go to team settings > billing section
2. **Expected**: Current plan, storage used, storage limit shown
3. **Expected**: Upgrade/manage buttons visible

### 12.2 Only owner can manage billing
1. Sign in as admin (not owner)
2. Go to team settings > billing
3. **Expected**: Billing management options hidden or disabled
4. **Expected**: "Only team owners can manage billing" if tried via API

### 12.3 Checkout — basic plan
1. As owner, click checkout for basic plan
2. **Expected**: Redirect to YooKassa payment page
3. (In test mode) Complete payment
4. **Expected**: Team plan updated to "basic", billingStatus="active"

### 12.4 Checkout — already on same plan
1. Team already on "basic" plan with active subscription
2. Try to checkout "basic" again
3. **Expected**: Error: "This team is already on this plan"

### 12.5 Cancel subscription
1. As owner with active subscription
2. Click cancel subscription
3. **Expected**: Confirmation dialog
4. Confirm
5. **Expected**: billingStatus changes, cancellation email sent
6. **Expected**: Grace period noted (can still use until period end + 10 days)

### 12.6 Cancel — not subscribed
1. Team with no subscription
2. Try to cancel
3. **Expected**: Error: "This team does not have an active subscription"

### 12.7 Feature gating without subscription
1. Remove subscription from team
2. Try each gated action:
   - [ ] Create project → **Expected**: 402 error
   - [ ] Upload video → **Expected**: 402 error
   - [ ] Post comment → **Expected**: 402 error
   - [ ] Delete comment → **Expected**: 402 error
   - [ ] Resolve comment → **Expected**: 402 error
   - [ ] Download video → **Expected**: 402 error
3. **Expected**: Clear error message about subscription required

---

## 13. Real-Time Updates (WebSocket)

### 13.1 Live video list updates
1. Open project page in Tab 1
2. Upload a video from Tab 2 (or another user)
3. **Expected**: Video appears in Tab 1 without refresh

### 13.2 Live comment updates
1. Open a video in Tab 1 (User A) and Tab 2 (User B)
2. User A posts a comment
3. **Expected**: Comment appears in Tab 2 instantly

### 13.3 Live workflow status update
1. Open a video in Tab 1 and project list in Tab 2
2. Change workflow status in Tab 1
3. **Expected**: Badge updates in Tab 2 without refresh

### 13.4 Presence — who's watching
1. Open a video in Tab 1 (User A) and Tab 2 (User B)
2. **Expected**: Both users shown as "watching" (viewer count or avatars)
3. Close Tab 2
4. **Expected**: Within ~45 seconds, User B disappears from watchers

### 13.5 WebSocket reconnection
1. Open a video page
2. Throttle network to "Offline" in DevTools for 5 seconds
3. Restore network
4. **Expected**: WebSocket reconnects
5. Post a comment
6. **Expected**: Comment delivered and shown

---

## 14. Navigation & Breadcrumbs

### 14.1 Dashboard navigation
1. Sign in, go to dashboard
2. Click on a team
3. **Expected**: Breadcrumb shows: Правко > Team Name
4. Click on a project
5. **Expected**: Breadcrumb shows: Правко > Team Name > Project Name
6. Click on a video
7. **Expected**: Breadcrumb shows full path

### 14.2 Breadcrumb back-navigation
1. From a video page, click team name in breadcrumb
2. **Expected**: Navigates to team page
3. From a project page, click "Правко" in breadcrumb
4. **Expected**: Navigates to dashboard root

### 14.3 Browser back/forward
1. Navigate: dashboard → team → project → video
2. Press browser Back button
3. **Expected**: Goes to project page
4. Press Back again
5. **Expected**: Goes to team page
6. Press Forward
7. **Expected**: Goes to project page

### 14.4 Deep link — direct URL access
1. Sign in, navigate to a video, copy URL
2. Open new tab, paste URL
3. **Expected**: Video page loads directly (no redirect loop)

### 14.5 Deep link — after sign-out
1. Copy a dashboard URL
2. Sign out
3. Paste the URL
4. **Expected**: Redirected to sign-in
5. Sign in
6. **Expected**: Redirected back to the original URL (or dashboard)

---

## 15. Error & Edge Cases

### 15.1 API health when DB is down
1. Stop postgres: `docker compose stop postgres`
2. Visit http://localhost:3456/api/health
3. **Expected**: Health check reports `db: error`
4. Restart postgres: `docker compose start postgres`
5. **Expected**: Health check recovers to `db: ok`

### 15.2 API health when Redis is down
1. Stop redis: `docker compose stop redis`
2. Visit http://localhost:3456/api/health
3. **Expected**: Health check reports `redis: error`
4. Restart redis: `docker compose start redis`
5. **Expected**: Health check recovers

### 15.3 404 page
1. Navigate to http://localhost:5296/nonexistent-route
2. **Expected**: Custom 404 page (not a blank page or crash)

### 15.4 API 401 on expired token
1. Sign in, then wait for JWT to expire (or manipulate token)
2. Try an API action
3. **Expected**: 401 error, UI prompts to re-authenticate

### 15.5 Concurrent edits — video title
1. Open same video in 2 tabs
2. Edit title in Tab 1 to "Title A"
3. Edit title in Tab 2 to "Title B"
4. **Expected**: Last write wins, no crash
5. Refresh both tabs
6. **Expected**: Both show "Title B"

### 15.6 Rapid clicking — double submit
1. Click "СОЗДАТЬ" on project creation dialog rapidly (double-click)
2. **Expected**: Only one project created (not two)

### 15.7 Long text inputs
1. Enter a 10,000-character team name
2. **Expected**: Handled gracefully (truncated or error)
3. Enter a very long video title
4. **Expected**: UI doesn't break, text truncated in display

### 15.8 Special characters in names
1. Create a team with name: `<script>alert('xss')</script>`
2. **Expected**: Name escaped properly, no XSS
3. Create project with name: `"quotes' and <html>`
4. **Expected**: Displayed as plain text, no injection

### 15.9 Unicode / Emoji in names
1. Create team: "Команда 🎬🎥"
2. Create project: "Проект с ёжиком 🦔"
3. **Expected**: Names saved and displayed correctly with emoji

### 15.10 Stale data after member removal
1. User B is on a team, has a project open
2. User A removes User B from the team
3. User B tries to perform an action (upload, comment)
4. **Expected**: 403 error, not a crash
5. **Expected**: UI shows "not a member" or redirects to dashboard

---

## 16. Mobile Browser Testing

### 16.1 Homepage on mobile
1. Open http://localhost:5296 on mobile (or DevTools 375px)
2. **Expected**: All content readable, no horizontal scroll
3. **Expected**: Navigation accessible (burger menu or collapsed)

### 16.2 Login flow on mobile
1. Tap "ВОЙТИ" on mobile
2. **Expected**: Logto page fits mobile screen
3. Complete sign-in
4. **Expected**: Redirected to dashboard

### 16.3 Video player on mobile
1. Open a video on mobile
2. **Expected**: Player fills width, controls accessible
3. **Expected**: Comments accessible via modal or bottom sheet (not sidebar)
4. Play video
5. **Expected**: Playback works, can seek

### 16.4 Upload on mobile
1. Open a project on mobile
2. Tap upload zone
3. **Expected**: File picker opens (camera roll / files)
4. Select a video
5. **Expected**: Upload works with progress indicator

### 16.5 Comment input on mobile
1. Open a video on mobile
2. Tap comment input
3. **Expected**: Keyboard opens, input field visible above keyboard
4. Type and submit comment
5. **Expected**: Comment posted successfully

---

## 17. Performance & Loading States

### 17.1 Skeleton / loading states
1. Throttle network to "Slow 3G" in DevTools
2. Navigate to dashboard
3. **Expected**: Loading skeleton or spinner shown (not blank page)
4. Navigate to project
5. **Expected**: Loading state while videos load
6. Navigate to video
7. **Expected**: Player shows loading state while HLS initializes

### 17.2 Large project (many videos)
1. Create a project with 20+ videos (use API directly or upload many)
2. Navigate to the project
3. **Expected**: Page loads without freezing
4. **Expected**: Scroll works smoothly

### 17.3 Route prewarming (hover)
1. On the project list, hover over a video card
2. **Expected**: No visible effect, but network tab shows prefetch request
3. Click on the video
4. **Expected**: Page loads faster (data already cached)

---

## Test Result Template

For each test, record:

| # | Test Name | Status | Notes |
|---|-----------|--------|-------|
| 1.1 | Homepage loads | PASS/FAIL/SKIP | Any issues observed |

Statuses:
- **PASS** — Works as expected
- **FAIL** — Does not work as expected (describe the bug)
- **SKIP** — Cannot test (explain why)
- **PARTIAL** — Mostly works but with minor issues (describe)

---

## Browser Matrix

Test at minimum in:
- [ ] Chrome (latest) — desktop
- [ ] Chrome (latest) — mobile emulation (375px)
- [ ] Safari (latest) — desktop (if macOS)
- [ ] Firefox (latest) — desktop

---

## Severity Classification

When reporting bugs, classify as:

- **Critical**: App crashes, data loss, security issue, cannot sign in
- **Major**: Feature broken, cannot complete core workflow (upload, comment, share)
- **Minor**: UI glitch, wrong text, non-blocking issue
- **Cosmetic**: Visual inconsistency, spacing, color mismatch
