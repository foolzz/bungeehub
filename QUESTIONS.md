# Bungie Hub - Clarifying Questions

Before starting implementation, we need answers to these critical questions to ensure we build the right system.

---

## 🎯 CRITICAL DECISIONS (Please answer these first)

### 1. Technology Stack

**Q1.1: Backend Framework Choice?**
- [ ] **Express.js** - Simple, mature, huge community
- [ ] **Fastify** - Faster performance, built-in validation
- [ ] **NestJS** - TypeScript-first, structured, enterprise-grade

**My Recommendation**: Fastify (good performance + validation) or NestJS (if you want strong structure)

**Q1.2: TypeScript or JavaScript?**
- [ ] **TypeScript** (recommended - type safety, better tooling)
- [ ] **JavaScript** (faster to prototype)

**My Recommendation**: TypeScript for production reliability

**Q1.3: Database ORM/Query Builder?**
- [ ] **Prisma** - Type-safe, excellent DX, auto-generated client
- [ ] **Drizzle** - Lightweight, SQL-like, good performance
- [ ] **node-postgres (pg)** - Raw SQL, most flexible

**My Recommendation**: Prisma (best developer experience)

**Q1.4: Mobile App Framework?**
- [ ] **React Native** - JavaScript, code sharing with web
- [ ] **Flutter** - Dart, beautiful UI, good performance
- [ ] **Native** - Swift/Kotlin, best performance

**My Recommendation**: React Native (faster development, shared logic)

---

## 💰 Business Model Questions

### 2. Hub Host Compensation

**Q2.1: How do hub hosts get paid?**
- [ ] Per package delivered (e.g., $2 per package)
- [ ] Per batch received (e.g., $100 per batch)
- [ ] Percentage of delivery fee (e.g., 70% goes to host)
- [ ] Tiered pricing based on hub level
- [ ] Combination of above

**Please specify**: _______________

**Q2.2: Payment frequency?**
- [ ] Daily payout
- [ ] Weekly payout
- [ ] Bi-weekly
- [ ] Monthly

**Q2.3: Do we need payment processing integration now?**
- [ ] Yes, integrate Stripe/PayPal in MVP
- [ ] No, manual payments for now
- [ ] Later phase

---

### 3. Service Area & Coverage

**Q3.1: Delivery radius from each hub?**
- [ ] 1-2 miles (dense urban areas)
- [ ] 3-5 miles (suburban)
- [ ] 5-10 miles (rural)
- [ ] Configurable per hub

**Please specify**: _______________

**Q3.2: How do we assign packages to hubs?**
- [ ] Automatic (closest hub with capacity)
- [ ] Manual assignment by admin
- [ ] Hubs can "claim" packages in their area

---

### 4. Package Specifications

**Q4.1: Package size/weight limits?**
- Maximum weight: _______________ lbs/kg
- Maximum dimensions: _______________ inches/cm
- Any prohibited items: _______________

**Q4.2: Batch size flexibility?**
- Fixed at 50-100 packages per batch? Yes / No
- Can hubs set their own capacity? Yes / No
- Minimum packages per batch: _______________

---

### 5. Delivery Timeline

**Q5.1: Expected delivery timeframe?**
- [ ] Same-day (from hub receipt to delivery)
- [ ] Next-day
- [ ] Within 24 hours
- [ ] Within 48 hours
- [ ] Flexible

**Q5.2: Hub operating hours?**
- [ ] 24/7
- [ ] Business hours only (9am-6pm)
- [ ] Configurable per hub

---

### 6. Hub Approval & Verification

**Q6.1: Hub approval process?**
- [ ] Automated approval (instant)
- [ ] Manual admin review (1-2 days)
- [ ] Hybrid (auto-approve if criteria met, else manual review)

**Q6.2: Background checks required?**
- [ ] Yes, mandatory
- [ ] Yes, but optional (affects tier)
- [ ] No

**Q6.3: Minimum hub requirements?**
- Minimum space: _______________
- Insurance required: Yes / No
- Minimum age: _______________
- Other: _______________

---

## 📱 Technical Requirements

### 7. Photo & Media

**Q7.1: Proof of Delivery photo requirements?**
- Maximum file size: _______________ MB
- Required resolution: _______________
- Format: JPG / PNG / WebP / Any

**Q7.2: Photo retention policy?**
- Keep POD photos for: _______________ days
- After that: Delete / Archive to cold storage

