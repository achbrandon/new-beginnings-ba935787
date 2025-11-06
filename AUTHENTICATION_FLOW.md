# VaultBank Authentication & Account Flow

## Overview
This document explains the complete authentication and account creation flow with security measures.

## Account Creation Process

### Step 1: User Registration (Open Account)
1. User fills out the complete application form at `/open-account`
2. User provides:
   - Personal information (name, DOB, address, etc.)
   - Identity documents (ID, selfie, proof of address)
   - Employment & financial information
   - **Account security**: Email, Password, and **6-digit PIN**
   - Security question and answer

### Step 2: Account Application Submission
1. Form data is sent to `create-account-application` edge function
2. User account is created in Supabase Auth (email NOT auto-confirmed)
3. Application record is created with status: `pending`
4. User profile is updated with PIN and security info
5. **Verification email** is sent with QR code and secret key

### Step 3: Email Verification
1. User receives email with:
   - Verification link
   - QR code image
   - Secret key (text below QR code)
2. User clicks verification link → redirected to `/verify-qr`
3. User enters the secret key from email
4. On successful verification:
   - Profile is marked as `qr_verified: true`
   - User is redirected to `/verification-success` page
   - Success page explains that documents are under review

### Step 4: Admin Review (Manual Process)
1. Admin logs in and reviews account applications
2. Admin checks:
   - Identity documents
   - Proof of address
   - Employment information
   - Tax information
3. Admin approves or rejects the application
4. System updates application status: `approved` or `rejected`
5. User receives email notification about decision

---

## Login Process

### Required Credentials
Users MUST provide ALL three credentials to log in:
1. **Email address**
2. **Password**
3. **6-digit PIN**

### Login Flow & Error Messages

#### Case 1: Pending Account (Under Review)
- **Trigger**: User tries to login but account application is still `pending`
- **Message**: 
  - "🔍 Your account is currently under review. Our team is reviewing your application and documents for security verification."
  - "📧 You will receive an email notification once your account has been approved. This typically takes 24-48 hours."
- **Action**: User must wait for admin approval

#### Case 2: Rejected Account
- **Trigger**: Admin has rejected the application
- **Message**: "❌ Your account application was not approved. Please contact support@vaultbankonline.com for more information."
- **Action**: User must contact support

#### Case 3: Approved Account - Incorrect Credentials
- **Trigger**: Account is approved but user enters wrong email/password/PIN
- **Messages**:
  - Wrong email/password: "❌ Incorrect email, password, or PIN. Please check your credentials and try again."
  - Wrong PIN: "❌ Incorrect PIN. Please enter the correct 6-digit PIN."
- **Action**: User must enter correct credentials

#### Case 4: Email Not Verified
- **Trigger**: User tries to login before verifying email
- **Message**: "⚠️ Please verify your email address first. Check your inbox for the verification link."
- **Action**: User must verify email first

#### Case 5: Successful Login
- **Requirements**:
  - Email is verified
  - Account application is approved
  - Correct email + password + PIN provided
- **Action**: User is redirected to dashboard

---

## Security Features

### Multi-Factor Authentication
1. **Email verification** - Confirms email ownership
2. **QR/Secret verification** - Additional security layer
3. **PIN verification** - Required at every login

### Account Status Checks
- System checks application status before allowing login
- Prevents unauthorized access to pending/rejected accounts
- Provides clear feedback to users about account status

### Admin Controls
- Manual review of all applications
- Document verification required
- Approve/reject decisions with notification emails

---

## Technical Implementation

### Database Tables
- `auth.users` - Supabase authentication users
- `profiles` - User profiles with PIN and verification status
- `account_applications` - Application records with status
- `user_roles` - Admin role assignments

### Key Functions
- `create-account-application` - Creates user account and application
- `send-verification-email` - Sends verification email with QR code
- `send-application-decision` - Notifies user of approval/rejection

### Status Flow
```
1. User creates account → status: "pending"
2. User verifies email → qr_verified: true
3. Admin reviews → status: "approved" or "rejected"
4. User can login → if approved + verified
```

---

## Admin Account Details

**Email**: `info@vaulteonline.com`
**Password**: *(Set during admin account creation - cannot be retrieved)*

If you forgot the admin password, use the "Forgot Password" feature on the login page.

---

## Support Contact
For any issues with account creation or login:
**Email**: support@vaultbankonline.com
