// This file can hold types shared across API requests/responses and frontend

// From your PRD, the beneficiaries table has these (plus timestamps we might not need on frontend always)
export interface Beneficiary {
  id: string; // UUID
  phone_number_for_telegram: string;
  display_name: string | null; // Made nullable as per DB schema (TEXT can be NULL)
  // include other fields if needed by the frontend, e.g., created_at
}

// You might have other API related types here, e.g.:
// export interface Sponsorship {
//   // ...
// } 