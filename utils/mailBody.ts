import * as config from "../config";

export const emailVerify = (email_code: string) => {
  return {
    header: "Verify your BitSwap email",
    body:
      `<!DOCTYPE html><html><head><title>BitSwap Email Verification</title><body>` +
      `<p>Click <a href="${config.URL}user/verify-email/${email_code}">here</a> to verify your email. If this wasn't you, simply ignore this email.</p>` +
      `<p>If you can't click on the link, paste this into your broswer: ${config.URL}user/verify-email/${email_code}` +
      `</body></html>`,
  };
};

export const emailverified =
  '<!DOCTYPE html><html><body><p>Your email has been successfully verified.</p><br /><a href="https://app.bitswap.network">Go to BitSwap homepage.</a></body></html>';
export const invalidlink =
  '<!DOCTYPE html><html><body><p>The link is invalid.</p><br /><a href="https://app.bitswap.network">Go to BitSwap homepage.</a></body></html>';
export const servererror =
  '<!DOCTYPE html><html><body><p>An error has occurred.</p><br /><a href="https://app.bitswap.network">Go to BitSwap homepage.</a></body></html>';
