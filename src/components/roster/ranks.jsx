export const RANKS = [
  { label: "Captain", abbr: "Capt" },
  { label: "First Lieutenant", abbr: "1stLt" },
  { label: "Second Lieutenant", abbr: "2ndLt" },
  { label: "Master Sergeant", abbr: "MSgt" },
  { label: "Gunnery Sergeant", abbr: "GySgt" },
  { label: "Staff Sergeant", abbr: "SSgt" },
  { label: "Corporal", abbr: "Cpl" },
  { label: "Lance Corporal", abbr: "LCpl" },
  { label: "Specialist", abbr: "SPC" },
  { label: "Private First Class", abbr: "PFC" },
  { label: "Private (PV2)", abbr: "PV2" },
  { label: "Private (PV1)", abbr: "PV1" },
];

// Returns the abbreviation for a stored rank value (abbr or full label)
export function getRankAbbr(rank) {
  if (!rank) return "";
  const found = RANKS.find(r => r.abbr === rank || r.label === rank);
  return found ? found.abbr : rank;
}

// Returns the full label for a stored rank value (abbr or full label)
export function getRankLabel(rank) {
  if (!rank) return "";
  const found = RANKS.find(r => r.abbr === rank || r.label === rank);
  return found ? found.label : rank;
}

// Returns "Abbr UnitName" for display
export function formatMemberName(member) {
  if (!member) return "";
  const abbr = getRankAbbr(member.rank);
  return abbr ? `${abbr} ${member.unit_name}` : member.unit_name;
}