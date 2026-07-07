/**
 * DEA Result Interpreter — JavaScript port of the Python interpreter.
 * Converts numerical results into plain-English explanations.
 */

export function interpretResults(results) {
  const { model, orientation, scores, summary, scale_efficiency: scaleEff } = results;
  const n = results.n_dmus;
  const pctEfficient = n > 0 ? Math.round(100 * summary.n_efficient / n * 10) / 10 : 0;
  const meanEff = summary.mean_efficiency;

  const overall = overallVerdict(pctEfficient, meanEff, orientation);
  const dmuInterpretations = scores.map(s => interpretSingleDMU(s, orientation, scaleEff));
  const benchmarkInsight  = benchmarkInsight_(summary.efficient_dmus, scores);
  const teachingPoints    = generateTeachingPoints(results, scaleEff);
  const modelNote         = getModelNote(model, orientation);

  return { overall, dmu_interpretations: dmuInterpretations, benchmark_insight: benchmarkInsight, teaching_points: teachingPoints, model_note: modelNote };
}

function overallVerdict(pctEfficient, meanEff, orientation) {
  if (meanEff == null) return { headline: 'Analysis incomplete', finding: '' };

  const meanPct = Math.round(meanEff * 1000) / 10;
  const wastePct = Math.round((1 - meanEff) * 1000) / 10;
  const gainPct  = wastePct;

  const meanPlain = meanEff
    ? `On average, the DMUs are operating at ${meanPct}% efficiency. ` +
      (orientation === 'input'
        ? `They could reduce their inputs by ${wastePct}% and still produce the same outputs.`
        : `They could increase their outputs by ${gainPct}% without using any additional inputs.`)
    : '';

  if (pctEfficient >= 60) return {
    headline: `${pctEfficient}% of DMUs are on the efficiency frontier`,
    finding: 'The majority of units are performing at best-practice levels. With a small sample this may reflect that inputs+outputs outnumber DMUs — consider adding more units or fewer variables.',
    mean_efficiency_plain: meanPlain,
  };
  if (pctEfficient >= 30) return {
    headline: `${pctEfficient}% of DMUs are efficient — moderate variation detected`,
    finding: `With ${meanPct}% mean efficiency there is meaningful variation. Some units clearly outperform others. Inefficient units have specific, actionable targets.`,
    mean_efficiency_plain: meanPlain,
  };
  return {
    headline: `Significant inefficiency — only ${pctEfficient}% of DMUs are efficient`,
    finding: `The average DMU operates at only ${meanPct}% efficiency. Considerable resources are being wasted relative to best-practice peers.`,
    mean_efficiency_plain: meanPlain,
  };
}

