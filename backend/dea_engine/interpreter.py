"""
DEA Result Interpreter
Converts numerical DEA results into clear, structured plain-English explanations
suitable for MBA students and faculty at IFHE Hyderabad.
"""

from typing import Any


def interpret_results(results: dict) -> dict:
    """
    Takes the raw output of run_dea() and returns a rich interpretation object
    with overall findings, per-DMU plain English, and teaching insights.
    """
    model = results["model"]
    orientation = results["orientation"]
    scores = results["scores"]
    summary = results["summary"]
    scale_eff = results.get("scale_efficiency")
    n = results["n_dmus"]

    # ── Overall narrative ───────────────────────────────────────────────────
    pct_efficient = round(100 * summary["n_efficient"] / n, 1) if n > 0 else 0
    mean_eff = summary["mean_efficiency"]

    overall_verdict = _overall_verdict(pct_efficient, mean_eff, model)

    # ── Per-DMU interpretation ─────────────────────────────────────────────
    dmu_interpretations = []
    for s_ in scores:
        if s_["status"] != "optimal":
            dmu_interpretations.append({
                "dmu": s_["dmu"],
                "headline": f"{s_['dmu']}: Analysis could not be completed",
                "detail": "The LP solver returned an infeasible solution. Check that all input and output values are positive and non-zero.",
                "action": None,
                "badge": "error"
            })
            continue

        dmu_interpretations.append(
            _interpret_single_dmu(s_, orientation, scale_eff)
        )

    # ── Benchmarking insight ───────────────────────────────────────────────
    efficient_set = summary["efficient_dmus"]
    benchmark_insight = _benchmark_insight(efficient_set, scores)

    # ── Teaching points ────────────────────────────────────────────────────
    teaching_points = _generate_teaching_points(results, scale_eff)

    return {
        "overall": {
            "headline": overall_verdict["headline"],
            "finding": overall_verdict["finding"],
            "mean_efficiency_plain": (
                f"On average, the DMUs in this analysis are operating at "
                f"{round(mean_eff * 100, 1)}% efficiency. This means they could "
                f"{'reduce their inputs by ' + str(round((1 - mean_eff)*100,1)) + '% and still produce the same outputs.' if orientation == 'input' else 'increase their outputs by ' + str(round((1/mean_eff - 1)*100,1)) + '% without using any additional inputs.'}"
                if mean_eff else "Efficiency data not available."
            ),
        },
        "dmu_interpretations": dmu_interpretations,
        "benchmark_insight": benchmark_insight,
        "teaching_points": teaching_points,
        "model_note": _model_note(model, orientation),
    }


# ─── Helpers ────────────────────────────────────────────────────────────────────

def _overall_verdict(pct_efficient: float, mean_eff: float | None, model: str) -> dict:
    if mean_eff is None:
        return {"headline": "Analysis incomplete", "finding": ""}

    if pct_efficient >= 60:
        headline = f"{pct_efficient}% of DMUs are on the efficiency frontier"
        finding = (
            "The majority of units in this sample are performing at best-practice levels. "
            "This could mean: (a) the sample genuinely contains many high performers, "
            "(b) the number of DMUs is small relative to inputs + outputs, causing trivial frontier membership, "
            "or (c) the chosen inputs and outputs don't discriminate well. "
            "Consider adding more variables or increasing the sample size."
        )
    elif pct_efficient >= 30:
        headline = f"{pct_efficient}% of DMUs are efficient — moderate variation detected"
        finding = (
            f"With {round(mean_eff*100,1)}% mean efficiency, there is meaningful variation in the sample. "
            "Some units are clearly outperforming others. The inefficient units have specific, "
            "actionable targets to reach the frontier."
        )
    else:
        headline = f"Significant inefficiency found — only {pct_efficient}% of DMUs are efficient"
        finding = (
            f"The average DMU is operating at only {round(mean_eff*100,1)}% efficiency. "
            "This is a strong finding: considerable resources are being wasted or outputs are "
            "well below their potential. The efficient DMUs define the best-practice frontier "
            "that others should emulate."
        )
    return {"headline": headline, "finding": finding}


