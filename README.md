# AgriFin: Intelligent Credit Underwriting & Agronomic Harvest Engine

[![Live Deployment](https://img.shields.io/badge/Vercel-Live%20Demo-10b981?style=for-the-badge&logo=vercel)](https://agrifinn-platform.vercel.app)
[![React](https://img.shields.io/badge/React-18.x-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646cff?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Live Application:** [https://agrifinn-platform.vercel.app](https://agrifinn-platform.vercel.app)

---

## 📌 Executive Summary

Smallholder farmers frequently face credit exclusion due to lack of formalized collateral, unrecorded cash flows, or thin bureau files. **AgriFin** bridges this gap by deploying an agronomic-first underwriting framework.

By modeling soil quality, seed genetics, seasonal precipitation, and insolation, the platform calculates expected harvest yields and projected cash flows. This data is combined with conventional bureau metrics (TransUnion CIBIL) to execute a two-stage solvency decision, generating instant, verifiable credit sanction memorandums.

---

## 🚀 Key Features

* **Dual-Portal Architecture:**
  * **Farmer Self-Service Application:** Designed for first-time borrowers without credit history. Integrates land registry (Patta/Survey) and PM-KISAN subsidy matching.
  * **Institutional Underwriting Terminal:** Officer-facing workbench linking CIBIL bureau performance, debt restructuring histories, and facility limits.
* **Dynamic Climate Stress Simulation:**
  * Interactive SVG yield response curve mapping seasonal harvest variations across rainfall shocks (-40% drought stress to +40% flood surplus).
* **Two-Stage Credit Decision Pipeline:**
  * Stage 1: Agronomic yield estimation based on empirical feature weights.
  * Stage 2: Debt Service Coverage Ratio (DSCR) stress testing combined with CIBIL credit tiering.
* **Demographic Fairness & Parity Auditing:**
  * Automated compliance checks ensuring smallholder holdings (< 2 hectares) maintain a 0.95 Disparity Index against commercial holdings, exceeding the 0.80 regulatory benchmark.
* **Automated PDF Sanction Memo Export:**
  * In-browser generation of institutional appraisal dossiers and conditional sanction letters using `jsPDF`.

---

## 🔬 Underwriting Framework

### 1. Yield Estimation Formula (Empirical RF Proxy)
The agronomic harvest engine calculates yield ($Y$ in kg/ha) via:

$$\text{Yield} = 420 + 1.45(\text{SQI}) + 195(\text{Seed}) + 0.92(\text{Fert}) + 0.42(\text{Sun}) - 0.18(\text{Rain}_{\text{adj}}) + 24.5(\text{Irr})$$

* **SQI:** Soil Quality Index (50–100 scale)
* **Seed:** Certified Hybrid ($1$) vs. Traditional ($0$)
* **Fert:** Fertilizer application rate (kg/ha)
* **Sun:** Insolation duration (sunny days per season)
* **Rain:** Seasonal rainfall adjusted by simulated climate shocks
* **Irr:** Controlled irrigation intervals (sessions)

### 2. Underwriting Tiering
* **Tier-1 Green Channel:** CIBIL $\ge 750$ and DSCR $\ge 1.5\text{x}$. Pre-approved with preferential interest subvention.
* **Conditional Sanction:** DSCR $\ge 1.15\text{x}$ with mandatory PMFBY crop insurance enrollment.
* **High-Risk / Restructure:** CIBIL $< 650$ or DSCR $< 1.15\text{x}$. Caps uncollateralized exposure and requires Joint Liability Group (JLG) guarantees.

---

## 🛠 Tech Stack

* **Frontend Framework:** React 18, Vite
* **Styling:** Custom CSS Glassmorphism & Cyber-Agronomic Dark Palette
* **Data Visualization:** Native Vector SVGs (Real-time Area Response Curves, Dynamic Gauges, Cohort Bar Graphs)
* **Document Engine:** `jsPDF`
* **Hosting & CI/CD:** Vercel Continuous Deployment

---

## 💻 Local Setup & Development

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/prenitarose-source/agrifin-platform.git](https://github.com/prenitarose-source/agrifin-platform.git)
   cd agrifin-platform