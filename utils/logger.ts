export const critical = (...params) => {
  // rollbar.critical(...params);
  console.error(...params);
};
export const error = (...params) => {
  // rollbar.error(...params);
  console.error(...params);
};

export const warning = (...params) => {
  // rollbar.warning(...params);
  console.error(...params);
};
export const info = (...params) => {
  console.log(...params);
};
