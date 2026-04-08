import { calcB737, lookupB737Speeds, lookupB737ClimbLimited } from "./calc-b737.js";

// ─────────────────────────────────────────────────────────────────────────────
// 737-800  (CFM56-7B27)
// ─────────────────────────────────────────────────────────────────────────────
export const b737800Config = {
  id:        "b737-800",
  label:     "737-800",
  title:     "737-800 In-Flight Normal Landing Distance",
  maxWeight: 162800,   // 737-800 MLAW lbs

  defaults: {
    flap:          "FLAPS 30",
    brakeMode:     "MAX_AUTO",
    reversers:     "Both",
    vrefAdditive:  5,
    landingWeight: 130000,
    engineAntiIce: false,
    wingAntiIce:   false,
    iceAccretion:  false,
    pressureAlt:   1000,
    oatC:          24,
    headwind:      5,
    brakingAction: 6,
  },

  weightLimits: { min: 100000, max: 162800, step: 1000 },

  // 737 flap settings for landing: Flaps 30 (normal) or Flaps 40 (short field)
  flapOptions: [
    { value: "FLAPS 30", label: "Flaps 30" },
    { value: "FLAPS 40", label: "Flaps 40" },
  ],

  // Boeing autobrake nomenclature: MAX AUTO, 3, 2, 1
  // (RTO is a ground mode — not used for in-flight landing performance)
  brakeModeOptions: [
    { value: "MAX_AUTO", label: "MAX AUTO" },
    { value: "AUTO_3",   label: "Autobrake 3" },
    { value: "AUTO_2",   label: "Autobrake 2" },
    { value: "AUTO_1",   label: "Autobrake 1" },
  ],

  // Thrust reverser deployment options
  reverserOptions: [
    { value: "Both",  label: "Both" },
    { value: "Idle",  label: "Idle / Stowed" },
    { value: "None",  label: "None" },
  ],

  brakingOptions: [
    { value: 6, label: "6 - Dry",      surface: "dry"  },
    { value: 5, label: "5 - Good",     surface: "dry"  },
    { value: 4, label: "4 - Good/Med", surface: "poor" },
    { value: 3, label: "3 - Medium",   surface: "poor" },
    { value: 2, label: "2 - Med/Poor", surface: "poor" },
    { value: 1, label: "1 - Poor",     surface: "poor" },
  ],

  // Speed labels shown in the bottom bar.
  // Boeing uses VREF (threshold ref), F (Flaps 15), S (Flaps 5), G (clean/Vref+80).
  // VAPP = VREF + additive is computed in calculate() and returned as "vapp".
  speedSlots: [
    { key: "vref", label: "VREF", color: "#ff3b30" },
    { key: "vapp", label: "VAPP", color: "#34c759" },
    { key: "f",    label: "F",    color: "#007aff" },
    { key: "s",    label: "S",    color: "#ff9500" },
    { key: "g",    label: "G",    color: "#8e8e93" },
  ],

  toggles: ["engineAntiIce", "wingAntiIce", "iceAccretion"],

  showShortRunway: false,   // enable when short-field QRH data available
  showCatII:       false,
  showBrakeMode:   true,
  primaryDistKey:  "byRwyCC",

  calculate(s) {
    const speeds = lookupB737Speeds(s.landingWeight, s.flap);
    const vref   = speeds.VREF;
    const vapp   = vref + s.vrefAdditive;

    const distances = calcB737({
      weightLbs:    s.landingWeight,
      flap:         s.flap,
      brakeMode:    s.brakeMode,
      pressureAlt:  s.pressureAlt,
      oatC:         s.oatC,
      headwind:     s.headwind,
      vrefAdditive: s.vrefAdditive,
      reversers:    s.reversers,   // "Both" | "Idle" | "None"
    });

    // Climb-limited go-around weight — anti-ice deduction applied inside calc
    // Per QRH note (IMG_0901): decrease gradient by 58 Ft/NM for Anti-Ice ON.
    // "Anti-Ice ON" means engine anti-ice, wing anti-ice, or both.
    const antiIceOn = s.engineAntiIce || s.wingAntiIce;
    const climbLimitedKlbs = lookupB737ClimbLimited(
      s.flap,
      s.pressureAlt,
      s.oatC,
      antiIceOn,
    );

    return {
      speeds: {
        vref,
        vapp,
        f: speeds.F,
        s: speeds.S,
        g: speeds.G,
      },
      distances,
      climbLimitedKlbs,
      primaryDist: distances ? distances[s.brakingAction] : null,
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 737-900ER  (CFM56-7B27E)
// ─────────────────────────────────────────────────────────────────────────────
// Same calc engine; different MLAW and default weight.
// If the QRH tables differ from the -800, create a separate calc-b737-900er.js
// and swap out the imports above.
export const b737900erConfig = {
  ...b737800Config,
  id:        "b737-900er",
  label:     "737-900ER",
  title:     "737-900ER In-Flight Normal Landing Distance",
  maxWeight: 174200,   // 737-900ER MLAW lbs
  defaults: {
    ...b737800Config.defaults,
    landingWeight: 140000,
  },
  weightLimits: { min: 110000, max: 174200, step: 1000 },
};