def _interpret_single_dmu(s_: dict, orientation: str, scale_eff: dict | None) -> dict:
    dmu = s_["dmu"]
    theta = s_["theta"]
    peers = s_["peers"]
    input_slacks  = s_["input_slacks"]
    output_slacks = s_["output_slacks"]
    input_targets  = s_["input_targets"]
    output_targets = s_["output_targets"]
    input_current  = s_["input_current"]
    output_current = s_["output_current"]

    efficient = theta >= 0.9999

    if efficient:
        headline = f"{dmu} ✓ — On the Efficiency Frontier (Score = 1.000)"
        detail = (
            f"{dmu} is a best-practice unit. It converts its inputs into outputs "
            "as efficiently as any unit in this sample. It may serve as a benchmark "
            "for other DMUs to emulate."
        )
        # Check for weak efficiency (slacks exist even though theta=1)
        total_slack = sum(v for v in input_slacks.values()) + sum(v for v in output_slacks.values())
        if total_slack > 0.01:
            detail += (
                f" However, {dmu} has non-zero slacks, making it only weakly efficient. "
                "It can improve further by eliminating these slacks without changing its efficiency score."
            )
        action = None
        badge = "efficient"
    else:
        pct_inefficient = round((1 - theta) * 100, 1)
        headline = f"{dmu} — Score {round(theta, 3)} ({pct_inefficient}% inefficient)"

        if orientation == "input":
            detail = (
                f"{dmu} is operating at {round(theta*100, 1)}% efficiency. "
                f"It is using {pct_inefficient}% more inputs than necessary to produce its current outputs. "
            )
        else:
            phi = 1 / theta if theta > 0 else None
            output_gap = round((phi - 1) * 100, 1) if phi else 0
            detail = (
                f"{dmu} is operating at {round(theta*100, 1)}% efficiency. "
                f"It could increase its outputs by {output_gap}% without using any additional inputs. "
            )

        # Peer comparison
        if peers:
            peer_names = ", ".join(p["dmu"] for p in peers[:3])
            detail += f"Its benchmark peers are: {peer_names}. "

        # Specific improvement targets
        improvements = []
        for inp, target in input_targets.items():
            current = input_current.get(inp, 0)
            if current > 0:
                reduction = round(((current - target) / current) * 100, 1)
                if reduction > 0.5:
                    improvements.append(
                        f"Reduce {inp} from {round(current, 2)} to {round(target, 2)} "
                        f"(save {reduction}%)"
                    )
        for out, target in output_targets.items():
            current = output_current.get(out, 0)
            if target > current + 0.01:
                increase = round(((target - current) / current) * 100, 1) if current > 0 else 0
                improvements.append(
                    f"Increase {out} from {round(current, 2)} to {round(target, 2)} "
                    f"(improve by {increase}%)"
                )

        action = improvements if improvements else None
        badge = "inefficient_high" if theta >= 0.8 else "inefficient_low"

    # Scale efficiency note (BCC model)
    scale_note = None
    if scale_eff and dmu in scale_eff:
        se_data = scale_eff[dmu]
        se = se_data.get("SE")
        ote = se_data.get("OTE_CCR")
        pte = se_data.get("PTE_BCC")
        if se is not None:
            if se >= 0.9999:
                scale_note = f"{dmu} is operating at its most productive scale (Scale Efficiency = 1.0)."
            elif ote and pte and ote < pte:
                scale_note = (
                    f"Scale Efficiency = {round(se, 3)}. "
                    f"Pure technical efficiency (BCC) = {round(pte, 3)} but overall efficiency (CCR) = {round(ote, 3)}. "
                    f"{dmu}'s inefficiency is partly due to operating at a non-optimal scale — it may be too small (IRS) or too large (DRS)."
                )
            else:
                scale_note = f"Scale Efficiency = {round(se, 3)}."

    return {
        "dmu": dmu,
        "headline": headline,
        "detail": detail,
        "action": action,
        "scale_note": scale_note,
        "badge": badge,
        "score": round(theta, 4),
        "peers": peers,
        "input_slacks":  input_slacks,
        "output_slacks": output_slacks,
        "input_targets":  input_targets,
        "output_targets": output_targets,
    }


