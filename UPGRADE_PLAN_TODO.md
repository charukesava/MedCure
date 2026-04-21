# Upgrade Plan Implementation - To Do Later

## Current Status
The app currently has an "Upgrade Plan" card in the sidebar (bottom section), but it only displays placeholder content and redirects to the Doctor Agent page.

## What Needs to Be Done

### 1. Design the Upgrade Plans
Define three tiers:
```
🥈 Bronze Plan
- Basic AI consultations (5 per day)
- Standard hospital search
- Appointment booking
- Price: ₹99/month

🥇 Silver Plan  
- Premium AI consultations (unlimited)
- Priority hospital search
- Doctor ratings & reviews
- Health record storage (5 documents)
- Appointment reminders
- Price: ₹299/month

👑 Gold Plan
- All Silver features
- Video consultations with specialists
- Unlimited health records storage
- Prescription management
- Insurance integration
- 24/7 support
- Price: ₹699/month
```

### 2. Frontend Implementation Required
- Create `/pages/UpgradePlans.js` page to display plan options
- Create payment gateway integration component
- Add plan comparison table
- Create plan selection flow
- Store user's subscription status in Firebase

### 3. Backend Implementation Required
- Payment gateway integration (Stripe, Razorpay, or similar)
- Subscription tracking in Firestore
- Limit enforcement based on plan tier
- Usage analytics tracking
- Payment webhook handlers

### 4. Database Changes
Add to user profile:
```javascript
{
  userId: "...",
  plan: "free" | "bronze" | "silver" | "gold",
  subscription: {
    status: "active" | "inactive" | "expired",
    startDate: timestamp,
    endDate: timestamp,
    paymentId: "...",
    renewalDate: timestamp
  },
  usageLimits: {
    aiConsultations: { limit: 5, used: 2 },
    monthlyReset: timestamp
  }
}
```

### 5. Feature Gating Required
Implement checks in:
- `DoctorAgent.js` - Limit AI consultations based on plan
- `NearbyFinder.js` - Premium search features for higher tiers
- `Feedback.js` - Storage limits based on plan
- New components - Video consultation access, prescription management

### 6. UI/UX Enhancements
- Create upgrade modal to display when limits are reached
- Add "Upgrade Now" CTA throughout the app
- Show current plan on Settings page
- Display usage statistics (e.g., "2/5 consultations used this month")
- Create plan comparison overlay

### 7. Files to Create/Modify
**New Files:**
- `frontend/src/pages/UpgradePlans.js` - Main plans page
- `frontend/src/components/PaymentGateway.js` - Payment integration
- `frontend/src/components/PlanComparison.js` - Feature comparison table
- `frontend/src/utils/planLimits.js` - Plan enforcement logic
- `backend/routes/subscriptions.js` - Subscription management API
- `backend/middleware/planLimit.js` - Rate limiting by plan

**Modified Files:**
- `frontend/src/App.js` - Add upgrade route
- `frontend/src/components/Navbar.js` - Link to plans page
- `frontend/src/pages/DoctorAgent.js` - Enforce consultation limits
- `frontend/src/context/AuthContext.js` - Add plan context
- `backend/server.js` - Add subscription middleware

### 8. Payment Gateway Recommendation
**Razorpay** (Best for India):
- No setup fees
- Simple integration
- Supports UPI, cards, wallets
- Good for recurring subscriptions
- Webhook support for renewal

**Alternative: Stripe**
- International support
- More mature platform
- Higher fees (2.9% + 30¢)
- Better for global users

### 9. Estimated Development Time
- UI/UX Design: 1-2 hours
- Frontend Implementation: 4-5 hours
- Backend API: 3-4 hours
- Payment Integration: 2-3 hours
- Testing & Debugging: 2-3 hours
- **Total: 12-17 hours**

### 10. Security Considerations
- Use JWT for subscription verification
- Validate all plan limits on backend (don't trust frontend)
- Secure payment webhook endpoints
- Encrypt payment information
- Implement fraud detection
- Use HTTPS for all payment transactions
- PCI DSS compliance (use payment gateway's hosted solution)

### 11. Testing Checklist
- ✓ Plan selection workflow
- ✓ Payment processing
- ✓ Subscription activation
- ✓ Feature access control
- ✓ Usage limit enforcement
- ✓ Plan expiration handling
- ✓ Renewal flow
- ✓ Cancellation process
- ✓ Invoice generation
- ✓ Fraud detection

---

## Priority: MEDIUM
This feature doesn't affect core functionality but is important for monetization.
Start this after ensuring core features are stable and well-tested.

## Notes
- Consider A/B testing different plan prices
- May need compliance review for financial/healthcare regulations in India
- Consider implementing trial period (7-14 days)
- Build in grace period for failed payments
