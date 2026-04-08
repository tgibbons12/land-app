import { useState, useCallback } from "react";
import { FLEETS, FAMILY_LIST } from "./lib/fleetRegistry.js";

// ─────────────────────────────────────────────────────────────────────────────
// RCAM DATA
// ─────────────────────────────────────────────────────────────────────────────
const RCAM_ROWS = [
  { code: 6, color: "#000", bg: "#fff",    desc: "Dry",                                     braking: "—",                          pilot: "—"       },
  { code: 5, color: "#000", bg: "#fff",    desc: "Frost / Wet (≤⅛\") / Slush ≤⅛\" / Dry or Wet Snow ≤⅛\"", braking: "Normal deceleration AND normal directional control", pilot: "Good" },
  { code: 4, color: "#000", bg: "#fff",    desc: "Compacted Snow (≤−15°C)",                 braking: "Between Good and Medium",    pilot: "Good to Medium" },
  { code: 3, color: "#000", bg: "#fff",    desc: "Slippery When Wet / Dry or Wet Snow over Compacted Snow / Compacted Snow (>−15°C) / Dry or Wet Snow >⅛\"", braking: "Noticeably reduced deceleration OR directional control", pilot: "Medium" },
  { code: 2, color: "#000", bg: "#fff",    desc: "Water >⅛\" / Slush >⅛\"",               braking: "Between Medium and Poor",    pilot: "Medium to Poor" },
  { code: 1, color: "#fff", bg: "#c0392b", desc: "Ice",                                     braking: "Significantly reduced deceleration OR directional control", pilot: "Poor" },
  { code: 0, color: "#fff", bg: "#7b0000", desc: "Wet Ice / Slush over Ice / Water over Compacted Snow / Snow over Ice", braking: "Minimal to non-existent deceleration OR directional control uncertain", pilot: "Nil" },
];

