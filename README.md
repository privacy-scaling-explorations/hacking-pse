# hacking-pse

Monorepo for all things related to "Hacking PSE". This includes the following:

- backend 
- frontend 
- contracts (AA smart wallet/paymester)

### Backend

Simple express API which accepts a @pse.dev email and sends an OTP. Another endpoint accepts an OTP + email + address to store details about the user and verify the OTP. If a match, then it will mint a Hat to the provided address.

Conditions:

1. Sending a @pse.dev email 
2. If already sent an OTP and it's not expired yet, then don't send another OTP.
3. If already sent an OTP and it's expired, then send a new OTP.
4. If user is already registered it does not send another OTP.
5. Cannot re register with two addresses nor same email address.
