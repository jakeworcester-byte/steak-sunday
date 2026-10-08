/* =============================================================
   STEAK MONDAY - CONTROL PANEL
   Jake: this is the only file you should need to edit.
   Change something, save, commit, push. GitHub Pages redeploys.
   ============================================================= */

window.STEAK_CONFIG = {

  /* ---- The event ---------------------------------------- */
  event: {
    name: "Steak Monday",
    date: "2026-10-26",                 // YYYY-MM-DD
    dateLabel: "Monday evening, October 26, 2026",
    where: "Jake and Hilary's",
    city: "Kansas City",
    crew: "Development Marketing Leadership Team"
  },

  /* ---- Who is invited ----------------------------------- */
  /* "Other" is added automatically at the bottom of the list. */
  guests: [
    "Heather Elliott",
    "Chris Root",
    "Sadaf Baig",
    "Beth Martz",
    "Beth Birnstihl",
    "Estella McCollum"
  ],

  /* ---- Where the answers go ------------------------------ */
  /* A Google Form in Jake's account acts as the database.
     Responses land in the "Steak Sunday RSVPs" Google Sheet.
     The "Host View" tab shows each guest's latest answer.   */
  backend: {
    formAction: "https://docs.google.com/forms/d/e/1FAIpQLSduBXz1Cy7CeqrlwVmbtnTEuVWdIkb0HLBT4bUoDNSzceahmw/formResponse",
    fields: {
      guest:      "entry.1557203407",
      cocktail:   "entry.1033870941",
      steak:      "entry.897160028",
      steakNotes: "entry.931256137",
      dietary:    "entry.1332115393",
      wine:       "entry.957823455",
      device:     "entry.1275543898"
    },
    hostSheet: "https://docs.google.com/spreadsheets/d/1NNosbo7DB90MK8Y_fK1b5br8X_EZO8v62m1KWUNgtvg/edit"
  },

  /* The sibling site. Every steak needs a tracking number. */
  meatTrackerUrl: "https://jakeworcester-byte.github.io/meat-tracker/"
};