function interpretSingleDMU(s, orientation, scaleEff) {
  if (s.status !== 'optimal') return { dmu: s.dmu, headline: `${s.dmu}: analysis incomplete`, detail: 'LP solver could not find a solution. Check data is positive and non-zero.', badge: 'error', score: null };

  const { dmu, theta, efficient, peers, input_slacks, output_slacks, input_targets, output_targets, input_current, output_current } = s;
  const pctInefficent = Math.round((1 - theta) * 1000) / 10;

  let headline, detail, action, badge;

  if (efficient) {
    headline = `${dmu} ✓ — On the Efficiency Frontier (Score = 1.000)`;
    const totalSlack = Object.values(input_slacks || {}).reduce((a,v) => a+v, 0) + Object.values(output_slacks || {}).reduce((a,v) => a+v, 0);
    detail = `${dmu} is a best-practice unit — it converts its inputs into outputs as efficiently as any unit in this sample.` +
      (totalSlack > 0.01 ? ` However, non-zero slacks mean it is only weakly efficient and can still improve along the frontier.` : '');
    action = null; badge = 'efficient';
  } else {
    headline = `${dmu} — Score ${Math.round(theta * 1000) / 1000} (${pctInefficent}% inefficient)`;
    detail = orientation === 'input'
      ? `${dmu} is using ${pctInefficent}% more inputs than necessary to produce its current outputs. `
      : `${dmu} could expand its outputs by ${Math.round((1/theta - 1)*1000)/10}% without any additional inputs. `;
    if (peers?.length) detail += `Benchmark peers: ${peers.slice(0,3).map(p=>p.dmu).join(', ')}.`;

    action = [];
    for (const [k, target] of Object.entries(input_targets || {})) {
      const cur = input_current?.[k] || 0;
      const reduction = cur > 0 ? Math.round(((cur - target) / cur) * 1000) / 10 : 0;
      if (reduction > 0.5) action.push(`Reduce ${k} from ${round2(cur)} to ${round2(target)} (save ${reduction}%)`);
    }
    for (const [k, target] of Object.entries(output_targets || {})) {
      const cur = output_current?.[k] || 0;
      if (target > cur + 0.01) {
        const inc = cur > 0 ? Math.round(((target - cur) / cur) * 1000) / 10 : 0;
        action.push(`Increase ${k} from ${round2(cur)} to ${round2(target)} (improve by ${inc}%)`);
      }
    }
    badge = theta >= 0.8 ? 'inefficient_high' : 'inefficient_low';
  }

  let scaleNote = null;
  if (scaleEff?.[dmu]) {
    const { SE, OTE_CCR, PTE_BCC } = scaleEff[dmu];
    if (SE >= 0.9999) scaleNote = `${dmu} operates at its most productive scale (SE = 1.0).`;
    else scaleNote = `Scale Efficiency = ${round3(SE)}. Pure technical efficiency (BCC) = ${round3(PTE_BCC)}, overall (CCR) = ${round3(OTE_CCR)}. The gap indicates scale inefficiency — ${dmu} may be operating at a non-optimal scale.`;
  }

  return { dmu, headline, detail, action, scale_note: scaleNote, badge, score: Math.round(theta * 10000) / 10000, peers, input_slacks, output_slacks, input_targets, output_targets, input_current, output_current };
}

function benchmarkInsight_(efficientSet, scores) {
  if (!efficientSet?.length) return { headline: 'No efficient DMUs found', text: 'No unit achieved a score of 1.0. Check data quality or expand the sample.' };

  const peerCounts = {};
  for (const s of scores) {
    for (const p of s.peers || []) peerCounts[p.dmu] = (peerCounts[p.dmu] || 0) + 1;
  }

  const top = Object.entries(peerCounts).sort((a,b) => b[1]-a[1])[0];
  const text = top
    ? `Among the ${efficientSet.length} efficient DMU(s), <strong>${top[0]}</strong> is the most influential benchmark — appearing as a peer for ${top[1]} other unit(s). Inefficient units should study its operations most closely.`
    : `Efficient DMUs: ${efficientSet.join(', ')}. They define the best-practice standard for this sample.`;

  return { headline: `Best-practice benchmarks: ${efficientSet.join(', ')}`, text };
}

