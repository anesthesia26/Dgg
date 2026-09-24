/**
 * ANESTHESIA & ICU MASTER WORKSTATION — CLINICAL ENGINE
 * Pure Mathematical & Clinical Decision Support Calculations
 * Expanded with: Pre-op Risk Indices, Advanced Ventilator Mechanics & Actionable ABG Bedside Therapy Engine
 */

const ClinicalEngine = {
  // 1. IDEAL & ADJUSTED BODY WEIGHT (Devine & Lemmens Formulas)
  calcWeights(weight, heightCm, gender = 'male') {
    const w = parseFloat(weight) || 70;
    const h = parseFloat(heightCm) || 170;
    const heightInches = h / 2.54;
    const over5Ft = Math.max(0, heightInches - 60);

    let ibw = gender === 'male' ? 50 + 2.3 * over5Ft : 45.5 + 2.3 * over5Ft;
    ibw = Math.round(ibw * 10) / 10;

    const bmi = Math.round((w / Math.pow(h / 100, 2)) * 10) / 10;
    const abw = Math.round((ibw + 0.4 * (w - ibw)) * 10) / 10;

    // DuBois BSA
    const bsa = Math.round(0.007184 * Math.pow(w, 0.425) * Math.pow(h, 0.725) * 100) / 100;

    return { tbw: w, ibw, abw, bmi, bsa };
  },

  // 2. PEDIATRIC & ADULT AIRWAY SIZING (ETT, Depth, Blades)
  calcAirway(age, ageUnit = 'years') {
    let ageYears = parseFloat(age) || 35;
    if (ageUnit === 'months') ageYears = ageYears / 12;
    if (ageUnit === 'days') ageYears = ageYears / 365;

    let uncuffedETT = 0;
    let cuffedETT = 0;
    let ettDepth = 0;
    let bladeType = '';
    let bladeSize = '';
    let suctionFr = 0;

    if (ageYears < 0.08) { // Neonate < 1 month
      uncuffedETT = 3.0;
      cuffedETT = 2.5;
      ettDepth = 9;
      bladeType = 'Miller';
      bladeSize = '0';
      suctionFr = 6;
    } else if (ageYears < 1) { // Infant 1-12 months
      uncuffedETT = 3.5;
      cuffedETT = 3.0;
      ettDepth = 10;
      bladeType = 'Miller';
      bladeSize = '1';
      suctionFr = 8;
    } else if (ageYears <= 2) {
      uncuffedETT = 4.0;
      cuffedETT = 3.5;
      ettDepth = 11;
      bladeType = 'Miller / Mac';
      bladeSize = '1 - 2';
      suctionFr = 8;
    } else if (ageYears <= 12) {
      // Motoyama / Khine formula
      uncuffedETT = Math.round(((ageYears / 4) + 4) * 2) / 2;
      cuffedETT = Math.round(((ageYears / 4) + 3.5) * 2) / 2;
      ettDepth = Math.round(((ageYears / 2) + 12) * 10) / 10;
      bladeType = 'Macintosh';
      bladeSize = ageYears <= 6 ? '2' : '3';
      suctionFr = Math.round(cuffedETT * 2);
    } else {
      // Adult
      cuffedETT = 7.5;
      uncuffedETT = 8.0;
      ettDepth = 21;
      bladeType = 'Macintosh';
      bladeSize = '3 - 4';
      suctionFr = 12;
    }

    return {
      cuffedETT: cuffedETT.toFixed(1),
      uncuffedETT: uncuffedETT.toFixed(1),
      ettDepth: ettDepth.toFixed(1),
      blade: `${bladeType} ${bladeSize}`,
      suction: `${suctionFr} Fr`
    };
  },

  // 3. INDUCTION DRUGS DOSING & CONCENTRATIONS
  calcInductionDrugs(weightKg, ibwKg) {
    const w = parseFloat(weightKg) || 70;
    const ibw = parseFloat(ibwKg) || w;

    return [
      {
        id: 'propofol',
        name: 'Propofol (بروبوفول)',
        basis: 'IBW / ABW in obesity',
        standardConc: '10 mg/ml (1%)',
        mgDoseMin: Math.round(ibw * 1.5),
        mgDoseMax: Math.round(ibw * 2.5),
        mlMin: (ibw * 1.5 / 10).toFixed(1),
        mlMax: (ibw * 2.5 / 10).toFixed(1),
        notes: 'يخفض الضغط الشرياني. يقلل الجرعة عند كبار السن ومرضى الصدمة.'
      },
      {
        id: 'ketamine',
        name: 'Ketamine (كيتامين)',
        basis: 'Total Body Weight',
        standardConc: '50 mg/ml',
        mgDoseMin: Math.round(w * 1.0),
        mgDoseMax: Math.round(w * 2.0),
        mlMin: (w * 1.0 / 50).toFixed(1),
        mlMax: (w * 2.0 / 50).toFixed(1),
        notes: 'يحافظ على النتاج القلبي وموسع قصبي ممتاز. مثالي لمرضى الربو والصدمة الإنتانية.'
      },
      {
        id: 'etomidate',
        name: 'Etomidate (إيتوميدات)',
        basis: 'Total Body Weight',
        standardConc: '2 mg/ml',
        mgDoseMin: Math.round(w * 0.2),
        mgDoseMax: Math.round(w * 0.3),
        mlMin: (w * 0.2 / 2).toFixed(1),
        mlMax: (w * 0.3 / 2).toFixed(1),
        notes: 'استقرار ديناميكي قلبي فائق. الحذر من تثبيط قشر الكظر المؤقت.'
      },
      {
        id: 'thiopental',
        name: 'Thiopental (ثيوبنتال)',
        basis: 'Total Body Weight',
        standardConc: '25 mg/ml (2.5%)',
        mgDoseMin: Math.round(w * 3.0),
        mgDoseMax: Math.round(w * 5.0),
        mlMin: (w * 3.0 / 25).toFixed(1),
        mlMax: (w * 5.0 / 25).toFixed(1),
        notes: 'خافض لضغط الدماغ ICP وحامي عصبي. ممنوع في البورفيريا وهبوط الضغط الحاد.'
      },
      {
        id: 'midazolam',
        name: 'Midazolam (ميدازولام)',
        basis: 'Total Body Weight',
        standardConc: '1 mg/ml أو 5 mg/ml',
        mgDoseMin: (w * 0.05).toFixed(1),
        mgDoseMax: (w * 0.15).toFixed(1),
        mlMin: (w * 0.05 / 1).toFixed(1),
        mlMax: (w * 0.15 / 1).toFixed(1),
        notes: 'مهدئ ومضاد للقلق ومانع للذاكرة الرجعية. يقلل الجرعة عند كبار السن.'
      },
      {
        id: 'fentanyl',
        name: 'Fentanyl (فنتانيل)',
        basis: 'Total Body Weight',
        standardConc: '50 mcg/ml (0.05 mg/ml)',
        mgDoseMin: Math.round(w * 1.5),
        mgDoseMax: Math.round(w * 3.0),
        mlMin: (w * 1.5 / 50).toFixed(1),
        mlMax: (w * 3.0 / 50).toFixed(1),
        notes: 'الجرعة بالميكروغرام (mcg). يثبط الاستجابة الودية للتنبيب الحنجري.'
      },
      {
        id: 'rocuronium',
        name: 'Rocuronium (روكورونيوم)',
        basis: 'Ideal Body Weight (أو TBW للـ RSI)',
        standardConc: '10 mg/ml',
        mgDoseMin: Math.round(ibw * 0.6),
        mgDoseMax: Math.round(w * 1.2), // RSI dose
        mlMin: (ibw * 0.6 / 10).toFixed(1),
        mlMax: (w * 1.2 / 10).toFixed(1),
        notes: '0.6 mg/kg للروتين (خلال 90 ثانية)، و 1.2 mg/kg للتحريض السريع RSI (خلال 60 ثانية).'
      },
      {
        id: 'atracurium',
        name: 'Atracurium (أتراكوريوم)',
        basis: 'Ideal Body Weight',
        standardConc: '10 mg/ml',
        mgDoseMin: (ibw * 0.4).toFixed(1),
        mgDoseMax: (ibw * 0.5).toFixed(1),
        mlMin: (ibw * 0.4 / 10).toFixed(1),
        mlMax: (ibw * 0.5 / 10).toFixed(1),
        notes: 'تصفية هوفمان. يحرر الهستامين إذا حُقن بسرعة (تجنبه في الربو الشديد).'
      },
      {
        id: 'cisatracurium',
        name: 'Cisatracurium (سيساتراكوريوم)',
        basis: 'Ideal Body Weight',
        standardConc: '2 mg/ml',
        mgDoseMin: (ibw * 0.15).toFixed(1),
        mgDoseMax: (ibw * 0.20).toFixed(1),
        mlMin: (ibw * 0.15 / 2).toFixed(1),
        mlMax: (ibw * 0.20 / 2).toFixed(1),
        notes: 'المرخي المثالي للفشل الكلوي والكبدي. لا يحرر الهستامين وآمن قلبياً.'
      },
      {
        id: 'succinylcholine',
        name: 'Succinylcholine (سكسنيل كولين)',
        basis: 'Total Body Weight',
        standardConc: '50 mg/ml',
        mgDoseMin: Math.round(w * 1.0),
        mgDoseMax: Math.round(w * 1.5),
        mlMin: (w * 1.0 / 50).toFixed(1),
        mlMax: (w * 1.5 / 50).toFixed(1),
        notes: 'مرخي عضلي مزيل للاستقطاب فائق السرعة. يرفع البوتاسيوم 0.5 mEq/L. ممنوع في الحروق والكسور وMH.'
      }
    ];
  },

  // 4. REVERSALS & SUGAMMADEX CALCULATION
  calcReversals(weightKg) {
    const w = parseFloat(weightKg) || 70;
    return {
      sugammadexRoutine: {
        doseMg: Math.round(w * 2),
        volMl: ((w * 2) / 100).toFixed(1),
        indication: 'حصار عضلي روتيني (ظهور نبضتين TOF >= 2)'
      },
      sugammadexDeep: {
        doseMg: Math.round(w * 4),
        volMl: ((w * 4) / 100).toFixed(1),
        indication: 'حصار عضلي عميق (TOF = 0 مع PTC 1-2)'
      },
      sugammadexImmediate: {
        doseMg: Math.round(w * 16),
        volMl: ((w * 16) / 100).toFixed(1),
        indication: 'إنقاذ عاجل وفوري بعد جرعة روكورونيوم عالية (1.2 mg/kg)'
      },
      neostigmineAtropine: {
        neostigmineMg: (w * 0.05).toFixed(2),
        neostigmineMl: ((w * 0.05) / 0.5).toFixed(1), // Conc 0.5 mg/ml
        atropineMg: (w * 0.02).toFixed(2),
        atropineMl: ((w * 0.02) / 1.0).toFixed(1),   // Conc 1.0 mg/ml
        indication: 'مضاد تقليدي (يجب ظهور 4 نبضات TOF مع استدامة قبل الحقن)'
      }
    };
  },

  // 5. VENTILATION MECHANICS & ADVANCED ARDS CALCULATIONS
  calcVentilatorAdvanced({ vT, pPeak, pPlat, peep, rr, paCO2, targetPaCO2, paO2, fio2, flowLpm = 60, ibwKg }) {
    const vt = parseFloat(vT) || 450;
    const ppeak = parseFloat(pPeak) || 22;
    const pplat = parseFloat(pPlat) || 18;
    const pe = parseFloat(peep) || 5;
    const rate = parseFloat(rr) || 12;
    const flow = parseFloat(flowLpm) || 60; // L/min

    // Driving Pressure (Delta P = Pplat - PEEP)
    const drivingPressure = Math.round((pplat - pe) * 10) / 10;
    let drivingPressureClass = 'safe';
    let drivingPressureNote = 'ضغط قيادة آمن وقائي (< 14 cmH2O)';
    if (drivingPressure >= 14 && drivingPressure < 18) {
      drivingPressureClass = 'warning';
      drivingPressureNote = 'ضغط قيادة مرتفع نسبياً (14-17 cmH2O) — يوصى بتقليل الحجم الجاري Vt';
    } else if (drivingPressure >= 18) {
      drivingPressureClass = 'danger';
      drivingPressureNote = 'خطر شديد لرضح الضغط (Barotrauma/Volutrauma >= 18 cmH2O) — يجب خفض Vt فوراً';
    }

    // Static Compliance (Cstat = Vt / (Pplat - PEEP))
    const deltaP = Math.max(1, pplat - pe);
    const staticCompliance = Math.round((vt / deltaP) * 10) / 10;

    // Dynamic Compliance (Cdyn = Vt / (Ppeak - PEEP))
    const deltaPeak = Math.max(1, ppeak - pe);
    const dynamicCompliance = Math.round((vt / deltaPeak) * 10) / 10;

    // Airway Resistance (Raw = (Ppeak - Pplat) / (Flow in L/sec))
    const flowLps = flow / 60;
    const airwayResistance = Math.round(((ppeak - pplat) / flowLps) * 10) / 10;

    // Minute Ventilation
    const currentVE = Math.round((vt * rate / 1000) * 10) / 10;

    // Desired Minute Ventilation for target PaCO2
    let desiredVE = null;
    let desiredRR = null;
    let desiredVt = null;
    if (paCO2 && targetPaCO2) {
      const curCO2 = parseFloat(paCO2);
      const tarCO2 = parseFloat(targetPaCO2);
      if (curCO2 > 0 && tarCO2 > 0) {
        desiredVE = Math.round((currentVE * (curCO2 / tarCO2)) * 10) / 10;
        desiredRR = Math.round(rate * (curCO2 / tarCO2));
        desiredVt = Math.round(vt * (curCO2 / tarCO2));
      }
    }

    // RSBI (Rapid Shallow Breathing Index = RR / (Vt in Liters))
    const vtLiters = vt / 1000;
    const rsbi = Math.round(rate / vtLiters);
    let rsbiInterpretation = '';
    if (rsbi < 105) {
      rsbiInterpretation = 'مؤشر إيجابي ممتاز للفطام ونزع الأنبوب الرغامي (RSBI < 105)';
    } else {
      rsbiInterpretation = 'مؤشر مرتفع (RSBI >= 105) — احتمالية فشل الفطام ونزع الأنبوب عالية، يحتاج استمرار الدعم';
    }

    // PaO2 / FiO2 Ratio (P/F Ratio)
    let pfRatio = null;
    let ardsSeverity = 'Normal';
    if (paO2 && fio2) {
      const pO2 = parseFloat(paO2);
      let fi = parseFloat(fio2);
      if (fi > 1) fi = fi / 100; // if entered as percentage e.g. 40
      if (fi > 0) {
        pfRatio = Math.round(pO2 / fi);
        if (pfRatio > 300) ardsSeverity = 'أكسجة طبيعية (No ARDS)';
        else if (pfRatio > 200) ardsSeverity = 'متلازمة ضائقة تنفسية خفيفة (Mild ARDS: P/F 201-300)';
        else if (pfRatio > 100) ardsSeverity = 'متلازمة ضائقة تنفسية متوسطة (Moderate ARDS: P/F 101-200)';
        else ardsSeverity = 'متلازمة ضائقة تنفسية حادة وشديدة (Severe ARDS: P/F <= 100)';
      }
    }

    return {
      drivingPressure,
      drivingPressureClass,
      drivingPressureNote,
      staticCompliance,
      dynamicCompliance,
      airwayResistance,
      currentVE,
      desiredVE,
      desiredRR,
      desiredVt,
      rsbi,
      rsbiInterpretation,
      pfRatio,
      ardsSeverity
    };
  },

  // 6. ACTIONABLE CLINICAL ABG BEDSIDE THERAPY ENGINE
  generateABGTreatmentProtocol({ ph, paco2, hco3, pao2, fio2, na, cl, albumin, weightKg = 70, currentRR = 12, currentVt = 450 }) {
    const pH = parseFloat(ph);
    const PaCO2 = parseFloat(paco2);
    const HCO3 = parseFloat(hco3);
    const PaO2 = parseFloat(pao2);
    const FiO2 = parseFloat(fio2) > 1 ? parseFloat(fio2) / 100 : parseFloat(fio2);
    const Na = parseFloat(na) || 140;
    const Cl = parseFloat(cl) || 102;
    const Alb = parseFloat(albumin) || 4.0;
    const w = parseFloat(weightKg) || 70;
    const rr = parseFloat(currentRR) || 12;
    const vt = parseFloat(currentVt) || 450;

    if (isNaN(pH) || isNaN(PaCO2) || isNaN(HCO3)) {
      return { status: 'يرجى إدخال قيم صالحة لـ pH و PaCO2 و HCO3-', hasData: false };
    }

    let diagnosis = '';
    let disorderType = '';
    let compensationStatus = '';
    let anionGap = Math.round((Na - (Cl + HCO3)) * 10) / 10;
    let correctedAG = Math.round((anionGap + 2.5 * (4.0 - Alb)) * 10) / 10;

    const medicalActions = [];
    const ventilatorActions = [];
    const criticalWarnings = [];

    if (pH < 7.35) {
      if (PaCO2 > 45 && HCO3 < 22) {
        diagnosis = 'حماض مختلط حاد وشديد (Mixed Severe Acidosis: تنفسي واستقلابي معاً)';
        disorderType = 'mixed_acid';
      } else if (PaCO2 > 45) {
        diagnosis = 'حماض تنفسي (Respiratory Acidosis)';
        disorderType = 'resp_acid';
        if (HCO3 > 26) compensationStatus = 'معاوض جزئياً أو مزمن (Renal Compensation)';
        else compensationStatus = 'حاد غير معاوض (Acute Uncompensated)';
      } else if (HCO3 < 22) {
        diagnosis = 'حماض استقلابي (Metabolic Acidosis)';
        disorderType = 'met_acid';
        const expectedPaCO2 = (1.5 * HCO3) + 8;
        if (Math.abs(PaCO2 - expectedPaCO2) <= 2) {
          compensationStatus = `معاوضة تنفسية متوقعة وفق معادلة وينتر Winter's formula (~${Math.round(expectedPaCO2)} mmHg)`;
        } else if (PaCO2 > expectedPaCO2) {
          compensationStatus = 'مصحوب بحماض تنفسي إضافي (Superimposed Respiratory Acidosis / نقص تهوية)';
        } else {
          compensationStatus = 'مصحوب بقلاء تنفسي إضافي (Superimposed Respiratory Alkalosis / فرط تهوية)';
        }
      }
    } else if (pH > 7.45) {
      if (PaCO2 < 35 && HCO3 > 26) {
        diagnosis = 'قلاء مختلط (Mixed Alkalosis: تنفسي واستقلابي معاً)';
        disorderType = 'mixed_alk';
      } else if (PaCO2 < 35) {
        diagnosis = 'قلاء تنفسي (Respiratory Alkalosis)';
        disorderType = 'resp_alk';
        if (HCO3 < 22) compensationStatus = 'معاوض كلوياً (Compensated by kidneys)';
        else compensationStatus = 'حاد غير معاوض (Acute uncompensated)';
      } else if (HCO3 > 26) {
        diagnosis = 'قلاء استقلابي (Metabolic Alkalosis)';
        disorderType = 'met_alk';
        const expectedPaCO2 = 40 + 0.7 * (HCO3 - 24);
        compensationStatus = `معاوضة تنفسية متوقعة: ~${Math.round(expectedPaCO2)} mmHg`;
      }
    } else {
      if (PaCO2 >= 35 && PaCO2 <= 45 && HCO3 >= 22 && HCO3 <= 26) {
        diagnosis = 'غازات دم شريانية ضمن الحدود الطبيعية تماماً (Normal ABG)';
        disorderType = 'normal';
      } else if (PaCO2 > 45 && HCO3 > 26) {
        diagnosis = 'حماض تنفسي مزمن معاوض كلياً أو قلاء استقلابي معاوض';
        disorderType = 'comp_resp_acid';
      } else {
        diagnosis = 'اضطراب معاوض كلياً (Fully Compensated Acid-Base Status)';
        disorderType = 'compensated';
      }
    }

    if (disorderType === 'met_acid') {
      if (correctedAG > 12) {
        medicalActions.push(`حماض استقلابي مرتفع الفجوة الشاردية (High Anion Gap = ${correctedAG} mEq/L). الأسباب: حمض اللاكتيك (Lactic Acidosis)، الحماض الكيتوني السكري (DKA)، اليوريميا (Uremia)، أو السموم.`);
        medicalActions.push('الإنعاش بالسوائل المتوازنة: إعطاء محلول Plasmalyte أو Ringer Lactate. تجنب الإفراط في Normal Saline 0.9% لمنع الحماض الكلوري الإضافي.');
        medicalActions.push('فحص سكر الدم وتريتر الأنسولين النظامي وريدياً إذا كان السبب DKA، مع تعويض البوتاسيوم.');
      } else {
        medicalActions.push(`حماض استقلابي طبيعي الفجوة الشاردية (Normal Anion Gap = ${correctedAG} mEq/L). السبب الرئيسي: فقدان البيكربونات (إسهال شديد، نواسير هضمية) أو فرط الكلور من المحاليل الملحية.`);
        medicalActions.push('إيقاف المحاليل الغنية بالكلور (Normal Saline) والتحويل فوراً إلى Plasmalyte أو محاليل بيكربونات متوازنة.');
      }

      const hco3Deficit = Math.round(0.3 * w * Math.max(0, 24 - HCO3));
      if (pH < 7.15 || HCO3 < 10) {
        medicalActions.push(`حاسبة عجز البيكربونات: العجز الكلي = ${hco3Deficit} mEq. الاستطباب سريرياً: إعطاء نصف الجرعة المحسوبة (${Math.round(hco3Deficit / 2)} mEq NaHCO3 8.4%) تسريباً بطيئاً على مدى 30-60 دقيقة للوصول بـ pH إلى 7.20.`);
        criticalWarnings.push('تحذير بيكربونات الصوديوم: لا تعطِ البيكربونات إلا بوجود تهوية دقيقة كافية على الفنتليتر، لأنها تتحول إلى CO2 وقد تسبب حماضاً متناقضاً داخل الخلايا (Paradoxical Intracellular Acidosis). راقب الكالسيوم الشاردي والبوتاسيوم.');
      } else {
        medicalActions.push(`عجز البيكربونات النظري = ${hco3Deficit} mEq، ولكن لا يُنصح بإعطاء البيكربونات روتينياً لأن pH > 7.15 — ركّز على معالجة السبب الجذري والتروية النسيجية.`);
      }

      const curVE = (vt * rr) / 1000;
      const targetCO2 = Math.min(40, Math.max(25, (1.5 * HCO3) + 8));
      const targetRR = Math.min(30, Math.round(rr * (PaCO2 / targetCO2)));
      ventilatorActions.push(`دعم المعاوضة التنفسية: ضبط PaCO2 المستهدف عند ${Math.round(targetCO2)} mmHg.`);
      ventilatorActions.push(`زيادة معدل التنفس على الفنتليتر من ${rr} bpm إلى ${targetRR} bpm مع الإبقاء على Vt وقائياً (6-8 ml/kg من IBW).`);
    } else if (disorderType === 'resp_acid') {
      medicalActions.push('فحص سلامة المسلك الهوائي ونظافة الأنبوب الرغامي وعمق التثبيت واستبعاد الانحشار بالمفرزات أو التواء الأنبوب.');
      medicalActions.push('إذا كان المريض يعاني من أزيز أو تشنج قصبي: إعطاء رذاذ Salbutamol + Ipratropium وتعميق التخدير بغاز سيفوفلوران.');
      medicalActions.push('إذا كان الحماض ناتجاً عن تثبيط تنفسي بعد نزع التيوب: إعطاء نالوكسون Naloxone 0.04-0.1 mg وريدياً titrated لمضادات الأفيون، أو فلومازينيل Flumazenil 0.2 mg للبنزوديازيبين.');

      const curVE = (vt * rr) / 1000;
      const desiredVE = Math.round((curVE * (PaCO2 / 40)) * 10) / 10;
      const desiredRR = Math.min(32, Math.round(rr * (PaCO2 / 40)));
      ventilatorActions.push(`تصحيح التهوية الدقيقة: التهوية الحالية = ${curVE.toFixed(1)} L/min. التهوية الدقيقة المطلوبة للوصول إلى PaCO2 40 mmHg هي: ${desiredVE} L/min.`);
      ventilatorActions.push(`وصفة ضبط الفنتليتر الموصى بها: رفع معدل التنفس (RR) من ${rr} إلى ${desiredRR} تنفس/دقيقة.`);
      if (desiredRR > 26) {
        ventilatorActions.push('إذا كان معدل التنفس مرتفعاً جداً، يمكن رفع الحجم الجاري Vt بمقدار 50-75 ml بشرط ألا يتجاوز ضغط القيادة Driving Pressure 14 cmH2O.');
      }
    } else if (disorderType === 'met_alk') {
      medicalActions.push('قلاء استقلابي: غالباً ما يكون ناتجاً عن القيء وفقدان حمض المعدة، الشفط الأنفي المعدي المستمر (NG suction)، أو استخدام المدرات الخافضة للبوتاسيوم.');
      medicalActions.push('الخط الأول: تسريب محلول ملحي متساوي التوتر (0.9% Normal Saline) لإعادة توازن الكلور والحجم.');
      medicalActions.push('تعويض البوتاسيوم والمغنيسيوم الوريدي: نقص البوتاسيوم يثبت القلاء ويديمه في الأنابيب الكلوية.');
      medicalActions.push('في المرضى الذين يعانون من فرط السوائل أو قصور القلب: النظر في إعطاء أسيتازولاميد Acetazolamide (Diamox) 250 - 500 mg IV لطرح البيكربونات كلوياً.');
      ventilatorActions.push('مراقبة التنفس التلقائي: قد يؤدي القلاء الاستقلابي إلى نقص تهوية تعويضي يؤخر الفطام عن جهاز التنفس.');
    } else if (disorderType === 'resp_alk') {
      medicalActions.push('قلاء تنفسي حاد: البحث عن السبب المحفز: الألم الشديد، القلق، الحمى، نقص الأكسجة، تعفن الدم المبكر، أو الانصمام الرئوي.');
      medicalActions.push('توفير التسكين الكافي (Fentanyl / Morphine) وتهدئة المريض إذا كان يقاوم جهاز التنفس (Patient-Ventilator Asynchrony).');
      const curVE = (vt * rr) / 1000;
      const desiredRR = Math.max(8, Math.round(rr * (PaCO2 / 40)));
      ventilatorActions.push(`خفض التهوية المفرطة: إنقاص معدل التنفس (RR) على الفنتليتر من ${rr} إلى ${desiredRR} تنفس/دقيقة.`);
      ventilatorActions.push('التحويل من نمط السيطرة الإجبارية (VCV/PCV) إلى نمط الدعم التلقائي (PSV) لتمكين المريض من تنظيم سرعة تنفسه ذاتياً.');
    } else if (disorderType === 'mixed_acid') {
      medicalActions.push('🚨 حالة طوارئ حرجة: حماض مزدوج فتاك ينذر بتوقف القلب أو الانهيار الدوراني الوشيك.');
      medicalActions.push('البدء الفوري برافعات الضغط والإنوتروب (Noradrenaline + Epinephrine) للحفاظ على الضغط الشرياني الوسطي MAP > 65.');
      medicalActions.push('استخدام البيكربونات (NaHCO3 8.4%) بجرعة إنقاذية لتفادي توقف القلب الحماضي.');
      ventilatorActions.push('تهوية قصوى بأكسجين 100% وزيادة التهوية الدقيقة لطرد أكبر كمية ممكنة من CO2 فوراً.');
    } else {
      medicalActions.push('القيم الحالية متوازنة أو معاوضة. استمر في المراقبة السريرية الدورية وإعادة التحليل بعد التدخلات الجراحية الكبرى.');
      ventilatorActions.push('استمر في إعدادات التهوية الوقائية الحالية مع الحفاظ على ضغط القيادة < 14 cmH2O.');
    }

    let pfRatio = null;
    let hypoxemiaProtocol = null;
    if (!isNaN(PaO2) && !isNaN(FiO2) && FiO2 > 0) {
      pfRatio = Math.round(PaO2 / FiO2);
      let severity = '';
      const steps = [];

      if (pfRatio > 300) {
        severity = 'أكسجة طبيعية (PaO2/FiO2 > 300)';
        steps.push('الحفاظ على FiO2 عند أدنى مستوى يحقق تشبع SpO2 بين 94-98% لتجنب سمية الأكسجين.');
      } else if (pfRatio > 200) {
        severity = 'فشل أكسجة خفيف (Mild ARDS: 201 - 300)';
        steps.push('رفع ضغط PEEP إلى 8 - 10 cmH2O وفق جدول ARDSNet.');
        steps.push('التأكد من الالتزام بالحجم الجاري الوقائي 6 ml/kg من الوزن المثالي IBW.');
      } else if (pfRatio > 100) {
        severity = 'فشل أكسجة متوسط (Moderate ARDS: 101 - 200)';
        steps.push('رفع PEEP تدريجياً إلى 10 - 14 cmH2O ومراقبة ضغط القيادة Driving Pressure.');
        steps.push('إجراء مناورات فتح الأسناخ الرئوية (Alveolar Recruitment Maneuvers: CPAP 30-40 cmH2O لمدة 30-40 ثانية بوجود استقرار قلبي).');
        steps.push('تسكين وتنويم عميق لمنع التزامن الخاطئ مع الفنتليتر.');
      } else {
        severity = 'فشل أكسجة حاد وشديد (Severe ARDS: PaO2/FiO2 <= 100)';
        steps.push('الإنعاش بوضعية الانبطاح (Prone Positioning): استلقاء على البطن لمدة 16-18 ساعة يومياً (يخفض الوفيات بنسبة 50%).');
        steps.push('حصار عصبي عضلي مستمر: تسريب سيساتراكوريوم (Cisatracurium Infusion) لمدة 48 ساعة.');
        steps.push('النظر في الغازات الموسعة للأوعية الرئوية المستنشقة (Inhaled Epoprostenol أو Nitric Oxide iNO).');
        steps.push('تقييم الحاجة العاجلة لجهاز الأكسجة الغشائية خارج الجسم (VV-ECMO Evaluation).');
      }

      hypoxemiaProtocol = { pfRatio, severity, steps };
    }

    return {
      hasData: true,
      diagnosis,
      disorderType,
      compensationStatus,
      anionGap,
      correctedAG,
      medicalActions,
      ventilatorActions,
      criticalWarnings,
      hypoxemiaProtocol
    };
  },

  // 7. PRE-OPERATIVE RISK CALCULATORS (RCRI & STOP-BANG)
  calcRCRI(selectedFactors = []) {
    const count = selectedFactors.length;
    let riskClass = 'Class I';
    let maceRate = '0.4% - 0.5%';
    let recommendation = 'خطر قلبي ضئيل جداً. لا توجد حاجة لفحوصات قلبية إضافية متقدمة إلا إذا كان المريض يعاني من أعراض جديدة.';

    if (count === 1) {
      riskClass = 'Class II';
      maceRate = '0.9% - 1.0%';
      recommendation = 'خطر قلبي منخفض إلى متوسط. يوصى بإجراء تخطيط قلب ECG وتقييم السعة الوظيفية METs.';
    } else if (count === 2) {
      riskClass = 'Class III';
      maceRate = '6.6% - 7.0%';
      recommendation = 'خطر قلبي مرتفع. استشارة طبيب القلبية، تقييم إيكو القلب حديث، وتجهيز مراقبة شريانية غازية أثناء العملية (Arterial Line).';
    } else if (count >= 3) {
      riskClass = 'Class IV';
      maceRate = '> 11.0%';
      recommendation = 'خطر قلبي حرج وفائق. يجب تأجيل الجراحة غير الإسعافية لتحسين وظائف القلب وتوفير سرير عناية مركزة ICU بعد العملية حتماً.';
    }

    return { count, riskClass, maceRate, recommendation };
  },

  calcSTOPBang(selectedItems = []) {
    const score = selectedItems.length;
    let riskLevel = 'خطر منخفض (Low Risk OSA)';
    let levelClass = 'safe';
    let recommendations = [
      'احتمالية انقطاع التنفس أثناء النوم ضئيلة.',
      'تطبيق بروتوكول التخدير الاعتيادي مع المراقبة الروتينية.'
    ];

    if (score >= 3 && score <= 4) {
      riskLevel = 'خطر متوسط (Intermediate Risk OSA)';
      levelClass = 'warning';
      recommendations = [
        'تجهيز مسلك هوائي صعب (توقع صعوبة التهوية بالقناع والتنبيب).',
        'تقليل استخدام المهدئات والأفيونات القوية، وتفضيل التسكين المناطقي أو المتعدد الأنماط (Multimodal Analgesia).',
        'مراقبة تشبع الأكسجين المستمرة في وحدة الإفاقة PACU.'
      ];
    } else if (score >= 5) {
      riskLevel = 'خطر عالي جداً (High Risk OSA)';
      levelClass = 'danger';
      recommendations = [
        '🚨 خطر شديد لانسداد المجرى التنفسي ونقص الأكسجة المفاجئ بعد العمليات.',
        'وضعية الرأس المرتفع (Ramped Position) أثناء التحريض ونزع الأنبوب الرغامي في حالة اليقظة التامة (Awake Extubation).',
        'إحضار جهاز الـ CPAP الخاص بالمريض إلى المستشفى وتطبيقه فورياً في غرفة الإفاقة.',
        'ممنوع خروج المريض إلى الردهة العادية دون مراقبة دقيقة ومستمرة لنبض القلب والأكسجين.'
      ];
    }

    return { score, riskLevel, levelClass, recommendations };
  },

  // 8. PERIOPERATIVE FLUIDS (4-2-1 Rule & Fasting Deficit)
  calcFluids(weightKg, fastingHours = 8, surgicalSeverity = 'moderate') {
    const w = parseFloat(weightKg) || 70;
    const hours = parseFloat(fastingHours) || 8;

    let maintenanceHourly = 0;
    if (w <= 10) maintenanceHourly = w * 4;
    else if (w <= 20) maintenanceHourly = 40 + (w - 10) * 2;
    else maintenanceHourly = 60 + (w - 20) * 1;

    const totalDeficit = maintenanceHourly * hours;
    const firstHourReplacement = (totalDeficit / 2) + maintenanceHourly;
    const secondHourReplacement = (totalDeficit / 4) + maintenanceHourly;
    const thirdHourReplacement = (totalDeficit / 4) + maintenanceHourly;

    let surgicalLossMlKg = 4; // Moderate
    if (surgicalSeverity === 'minimal') surgicalLossMlKg = 2;
    if (surgicalSeverity === 'severe') surgicalLossMlKg = 7;

    const surgicalLossHourly = w * surgicalLossMlKg;

    return {
      maintenanceHourly: Math.round(maintenanceHourly),
      totalDeficit: Math.round(totalDeficit),
      firstHourReplacement: Math.round(firstHourReplacement + surgicalLossHourly),
      secondHourReplacement: Math.round(secondHourReplacement + surgicalLossHourly),
      surgicalLossHourly: Math.round(surgicalLossHourly)
    };
  },

  // 9. CDSS (CLINICAL DECISION SUPPORT SYSTEM) ENGINE
  generateCDSSPlan(params, selectedConditions = []) {
    const w = parseFloat(params.weight) || 70;
    const age = parseFloat(params.age) || 35;
    const gender = params.gender || 'male';
    const weights = this.calcWeights(w, params.height || 170, gender);
    const airway = this.calcAirway(age, params.ageUnit || 'years');

    const redAlerts = [];
    const inductionStrategy = [];
    const maintenanceStrategy = [];
    const airwayStrategy = [];
    const specialPrecautions = [];

    const has = (cond) => selectedConditions.includes(cond);

    // Baseline Induction
    let chosenHypnotic = 'Propofol';
    let chosenHypnoticDose = `${Math.round(weights.ibw * 1.5 - weights.ibw * 2.0)} mg`;
    let chosenRelaxant = 'Rocuronium';
    let chosenRelaxantDose = `${Math.round(weights.ibw * 0.6 * 10) / 10} mg`;

    // Condition: Difficult Airway
    if (has('difficult_airway')) {
      redAlerts.push('تحذير المجرى الصعب: تجنب إعطاء المرخي العضلي قبل التأكد من إمكانية التهوية بالقناع (Cannot Intubate / Cannot Ventilate Risk). جهز منظار الفيديو Video-Laryngoscope ومعدة المجرى الهوائي الجراحي.');
      airwayStrategy.push('استخدام منظار الفيديو (GlideScope / C-MAC) مع بوجي (Bougie) كخيار أول.');
      airwayStrategy.push('النظر في التنبيب بالوعي الكامل (Awake Fiberoptic Intubation) إذا كانت معايير الصعوبة شديدة.');
    }

    // Condition: Full Stomach / Aspiration Risk
    if (has('full_stomach')) {
      redAlerts.push('معدة ممتلئة / خطر ارتداد رئوي عالي: يمنع منعاً باتاً التهوية بالضغط الإيجابي بالماسك قبل التنبيب. استخدم التحريض سريع التسلسل (Rapid Sequence Induction - RSI) حصراً.');
      chosenRelaxant = 'Succinylcholine 1.5 mg/kg أو Rocuronium 1.2 mg/kg';
      chosenRelaxantDose = `${Math.round(w * 1.2)} mg Roc أو ${Math.round(w * 1.5)} mg Sux`;
      airwayStrategy.push('تطبيق مناورة سيليك (Sellick Maneuver / Cricoid Pressure) من قبل مساعد خبير وتجهيز شفاط قوي فوري.');
    }

    // Condition: Severe Cardiac / Hemodynamic Instability / Shock
    if (has('shock') || has('severe_as') || has('heart_failure')) {
      redAlerts.push('عدم استقرار دوراني شديد / تضيق أبهري شديد: البروبوفول ممنوع أو يجب تقليله للحد الأدنى (خطر هبوط ضغط حاد وانهيار دوراني).');
      chosenHypnotic = 'Etomidate (0.2-0.3 mg/kg) أو Ketamine (1-1.5 mg/kg)';
      chosenHypnoticDose = `${Math.round(w * 0.2)} mg Etomidate`;
      specialPrecautions.push('تجهيز رافعات الضغط (Noradrenaline / Ephedrine) متصلة بالكانولا قبل البدء بالحث التخديري.');
    }

    // Condition: Asthma / Severe COPD
    if (has('asthma')) {
      redAlerts.push('ربو قصبي / تشنج قصبي: تجنب الأتراكوريوم (Atracurium) والمورفين لتحريرهما لمادة الهستامين.');
      chosenHypnotic = 'Ketamine أو Propofol (كلاهما موسع قصبي ممتاز)';
      chosenRelaxant = 'Rocuronium أو Cisatracurium';
      maintenanceStrategy.push('استخدام سيفوفلوران (Sevoflurane) كغاز صيانة مفضل لتأثيره الموسع للقصبات.');
    }

    // Condition: Renal Failure
    if (has('renal_failure')) {
      redAlerts.push('عجز كلوي: فحص البوتاسيوم المصلي (Serum K+) قبل إعطاء السكسنيل كولين. إذا كان K+ > 5.0 ممنوع إعطاء السكسنيل كولين قطعياً.');
      chosenRelaxant = 'Cisatracurium (0.15 mg/kg) - يطرح بآلية هوفمان دون الاعتماد على الكلى';
      chosenRelaxantDose = `${Math.round(w * 0.15 * 10) / 10} mg`;
      specialPrecautions.push('تجنب أشباه الأفيون التي تتراكم نواتجها مثل المورفين والبيثيدين، واستخدم الفنتانيل.');
    }

    // Condition: Malignant Hyperthermia Susceptible
    if (has('mh_susceptible')) {
      redAlerts.push('🚨 تأهب فرط الحرارة الخبيث (MH): ممنوع قطعياً استخدام الغازات الاستنشاقية (Sevo/Iso/Des) والسكسنيل كولين! تخدير وريدي تام (TIVA) حصراً مع غسل جهاز التخدير وتوفر الدانترولين.');
      maintenanceStrategy.push('TIVA (Propofol Infusion + Remifentanil/Fentanyl) حصراً بدون أي غاز تبخير.');
    }

    // Default Induction Assembly
    inductionStrategy.push({
      drug: chosenHypnotic,
      dose: chosenHypnoticDose,
      note: 'الحث التنويمي الأساسي'
    });
    inductionStrategy.push({
      drug: chosenRelaxant,
      dose: chosenRelaxantDose,
      note: 'الإرخاء العضلي للتنبيب'
    });
    inductionStrategy.push({
      drug: 'Fentanyl',
      dose: `${Math.round(w * 2.0)} mcg`,
      note: 'التسكين الأولي قبل التنبيب بـ 3 دقائق'
    });

    return {
      patientSummary: { weight: w, ibw: weights.ibw, bmi: weights.bmi, ettSize: airway.cuffedETT },
      redAlerts,
      inductionStrategy,
      maintenanceStrategy,
      airwayStrategy,
      specialPrecautions
    };
  }
};

// Expose globally for browser usage
window.ClinicalEngine = ClinicalEngine;