**Q7.3: Multiple photos per delivery?**
- [ ] Single photo required
- [ ] Multiple photos allowed (e.g., package + door + address)

---

### 8. Failed Delivery Handling

**Q8.1: What happens when delivery fails?**
- [ ] Return to hub, retry next day
- [ ] Reassign to different hub
- [ ] Return to sender
- [ ] Other: _______________

**Q8.2: Maximum retry attempts?**
- _______________ attempts

**Q8.3: Who decides retry vs. return?**
- [ ] Automated system
- [ ] Hub host decision
- [ ] Admin decision

---

### 9. Communication & Notifications

**Q9.1: Notification channels?**
- [ ] Push notifications (mobile app)
- [ ] SMS
- [ ] Email
- [ ] All of the above

**Q9.2: Which events trigger customer notifications?**
- [ ] Package assigned to hub
- [ ] Package arrived at hub
- [ ] Out for delivery
- [ ] Delivered
- [ ] Failed delivery
- [ ] Other: _______________

**Q9.3: Can customers contact hub hosts?**
- [ ] Yes, via in-app messaging
- [ ] Yes, phone number shared
- [ ] No, all communication through platform
- [ ] Only for delivery issues

---

### 10. Real-time Tracking

**Q10.1: Real-time tracking requirements?**
- [ ] Live GPS tracking during delivery
- [ ] Status updates only (no GPS tracking)
- [ ] Both

**Q10.2: Acceptable delay for status updates?**
- [ ] Instant (< 1 second via WebSocket)
- [ ] Near real-time (< 5 seconds)
- [ ] Periodic refresh (30-60 seconds)

---

## 🔒 Security & Compliance

### 11. Data & Privacy

**Q11.1: Geographic scope?**
- [ ] US only (CCPA compliance)
- [ ] EU (GDPR compliance required)
- [ ] Global
- [ ] Specific regions: _______________

**Q11.2: Data retention requirements?**
- User data: _______________ years
- Package records: _______________ years
- POD photos: _______________ days
- Analytics data: _______________

**Q11.3: PII handling?**
- Customer addresses visible to hub hosts: Yes / No
- Customer phone numbers visible: Yes / No
- If no, how do they coordinate delivery issues: _______________

---

### 12. Insurance & Liability

**Q12.1: Package insurance?**
- [ ] Platform provides insurance
- [ ] Hub hosts must have insurance
- [ ] No insurance (best effort)
- [ ] Optional (affects tier/earnings)

**Q12.2: Lost/damaged package responsibility?**
- [ ] Platform covers all losses
- [ ] Hub host liable
- [ ] Shared responsibility
- [ ] Insurance claim process

**Q12.3: Maximum liability per package?**
- $_______________ per package

---

## 📊 Analytics & Reporting

### 13. Hub Performance Metrics

**Q13.1: How often to update hub rankings?**
- [ ] Real-time (after each delivery)
- [ ] Daily
- [ ] Weekly
- [ ] Monthly

**Q13.2: Tier upgrade criteria?**

**Level 1 → Level 2 (Active Hub)**:
- Successful deliveries: _______________
- Accuracy rate: _______________%
- Time period: _______________ days

**Level 2 → Level 3 (Top Hub)**:
- Successful deliveries: _______________
- Accuracy rate: _______________%
- Customer rating: _______________ stars

**Level 3 → Level 4 (Super Hub)**:
- Successful deliveries: _______________
- Accuracy rate: _______________%
- Customer rating: _______________ stars
- Other criteria: _______________

**Q13.3: Can hubs be demoted?**
- [ ] Yes, if performance drops
- [ ] No, tiers are permanent
- If yes, demotion criteria: _______________

---

## 🔌 Integration Requirements

### 14. B2B System Integration

**Q14.1: Existing B2B system details?**
- System name: _______________
- Technology: _______________
- API available: Yes / No
- Documentation: _______________

**Q14.2: Integration priority?**
- [ ] Must have in MVP
- [ ] Phase 2
- [ ] Nice to have

**Q14.3: Integration type?**
- [ ] REST API calls
- [ ] Webhooks (we notify them)
- [ ] Database sync
- [ ] File exchange (CSV/JSON)
- [ ] Other: _______________

---

### 15. Third-Party Services

