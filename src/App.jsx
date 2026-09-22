import React, { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';

// Mock Bureau Database for Existing Farmers
const FARMER_DATABASE = {
  'FARM-1001': {
    name: 'Ramesh Kumar',
    aadharMasked: '[Aadhaar Redacted]',
    district: 'Erode, Tamil Nadu',
    cibilScore: 765,
    pastLoansCount: 2,
    activeDebt: 0,
    repaymentTrack: '100% On-Time Record',
    defaultHistory: 'Nil Defaults Recorded',
    landArea: 3.5,
    soilQuality: 78.5,
    seedVariety: 1,
    fertilizerAmount: 180,
    sunnyDays: 98,
    rainfallMm: 480,
    irrigationSchedule: 6,
    loanRequested: 65000,
    cropMarketPrice: 28,
    productionCostPerHectare: 16000
  },
  'FARM-1002': {
    name: 'Kavitha R.',
    aadharMasked: '[Aadhaar Redacted]',
    district: 'Salem, Tamil Nadu',
    cibilScore: 820,
    pastLoansCount: 3,
    activeDebt: 25000,
    repaymentTrack: 'Early Repayment Track',
    defaultHistory: 'Nil Defaults Recorded',
    landArea: 4.2,
    soilQuality: 88.0,
    seedVariety: 1,
    fertilizerAmount: 210,
    sunnyDays: 105,
    rainfallMm: 460,
    irrigationSchedule: 8,
    loanRequested: 55000,
    cropMarketPrice: 30,
    productionCostPerHectare: 15500
  },
  'FARM-1003': {
    name: 'Murugan S.',
    aadharMasked: '[Aadhaar Redacted]',
    district: 'Dharmapuri, Tamil Nadu',
    cibilScore: 610,
    pastLoansCount: 1,
    activeDebt: 45000,
    repaymentTrack: 'Frequent 30-Day Overdues',
    defaultHistory: '1 Previous Restructure (2023)',
    landArea: 2.0,
    soilQuality: 54.0,
    seedVariety: 0,
    fertilizerAmount: 110,
    sunnyDays: 85,
    rainfallMm: 720,
    irrigationSchedule: 2,
    loanRequested: 85000,
    cropMarketPrice: 22,
    productionCostPerHectare: 16500
  }
};

const FEATURE_IMPORTANCES = [
  { name: 'Seed Variety (Certified Hybrid)', weight: 38, gradient: 'linear-gradient(90deg, #10b981, #059669)' },
  { name: 'Irrigation Schedule (Sessions)', weight: 26, gradient: 'linear-gradient(90deg, #06b6d4, #0284c7)' },
  { name: 'Fertilizer Input (kg/ha)', weight: 16, gradient: 'linear-gradient(90deg, #f59e0b, #d97706)' },
  { name: 'Seasonal Precipitation (mm)', weight: 11, gradient: 'linear-gradient(90deg, #8b5cf6, #6d28d9)' },
  { name: 'Soil Quality Index (SQI)', weight: 6, gradient: 'linear-gradient(90deg, #ec4899, #db2777)' },
  { name: 'Insolation / Sunny Days', weight: 3, gradient: 'linear-gradient(90deg, #64748b, #475569)' }
];

export default function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [userRole, setUserRole] = useState('officer');
  const [officerId, setOfficerId] = useState('AGRI-OFFICER-04');
  const [activeTab, setActiveTab] = useState('assessment');
  const [climateDeviation, setClimateDeviation] = useState(0);

  const [selectedFarmerId, setSelectedFarmerId] = useState('FARM-1001');
  const [formData, setFormData] = useState(FARMER_DATABASE['FARM-1001']);

  const [newFarmer, setNewFarmer] = useState({
    fullName: 'Anitha Selvam',
    phone: '98765 43210',
    aadhaar: '[Aadhaar Redacted]',
    pattaNumber: 'TN-ERD-2026-981',
    district: 'Erode',
    landArea: 2.5,
    cropSelected: 'Paddy / Rice',
    seedType: 1,
    soilQuality: 72,
    fertilizerPlanned: 160,
    requestedLoan: 50000,
    hasPmKisan: true
  });

  const [applicationSubmitted, setApplicationSubmitted] = useState(false);

  const handleFarmerChange = (e) => {
    const id = e.target.value;
    setSelectedFarmerId(id);
    if (FARMER_DATABASE[id]) setFormData(FARMER_DATABASE[id]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: isNaN(value) || value === '' ? value : parseFloat(value)
    }));
  };

  const handleNewFarmerChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewFarmer((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : isNaN(value) || value === '' ? value : parseFloat(value)
    }));
  };

  // Helper function to calculate yield for any rainfall deviation percentage
  const calculateYieldForDeviation = (devPct) => {
    const adjustedRain = (Number(formData.rainfallMm) || 0) * (1 + devPct / 100);
    const base = 420.0;
    const soil = (Number(formData.soilQuality) || 0) * 1.45;
    const seed = Number(formData.seedVariety) === 1 ? 195.0 : 0;
    const fert = (Number(formData.fertilizerAmount) || 0) * 0.92;
    const sun = (Number(formData.sunnyDays) || 0) * 0.42;
    const rain = adjustedRain * -0.18;
    const irr = (Number(formData.irrigationSchedule) || 0) * 24.5;
    const res = base + soil + seed + fert + sun + rain + irr;
    return Math.max(200, Math.round(res));
  };

  // Generate curve data points for SVG Chart (-40% to +40% in steps of 10)
  const climateCurvePoints = useMemo(() => {
    const deviations = [-40, -30, -20, -10, 0, 10, 20, 30, 40];
    return deviations.map((d) => ({
      deviation: d,
      yieldVal: calculateYieldForDeviation(d)
    }));
  }, [formData]);

  // Two-Stage Evaluation Pipeline
  const evaluation = useMemo(() => {
    const predictedYieldPerHa = calculateYieldForDeviation(climateDeviation);
    const totalLand = Number(formData.landArea) || 1;
    const totalHarvestKg = predictedYieldPerHa * totalLand;
    const grossRevenue = totalHarvestKg * (Number(formData.cropMarketPrice) || 28);
    const operationalCosts = totalLand * (Number(formData.productionCostPerHectare) || 16000);
    const netFarmerProfit = grossRevenue - operationalCosts;

    const loanPrincipal = Number(formData.loanRequested) || 50000;
    const annualDebtService = loanPrincipal * 1.12;
    const dscr = annualDebtService > 0 ? netFarmerProfit / annualDebtService : 0;
    const cibil = Number(formData.cibilScore) || 300;

    let status = 'APPROVED';
    let themeColor = '#10b981';
    let gradientBg = 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.05) 100%)';
    let badgeText = 'PRE-APPROVED (LOW RISK)';
    let recommendation = '';

    if (cibil < 650) {
      status = 'REJECTED';
      themeColor = '#f43f5e';
      gradientBg = 'linear-gradient(135deg, rgba(244,63,94,0.15) 0%, rgba(190,18,60,0.05) 100%)';
      badgeText = 'HIGH RISK (RESTRICTED)';
      recommendation = `Sub-prime bureau profile (CIBIL ${cibil}). Despite agronomic output potential of ${predictedYieldPerHa} kg/ha, loan principal exceeds uncollateralized lending caps. Require joint liability group (JLG) guarantor or collateral pledge.`;
    } else if (dscr >= 1.5 && cibil >= 750) {
      status = 'PRIME';
      themeColor = '#10b981';
      gradientBg = 'linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(13,148,136,0.08) 100%)';
      badgeText = 'TIER-1 GREEN CHANNEL';
      recommendation = `Outstanding credit history (CIBIL ${cibil}) with robust debt coverage (${dscr.toFixed(2)}x DSCR). High resilience to adverse climate deviations. Sanction INR ${loanPrincipal.toLocaleString()} with interest subvention eligibility.`;
    } else if (dscr >= 1.15) {
      status = 'CONDITIONAL';
      themeColor = '#f59e0b';
      gradientBg = 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(217,119,6,0.05) 100%)';
      badgeText = 'CONDITIONAL APPROVAL';
      recommendation = `Fair credit discipline (CIBIL ${cibil}), but free cash buffer is moderately tight (${dscr.toFixed(2)}x DSCR). Sanctioning conditional on mandatory Pradhan Mantri Fasal Bima Yojana (PMFBY) insurance enrollment.`;
    } else {
      status = 'DEFICIT';
      themeColor = '#f43f5e';
      gradientBg = 'linear-gradient(135deg, rgba(244,63,94,0.15) 0%, rgba(190,18,60,0.05) 100%)';
      badgeText = 'EXPOSURE WARNING';
      recommendation = `Operational cost deficit warning. Projected farm net earnings of INR ${Math.max(0, Math.round(netFarmerProfit)).toLocaleString()} fall below debt service threshold of INR ${Math.round(annualDebtService).toLocaleString()}. Restructure loan size down by 30%.`;
    }

    return {
      predictedYieldPerHa,
      totalHarvestKg: Math.round(totalHarvestKg),
      netFarmerProfit: Math.round(netFarmerProfit),
      dscr: dscr.toFixed(2),
      status,
      themeColor,
      gradientBg,
      badgeText,
      recommendation
    };
  }, [formData, climateDeviation]);

  const newFarmerEvaluation = useMemo(() => {
    const baseYield = 450 + (Number(newFarmer.soilQuality) || 60) * 1.5 + (Number(newFarmer.seedType) === 1 ? 190 : 0) + (Number(newFarmer.fertilizerPlanned) || 120) * 0.85;
    const land = Number(newFarmer.landArea) || 1;
    const totalHarvest = baseYield * land;
    const grossIncome = totalHarvest * 28;
    const estCost = land * 15500;
    const netProfit = grossIncome - estCost;
    const maxPermissibleLoan = Math.round(land * 35000);
    const isEligible = newFarmer.requestedLoan <= maxPermissibleLoan * 1.3 && netProfit > newFarmer.requestedLoan * 0.5;

    return {
      predictedYield: Math.round(baseYield),
      totalHarvest: Math.round(totalHarvest),
      netProfit: Math.round(netProfit),
      maxPermissibleLoan,
      isEligible,
      subsidyRate: newFarmer.hasPmKisan ? '4% Effective Rate (with 3% Gov Subvention)' : '7% Standard Agricultural Rate'
    };
  }, [newFarmer]);

  // PDF Export
  const generateSanctionLetterPDF = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('AGRIFIN NEURAL CREDIT & UNDERWRITING CELL', 14, 14);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Official Credit Decision Memo & Agronomic Appraisal Dossier', 14, 21);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Appraisal Ref: AGRI-MEMO-${Date.now().toString().slice(-6)}`, 14, 38);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date of Assessment: ${new Date().toLocaleDateString()}`, 140, 38);
    doc.text(`Reviewing Officer ID: ${officerId}`, 14, 44);
    doc.text(`Credit Bureau Track: TransUnion CIBIL Linked`, 140, 44);

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 48, 196, 48);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(20, 83, 45);
    doc.text('1. APPLICANT & CREDIT BUREAU SUMMARY', 14, 56);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(`Borrower Name: ${formData.name}`, 14, 64);
    doc.text(`District / Region: ${formData.district}`, 14, 70);
    doc.text(`CIBIL Bureau Score: ${formData.cibilScore} / 900`, 110, 64);
    doc.text(`Past Sanctioned Facilities: ${formData.pastLoansCount}`, 110, 70);
    doc.text(`Repayment Track: ${formData.repaymentTrack}`, 14, 76);

    doc.line(14, 82, 196, 82);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(20, 83, 45);
    doc.text('2. MACHINE LEARNING HARVEST PROJECTIONS', 14, 90);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(`Operational Holding: ${formData.landArea} Hectares`, 14, 98);
    doc.text(`Soil Quality Index (SQI): ${formData.soilQuality} / 100`, 14, 104);
    doc.text(`Predicted Yield: ${evaluation.predictedYieldPerHa} kg/ha`, 110, 98);
    doc.text(`Total Expected Harvest: ${evaluation.totalHarvestKg.toLocaleString()} kg`, 110, 104);

    doc.line(14, 116, 196, 116);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(20, 83, 45);
    doc.text('3. SANCTION & UNDERWRITING MEMORANDUM', 14, 124);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Principal Requested: INR ${Number(formData.loanRequested).toLocaleString()}`, 14, 132);
    doc.text(`Debt Service Ratio (DSCR): ${evaluation.dscr}x`, 110, 132);
    doc.setFont('helvetica', 'bold');
    doc.text(`Underwriting Recommendation: ${evaluation.status}`, 14, 140);

    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(`Agronomic Stipulations: ${evaluation.recommendation}`, 180);
    doc.text(splitNotes, 14, 148);

    doc.line(14, 240, 70, 240);
    doc.text('Branch Credit Officer Signature', 14, 246);
    doc.line(140, 240, 196, 240);
    doc.text('Lead Underwriting Authority', 140, 246);

    doc.save(`Sanction_Letter_${formData.name.replace(/\s+/g, '_')}.pdf`);
  };

  // Circular Meter SVG Component
  const CircularGauge = ({ value, max, label, color, suffix = '' }) => {
    const radius = 36;
    const stroke = 6;
    const norm = 2 * Math.PI * radius;
    const percentage = Math.min(Math.max(value / max, 0), 1);
    const strokeDashoffset = norm - percentage * norm;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <svg height="90" width="90" style={{ transform: 'rotate(-90deg)' }}>
          <circle stroke="rgba(255,255,255,0.08)" fill="transparent" strokeWidth={stroke} r={radius} cx="45" cy="45" />
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={norm}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.8s ease' }}
            strokeLinecap="round"
            r={radius}
            cx="45"
            cy="45"
          />
        </svg>
        <div style={{ marginTop: '-58px', textAlign: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '17px', fontWeight: '800', color: '#fff' }}>{value}{suffix}</span>
        </div>
        <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600' }}>
          {label}
        </span>
      </div>
    );
  };

  // Render SVG Climate Sensitivity Area Chart
  const renderClimateGraph = () => {
    const width = 440;
    const height = 150;
    const padX = 40;
    const padY = 20;

    const minY = 300;
    const maxY = 1000;

    const scaleX = (val) => padX + ((val + 40) / 80) * (width - 2 * padX);
    const scaleY = (val) => height - padY - ((val - minY) / (maxY - minY)) * (height - 2 * padY);

    const pointsStr = climateCurvePoints
      .map((p) => `${scaleX(p.deviation)},${scaleY(p.yieldVal)}`)
      .join(' ');

    const currentX = scaleX(climateDeviation);
    const currentY = scaleY(evaluation.predictedYieldPerHa);

    const areaPath = `M ${scaleX(-40)},${height - padY} L ${pointsStr} L ${scaleX(40)},${height - padY} Z`;

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="yieldAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        <line x1={padX} y1={scaleY(500)} x2={width - padX} y2={scaleY(500)} stroke="rgba(255,255,255,0.08)" strokeDasharray="3,3" />
        <line x1={padX} y1={scaleY(750)} x2={width - padX} y2={scaleY(750)} stroke="rgba(255,255,255,0.08)" strokeDasharray="3,3" />
        <line x1={scaleX(0)} y1={padY} x2={scaleX(0)} y2={height - padY} stroke="rgba(255,255,255,0.15)" strokeDasharray="2,2" />

        {/* Baseline 0% indicator text */}
        <text x={scaleX(0)} y={padY - 4} fill="#94a3b8" fontSize="9" textAnchor="middle">Baseline 0%</text>

        {/* Area fill */}
        <path d={areaPath} fill="url(#yieldAreaGrad)" />

        {/* Line stroke */}
        <polyline points={pointsStr} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />

        {/* Current Position Marker */}
        <circle cx={currentX} cy={currentY} r="6" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />
        <circle cx={currentX} cy={currentY} r="11" fill="none" stroke="#38bdf8" strokeWidth="1.5" opacity="0.6" />

        {/* Dynamic Tooltip on Current Point */}
        <text x={currentX} y={Math.max(currentY - 12, 14)} fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">
          {evaluation.predictedYieldPerHa} kg/ha
        </text>

        {/* Axis labels */}
        <text x={padX} y={height - 4} fill="#64748b" fontSize="9">-40% Drought</text>
        <text x={width - padX} y={height - 4} fill="#64748b" fontSize="9" textAnchor="end">+40% Flood</text>
      </svg>
    );
  };

  // ---------------- PAGE 1: LOGIN ----------------
  if (currentPage === 'login') {
    return (
      <div style={neonCanvasBg}>
        <div style={glowOrbTopLeft} />
        <div style={glowOrbBottomRight} />
        <div style={{ ...glassCard, width: '440px', padding: '40px 32px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <div style={{ width: '64px', height: '64px', margin: '0 auto 16px', background: 'linear-gradient(135deg, #10b981, #06b6d4)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', boxShadow: '0 10px 25px rgba(16,185,129,0.35)' }}>
            🌾
          </div>
          <h2 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: '800', background: 'linear-gradient(90deg, #ffffff, #6ee7b7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AgriFin Intelligent Core
          </h2>
          <p style={{ margin: '0 0 24px', color: '#94a3b8', fontSize: '13px' }}>
            Agronomic Yield Prediction & Credit Inclusion Portal
          </p>

          <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.7)', padding: '4px', borderRadius: '10px', marginBottom: '22px' }}>
            <button
              onClick={() => setUserRole('farmer')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '700',
                background: userRole === 'farmer' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
                color: userRole === 'farmer' ? '#fff' : '#94a3b8'
              }}
            >
              New Farmer Portal
            </button>
            <button
              onClick={() => setUserRole('officer')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '700',
                background: userRole === 'officer' ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'transparent',
                color: userRole === 'officer' ? '#fff' : '#94a3b8'
              }}
            >
              Bank Underwriter
            </button>
          </div>

          {userRole === 'farmer' ? (
            <div style={{ textAlign: 'left' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '12px', borderRadius: '10px', marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#34d399', marginBottom: '2px' }}>
                  No prior credit score or bank account history?
                </div>
                <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.4' }}>
                  Our AI qualifies your loan application based on your farm's soil quality, irrigation, and harvest potential.
                </div>
              </div>
              <button onClick={() => setCurrentPage('farmer-portal')} style={gradientPrimaryButton}>
                Apply for New Agricultural Loan →
              </button>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setCurrentPage('officer-dashboard'); }} style={{ textAlign: 'left' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={neonLabel}>Officer Identification</label>
                <input style={neonInput} type="text" value={officerId} onChange={(e) => setOfficerId(e.target.value)} required />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={neonLabel}>Access Security Key</label>
                <input style={neonInput} type="password" placeholder="••••••••••••" defaultValue="admin123" required />
              </div>
              <button type="submit" style={{ ...gradientPrimaryButton, background: 'linear-gradient(135deg, #0284c7, #2563eb)' }}>
                Access Underwriter Gateway →
              </button>
            </form>
          )}

          <div style={{ marginTop: '22px', fontSize: '11px', color: '#64748b' }}>
            Integrated with PM-KISAN, CIBIL Bureau & State Land Registries
          </div>
        </div>
      </div>
    );
  }

  // ---------------- PAGE 3: EXIT ----------------
  if (currentPage === 'exit') {
    return (
      <div style={neonCanvasBg}>
        <div style={glowOrbTopLeft} />
        <div style={{ ...glassCard, width: '420px', padding: '48px 32px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <div style={{ width: '64px', height: '64px', margin: '0 auto 16px', background: 'linear-gradient(135deg, #f43f5e, #fb7185)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', boxShadow: '0 10px 25px rgba(244,63,94,0.35)' }}>
            🔒
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: '800', color: '#fff' }}>Session Cleared</h2>
          <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.6', marginBottom: '28px' }}>
            All evaluation cache and application states have been safely preserved in local records.
          </p>
          <button onClick={() => setCurrentPage('login')} style={gradientPrimaryButton}>
            Return to Main Entry Gateway
          </button>
        </div>
      </div>
    );
  }

  // ---------------- PAGE 4: NEW FARMER PORTAL ----------------
  if (currentPage === 'farmer-portal') {
    return (
      <div style={{ ...neonCanvasBg, minHeight: '100vh', padding: '28px', display: 'block' }}>
        <div style={glowOrbTopLeft} />
        <div style={glowOrbBottomRight} />

        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #10b981, #06b6d4)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
              🚜
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', background: 'linear-gradient(90deg, #ffffff, #a7f3d0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Kisan Digital Credit Application & Yield Estimator
              </h1>
              <p style={{ margin: '3px 0 0', color: '#94a3b8', fontSize: '12px' }}>
                First-Time Farmer Direct Lending Portal | Land Registry & Yield-Backed Underwriting
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setCurrentPage('officer-dashboard')} style={pillButton('#38bdf8')}>
              Switch to Bank View
            </button>
            <button onClick={() => setCurrentPage('exit')} style={neonExitButton}>
              Exit ⏻
            </button>
          </div>
        </header>

        {applicationSubmitted ? (
          <div style={{ ...glassCard, maxWidth: '800px', margin: '40px auto', padding: '36px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(16,185,129,0.2)', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 16px', color: '#10b981' }}>
              ✓
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', margin: '0 0 6px' }}>
              Application Successfully Registered!
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 20px' }}>
              Acknowledgement Ref: <strong style={{ color: '#38bdf8' }}>AGRI-2026-948210</strong>
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', textAlign: 'left', marginBottom: '24px' }}>
              <div style={resultStatBox}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Applicant</div>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#fff' }}>{newFarmer.fullName}</div>
                <div style={{ fontSize: '11px', color: '#38bdf8' }}>{newFarmer.pattaNumber}</div>
              </div>
              <div style={resultStatBox}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Estimated Yield</div>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#10b981' }}>{newFarmerEvaluation.predictedYield} kg/ha</div>
                <div style={{ fontSize: '11px', color: '#cbd5e1' }}>Total: {newFarmerEvaluation.totalHarvest} kg</div>
              </div>
              <div style={resultStatBox}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Pre-Qualified Limit</div>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#38bdf8' }}>INR {newFarmerEvaluation.maxPermissibleLoan.toLocaleString()}</div>
                <div style={{ fontSize: '11px', color: '#34d399' }}>Subsidized 4% KCC</div>
              </div>
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', padding: '16px', textAlign: 'left', fontSize: '13px', color: '#cbd5e1', marginBottom: '24px' }}>
              <strong>Next Steps for Field Disbursement:</strong>
              <ul style={{ margin: '8px 0 0', paddingLeft: '18px', lineHeight: '1.6' }}>
                <li>Your local Erode District Agricultural Credit Officer has received your agronomic dossier.</li>
                <li>Digital verification completed for Patta Record <span style={{ color: '#fff' }}>{newFarmer.pattaNumber}</span>.</li>
                <li>Carry Identity Verification and Land Revenue Chitta receipt to your nearest Gramin branch for immediate card issue.</li>
              </ul>
            </div>

            <button onClick={() => setApplicationSubmitted(false)} style={{ ...pillButton('#38bdf8'), padding: '10px 24px' }}>
              Edit / Submit Another Application
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', position: 'relative', zIndex: 10 }}>
            <div style={glassCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
                  New Farmer Loan Eligibility Registration
                </h2>
                <span style={{ fontSize: '11px', color: '#38bdf8', background: 'rgba(56,189,248,0.1)', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                  No Past CIBIL Required
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={neonLabel}>Applicant Full Name</label>
                  <input style={neonInput} type="text" name="fullName" value={newFarmer.fullName} onChange={handleNewFarmerChange} />
                </div>
                <div>
                  <label style={neonLabel}>Mobile Number</label>
                  <input style={neonInput} type="text" name="phone" value={newFarmer.phone} onChange={handleNewFarmerChange} />
                </div>
                <div>
                  <label style={neonLabel}>Land Record / Patta Survey No.</label>
                  <input style={neonInput} type="text" name="pattaNumber" value={newFarmer.pattaNumber} onChange={handleNewFarmerChange} />
                </div>
                <div>
                  <label style={neonLabel}>District / Taluk</label>
                  <input style={neonInput} type="text" name="district" value={newFarmer.district} onChange={handleNewFarmerChange} />
                </div>
                <div>
                  <label style={neonLabel}>Cultivable Holding (Hectares)</label>
                  <input style={neonInput} type="number" step="0.1" name="landArea" value={newFarmer.landArea} onChange={handleNewFarmerChange} />
                </div>
                <div>
                  <label style={neonLabel}>Planned Crop Cycle</label>
                  <select style={neonInput} name="cropSelected" value={newFarmer.cropSelected} onChange={handleNewFarmerChange}>
                    <option value="Paddy / Rice">Paddy / Rice</option>
                    <option value="Sugarcane">Sugarcane</option>
                    <option value="Turmeric">Turmeric</option>
                    <option value="Maize / Corn">Maize / Corn</option>
                  </select>
                </div>
                <div>
                  <label style={neonLabel}>Seed Quality Variety</label>
                  <select style={neonInput} name="seedType" value={newFarmer.seedType} onChange={handleNewFarmerChange}>
                    <option value={1}>Certified High-Yield Hybrid (1)</option>
                    <option value={0}>Traditional Uncertified (0)</option>
                  </select>
                </div>
                <div>
                  <label style={neonLabel}>Estimated Soil Quality (50-100)</label>
                  <input style={neonInput} type="number" name="soilQuality" value={newFarmer.soilQuality} onChange={handleNewFarmerChange} />
                </div>
                <div>
                  <label style={neonLabel}>Planned Fertilizer Input (kg/ha)</label>
                  <input style={neonInput} type="number" name="fertilizerPlanned" value={newFarmer.fertilizerPlanned} onChange={handleNewFarmerChange} />
                </div>
                <div>
                  <label style={neonLabel}>Loan Amount Requested (INR)</label>
                  <input style={neonInput} type="number" name="requestedLoan" value={newFarmer.requestedLoan} onChange={handleNewFarmerChange} />
                </div>
              </div>

              <div style={{ marginTop: '16px', background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px 14px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', color: '#e2e8f0' }}>
                  <input
                    type="checkbox"
                    name="hasPmKisan"
                    checked={newFarmer.hasPmKisan}
                    onChange={handleNewFarmerChange}
                    style={{ accentColor: '#10b981', width: '16px', height: '16px' }}
                  />
                  <span>
                    Enrolled in <strong>PM-KISAN Samman Nidhi</strong> (Qualifies for 3% Interest Subvention)
                  </span>
                </label>
              </div>

              <button onClick={() => setApplicationSubmitted(true)} style={{ ...gradientPrimaryButton, marginTop: '20px' }}>
                Submit Digital Application for Approval →
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ ...glassCard, padding: '22px', border: newFarmerEvaluation.isEligible ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(244,63,94,0.4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>
                    Instant AI Pre-Qualification
                  </span>
                  <span style={{ background: newFarmerEvaluation.isEligible ? '#10b981' : '#f43f5e', color: '#090d16', fontSize: '11px', fontWeight: 'bold', padding: '3px 10px', borderRadius: '12px' }}>
                    {newFarmerEvaluation.isEligible ? 'HIGH PROBABILITY ELIGIBLE' : 'AMOUNT RESTRICTION'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={resultStatBox}>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Max Safe Credit Limit</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#38bdf8' }}>
                      INR {newFarmerEvaluation.maxPermissibleLoan.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>Scale of Finance Benchmark</div>
                  </div>
                  <div style={resultStatBox}>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Estimated Crop Harvest</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#34d399' }}>
                      {newFarmerEvaluation.totalHarvest.toLocaleString()} <span style={{ fontSize: '12px' }}>kg</span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>Yield: {newFarmerEvaluation.predictedYield} kg/ha</div>
                  </div>
                </div>

                <div style={{ marginTop: '16px', background: 'rgba(15, 23, 42, 0.7)', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #38bdf8' }}>
                  <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 'bold' }}>Applicable Interest Rate:</div>
                  <div style={{ fontSize: '13px', color: '#fff', marginTop: '2px' }}>{newFarmerEvaluation.subsidyRate}</div>
                </div>
              </div>

              <div style={{ ...glassCard, padding: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#fff', margin: '0 0 12px' }}>
                  Government Financial Benefits Matched
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#34d399' }}>1. Kisan Credit Card (KCC) Scheme</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                      Concessional crop loans up to INR 3,00,000 at 7% p.a., reduced to 4% p.a. upon prompt repayment.
                    </div>
                  </div>
                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#38bdf8' }}>2. PM Fasal Bima Yojana (Crop Insurance)</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                      Automatic climate risk insurance coverage at only 1.5% - 2.0% nominal premium.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------------- PAGE 2: BANK UNDERWRITING OFFICER DASHBOARD ----------------
  return (
    <div style={{ ...neonCanvasBg, minHeight: '100vh', padding: '28px', display: 'block' }}>
      <div style={glowOrbTopLeft} />
      <div style={glowOrbBottomRight} />

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '46px', height: '46px', background: 'linear-gradient(135deg, #10b981, #06b6d4)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', boxShadow: '0 4px 20px rgba(16,185,129,0.3)' }}>
            🌱
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #ffffff, #a7f3d0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              AgriFin Neural Underwriter
            </h1>
            <p style={{ margin: '3px 0 0', color: '#94a3b8', fontSize: '12px' }}>
              Officer: <span style={{ color: '#34d399', fontWeight: '600' }}>{officerId}</span> | Credit Registry Online
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={generateSanctionLetterPDF} style={pillButton('#10b981')}>
            Export Sanction Letter (PDF)
          </button>
          <button onClick={() => setCurrentPage('farmer-portal')} style={pillButton('#38bdf8')}>
            + New Farmer Portal
          </button>
          <button onClick={() => setCurrentPage('exit')} style={neonExitButton}>
            Terminate Session ⏻
          </button>
        </div>
      </header>

      {/* Profile Selector */}
      <div style={{ ...glassCard, padding: '16px 22px', marginBottom: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Registered Profile:
          </span>
          <select value={selectedFarmerId} onChange={handleFarmerChange} style={{ ...neonInput, width: '310px', margin: 0, background: '#1e293b' }}>
            <option value="FARM-1001">FARM-1001: Ramesh Kumar (Prime CIBIL 765)</option>
            <option value="FARM-1002">FARM-1002: Kavitha R. (High Yield / CIBIL 820)</option>
            <option value="FARM-1003">FARM-1003: Murugan S. (Delinquency Warning 610)</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => { setSelectedFarmerId('FARM-1002'); setFormData(FARMER_DATABASE['FARM-1002']); }} style={pillButton('#10b981')}>
            ★ High-Yield Model
          </button>
          <button onClick={() => { setSelectedFarmerId('FARM-1003'); setFormData(FARMER_DATABASE['FARM-1003']); }} style={pillButton('#f59e0b')}>
            ⚠ High-Stress Case
          </button>
        </div>
      </div>

      {/* Bureau Strip */}
      <div style={{ ...glassCard, padding: '20px 24px', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>🏦</span>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              CIBIL Bureau Verification & Repayment Profile
            </span>
          </div>
          <span style={{ background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.4)', color: '#38bdf8', fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '12px' }}>
            BUREAU CONNECTED
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
          <div style={bureauDarkBox}>
            <div style={bureauLabel}>Farmer Identity</div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginTop: '3px' }}>{formData.name}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{formData.district}</div>
          </div>
          <div style={bureauDarkBox}>
            <div style={bureauLabel}>CIBIL Credit Score</div>
            <div style={{ fontSize: '18px', fontWeight: '800', marginTop: '3px', color: formData.cibilScore >= 750 ? '#34d399' : formData.cibilScore >= 650 ? '#fbbf24' : '#f43f5e' }}>
              {formData.cibilScore} <span style={{ fontSize: '12px', color: '#94a3b8' }}>/ 900</span>
            </div>
            <div style={{ fontSize: '10px', fontWeight: '600', color: formData.cibilScore >= 750 ? '#34d399' : '#f43f5e' }}>
              {formData.cibilScore >= 750 ? '● Grade A Prime' : '▲ Sub-Prime Caution'}
            </div>
          </div>
          <div style={bureauDarkBox}>
            <div style={bureauLabel}>Historical Credit Lines</div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginTop: '3px' }}>
              {formData.pastLoansCount} Disbursed
            </div>
            <div style={{ fontSize: '11px', color: '#38bdf8' }}>Active Debt: INR {formData.activeDebt.toLocaleString()}</div>
          </div>
          <div style={bureauDarkBox}>
            <div style={bureauLabel}>Discipline Record</div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0', marginTop: '3px' }}>
              {formData.repaymentTrack}
            </div>
          </div>
          <div style={bureauDarkBox}>
            <div style={bureauLabel}>NPA / Restructure History</div>
            <div style={{ fontSize: '13px', fontWeight: '700', marginTop: '3px', color: formData.defaultHistory.includes('Nil') ? '#34d399' : '#f43f5e' }}>
              {formData.defaultHistory}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', position: 'relative', zIndex: 10 }}>
        <button onClick={() => setActiveTab('assessment')} style={vibrantTabStyle(activeTab === 'assessment')}>
          Two-Stage Underwriting Engine & Yield Curve
        </button>
        <button onClick={() => setActiveTab('analytics')} style={vibrantTabStyle(activeTab === 'analytics')}>
          Feature Weights & Demographic Parity Graphs
        </button>
      </div>

      {activeTab === 'assessment' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '24px', position: 'relative', zIndex: 10 }}>
          {/* Input Panel with Interactive Climate Curve Graph */}
          <div style={glassCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>⚙</span> Farm Agronomics & Financial Requirements
              </h2>
              <span style={{ fontSize: '11px', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                Auto-Calibrating
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={neonLabel}>Cultivable Acreage (Hectares)</label>
                <input style={neonInput} type="number" step="0.1" name="landArea" value={formData.landArea} onChange={handleInputChange} />
              </div>
              <div>
                <label style={neonLabel}>Soil Quality Index (SQI 50-100)</label>
                <input style={neonInput} type="number" name="soilQuality" value={formData.soilQuality} onChange={handleInputChange} />
              </div>
              <div>
                <label style={neonLabel}>Genetic Seed Variety</label>
                <select style={neonInput} name="seedVariety" value={formData.seedVariety} onChange={handleInputChange}>
                  <option value={1}>Type 1 (High-Yield Hybrid)</option>
                  <option value={0}>Type 0 (Traditional Standard)</option>
                </select>
              </div>
              <div>
                <label style={neonLabel}>Fertilizer Application (kg/ha)</label>
                <input style={neonInput} type="number" name="fertilizerAmount" value={formData.fertilizerAmount} onChange={handleInputChange} />
              </div>
              <div>
                <label style={neonLabel}>Irrigation Schedule (Sessions)</label>
                <input style={neonInput} type="number" name="irrigationSchedule" value={formData.irrigationSchedule} onChange={handleInputChange} />
              </div>
              <div>
                <label style={neonLabel}>Seasonal Rainfall (mm)</label>
                <input style={neonInput} type="number" name="rainfallMm" value={formData.rainfallMm} onChange={handleInputChange} />
              </div>
              <div>
                <label style={neonLabel}>Crop Market Rate (INR/kg)</label>
                <input style={neonInput} type="number" name="cropMarketPrice" value={formData.cropMarketPrice} onChange={handleInputChange} />
              </div>
              <div>
                <label style={neonLabel}>Credit Requested (INR)</label>
                <input style={neonInput} type="number" name="loanRequested" value={formData.loanRequested} onChange={handleInputChange} />
              </div>
            </div>

            {/* Weather Sensitivity Slider & Real-time Graph Display */}
            <div style={{ marginTop: '20px', background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255,255,255,0.08)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '700' }}>
                <span style={{ color: '#cbd5e1' }}>Simulate Climate Shock:</span>
                <span style={{ color: climateDeviation < 0 ? '#f43f5e' : climateDeviation > 0 ? '#38bdf8' : '#34d399', fontWeight: '800' }}>
                  {climateDeviation > 0 ? `+${climateDeviation}% Rain Surplus` : climateDeviation < 0 ? `${climateDeviation}% Drought Stress` : '0% Baseline Norm'}
                </span>
              </div>
              <input
                type="range"
                min="-40"
                max="40"
                step="5"
                value={climateDeviation}
                onChange={(e) => setClimateDeviation(parseInt(e.target.value))}
                style={{ width: '100%', marginTop: '10px', accentColor: '#10b981', cursor: 'pointer' }}
              />

              {/* Dynamic SVG Graph of Yield Curve */}
              <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>
                    📈 Climate Sensitivity Yield Response Curve
                  </span>
                  <span style={{ fontSize: '11px', color: '#34d399' }}>Live Telemetry</span>
                </div>
                {renderClimateGraph()}
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ ...glassCard, padding: '22px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>
                Real-Time Telemetry & Core Metrics
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                <CircularGauge value={evaluation.predictedYieldPerHa} max={1200} label="Yield (kg/ha)" color="#10b981" />
                <CircularGauge value={evaluation.dscr} max={3.0} label="DSCR Ratio" color={evaluation.themeColor} suffix="x" />
                <CircularGauge value={formData.cibilScore} max={900} label="Credit Score" color={formData.cibilScore >= 750 ? '#38bdf8' : '#f43f5e'} />
              </div>
            </div>

            <div style={{ ...glassCard, padding: '22px', background: evaluation.gradientBg, border: `1px solid ${evaluation.themeColor}55` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: evaluation.themeColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Final Underwriting Decision
                </span>
                <span style={{ backgroundColor: evaluation.themeColor, color: '#090d16', fontWeight: '800', fontSize: '11px', padding: '4px 12px', borderRadius: '16px', boxShadow: `0 0 15px ${evaluation.themeColor}66` }}>
                  {evaluation.badgeText}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                <div style={resultStatBox}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Total Projected Harvest</div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#fff', marginTop: '2px' }}>
                    {evaluation.totalHarvestKg.toLocaleString()} <span style={{ fontSize: '13px', color: '#34d399' }}>kg</span>
                  </div>
                </div>
                <div style={resultStatBox}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Projected Net Profit</div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#fff', marginTop: '2px' }}>
                    INR {evaluation.netFarmerProfit.toLocaleString()}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '16px', background: 'rgba(15, 23, 42, 0.75)', padding: '14px', borderRadius: '10px', borderLeft: `4px solid ${evaluation.themeColor}` }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>
                  Automated Credit & Agronomic Recommendation:
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', lineHeight: '1.55' }}>
                  {evaluation.recommendation}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Analytics Tab with Comparative Visual Bar Graphs */
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '24px', position: 'relative', zIndex: 10 }}>
          <div style={glassCard}>
            <h2 style={{ fontSize: '17px', fontWeight: '800', marginTop: 0, color: '#fff' }}>
              Random Forest Feature Importance Weights
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 20px' }}>
              Agronomic contribution percentages calculated on 16,000 empirical field observations.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {FEATURE_IMPORTANCES.map((item) => (
                <div key={item.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ color: '#e2e8f0', fontWeight: '600' }}>{item.name}</span>
                    <span style={{ fontWeight: '800', color: '#fff' }}>{item.weight}%</span>
                  </div>
                  <div style={{ height: '9px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${item.weight * 2.2}%`, background: item.gradient, height: '100%', borderRadius: '6px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={glassCard}>
            <h2 style={{ fontSize: '17px', fontWeight: '800', marginTop: 0, color: '#fff' }}>
              Demographic Fairness & Parity Visual Graphs
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px' }}>
              Auditing underwriter acceptance distributions between smallholders (&lt; 2 ha) vs. commercial farms.
            </p>

            {/* Visual Comparative Graph: Approval Rate */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '8px' }}>
                Loan Approval Rate by Cohort:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '3px' }}>
                    <span>Smallholder (&lt; 2 Ha)</span>
                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>78.4%</span>
                  </div>
                  <div style={{ height: '12px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ width: '78.4%', background: 'linear-gradient(90deg, #10b981, #059669)', height: '100%' }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '3px' }}>
                    <span>Commercial Holdings (&ge; 2 Ha)</span>
                    <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>82.1%</span>
                  </div>
                  <div style={{ height: '12px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ width: '82.1%', background: 'linear-gradient(90deg, #0284c7, #38bdf8)', height: '100%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Comparative Graph: Average Yield Output */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '8px' }}>
                Mean Yield Production by Cohort (kg/ha):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '3px' }}>
                    <span>Smallholder Cohort</span>
                    <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>724 kg/ha</span>
                  </div>
                  <div style={{ height: '12px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${(724 / 900) * 100}%`, background: 'linear-gradient(90deg, #f59e0b, #d97706)', height: '100%' }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '3px' }}>
                    <span>Commercial Cohort</span>
                    <span style={{ color: '#8b5cf6', fontWeight: 'bold' }}>741 kg/ha</span>
                  </div>
                  <div style={{ height: '12px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${(741 / 900) * 100}%`, background: 'linear-gradient(90deg, #8b5cf6, #6d28d9)', height: '100%' }} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '14px', borderRadius: '10px', fontSize: '12px', color: '#a7f3d0', lineHeight: '1.5' }}>
              ✓ <strong>Demographic Parity Disparity Index: 0.95</strong>
              <div style={{ marginTop: '4px', color: '#cbd5e1' }}>
                Exceeds the regulatory 0.80 benchmark. Smallholder applications are evaluated on empirical agronomic viability without landholding bias.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Styling Constants
const neonCanvasBg = {
  backgroundColor: '#0a0f1d',
  color: '#f8fafc',
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  position: 'relative',
  overflowX: 'hidden'
};

const glowOrbTopLeft = {
  position: 'fixed',
  top: '-150px',
  left: '-150px',
  width: '450px',
  height: '450px',
  background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0) 70%)',
  borderRadius: '50%',
  pointerEvents: 'none',
  zIndex: 1
};

const glowOrbBottomRight = {
  position: 'fixed',
  bottom: '-150px',
  right: '-150px',
  width: '500px',
  height: '500px',
  background: 'radial-gradient(circle, rgba(6,182,212,0.18) 0%, rgba(6,182,212,0) 70%)',
  borderRadius: '50%',
  pointerEvents: 'none',
  zIndex: 1
};

const glassCard = {
  backgroundColor: 'rgba(26, 34, 53, 0.72)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  borderRadius: '16px',
  padding: '24px',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  boxShadow: '0 12px 35px rgba(0, 0, 0, 0.35)'
};

const bureauDarkBox = {
  backgroundColor: 'rgba(15, 23, 42, 0.65)',
  padding: '12px 14px',
  borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.06)'
};

const bureauLabel = {
  fontSize: '11px',
  fontWeight: '700',
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.04em'
};

const neonLabel = {
  fontSize: '11px',
  fontWeight: '700',
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  display: 'block',
  marginBottom: '4px'
};

const neonInput = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: '8px',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  backgroundColor: '#111827',
  color: '#f8fafc',
  fontSize: '13px',
  boxSizing: 'border-box',
  outline: 'none'
};

const resultStatBox = {
  backgroundColor: 'rgba(15, 23, 42, 0.6)',
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.05)'
};

const gradientPrimaryButton = {
  background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
  color: '#041d1a',
  border: 'none',
  borderRadius: '10px',
  padding: '12px 20px',
  fontSize: '14px',
  fontWeight: '800',
  cursor: 'pointer',
  width: '100%',
  boxShadow: '0 8px 20px rgba(16,185,129,0.35)'
};

const neonExitButton = {
  background: 'rgba(244, 63, 94, 0.15)',
  border: '1px solid rgba(244, 63, 94, 0.4)',
  color: '#fb7185',
  borderRadius: '10px',
  padding: '8px 16px',
  fontSize: '12px',
  fontWeight: '700',
  cursor: 'pointer'
};

const pillButton = (color) => ({
  backgroundColor: `${color}20`,
  border: `1px solid ${color}60`,
  color: color,
  borderRadius: '20px',
  padding: '6px 14px',
  fontSize: '12px',
  fontWeight: '700',
  cursor: 'pointer'
});

const vibrantTabStyle = (isActive) => ({
  background: isActive ? 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(6,182,212,0.15) 100%)' : 'transparent',
  border: isActive ? '1px solid rgba(16,185,129,0.5)' : '1px solid transparent',
  color: isActive ? '#34d399' : '#94a3b8',
  fontWeight: '800',
  padding: '10px 18px',
  borderRadius: '10px',
  cursor: 'pointer',
  fontSize: '13px'
});