def _benchmark_insight(efficient_set: list[str], scores: list[dict]) -> dict:
    if not efficient_set:
        return {
            "headline": "No efficient DMUs found",
            "text": "No unit achieved a score of 1.0. Consider checking data quality or expanding the sample."
        }

    # Count how many times each efficient DMU appears as a peer
    peer_counts: dict[str, int] = {}
    for s_ in scores:
        for p in s_.get("peers", []):
            peer_counts[p["dmu"]] = peer_counts.get(p["dmu"], 0) + 1

    if peer_counts:
        top_peers = sorted(peer_counts.items(), key=lambda x: -x[1])
        dominant = top_peers[0][0]
        dominant_count = top_peers[0][1]
        text = (
            f"Among the {len(efficient_set)} efficient DMU(s), "
            f"<strong>{dominant}</strong> is the most influential benchmark — "
            f"it appears as a peer for {dominant_count} other unit(s). "
            "This makes it the most representative 'best practice' example in this dataset. "
            "Inefficient units should study its operations most closely."
        )
    else:
        text = (
            f"The following DMUs are on the efficiency frontier: "
            f"{', '.join(efficient_set)}. They define the best-practice standard for this sample."
        )

    return {"headline": f"Best-practice benchmarks: {', '.join(efficient_set)}", "text": text}


def _generate_teaching_points(results: dict, scale_eff: dict | None) -> list[dict]:
    points = []
    scores = results["scores"]
    model = results["model"]
    summary = results["summary"]

    # Point 1: What theta means
    points.append({
        "title": "How to read the efficiency score (θ)",
        "text": (
            "A score of 1.0 means the DMU lies on the efficiency frontier — it is best-practice. "
            "A score of 0.75, for example, means the DMU uses 25% more inputs than necessary "
            "to produce its given outputs (input-oriented interpretation). "
            "Crucially, this is a <em>relative</em> measure — it compares each DMU to the best performers in <em>this</em> sample, not to some global standard."
        ),
        "icon": "target"
    })

    # Point 2: What lambda means
    points.append({
        "title": "What the λ (lambda) weights tell us",
        "text": (
            "For each inefficient DMU, the LP finds a weighted combination of efficient peers "
            "(the λ values) that produces at least as much output using fewer inputs. "
            "These weights show which efficient units the inefficient one should benchmark against, "
            "and in what proportion. A λ weight of 0.5 for Peer A means 'half of Peer A's operations "
            "serve as the reference for this DMU'."
        ),
        "icon": "scale"
    })

    # Point 3: Sample size warning if needed
    n = results["n_dmus"]
    m = results["n_inputs"]
    s = results["n_outputs"]
    if n < 3 * (m + s):
        points.append({
            "title": "⚠️ Sample size consideration",
            "text": (
                f"This analysis has {n} DMUs and {m+s} variables (inputs + outputs). "
                f"The recommended minimum is n ≥ 3 × (m + s) = {3*(m+s)}. "
                "With a small sample, many DMUs may score 1.0 trivially — not because they are "
                "genuinely efficient, but because there are not enough peers to constrain them. "
                "Interpret efficiency scores cautiously."
            ),
            "icon": "warning"
        })

    # Point 4: CCR vs BCC
    if model == "BCC" and scale_eff:
        se_values = [v["SE"] for v in scale_eff.values() if v.get("SE") is not None]
        if se_values:
            mean_se = round(sum(se_values) / len(se_values), 3)
            points.append({
                "title": f"Scale efficiency: average = {mean_se}",
                "text": (
                    f"The BCC model separates <strong>Pure Technical Efficiency (PTE)</strong> "
                    f"from <strong>Scale Efficiency (SE)</strong>. "
                    f"SE = CCR score ÷ BCC score. An SE of {mean_se} means that on average, "
                    f"{round((1-mean_se)*100, 1)}% of any overall inefficiency is due to operating at the "
                    "wrong scale — the DMU is either too small (Increasing Returns to Scale) or "
                    "too large (Decreasing Returns to Scale) relative to its most productive scale size."
                ),
                "icon": "resize"
            })

    # Point 5: Two-stage improvement
    dmus_with_slack = [
        s_["dmu"] for s_ in scores
        if s_["status"] == "optimal" and not s_.get("efficient") and
        (sum(s_["input_slacks"].values()) + sum(s_["output_slacks"].values())) > 0.01
    ]
    if dmus_with_slack:
        points.append({
            "title": "Two-stage improvement: radial reduction + slack elimination",
            "text": (
                "DEA improvement happens in two stages. First, all inputs are proportionally "
                "reduced by (1 − θ) — this is the radial contraction. Second, any remaining "
                "input slacks or output shortfalls are addressed. The final target = radial target − input slack. "
                f"DMUs with non-zero slacks after radial contraction: {', '.join(dmus_with_slack)}."
            ),
            "icon": "steps"
        })

    return points