**Q15.1: Geocoding service?**
- [ ] Google Maps API
- [ ] Mapbox
- [ ] OpenStreetMap
- [ ] Other: _______________

**Q15.2: SMS provider (if needed)?**
- [ ] Twilio
- [ ] AWS SNS
- [ ] Other: _______________
- [ ] Not needed

**Q15.3: Email service?**
- [ ] SendGrid
- [ ] AWS SES
- [ ] Mailgun
- [ ] Other: _______________

---

## 🚀 Launch Strategy

### 16. MVP Scope

**Q16.1: MVP user roles?**
- [ ] Hub hosts only (admin creates packages)
- [ ] Hub hosts + customers
- [ ] Hub hosts + customers + admins

**Q16.2: MVP must-have features?** (Prioritize 1-5, 1=highest)
- ___ Hub host registration
- ___ Package scanning
- ___ Proof of delivery with photo
- ___ Basic ranking system
- ___ Customer tracking
- ___ In-app messaging
- ___ Payment processing
- ___ B2B integration
- ___ Admin dashboard
- ___ Mobile apps (both platforms)

**Q16.3: Launch timeline?**
- Target MVP date: _______________
- Beta testing start: _______________
- Number of beta users: _______________

---

## 📱 Mobile App Specifics

### 17. Mobile Development

**Q17.1: Platform priority?**
- [ ] iOS first
- [ ] Android first
- [ ] Both simultaneously

**Q17.2: Offline support required?**
- [ ] Yes, critical (deliveries in areas with poor signal)
- [ ] Nice to have
- [ ] Not needed

**Q17.3: Barcode scanning method?**
- [ ] Built-in camera scanning
- [ ] External barcode scanner support
- [ ] Both

---

## 🎨 Branding & UX

### 18. User Experience

**Q18.1: Onboarding flow?**
- [ ] Simple (email + password)
- [ ] Detailed (profile, verification, training)
- [ ] Gamified (achievements, tutorials)

**Q18.2: Language support?**
- [ ] English only (for now)
- [ ] Multi-language from day 1
- Languages needed: _______________

**Q18.3: Accessibility requirements?**
- [ ] WCAG 2.1 AA compliance
- [ ] Basic accessibility
- [ ] Not a priority for MVP

---

## ⚙️ Infrastructure & DevOps

### 19. Environment Setup

**Q19.1: Environments needed?**
- [ ] Development only
- [ ] Development + Production
- [ ] Development + Staging + Production

**Q19.2: GCP project already created?**
- [ ] Yes, project ID: _______________
- [ ] No, need to create

**Q19.3: Neon database already set up?**
- [ ] Yes, connection string: _______________
- [ ] No, need to create

**Q19.4: Budget constraints?**
- Monthly budget: $_______________
- Any cost limits on specific services: _______________

---

## 📋 Additional Questions

### 20. Other Considerations

**Q20.1: Customer support?**
- [ ] In-app support system needed
- [ ] Email support only
- [ ] Phone support
- [ ] Chatbot

**Q20.2: Dispute resolution?**
- Process for handling complaints: _______________
- Who mediates disputes: _______________

**Q20.3: Referral program?**
- [ ] Yes, in MVP
- [ ] Yes, later phase
- [ ] No

**Q20.4: Marketing integration?**
- Email marketing platform: _______________
- Analytics (Google Analytics, Mixpanel, etc.): _______________

---

## 🎯 Summary: Top Priority Questions

**Please answer these ASAP to start implementation:**

1. **Framework**: Express / Fastify / NestJS?
2. **Language**: TypeScript or JavaScript?
3. **ORM**: Prisma / Drizzle / Raw SQL?
4. **Payment model**: Per package / per batch / percentage?
5. **Delivery radius**: How many miles from hub?
6. **Hub approval**: Automatic or manual review?
7. **MVP timeline**: Target date?
8. **GCP Project ID**: Existing or need to create?
9. **Mobile framework**: React Native / Flutter / Native?
10. **B2B integration**: Must-have in MVP or later?

---

## 📝 How to Answer

You can:
1. Reply with answers inline in this document
2. Create a separate `ANSWERS.md` file
3. Just tell me verbally and I'll update the docs

Once I have answers to the critical questions, I can:
1. Start building the project structure
2. Set up the database with proper schema
3. Begin implementing the backend API
4. Create the mobile app scaffold (if needed)

**Ready to start as soon as you provide guidance!** 🚀
