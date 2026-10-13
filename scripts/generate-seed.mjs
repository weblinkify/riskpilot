#!/usr/bin/env node
/**
 * Deterministic synthetic seed-data generator.
 *
 * Produces ONE canonical data set and writes it to:
 *   - backend/src/main/resources/db/migration/V2__seed_data.sql   (Flyway, real mode)
 *   - frontend/src/app/mock/seed-data.json                        (in-browser mock mode)
 *
 * Both API modes therefore serve exactly the same submissions, losses, documents and
 * appetite rules. All names, companies and addresses are fictional.
 *
 * Usage: node scripts/generate-seed.mjs        (CI re-runs it and fails on a git diff)
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------- deterministic PRNG
let state = 0x5eed2026;
function rand() {
  // mulberry32
  state |= 0;
  state = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const int = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const chance = (p) => rand() < p;
const roundTo = (n, step) => Math.round(n / step) * step;

// ---------------------------------------------------------------- vocab (all fictional)
const PREFIXES = [
  'Harborview', 'Copper Ridge', 'Bluewater', 'Iron Pine', 'Sundial', 'Northstar', 'Redwood Hollow',
  'Granite Peak', 'Silver Creek', 'Lakeshore', 'Prairie Wind', 'Juniper', 'Old Mill', 'Cedar Bend',
  'Riverbend', 'Summit Line', 'Brightwater', 'Foxglove', 'Kestrel', 'Maple Court', 'Stonegate',
  'Tidewater', 'Wildflower', 'Ashford', 'Beacon Hill', 'Clearview', 'Driftwood', 'Elm Street',
  'Fairhaven', 'Goldleaf', 'Highmark', 'Ironwood', 'Larkspur', 'Mesa Verde', 'Oakline', 'Pinecrest',
  'Quarry Road', 'Rosewood', 'Saltmarsh', 'Thornbury',
];

const OCCUPANCIES = [
  { occupancy: 'Dry goods warehouse', industry: 'Wholesale distribution', suffix: 'Logistics LLC' },
  { occupancy: 'Full-service restaurant', industry: 'Food service', suffix: 'Kitchen & Bar' },
  { occupancy: 'Light metal fabrication', industry: 'Manufacturing', suffix: 'Fabrication Inc.' },
  { occupancy: 'Class B office building', industry: 'Real estate', suffix: 'Office Partners' },
  { occupancy: 'Retail strip center', industry: 'Real estate', suffix: 'Retail Holdings' },
  { occupancy: 'Garden-style apartments', industry: 'Habitational', suffix: 'Residences LP' },
  { occupancy: 'Auto repair garage', industry: 'Auto services', suffix: 'Auto Works' },
  { occupancy: 'Cold storage facility', industry: 'Food distribution', suffix: 'Cold Storage Co.' },
  { occupancy: 'Limited-service hotel', industry: 'Hospitality', suffix: 'Inn & Suites' },
  { occupancy: 'Medical office building', industry: 'Healthcare real estate', suffix: 'Medical Plaza' },
  { occupancy: 'Self-storage facility', industry: 'Real estate', suffix: 'Self Storage' },
  { occupancy: 'Craft brewery & taproom', industry: 'Beverage manufacturing', suffix: 'Brewing Co.' },
  { occupancy: 'Commercial bakery', industry: 'Food manufacturing', suffix: 'Bakehouse Inc.' },
  { occupancy: 'Printing plant', industry: 'Printing', suffix: 'Press & Print' },
];

const LOCATIONS = [
  { city: 'Houston', state: 'TX', zip: '77002', coast: 45, flood: ['X', 'AE'] },
  { city: 'Corpus Christi', state: 'TX', zip: '78401', coast: 2, flood: ['AE', 'VE'] },
  { city: 'Austin', state: 'TX', zip: '78701', coast: 160, flood: ['X'] },
  { city: 'Tampa', state: 'FL', zip: '33602', coast: 3, flood: ['AE', 'X'] },
  { city: 'Orlando', state: 'FL', zip: '32801', coast: 45, flood: ['X'] },
  { city: 'Sacramento', state: 'CA', zip: '95814', coast: 85, flood: ['X', 'A'] },
  { city: 'San Diego', state: 'CA', zip: '92101', coast: 1, flood: ['X'] },
  { city: 'Atlanta', state: 'GA', zip: '30303', coast: 220, flood: ['X'] },
  { city: 'Savannah', state: 'GA', zip: '31401', coast: 15, flood: ['AE', 'X'] },
  { city: 'Chicago', state: 'IL', zip: '60601', coast: 700, flood: ['X'] },
  { city: 'Columbus', state: 'OH', zip: '43215', coast: 480, flood: ['X'] },
  { city: 'Charlotte', state: 'NC', zip: '28202', coast: 170, flood: ['X'] },
  { city: 'Phoenix', state: 'AZ', zip: '85004', coast: 260, flood: ['X'] },
  { city: 'Denver', state: 'CO', zip: '80202', coast: 900, flood: ['X'] },
  { city: 'Rochester', state: 'NY', zip: '14604', coast: 300, flood: ['X'] },
  { city: 'Tacoma', state: 'WA', zip: '98402', coast: 4, flood: ['X', 'AE'] },
  { city: 'New Orleans', state: 'LA', zip: '70112', coast: 8, flood: ['AE', 'A'] },
  { city: 'Nashville', state: 'TN', zip: '37203', coast: 370, flood: ['X', 'AE'] },
  { city: 'Pittsburgh', state: 'PA', zip: '15222', coast: 300, flood: ['X'] },
];

const STREETS = [
  'Industrial Pkwy', 'Commerce Dr', 'Market St', 'Harbor Blvd', 'Mill Rd', 'Enterprise Way',
  'Foundry Ave', 'Depot St', 'Canal St', 'Riverside Dr', 'Warehouse Row', 'Trade Center Blvd',
];

const BROKERS = [
  { agency: 'Northgate Risk Partners', people: ['Dana Whitfield', 'Marcus Oyelaran'] },
  { agency: 'Copperline Insurance Brokers', people: ['Priya Raman', 'Tom Kessler'] },
  { agency: 'Bluestem Specialty Group', people: ['Elena Vasquez', 'Grant Holloway'] },
  { agency: 'Meridian & Vale Brokerage', people: ['Aisha Bello', 'Ken Nakamura'] },
  { agency: 'Tallgrass Commercial Insurance', people: ['Riley Brennan', 'Sofia Marchetti'] },
  { agency: 'Keystone Harbor Agency', people: ['Jordan Pike', 'Mei-Lin Zhou'] },
];

const UNDERWRITERS = ['A. Moreau', 'J. Okafor', 'S. Lindqvist', 'R. Delgado'];

const LINES = ['PROPERTY', 'PROPERTY', 'PROPERTY', 'COMMERCIAL_PACKAGE', 'COMMERCIAL_PACKAGE', 'GENERAL_LIABILITY', 'UMBRELLA'];
const CONSTRUCTION = ['FRAME', 'JOISTED_MASONRY', 'NON_COMBUSTIBLE', 'MASONRY_NON_COMBUSTIBLE', 'MODIFIED_FIRE_RESISTIVE', 'FIRE_RESISTIVE'];
const CONSTRUCTION_WEIGHTS = [3, 4, 3, 2, 1, 1];
const CONSTRUCTION_LABEL = {
  FRAME: 'Frame (ISO 1)', JOISTED_MASONRY: 'Joisted masonry (ISO 2)', NON_COMBUSTIBLE: 'Non-combustible (ISO 3)',
  MASONRY_NON_COMBUSTIBLE: 'Masonry non-combustible (ISO 4)', MODIFIED_FIRE_RESISTIVE: 'Modified fire resistive (ISO 5)',
  FIRE_RESISTIVE: 'Fire resistive (ISO 6)',
};
const LOSS_CAUSES = {
  PROPERTY: ['FIRE', 'WATER_DAMAGE', 'WIND_HAIL', 'THEFT'],
  COMMERCIAL_PACKAGE: ['FIRE', 'WATER_DAMAGE', 'WIND_HAIL', 'THEFT', 'SLIP_AND_FALL'],
  GENERAL_LIABILITY: ['SLIP_AND_FALL', 'PRODUCT_LIABILITY', 'PREMISES_INJURY'],
  UMBRELLA: ['SLIP_AND_FALL', 'PREMISES_INJURY', 'VEHICLE'],
};
const LOSS_DESCRIPTIONS = {
  FIRE: 'Kitchen/equipment fire, contained to area of origin',
  WATER_DAMAGE: 'Burst supply line, interior water damage',
  WIND_HAIL: 'Hail damage to roof membrane and HVAC units',
  THEFT: 'Break-in, stock and equipment stolen',
  SLIP_AND_FALL: 'Customer slip and fall at entrance',
  PRODUCT_LIABILITY: 'Third-party injury alleged from product defect',
  PREMISES_INJURY: 'Visitor injured on premises',
  VEHICLE: 'Auto liability excess exposure',
};

const STATUS_PLAN = [
  ...Array(10).fill('NEW'), ...Array(9).fill('IN_REVIEW'), ...Array(8).fill('QUOTED'),
  ...Array(6).fill('DECLINED'), ...Array(7).fill('BOUND'),
];

function weighted(items, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r < 0) return items[i];
  }
  return items[items.length - 1];
}

const iso = (d) => d.toISOString().replace('.000Z', 'Z');
const isoDate = (d) => d.toISOString().slice(0, 10);
const addDays = (d, n) => new Date(d.getTime() + n * 86400000);
const addHours = (d, n) => new Date(d.getTime() + n * 3600000);
const money = (n) => '$' + Math.round(n).toLocaleString('en-US');

// shuffle statuses deterministically
const statuses = [...STATUS_PLAN];
for (let i = statuses.length - 1; i > 0; i--) {
  const j = Math.floor(rand() * (i + 1));
  [statuses[i], statuses[j]] = [statuses[j], statuses[i]];
}

const START = new Date('2026-06-15T08:00:00Z');
const submissions = [];

for (let i = 0; i < 40; i++) {
  const id = `SUB-${1001 + i}`;
  const status = statuses[i];
  const occ = pick(OCCUPANCIES);
  const loc = pick(LOCATIONS);
  const broker = pick(BROKERS);
  const line = pick(LINES);
  const construction = weighted(CONSTRUCTION, CONSTRUCTION_WEIGHTS);
  const name = `${PREFIXES[i]} ${occ.suffix}`;
  const yearsInBusiness = chance(0.15) ? int(1, 2) : int(3, 45);
  const yearBuilt = chance(0.2) ? int(1948, 1969) : chance(0.4) ? int(1970, 1999) : int(2000, 2023);
  const stories = construction === 'FRAME' ? int(1, 3) : int(1, 8);
  const squareFeet = roundTo(int(6000, 180000), 500);
  const sprinklered = construction === 'FRAME' ? chance(0.35) : chance(0.7);
  const protectionClass = chance(0.15) ? int(8, 10) : int(1, 7);
  const tivPerSqft = { FRAME: 140, JOISTED_MASONRY: 165, NON_COMBUSTIBLE: 150, MASONRY_NON_COMBUSTIBLE: 185, MODIFIED_FIRE_RESISTIVE: 230, FIRE_RESISTIVE: 260 }[construction];
  const tiv = roundTo(squareFeet * tivPerSqft * (0.8 + rand() * 0.9), 10000);
  const floodZone = pick(loc.flood);
  const distanceToCoastMiles = Math.max(0.5, Math.round((loc.coast + (rand() - 0.5) * Math.min(loc.coast, 10)) * 10) / 10);
  const annualRevenue = roundTo(int(800000, 60000000), 50000);
  const rate = { PROPERTY: 0.0042, COMMERCIAL_PACKAGE: 0.0058, GENERAL_LIABILITY: 0.0021, UMBRELLA: 0.0011 }[line];
  const premium = roundTo(tiv * rate * (0.85 + rand() * 0.4), 250);

  const receivedAt = addHours(addDays(START, Math.floor((i / 40) * 115) + int(0, 2)), int(0, 9));
  const decided = ['QUOTED', 'DECLINED', 'BOUND'].includes(status);
  const decidedAt = decided ? addHours(receivedAt, int(20, 260)) : null;

  // ---------------------------------------------------------------- loss history
  const hasLossRuns = status === 'NEW' ? chance(0.6) : chance(0.9);
  const losses = [];
  if (hasLossRuns) {
    const lossCount = weighted([0, 1, 2, 3, 4, 5], [5, 5, 4, 2, 1, 1]);
    for (let l = 0; l < lossCount; l++) {
      const cause = pick(LOSS_CAUSES[line]);
      const lossDate = addDays(receivedAt, -int(60, 1780));
      const severe = chance(0.2);
      const incurred = roundTo(severe ? int(120000, 600000) : int(4000, 85000), 100);
      const open = chance(0.2);
      const reserved = open ? roundTo(incurred * (0.3 + rand() * 0.5), 100) : 0;
      losses.push({
        id: `${id}-L${l + 1}`,
        lossDate: isoDate(lossDate),
        cause,
        description: LOSS_DESCRIPTIONS[cause],
        amountPaid: incurred - reserved,
        amountReserved: reserved,
        status: open ? 'OPEN' : 'CLOSED',
      });
    }
    losses.sort((a, b) => b.lossDate.localeCompare(a.lossDate));
  }
  const totalIncurred = losses.reduce((s, l) => s + l.amountPaid + l.amountReserved, 0);
  const openClaims = losses.filter((l) => l.status === 'OPEN').length;

  // ---------------------------------------------------------------- documents
  const hasInspection = chance(0.6);
  const roofAgeYears = Math.min(new Date(receivedAt).getUTCFullYear() - yearBuilt, chance(0.5) ? int(2, 14) : int(15, 32));
  const openRecommendations = hasInspection ? weighted([0, 1, 2, 3, 4], [4, 3, 2, 1, 1]) : 0;
  const slug = PREFIXES[i].toLowerCase().replace(/[^a-z]+/g, '_');
  const docTime = (h) => iso(addHours(receivedAt, h));
  const docs = [];
  const addDoc = (type, fileName, pages, fields, hours) =>
    docs.push({
      id: `${id}-D${docs.length + 1}`,
      fileName,
      type,
      sizeBytes: pages * int(38000, 72000),
      pageCount: pages,
      uploadedAt: docTime(hours),
      extractedFields: fields.map(([key, label, value]) => ({ key, label, value: String(value) })),
    });

  addDoc('ACORD_125', `acord125_${slug}.pdf`, 4, [
    ['applicant_name', 'Applicant name', name],
    ['industry', 'Industry', occ.industry],
    ['years_in_business', 'Years in business', yearsInBusiness],
    ['annual_revenue', 'Annual revenue', money(annualRevenue)],
  ], 0);
  addDoc('ACORD_140', `acord140_${slug}.pdf`, 3, [
    ['construction_class', 'Construction class', CONSTRUCTION_LABEL[construction]],
    ['occupancy', 'Occupancy', occ.occupancy],
    ['year_built', 'Year built', yearBuilt],
    ['stories', 'Stories', stories],
    ['square_feet', 'Square feet', squareFeet.toLocaleString('en-US')],
    ['sprinklered', 'Sprinklered', sprinklered ? 'Yes – 100% wet system' : 'No'],
    ['protection_class', 'ISO protection class', protectionClass],
  ], 0);
  addDoc('SOV', `statement_of_values_${slug}.xlsx`, 1, [
    ['total_insured_value', 'Total insured value', money(tiv)],
    ['location_state', 'Location state', loc.state],
    ['flood_zone', 'FEMA flood zone', floodZone],
    ['distance_to_coast_miles', 'Distance to coast (mi)', distanceToCoastMiles],
  ], 1);
  if (hasLossRuns) {
    addDoc('LOSS_RUNS', `loss_runs_5yr_${slug}.pdf`, Math.max(2, losses.length + 1), [
      ['valuation_date', 'Valuation date', isoDate(addDays(receivedAt, -int(5, 40)))],
      ['loss_count_5y', 'Losses (5 yrs)', losses.length],
      ['total_incurred_5y', 'Total incurred (5 yrs)', money(totalIncurred)],
      ['open_claims', 'Open claims', openClaims],
    ], 2);
  }
  if (hasInspection) {
    addDoc('INSPECTION_REPORT', `inspection_report_${slug}.pdf`, int(6, 14), [
      ['inspection_date', 'Inspection date', isoDate(addDays(receivedAt, -int(30, 400)))],
      ['roof_age_years', 'Roof age (yrs)', roofAgeYears],
      ['open_recommendations', 'Open recommendations', openRecommendations],
    ], 3);
  }
  if (chance(0.35)) {
    addDoc('FINANCIAL_STATEMENT', `financials_fy2025_${slug}.pdf`, int(8, 20), [
      ['fiscal_year', 'Fiscal year', 2025],
      ['annual_revenue', 'Revenue', money(annualRevenue)],
    ], 4);
  }

  const brokerName = pick(broker.people);
  submissions.push({
    id,
    reference: `RP-2026-${String(1001 + i).padStart(5, '0')}`,
    status,
    lineOfBusiness: line,
    premium,
    receivedAt: iso(receivedAt),
    decidedAt: decidedAt ? iso(decidedAt) : null,
    applicant: {
      name,
      industry: occ.industry,
      yearsInBusiness,
      annualRevenue,
      street: `${int(100, 9800)} ${pick(STREETS)}`,
      city: loc.city,
      state: loc.state,
      zip: loc.zip,
    },
    broker: {
      name: brokerName,
      agency: broker.agency,
      email: `${brokerName.toLowerCase().replace(/[^a-z]+/g, '.')}@${broker.agency.toLowerCase().split(/[^a-z]+/)[0]}.example.com`,
    },
    property: {
      constructionClass: construction,
      occupancy: occ.occupancy,
      yearBuilt,
      stories,
      squareFeet,
      sprinklered,
      protectionClass,
      tiv,
      floodZone,
      distanceToCoastMiles,
      roofAgeYears: hasInspection ? roofAgeYears : null,
      openRecommendations: hasInspection ? openRecommendations : null,
    },
    losses,
    documents: docs,
    historicalDecision: decided
      ? {
          id: `${id}-DEC0`,
          finalAction: status === 'DECLINED' ? 'DECLINE' : 'QUOTE',
          underwriter: pick(UNDERWRITERS),
          decidedAt: iso(decidedAt),
          reason: status === 'DECLINED' ? 'Declined prior to RiskPilot rollout (historical record).' : 'Quoted prior to RiskPilot rollout (historical record).',
        }
      : null,
  });
}

const appetiteRules = [
  { id: 1, name: 'Core property – Sun Belt', lineOfBusiness: 'PROPERTY', state: null, constructionClass: null, maxTiv: 25000000, active: true, notes: 'Default property appetite, all construction classes.' },
  { id: 2, name: 'Property – Florida masonry only', lineOfBusiness: 'PROPERTY', state: 'FL', constructionClass: 'MASONRY_NON_COMBUSTIBLE', maxTiv: 15000000, active: true, notes: 'FL limited to ISO 4 (masonry non-combustible) or better.' },
  { id: 3, name: 'Package – middle market', lineOfBusiness: 'COMMERCIAL_PACKAGE', state: null, constructionClass: null, maxTiv: 20000000, active: true, notes: 'BOP/package for middle market accounts.' },
  { id: 4, name: 'GL – general appetite', lineOfBusiness: 'GENERAL_LIABILITY', state: null, constructionClass: null, maxTiv: 50000000, active: true, notes: 'TIV used as exposure proxy.' },
  { id: 5, name: 'Umbrella – excess over our primary', lineOfBusiness: 'UMBRELLA', state: null, constructionClass: null, maxTiv: 30000000, active: true, notes: '' },
  { id: 6, name: 'Property – Louisiana (paused)', lineOfBusiness: 'PROPERTY', state: 'LA', constructionClass: null, maxTiv: 5000000, active: false, notes: 'Paused pending cat-model review.' },
];
// Matching (see AppetiteEvaluator): state-specific rules are authoritative for their state;
// constructionClass is a MINIMUM ISO class (FRAME=1 … FIRE_RESISTIVE=6).

const data = { generatedAt: '2026-10-12T00:00:00Z', submissions, appetiteRules };

// ---------------------------------------------------------------- write JSON
const jsonPath = resolve(root, 'frontend/src/app/mock/seed-data.json');
mkdirSync(dirname(jsonPath), { recursive: true });
writeFileSync(jsonPath, JSON.stringify(data, null, 2) + '\n');

// ---------------------------------------------------------------- write SQL
const q = (v) => (v === null || v === undefined ? 'NULL' : typeof v === 'number' || typeof v === 'boolean' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
const lines = ['-- GENERATED by scripts/generate-seed.mjs – do not edit by hand.', '-- Synthetic data only; all companies, people and addresses are fictional.', ''];
for (const s of submissions) {
  const a = s.applicant, b = s.broker, p = s.property;
  lines.push(
    `INSERT INTO submissions (id, reference, status, line_of_business, premium, received_at, decided_at, applicant_name, industry, years_in_business, annual_revenue, street, city, state, zip, broker_name, broker_agency, broker_email, construction_class, occupancy, year_built, stories, square_feet, sprinklered, protection_class, tiv, flood_zone, distance_to_coast_miles, roof_age_years, open_recommendations) VALUES (${[
      s.id, s.reference, s.status, s.lineOfBusiness, s.premium, s.receivedAt, s.decidedAt, a.name, a.industry, a.yearsInBusiness, a.annualRevenue, a.street, a.city, a.state, a.zip, b.name, b.agency, b.email,
      p.constructionClass, p.occupancy, p.yearBuilt, p.stories, p.squareFeet, p.sprinklered, p.protectionClass, p.tiv, p.floodZone, p.distanceToCoastMiles, p.roofAgeYears, p.openRecommendations,
    ].map(q).join(', ')});`,
  );
  for (const l of s.losses) {
    lines.push(`INSERT INTO losses (id, submission_id, loss_date, cause, description, amount_paid, amount_reserved, status) VALUES (${[l.id, s.id, l.lossDate, l.cause, l.description, l.amountPaid, l.amountReserved, l.status].map(q).join(', ')});`);
  }
  for (const d of s.documents) {
    lines.push(`INSERT INTO documents (id, submission_id, file_name, doc_type, size_bytes, page_count, uploaded_at, extracted_fields) VALUES (${[d.id, s.id, d.fileName, d.type, d.sizeBytes, d.pageCount, d.uploadedAt].map(q).join(', ')}, ${q(JSON.stringify(d.extractedFields))}::jsonb);`);
  }
  if (s.historicalDecision) {
    const h = s.historicalDecision;
    lines.push(`INSERT INTO decisions (id, submission_id, assessment_id, recommended_action, final_action, outcome, reason, underwriter, decided_at) VALUES (${[h.id, s.id, null, null, h.finalAction, 'MANUAL', h.reason, h.underwriter, h.decidedAt].map(q).join(', ')});`);
    lines.push(`INSERT INTO audit_log (entity_type, entity_id, action, actor, details, created_at) VALUES (${['SUBMISSION', s.id, 'DECISION_RECORDED', h.underwriter, `${h.finalAction} (manual, historical)`, h.decidedAt].map(q).join(', ')});`);
  }
  lines.push('');
}
for (const r of appetiteRules) {
  lines.push(`INSERT INTO appetite_rules (id, name, line_of_business, state, construction_class, max_tiv, active, notes) VALUES (${[r.id, r.name, r.lineOfBusiness, r.state, r.constructionClass, r.maxTiv, r.active, r.notes].map(q).join(', ')});`);
}
lines.push(`SELECT setval('appetite_rules_id_seq', (SELECT MAX(id) FROM appetite_rules));`);
const sqlPath = resolve(root, 'backend/src/main/resources/db/migration/V2__seed_data.sql');
mkdirSync(dirname(sqlPath), { recursive: true });
writeFileSync(sqlPath, lines.join('\n') + '\n');

const count = (s) => submissions.filter((x) => x.status === s).length;
console.log(`Seed: ${submissions.length} submissions (NEW ${count('NEW')}, IN_REVIEW ${count('IN_REVIEW')}, QUOTED ${count('QUOTED')}, DECLINED ${count('DECLINED')}, BOUND ${count('BOUND')}), ${appetiteRules.length} appetite rules`);