function generateTeachingPoints(results, scaleEff) {
  const points = [];
  const { scores, model, n_dmus: n, n_inputs: m, n_outputs: s } = results;

  points.push({
    title: 'How to read the efficiency score (θ)',
    text: 'A score of 1.0 means the DMU lies on the efficiency frontier — it is best-practice. A score of 0.75 means the DMU uses 25% more inputs than necessary to produce its given outputs (input-oriented). Crucially, this is a <em>relative</em> measure — it compares each DMU to the best performers in <em>this</em> sample, not to some global standard.',
    icon: 'target',
  });

  points.push({
    title: 'What the λ (lambda) weights tell us',
    text: 'For each inefficient DMU, the LP finds a weighted combination of efficient peers (λ values) that produces at least as much output using fewer inputs. These weights show which efficient units to benchmark against. A λ weight of 0.5 for Peer A means half of Peer A\'s operations serve as the reference.',
    icon: 'scale',
  });

  if (n < 3 * (m + s)) points.push({
    title: '⚠️ Sample size consideration',
    text: `This analysis has ${n} DMUs and ${m+s} variables. The recommended minimum is n ≥ 3×(m+s) = ${3*(m+s)}. With a small sample, many DMUs may score 1.0 trivially — not because they are genuinely efficient, but because there are not enough peers to constrain them.`,
    icon: 'warning',
  });

  if (model === 'BCC' && scaleEff) {
    const seVals = Object.values(scaleEff).map(v => v.SE).filter(Boolean);
    if (seVals.length) {
      const meanSE = Math.round(seVals.reduce((a,v)=>a+v,0)/seVals.length*1000)/1000;
      points.push({
        title: `Scale efficiency: average = ${meanSE}`,
        text: `The BCC model separates <strong>Pure Technical Efficiency (PTE)</strong> from <strong>Scale Efficiency (SE)</strong>. SE = CCR score ÷ BCC score. An SE of ${meanSE} means ${Math.round((1-meanSE)*100,1)}% of overall inefficiency is due to operating at the wrong scale — either too small (IRS) or too large (DRS).`,
        icon: 'resize',
      });
    }
  }

  const withSlack = scores.filter(s => s.status === 'optimal' && !s.efficient &&
    (Object.values(s.input_slacks||{}).reduce((a,v)=>a+v,0) + Object.values(s.output_slacks||{}).reduce((a,v)=>a+v,0)) > 0.01
  );
  if (withSlack.length) points.push({
    title: 'Two-stage improvement: radial reduction + slack elimination',
    text: `DEA improvement happens in two stages. First, all inputs are proportionally reduced by (1 − θ) — the radial contraction. Second, remaining input slacks or output shortfalls are addressed individually. Final target = radial target − input slack. DMUs with non-zero slacks: ${withSlack.map(s=>s.dmu).join(', ')}.`,
    icon: 'steps',
  });

  return points;
}

function getModelNote(model, orientation) {
  const modelText = model === 'CCR'
    ? '<strong>CCR Model (Charnes, Cooper & Rhodes, 1978)</strong> assumes Constant Returns to Scale (CRS). Best when all DMUs operate at a similar, optimal scale.'
    : '<strong>BCC Model (Banker, Charnes & Cooper, 1984)</strong> assumes Variable Returns to Scale (VRS). Appropriate when DMUs vary significantly in size.';
  const orientText = orientation === 'input'
    ? "The <strong>input orientation</strong> asks: 'How much can inputs be reduced while maintaining current output levels?'"
    : "The <strong>output orientation</strong> asks: 'How much can outputs be expanded while keeping inputs fixed?'";
  return `${modelText} ${orientText}`;
}

export function interpretMalmquist(results) {
  const { results: rs, summary } = results;
  const dmuInterpretations = rs.map(r => {
    if (!r.MPI) return { dmu: r.dmu, headline: `${r.dmu}: Could not compute MPI`, detail: 'Insufficient data.' };
    const dir = r.productivity_change === 'improved' ? '↑' : r.productivity_change === 'declined' ? '↓' : '→';
    const headline = `${r.dmu} — MPI = ${r.MPI} (productivity ${r.productivity_change} ${dir})`;
    const parts = [];
    if (r.EC) parts.push(r.EC > 1 ? `EC = ${r.EC}: ${r.dmu} caught up to the frontier (efficiency improvement).` : `EC = ${r.EC}: ${r.dmu} fell further behind the frontier.`);
    if (r.TC) parts.push(r.TC > 1 ? `TC = ${r.TC}: The frontier shifted outward — technological progress.` : `TC = ${r.TC}: The frontier regressed.`);
    return { dmu: r.dmu, headline, detail: parts.join(' '), MPI: r.MPI, EC: r.EC, TC: r.TC };
  });

  const mn = summary.mean_MPI;
  const overall = `On average, total factor productivity ${mn > 1 ? 'improved' : 'declined'} (mean MPI = ${mn}). ` +
    `Driven by efficiency change (EC = ${summary.mean_EC}) and technology change (TC = ${summary.mean_TC}).`;

  return { overall, dmu_interpretations: dmuInterpretations, summary };
}

function round2(v) { return Math.round(v * 100) / 100; }
function round3(v) { return Math.round(v * 1000) / 1000; }
