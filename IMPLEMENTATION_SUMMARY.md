## Summary of Changes

### Issues Fixed:

1. **Schema not registered for "notification" model**
   - Added missing models to `server/src/database/models/index.ts`:
     - notification
     - mouvements
     - dons
     - historiquePoints
     - votes

2. **Create user form not submitting**
   - Fixed `UserCreateDirectForm.tsx`:
     - Changed button `type="button"` to `type="submit"`
     - Removed incorrect `onClick={form.handleSubmit(onSubmit)}`
     - Now uses `onSubmit` handler from parent form via `form.handleSubmit`
   - Fixed yup schema: `number` → `decimal` (correct method name)
   - Fixed type assertion for `form.setValue` key parameter

3. **Enhanced total delete cascade**
   - Added more comprehensive cleanup in `userRepository.destroyWithAllRelations`:
     - Company records owned by user
     - Products created by user
     - Categories created by user
     - Both `adherent` and `createdBy` fields in dons

### Files Modified:

**Backend (server/src):**
- `database/models/index.ts` - Added missing model registrations
- `database/repositories/userRepository.ts` - Enhanced `destroyWithAllRelations` method
- `api/user/userDestroyAll.ts` - New endpoint for total deletion
- `api/user/userCreateDirect.ts` - New endpoint for direct user creation
- `api/user/index.ts` - Registered new routes

**Frontend (admin/src):**
- `modules/user/userService.tsx` - Added `destroyAll()` and `createDirect()` methods
- `modules/user/list/userListActions.tsx` - Added action types and handlers
- `modules/user/list/userListReducers.tsx` - Added state management
- `view/user/list/UserTable.tsx` - Added "Total Delete" button with confirmation modal
- `view/user/list/UserFilter.tsx` - Added "Create User Directly" button and modal
- `view/user/new/UserCreateDirectModal.tsx` - New modal component (created)
- `view/user/new/UserCreateDirectForm.tsx` - New form component (created)
- `i18n/en.tsx` - Added translation strings
- `i18n/pt-BR.tsx` - Added Portuguese translations
- `i18n/en.tsx` - Removed duplicate `password` field

### Features:

1. **Total Delete**: Permanently removes user and all related data
   - Deletes: user, records, transactions, notifications, mouvements, dons, historiquePoints, votes, company, products, categories
   - Confirmation modal with warning
   - Permission-protected

2. **Direct User Creation**: Create users without invitation flow
   - Fields: email, password, fullName, phoneNumber, VIP, balance, invitationCode, status
   - Auto-activates user (no permission waiting)
   - Auto-generates referral codes
   - Permission-protected

### Build Status:
- ✅ Admin frontend builds successfully
- ✅ All TypeScript checks pass
- ✅ No syntax errors