def _model_note(model: str, orientation: str) -> str:
    if model == "CCR":
        note = (
            "<strong>CCR Model (Charnes, Cooper & Rhodes, 1978)</strong> assumes Constant Returns to Scale (CRS). "
            "Every doubling of inputs should exactly double outputs. Best suited when all DMUs operate at a similar, "
            "optimal scale. "
        )
    else:
        note = (
            "<strong>BCC Model (Banker, Charnes & Cooper, 1984)</strong> assumes Variable Returns to Scale (VRS). "
            "It allows each DMU to be compared only against others of similar scale. "
            "This is almost always more appropriate when DMUs vary significantly in size. "
        )
    if orientation == "input":
        note += "The <strong>input orientation</strong> asks: 'How much can inputs be reduced while maintaining current output levels?'"
    else:
        note += "The <strong>output orientation</strong> asks: 'How much can outputs be expanded while keeping inputs fixed?'"
    return note


# ─── Malmquist interpretation ───────────────────────────────────────────────────

def interpret_malmquist(results: dict) -> dict:
    mpi_results = results["results"]
    summary = results["summary"]

    dmu_interpretations = []
    for r in mpi_results:
        dmu = r["dmu"]
        mpi = r["MPI"]
        ec  = r["EC"]
        tc  = r["TC"]

        if mpi is None:
            dmu_interpretations.append({
                "dmu": dmu,
                "headline": f"{dmu}: Could not compute MPI",
                "detail": "Insufficient data for one of the cross-period LPs.",
            })
            continue

        change = r["productivity_change"]
        headline = (
            f"{dmu} — MPI = {round(mpi,3)} "
            f"({'productivity improved ↑' if change == 'improved' else 'productivity declined ↓' if change == 'declined' else 'productivity unchanged →'})"
        )

        detail_parts = []
        if ec:
            if ec > 1:
                detail_parts.append(f"Efficiency Change (EC = {round(ec,3)}): {dmu} caught up to the frontier — it is using resources more efficiently than in the previous period.")
            elif ec < 1:
                detail_parts.append(f"Efficiency Change (EC = {round(ec,3)}): {dmu} fell further behind the frontier — a relative efficiency decline.")
            else:
                detail_parts.append(f"Efficiency Change (EC = 1.0): No change in relative efficiency.")

        if tc:
            if tc > 1:
                detail_parts.append(f"Technical Change (TC = {round(tc,3)}): The efficiency frontier shifted outward — technological progress occurred. Best practice improved.")
            elif tc < 1:
                detail_parts.append(f"Technical Change (TC = {round(tc,3)}): The frontier regressed — best practice worsened in this period.")
            else:
                detail_parts.append("Technical Change (TC = 1.0): No shift in the efficiency frontier.")

        dmu_interpretations.append({
            "dmu": dmu,
            "headline": headline,
            "detail": " ".join(detail_parts),
            "MPI": mpi,
            "EC": ec,
            "TC": tc,
        })

    # Overall
    mean_mpi = summary.get("mean_MPI")
    mean_ec  = summary.get("mean_EC")
    mean_tc  = summary.get("mean_TC")

    overall = (
        f"On average, total factor productivity {'improved' if mean_mpi and mean_mpi > 1 else 'declined'} "
        f"(mean MPI = {round(mean_mpi,3) if mean_mpi else 'N/A'}). "
        f"This is driven by "
        f"{'efficiency gains (EC = ' + str(round(mean_ec,3)) + ') and ' if mean_ec and mean_ec > 1 else ''}"
        f"{'technological progress (TC = ' + str(round(mean_tc,3)) + ')' if mean_tc and mean_tc > 1 else 'no significant technology improvement'}."
    )

    return {
        "overall": overall,
        "dmu_interpretations": dmu_interpretations,
        "summary": summary,
    }
