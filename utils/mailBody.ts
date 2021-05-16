export const completeEmail = (id: string) => {
  return {
    header: "BitSwap exchange completed",
    body: {
      seller: `<!DOCTYPE html><html><body><p>One of your swaps has been fulfilled, you can check the details on the <a href="https://app.bitswap.network/listing/${id}">listing page</a>.</p></body></html>`,
      buyer: `<!DOCTYPE html><html><body><p>One of your buys has been fulfilled, you can check the details on the <a href="https://app.bitswap.network/listing/${id}">listing page</a>.</p></body></html>`,
    },
  };
};

export const passwordResetEmail = (code: string) => {
  return {
    header: "Reset your BitSwap password",
    body:
      `<!DOCTYPE html><html><head><title>BitSwap Password Reset</title><body>` +
      `<p>Click <a href="https://api.bitswap.network/user/verifypassword/${code}">here</a> to reset your password. If you didn't request a password change, simply ignore this email.` +
      `</body></html>`,
  };
};

export const verifyPasswordHTML = (password: string) => {
  return `<!DOCTYPE html><html><body><p>Your password has been reset. Your temporary password is "${password}" (no quotation marks). Please change your password once you sign in.</p><br /><a href="https://app.bitswap.network">Go to BitSwap homepage.</a></body></html>`;
};

export const transactionNotificationEmail = (username: string, id: string) => {
  return {
    header: "Transaction Notification Alert",
    body:
      `<!DOCTYPE html><html><head><title>Transaction Notification Alert</title><body>` +
      `<p>@${username} has started a transaction with your listing.` +
      `<p>Click <a href="https://app.bitswap.network/listing/${id}">here</a> to view.</p>` +
      `</body></html>`,
  };
};

export const emailVerify = (email_code: string) => {
  return {
    header: "Verify your BitSwap email",
    body:
      `<!DOCTYPE html><html><head><title>BitSwap Email Verification</title><body>` +
      `<p>Click <a href="https://bitswap-api.herokuapp.com/user/verify-email/${email_code}">here</a> to verify your email. If this wasn't you, simply ignore this email.` +
      `</body></html>`,
  };
};

export const emailverified =
  '<!DOCTYPE html><html><body><p>Your email has been successfully verified.</p><br /><a href="https://app.bitswap.network">Go to BitSwap homepage.</a></body></html>';
export const invalidlink =
  '<!DOCTYPE html><html><body><p>The link is invalid.</p><br /><a href="https://app.bitswap.network">Go to BitSwap homepage.</a></body></html>';
export const servererror =
  '<!DOCTYPE html><html><body><p>An error has occurred.</p><br /><a href="https://app.bitswap.network">Go to BitSwap homepage.</a></body></html>';
