
#### **Project Setup**  
- [x] **Set up repo & project structure** → Initialize Next.js, Prisma (SQLite/PostgreSQL), and set up basic file structure. ✅ 2025-03-27
	- Use React Router and Prisma Sqlite in dev and neon on production
	- Use Neon DB
- [x] **Define database schema** → Create tables for transactions, email criteria, and user preferences. ✅ 2025-03-27

#### **Email Integration**  
- [x] **Set up Google OAuth** → Allow the app to connect to a Google account securely. ✅ 2025-03-27
- [x] Create source rules ✅ 2025-03-28
- [x] Show Source Rules ✅ 2025-03-28
- [x] Create teams ✅ 2025-03-28
- [x] Add user to team
- [ ] Set teams on login
- [x] Create custom categories
- [x] **Fetch emails based on criteria** → Store rules (e.g., sender, subject, keywords) and retrieve relevant emails.  
	- [ ] Create Crons
	- [x] Edit source rules
- [x] **Parse transactions from email** → Extract merchant, amount, and date from email body.  
#### **Transaction Storage & API**  
- [ ] **Create GET API for transaction summary** → Return categorized transaction data with filters.  
- [ ] **Manual categorising transactions** → Allow users to manually move transactions into categories.  
	- For drag and drop perhaps https://stackblitz.com/edit/react-1j37eg?file=src%2FApp.js
#### **Frontend Dashboard**  
- [x] **Set up mobile-friendly UI** → Show recent transactions, summaries, and charts. ✅ 2025-03-27
	- Use ShadCn and/or v0
	- https://v0.dev/chat/community/financial-dashboard-DuidKNEmCKf
	- https://v0.dev/chat/community/analytics-dashboard-WUYQbNYP3gt
	- https://v0.dev/chat/community/financial-dashboard-functional-jUBqSBJsNrz
- [ ] Reports
	- See lunch money's screenshots
	- https://v0.dev/chat/community/next-js-charts-MislIISzd67
- [ ] **Display categorized spends** → Show spending breakdown by category.  
- [ ] **Add simple filters & sorting** → Let users view transactions by date, category, or amount.  
- [ ] Search - maybe local search or create an api for searching:
	- https://v0.dev/chat/community/action-search-bar-S3nMPSmpQzk

#### **AI-Powered Features**  
- [ ] **Implement AI spend summarization** → Generate short insights on spending patterns.  
- [ ] **Implement AI-based categorization** → Auto-assign categories to transactions.  

#### **Deployment & Testing**  
- [ ] **Deploy backend & frontend** → Use Railway or Render for hosting.
- [ ] **Test email fetching & API** → Ensure transactions are extracted and categorized correctly.  
- [ ] **Monitor and refine AI results** → Adjust model behavior based on real data.  

#### Future Scope
- [ ] One user can have multiple email inboxes.
- [ ] Budgets
	- See lunch money's screenshots
- [ ] Conversion of EMIs (NoCost and Otherwise)
- [ ] Goals for no-spend days
- [ ] Tag expenses using NFC
- [ ] Show a quote everytime you open the dashboard
- [ ] Other goals
- [ ] Categories have to by dynamic