// ─────────────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────────────
const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; width: 100%; max-width: 100% !important; padding: 0 !important; overflow: hidden; text-align: left; }

  body {
    background: #E4E3EA;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
    color: #000;
    -webkit-font-smoothing: antialiased;
  }

  /* Outer shell — iPad background with thick bezels */
  .shell {
    height: 100dvh; width: 100%;
    display: flex; flex-direction: column;
    background: #E4E3EA;
    padding: 16px 16px 0;
  }

  /* Rounded gray container */
  .card {
    background: #9B9B9B;
    border: 1px solid #888888;
    border-radius: 12px;
    overflow: hidden;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    box-shadow: 0 1px 8px rgba(0,0,0,0.18);
  }

  /* ── TITLE BAR — lighter gray ── */
  .title-bar {
    background: #E4E3EA;
    display: flex; align-items: center; justify-content: center;
    padding: 7px 16px 6px; flex-shrink: 0; position: relative;
  }
  .title-bar h1 { font-size: 14px; font-weight: 400; color: #578E48; letter-spacing: 0; text-align: center; }
  .title-settings-btn {
    background: none; border: none; color: #007aff; font-size: 20px;
    cursor: pointer; padding: 0 4px; line-height: 1; font-family: inherit;
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  }
  .title-settings-btn:active { opacity: 0.5; }

  /* ── TWO PANELS — inside gray surround ── */
  .panels {
    display: grid; grid-template-columns: 1fr 1fr;
    flex: 1; min-height: 0;
    padding: 8px 8px 0; gap: 16px;
  }
  @media (max-width: 600px) { .panels { grid-template-columns: 1fr; } }

  .panel {
    background: #ffffff;
    padding: 10px 18px 14px;
    display: flex; flex-direction: column; gap: 0;
    border: 1px solid #d0d0d5; border-radius: 10px;
    overflow-y: auto; min-height: 0;
  }

  /* ── SECTION ROW ── */
  .srow { display: flex; flex-direction: column; align-items: center; padding: 7px 0 6px; gap: 5px; }
  .srow + .srow { border-top: 1px solid #e5e5ea; }
  .lbl { font-size: 13px; font-weight: 400; color: #000; text-align: center; line-height: 1.3; }
  .sublbl { font-size: 11px; color: #8e8e93; text-align: center; margin-top: -2px; }
  .val { font-size: 15px; color: #007aff; text-align: center; }

  /* ── SEGMENTED CONTROL ── */
  .seg { display: inline-flex; background: rgba(118,118,128,0.12); border-radius: 9px; padding: 2px; gap: 0; position: relative; }
  .seg-btn {
    position: relative; background: transparent; border: none; border-radius: 7px;
    font-size: 13px; font-weight: 400; color: #3c3c43; padding: 5px 14px;
    cursor: pointer; font-family: inherit; transition: color 0.15s;
    min-width: 48px; text-align: center; z-index: 1; white-space: nowrap;
  }
  .seg-btn.active { background: #ffffff; color: #000; font-weight: 500; box-shadow: 0 1px 3px rgba(0,0,0,0.18), 0 1px 1px rgba(0,0,0,0.06); }
  .seg-btn:not(.active):active { background: rgba(0,0,0,0.05); }

  /* ── STEPPER ── */
  .stepper { display: inline-flex; align-items: stretch; border-radius: 9px; overflow: hidden; border: 1px solid rgba(0,0,0,0.15); background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,0.08); }
  .step-btn {
    background: #fff; border: none; color: #007aff; font-size: 20px; font-weight: 300;
    width: 42px; height: 30px; cursor: pointer; display: flex; align-items: center;
    justify-content: center; font-family: inherit; line-height: 1;
    user-select: none; -webkit-user-select: none; transition: background 0.1s;
  }
  .step-divider { width: 1px; background: rgba(0,0,0,0.15); flex-shrink: 0; }
  .step-btn:active { background: #E4E3EA; }

  /* ── TOGGLES ── */
  .toggle-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; padding: 6px 0 4px; width: 100%; }
  .toggle-cell { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .toggle-lbl { font-size: 12px; color: #000; text-align: center; line-height: 1.2; }
  .ios-toggle { position: relative; width: 44px; height: 26px; display: block; }
  .ios-toggle input { position: absolute; opacity: 0; width: 0; height: 0; }
  .ios-track { position: absolute; inset: 0; background: #e5e5ea; border-radius: 26px; cursor: pointer; transition: background 0.22s; }
  .ios-track::before {
    content: ''; position: absolute; width: 22px; height: 22px; left: 2px; top: 2px;
    background: #fff; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.28); transition: transform 0.22s;
  }
  .ios-toggle input:checked ~ .ios-track { background: #578E48; }
  .ios-toggle input:checked ~ .ios-track::before { transform: translateX(18px); }

  /* ── BUTTONS ── */
  .rcam-btn { background: none; border: none; color: #007aff; font-size: 13.5px; font-family: inherit; cursor: pointer; padding: 2px 0; text-align: center; }
  .rcam-btn:active { opacity: 0.5; }
  .calc-btn { background: none; border: none; color: #007aff; font-size: 15px; font-family: inherit; cursor: pointer; padding: 4px 6px; white-space: nowrap; flex-shrink: 0; }
  .calc-btn:active { opacity: 0.5; }
  .hw-row { display: flex; align-items: center; gap: 10px; }
  .short-row { display: flex; align-items: center; gap: 10px; justify-content: center; }
  .short-none { font-size: 14px; color: #8e8e93; }

  /* ── BOTTOM BAR — flat white strip, no rounded corners, flush with card edges ── */
  .bottom-bar {
    background: #ffffff;
    border-top: 1px solid #c6c6c8;
    margin: 0 8px 8px;
    border-radius: 0 0 8px 8px;
    padding: 8px 16px 10px;
    display: flex; align-items: center;
    gap: 8px; flex-shrink: 0; flex-wrap: nowrap;
  }
  .speeds { display: flex; gap: 20px; align-items: flex-end; flex-shrink: 0; }
  .spd { display: flex; flex-direction: column; align-items: flex-start; }
  .spd-num { font-size: clamp(26px, 4vw, 36px); font-weight: 300; line-height: 1; }
  .spd-lbl { font-size: 10px; color: #8e8e93; margin-top: 2px; letter-spacing: 0.2px; text-transform: uppercase; }
  .bottom-mid { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 0; }
  .bot-actions { display: flex; gap: 20px; align-items: center; }
  .bot-btn { background: none; border: none; color: #007aff; font-size: 14px; font-family: inherit; cursor: pointer; }
  .bot-btn:active { opacity: 0.5; }
  .bot-type { font-size: 16px; font-weight: 700; color: #578E48; }
  .bot-note { font-size: 11px; color: #578E48; text-align: center; font-weight: 400; }
  .bot-sub { font-size: 10px; color: #8e8e93; text-align: center; }
  .dist-block { display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0; }
  .dist-num { font-size: clamp(28px, 4.5vw, 40px); font-weight: 400; color: #000; line-height: 1; white-space: nowrap; }
  .dist-lbl { font-size: 11px; color: #8e8e93; text-align: right; margin-top: 2px; }

  /* ── TAB BAR — on iPad background, outside card ── */
  .tab-bar {
    background: transparent;
    display: flex; flex-shrink: 0;
    padding: 4px 0 env(safe-area-inset-bottom, 8px);
  }
  .tab { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 6px 10px 4px; cursor: pointer; gap: 3px; background: none; border: none; font-family: inherit; }
  .tab-plane { display: block; color: #8e8e93; }
  .tab:has(.tab-lbl.on) .tab-plane { color: #007aff; }
  .tab-lbl { font-size: 11px; color: #8e8e93; }
  .tab-lbl.on { color: #007aff; }
  .tab-bar-indicator { width: 36px; height: 4px; background: #000; border-radius: 2px; margin: 3px auto 0; }

  /* ── MODAL BASE ── */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
  .modal { background: #fff; border-radius: 14px; width: 100%; max-width: 680px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.35); }
  .modal-header { padding: 16px 20px 12px; border-bottom: 1px solid #e5e5ea; display: flex; align-items: center; justify-content: space-between; }
  .modal-title { font-size: 15px; font-weight: 600; color: #000; line-height: 1.2; }
  .modal-subtitle { font-size: 11px; color: #8e8e93; margin-top: 2px; }
  .modal-close { background: #e5e5ea; border: none; border-radius: 50%; width: 28px; height: 28px; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #3c3c43; flex-shrink: 0; font-family: inherit; }
  .modal-body { overflow-y: auto; padding: 0; }
  .modal-footer { padding: 10px 16px; border-top: 1px solid #e5e5ea; font-size: 10px; color: #8e8e93; line-height: 1.5; }

  /* ── RCAM TABLE ── */
  .rcam-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .rcam-table th { background: #E4E3EA; padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 600; color: #3c3c43; border-bottom: 1px solid #e5e5ea; position: sticky; top: 0; }
  .rcam-table td { padding: 9px 12px; border-bottom: 1px solid #E4E3EA; vertical-align: top; line-height: 1.35; }
  .rcam-table tr:last-child td { border-bottom: none; }
  .rcc-badge { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 6px; font-size: 15px; font-weight: 700; }

  /* ── FLEET PICKER MODAL ── */
  .fleet-picker { background: #fff; border-radius: 14px; width: 100%; max-width: 380px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.35); }
  .fleet-list { padding: 8px 0; }
  .fleet-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 20px; cursor: pointer; border: none; background: none;
    width: 100%; font-family: inherit; text-align: left;
    border-bottom: 1px solid #E4E3EA;
  }
  .fleet-item:last-child { border-bottom: none; }
  .fleet-item:active { background: #E4E3EA; }
  .fleet-item-label { font-size: 16px; color: #000; }
  .fleet-item-check { color: #007aff; font-size: 18px; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// SUBCOMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function Seg({ options, value, onChange }) {
  return (
    <div className="seg">
      {options.map(o => (
        <button key={o.value ?? o} className={`seg-btn${value === (o.value ?? o) ? " active" : ""}`} onClick={() => onChange(o.value ?? o)}>
          {o.label ?? o}
        </button>
      ))}
    </div>
  );
}

function Stepper({ value, onChange, step = 1, min = -9999, max = 99999 }) {
  return (
    <div className="stepper">
      <button className="step-btn" onClick={() => onChange(Math.max(min, value - step))}>−</button>
      <div className="step-divider" />
      <button className="step-btn" onClick={() => onChange(Math.min(max, value + step))}>+</button>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <label className="ios-toggle">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="ios-track" />
    </label>
  );
}

function RCAMModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Runway Condition Assessment Matrix</div>
            <div className="modal-subtitle">AC 91-79A CHG 1 — Operational RCAM (Pilot)</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <table className="rcam-table">
            <thead>
              <tr>
                <th style={{width:48}}>RwyCC</th>
                <th>Runway Condition Description</th>
                <th>Control / Braking Observation</th>
                <th>Pilot Braking Action</th>
              </tr>
            </thead>
            <tbody>
              {RCAM_ROWS.map(row => (
                <tr key={row.code}>
                  <td><span className="rcc-badge" style={{background: row.bg, color: row.color, border: row.bg === "#fff" ? "1px solid #c6c6c8" : "none"}}>{row.code}</span></td>
                  <td>{row.desc}</td>
                  <td style={{color:"#3c3c43"}}>{row.braking}</td>
                  <td><strong>{row.pilot}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="modal-footer">
          Runway condition codes (e.g. 4/3/3) represent conditions for each third of the landing surface as reported by the airport operator.
        </div>
      </div>
    </div>
  );
}

function FleetPicker({ currentFamilyId, onSelect, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="fleet-picker" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Select Fleet</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="fleet-list">
          {FAMILY_LIST.map(family => (
            <button key={family.id} className="fleet-item" onClick={() => { onSelect(family.id); onClose(); }}>
              <span className="fleet-item-label">{family.label}</span>
              {family.id === currentFamilyId && <span className="fleet-item-check">✓</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOGGLE LABELS
// ─────────────────────────────────────────────────────────────────────────────
const TOGGLE_LABELS = {
  antiIce:      "Anti-ice ON",
  catII:        "CAT II",
  stallProtIce: <span>Stall Prot<br/>Ice Speeds</span>,
  iceAccretion: "Ice Accretion",
  engineAntiIce: <span>Engine<br/>Anti-ice</span>,
  wingAntiIce:   <span>Wing<br/>Anti-ice</span>,
};

// ─────────────────────────────────────────────────────────────────────────────
// EJET PANEL
// ─────────────────────────────────────────────────────────────────────────────
function EjetLeftPanel({ s, set, fleet }) {
  return (
    <div className="panel">
      {fleet.acTypeOptions && (
        <div className="srow">
          <div className="lbl">Aircraft Type</div>
          <div className="val">{s.acType}</div>
          <Seg options={fleet.acTypeOptions} value={s.acType} onChange={set("acType")} />
        </div>
      )}
      <div className="srow">
        <div className="lbl">Flap Lever Position</div>
        <Seg options={fleet.flapOptions} value={s.flap} onChange={set("flap")} />
      </div>
      <div className="srow">
        <div className="lbl">Thrust Reversers</div>
        <Seg options={fleet.reverserOptions} value={s.reversers} onChange={set("reversers")} />
      </div>
      <div className="srow">
        <div className="val">VAPP = VREF+{s.vappAdd}</div>
        <Stepper value={s.vappAdd} onChange={set("vappAdd")} step={5} min={0} max={30} />
      </div>
      <div className="srow">
        <div className="lbl">Landing Weight</div>
        <div className="val">{s.landingWeight.toLocaleString()}</div>
        <Stepper value={s.landingWeight} onChange={set("landingWeight")} step={fleet.weightLimits.step} min={fleet.weightLimits.min} max={fleet.weightLimits.max} />
      </div>
      <div className="toggle-grid">
        {fleet.toggles.map(key => (
          <div key={key} className="toggle-cell">
            <div className="toggle-lbl">{TOGGLE_LABELS[key]}</div>
            <Toggle checked={!!s[key]} onChange={set(key)} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// A32F PANEL (A319, A321 IAE-SL, A321 IAE, A321 CFM)
// ─────────────────────────────────────────────────────────────────────────────
function A32FLeftPanel({ s, set, fleet, variants, currentVariantId, onVariantChange }) {
  return (
    <div className="panel">
      <div className="srow">
        <div className="lbl">Aircraft Type</div>
        <Seg
          options={variants.map(v => ({ value: v.id, label: v.label.replace("A321 ","321 ").replace("A319","319") }))}
          value={currentVariantId}
          onChange={onVariantChange}
        />
      </div>
      <div className="srow">
        <div className="lbl">Configuration</div>
        <Seg options={fleet.flapOptions} value={s.flap} onChange={set("flap")} />
      </div>
      <div className="srow">
        <div className="lbl">Brake Mode</div>
        <Seg options={fleet.brakeModeOptions} value={s.brakeMode} onChange={set("brakeMode")} />
      </div>
      <div className="srow">
        <div className="lbl">Thrust Reversers</div>
        <Seg options={fleet.reverserOptions} value={s.reversers} onChange={set("reversers")} />
      </div>
      <div className="srow">
        <div className="val">VAPP = VLS+{s.vappAdditive}</div>
        <Stepper value={s.vappAdditive} onChange={set("vappAdditive")} step={5} min={5} max={30} />
      </div>
      <div className="srow">
        <div className="lbl">Landing Weight</div>
        <div className="val">{s.landingWeight.toLocaleString()}</div>
        <Stepper value={s.landingWeight} onChange={set("landingWeight")} step={fleet.weightLimits.step} min={fleet.weightLimits.min} max={fleet.weightLimits.max} />
      </div>
      <div className="toggle-grid">
        {fleet.toggles.map(key => (
          <div key={key} className="toggle-cell">
            <div className="toggle-lbl">{TOGGLE_LABELS[key]}</div>
            <Toggle checked={!!s[key]} onChange={set(key)} />
          </div>
        ))}
      </div>
      {fleet.showShortRunway && (
        <div className="srow">
          <div className="lbl">Short Runway Station</div>
          <div className="short-row">
            <Toggle checked={!!s.shortRwyStation} onChange={set("shortRwyStation")} />
            <span className="short-none">None</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED RIGHT PANEL
// ─────────────────────────────────────────────────────────────────────────────
function RightPanel({ s, set, fleet, brakingLbl, onCalculate, onShowRCAM }) {
  return (
    <div className="panel">
      <div className="srow">
        <div className="lbl">Pressure Altitude</div>
        <div className="val">{s.pressureAlt.toLocaleString()}</div>
        <Stepper value={s.pressureAlt} onChange={set("pressureAlt")} step={500} min={-2000} max={14000} />
      </div>
      <div className="srow">
        <div className="lbl">OAT° C</div>
        <div className="val">{s.oatC}</div>
        <Stepper value={s.oatC} onChange={set("oatC")} step={1} min={-60} max={55} />
      </div>
      <div className="srow">
        <div className="lbl">Headwind</div>
        <div className="sublbl">(negative for tailwind)</div>
        <div className="val">{s.headwind}</div>
        <div className="hw-row">
          <Stepper value={s.headwind} onChange={set("headwind")} step={5} min={-50} max={50} />
          <button className="calc-btn" onClick={onCalculate}>Calculate</button>
        </div>
      </div>
      <div className="srow">
        <div className="lbl">Braking Action</div>
        <div className="val">{brakingLbl}</div>
        <Stepper value={s.brakingAction} onChange={set("brakingAction")} step={1} min={1} max={6} />
      </div>
      <div className="srow">
        <button className="rcam-btn" onClick={onShowRCAM}>Runway Condition Assessment Matrix</button>
      </div>
      {fleet.showShortRunway && (
        <div className="srow">
          <div className="lbl">Short Runway Station</div>
          <div className="short-row">
            <Toggle checked={!!s.shortRwyStation} onChange={set("shortRwyStation")} />
            <span className="short-none">None</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOTTOM BAR
// ─────────────────────────────────────────────────────────────────────────────
function BottomBar({ fleet, result, s, onReset, acLabel }) {
  const primaryDist = result ? (result.primaryDist ?? result.distances?.MAX_MAN) : null;
  const isAirbus = fleet.id !== "ejet";

  const climbNote = result
    ? isAirbus
      ? result.climbLimitedKlbs != null
        ? `${Math.round(result.climbLimitedKlbs * 1000).toLocaleString()}`
        : null
      : result.climbLimited != null
        ? `${result.climbLimited.toLocaleString()} (${result.structural.toLocaleString()} structural)`
        : null
    : null;

  return (
    <div className="bottom-bar">
      <div className="speeds">
        {fleet.speedSlots.map(slot => (
          <div key={slot.key} className="spd">
            <div className="spd-num" style={{color: slot.color}}>
              {result ? (result.speeds[slot.key] ?? "—") : "—"}
            </div>
            <div className="spd-lbl">{slot.label}</div>
          </div>
        ))}
      </div>

      <div className="bottom-mid">
        <div className="bot-actions">
          <button className="bot-btn" onClick={onReset}>Reset</button>
          <div className="bot-type">{acLabel}</div>
          <button className="bot-btn">Audit</button>
        </div>
        {climbNote && (
          <>
            <div className="bot-note">{climbNote}</div>
            <div className="bot-sub">Climb Limited Max Landing Weight (for Dispatch Purposes Only)</div>
          </>
        )}
      </div>

      <div className="dist-block">
        <div className="dist-num">{primaryDist != null ? `${primaryDist.toLocaleString()} feet` : "— feet"}</div>
        <div className="dist-lbl">Landing Distance</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [familyId,   setFamilyId]   = useState("ejet");
  const [variantIds, setVariantIds] = useState({ ejet: "ejet", a32f: "a319" });
  const [states,     setStates]     = useState(() =>
    Object.fromEntries(FAMILY_LIST.flatMap(f => f.variants.map(v => [v.id, { ...v.defaults }])))
  );
  const [results,    setResults]    = useState({});
  const [showRCAM,   setShowRCAM]   = useState(false);
  const [showFleet,  setShowFleet]  = useState(false);

  const family    = FAMILY_LIST.find(f => f.id === familyId);
  const fleetId   = familyId === "ejet" ? "ejet" : variantIds.a32f;
  const fleet     = FLEETS[fleetId];
  const s         = states[fleetId];

  const set = key => val => setStates(prev => ({
    ...prev,
    [fleetId]: { ...prev[fleetId], [key]: val },
  }));

  const brkOpt     = fleet.brakingOptions.find(b => b.value === s.brakingAction) || fleet.brakingOptions[0];
  const brakingLbl = brkOpt.label;

  const calculate = useCallback(() => {
    const result = fleet.calculate(s);
    setResults(prev => ({ ...prev, [fleetId]: result }));
  }, [s, fleet, fleetId]);

  const handleReset = () => {
    setStates(prev => ({ ...prev, [fleetId]: { ...fleet.defaults } }));
    setResults(prev => ({ ...prev, [fleetId]: null }));
  };

  const handleFamilyChange = id => {
    setFamilyId(id);
  };

  const handleVariantChange = id => {
    setVariantIds(prev => ({ ...prev, a32f: id }));
  };

  const result = results[fleetId] || null;

  return (
    <>
      <style>{css}</style>
      <div className="shell">

        <div className="card">
          <div className="title-bar">
            <h1>{fleet.title}</h1>
            <button className="title-settings-btn" onClick={() => setShowFleet(true)}>⚙︎</button>
          </div>

          <div className="panels">
            {familyId === "a32f" ? (
              <A32FLeftPanel
                s={s} set={set} fleet={fleet}
                variants={family.variants}
                currentVariantId={fleetId}
                onVariantChange={handleVariantChange}
              />
            ) : (
              <EjetLeftPanel s={s} set={set} fleet={fleet} />
            )}
            <RightPanel
              s={s} set={set} fleet={fleet}
              brakingLbl={brakingLbl}
              onCalculate={calculate}
              onShowRCAM={() => setShowRCAM(true)}
            />
          </div>

          <BottomBar
            fleet={fleet} result={result} s={s}
            onReset={handleReset}
            acLabel={familyId === "ejet" ? s.acType : fleet.label}
          />
        </div>

        <div className="tab-bar">
          <button className="tab">
            <svg className="tab-plane" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>
            <span className="tab-lbl on">Normal</span>
            <div className="tab-bar-indicator" />
          </button>
          <button className="tab">
            <svg className="tab-plane" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" style={{opacity:0.35}}><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>
            <span className="tab-lbl">Non-Normal</span>
          </button>
        </div>

      </div>

      {showRCAM  && <RCAMModal onClose={() => setShowRCAM(false)} />}
      {showFleet && <FleetPicker currentFamilyId={familyId} onSelect={handleFamilyChange} onClose={() => setShowFleet(false)} />}
    </>
  );
}
