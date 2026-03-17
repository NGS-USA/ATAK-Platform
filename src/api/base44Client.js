// base44Client.js — compatibility shim
// This file keeps the old import paths working while using the new API
export { db as base44Entities } from './apiClient';
export { default as api } from './apiClient';

// Placeholder so old code that imports { base44 } still compiles
// You will replace actual usage of base44.entities.X and base44.auth
// in each page file following the instructions in this guide.
export const base44 = {
  entities: {},
  auth: {
    me: () => Promise.resolve(null),
    redirectToLogin: () => {},
    logout: () => {},
  }
};