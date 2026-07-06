"""
DEA Computation Engine
Supports: CCR (CRS), BCC (VRS) — input + output oriented
Provides: efficiency scores, lambda weights, slacks, targets, scale efficiency
Also: Malmquist Productivity Index (two periods)
Solver: scipy.optimize.linprog (simplex method)
"""

import numpy as np
from scipy.optimize import linprog
from typing import Optional
import warnings
warnings.filterwarnings("ignore")


# ─── Single DMU LP ─────────────────────────────────────────────────────────────

def _solve_dmu_input_oriented(
    x0: np.ndarray,   # inputs of DMU under evaluation (m,)
    y0: np.ndarray,   # outputs of DMU under evaluation (s,)
    X: np.ndarray,    # input matrix (n, m)
    Y: np.ndarray,    # output matrix (n, s)
    vrs: bool = False
) -> dict:
    """
    Input-oriented DEA LP for a single DMU.
    Minimise theta subject to:
        X'λ ≤ theta * x0      (input constraints)
        Y'λ ≥ y0              (output constraints)
        λ ≥ 0
        sum(λ) = 1  if vrs=True  (BCC convexity)
    Returns: theta, lambda, input_slacks, output_slacks, status
    """
    n, m = X.shape
    s = Y.shape[1]

    # Variables: [theta, lambda_1, ..., lambda_n]  → n+1 vars
    # Objective: minimise theta
    c = np.zeros(n + 1)
    c[0] = 1.0  # theta is variable index 0

    # ── Inequality constraints A_ub @ x <= b_ub ────────────────────────────
    # 1) Input constraints:  X' λ - theta * x0 ≤ 0
    #    → for each input i:  sum_j(X[j,i]*λ[j]) - x0[i]*theta ≤ 0
    # 2) Output constraints: -Y' λ ≤ -y0
    #    → for each output r: -sum_j(Y[j,r]*λ[j]) ≤ -y0[r]

    # Row i (input):   [-x0[i],  X[0,i],  X[1,i],  ...,  X[n-1,i]]
    A_inputs = np.hstack([-x0.reshape(-1, 1), X.T])  # (m, n+1)

    # Row r (output):  [0,  -Y[0,r], -Y[1,r], ..., -Y[n-1,r]]
    A_outputs = np.hstack([np.zeros((s, 1)), -Y.T])  # (s, n+1)

    A_ub = np.vstack([A_inputs, A_outputs])
    b_ub = np.concatenate([np.zeros(m), -y0])

    # ── Equality constraints (BCC only) ────────────────────────────────────
    if vrs:
        # sum(λ) = 1  →  [0, 1, 1, ..., 1] @ x = 1
        A_eq = np.zeros((1, n + 1))
        A_eq[0, 1:] = 1.0
        b_eq = np.array([1.0])
    else:
        A_eq = None
        b_eq = None

    # ── Bounds ─────────────────────────────────────────────────────────────
    # theta: [0, 1] for stability; lambda: [0, ∞)
    bounds = [(0, 1.0)] + [(0, None)] * n

    result = linprog(
        c,
        A_ub=A_ub, b_ub=b_ub,
        A_eq=A_eq, b_eq=b_eq,
        bounds=bounds,
        method="highs"
    )

    if result.status not in [0, 3]:
        return {"status": "infeasible", "theta": None}

    theta = float(result.x[0])
    lam = result.x[1:]

    # ── Slack calculation ───────────────────────────────────────────────────
    # Input slacks:  s_i^- = theta*x0_i - sum_j(lambda_j * X_j_i)
    input_slacks = theta * x0 - X.T @ lam  # (m,)
    input_slacks = np.maximum(input_slacks, 0)

    # Output slacks: s_r^+ = sum_j(lambda_j * Y_j_r) - y0_r
    output_slacks = Y.T @ lam - y0          # (s,)
    output_slacks = np.maximum(output_slacks, 0)

    return {
        "status": "optimal",
        "theta": round(theta, 6),
        "lambda": lam,
        "input_slacks": input_slacks,
        "output_slacks": output_slacks,
    }


def _solve_dmu_output_oriented(
    x0: np.ndarray,
    y0: np.ndarray,
    X: np.ndarray,
    Y: np.ndarray,
    vrs: bool = False
) -> dict:
    """
    Output-oriented DEA LP: Maximise phi (= 1/efficiency) subject to:
        X'λ ≤ x0
        Y'λ ≥ phi * y0
        λ ≥ 0
    We minimise -phi for linprog.
    """
    n, m = X.shape
    s = Y.shape[1]

    # Variables: [phi, lambda_1, ..., lambda_n]
    c = np.zeros(n + 1)
    c[0] = -1.0  # maximise phi = minimise -phi

    # Input constraints: X'λ ≤ x0
    A_inputs = np.hstack([np.zeros((m, 1)), X.T])  # (m, n+1)

    # Output constraints: -Y'λ + phi*y0 ≤ 0
    A_outputs = np.hstack([y0.reshape(-1, 1), -Y.T])  # (s, n+1)

    A_ub = np.vstack([A_inputs, A_outputs])
    b_ub = np.concatenate([x0, np.zeros(s)])

    if vrs:
        A_eq = np.zeros((1, n + 1))
        A_eq[0, 1:] = 1.0
        b_eq = np.array([1.0])
    else:
        A_eq = None
        b_eq = None

    bounds = [(1, None)] + [(0, None)] * n

    result = linprog(c, A_ub=A_ub, b_ub=b_ub, A_eq=A_eq, b_eq=b_eq,
                     bounds=bounds, method="highs")

    if result.status not in [0, 3]:
        return {"status": "infeasible", "theta": None}

    phi = float(result.x[0])
    lam = result.x[1:]
    theta = round(1.0 / phi, 6) if phi > 0 else 0.0

    input_slacks  = x0 - X.T @ lam
    output_slacks = Y.T @ lam - phi * y0
    input_slacks  = np.maximum(input_slacks, 0)
    output_slacks = np.maximum(output_slacks, 0)

    return {
        "status": "optimal",
        "theta": theta,
        "phi": round(phi, 6),
        "lambda": lam,
        "input_slacks": input_slacks,
        "output_slacks": output_slacks,
    }


# ─── Full DEA Run ───────────────────────────────────────────────────────────────

def run_dea(
    dmu_names: list[str],
    X: np.ndarray,           # (n, m)
    Y: np.ndarray,           # (n, s)
    input_names: list[str],
    output_names: list[str],
    model: str = "CCR",      # "CCR" | "BCC"
    orientation: str = "input"  # "input" | "output"
) -> dict:
    """
    Run DEA for all DMUs. Returns structured results ready for the API.
    """
    n, m = X.shape
    s = Y.shape[1]
    vrs = (model.upper() == "BCC")

    scores = []
    for i in range(n):
        x0 = X[i]
        y0 = Y[i]

        if orientation == "input":
            res = _solve_dmu_input_oriented(x0, y0, X, Y, vrs)
        else:
            res = _solve_dmu_output_oriented(x0, y0, X, Y, vrs)

        if res["status"] != "optimal":
            scores.append({
                "dmu": dmu_names[i],
                "status": "infeasible",
                "theta": None
            })
            continue

        theta = res["theta"]
        lam = res["lambda"]
        input_slacks  = res["input_slacks"]
        output_slacks = res["output_slacks"]

        # Target values
        input_targets  = [round(x0[k] * theta - input_slacks[k], 4) for k in range(m)]
        output_targets = [round(y0[r] + output_slacks[r], 4) for r in range(s)]

        # Peer DMUs (non-zero lambdas)
        peers = [
            {"dmu": dmu_names[j], "weight": round(float(lam[j]), 4)}
            for j in range(n) if lam[j] > 0.001
        ]

        scores.append({
            "dmu": dmu_names[i],
            "status": "optimal",
            "theta": theta,
            "efficient": theta >= 0.9999,
            "lambda": {dmu_names[j]: round(float(lam[j]), 4) for j in range(n)},
            "peers": peers,
            "input_slacks": {input_names[k]: round(float(input_slacks[k]), 4) for k in range(m)},
            "output_slacks": {output_names[r]: round(float(output_slacks[r]), 4) for r in range(s)},
            "input_targets": {input_names[k]: input_targets[k] for k in range(m)},
            "output_targets": {output_names[r]: output_targets[r] for r in range(s)},
            "input_current": {input_names[k]: round(float(x0[k]), 4) for k in range(m)},
            "output_current": {output_names[r]: round(float(y0[r]), 4) for r in range(s)},
        })

    # Compute scale efficiency if both CCR and BCC are possible
    se_results = None
    if model.upper() == "BCC":
        # Re-run CCR to get OTE for scale efficiency
        ccr_scores = []
        for i in range(n):
            r = _solve_dmu_input_oriented(X[i], Y[i], X, Y, vrs=False)
            ccr_scores.append(r.get("theta", 1.0) or 1.0)
        bcc_scores = [s_["theta"] or 1.0 for s_ in scores]
        se_results = {
            dmu_names[i]: {
                "OTE_CCR": round(ccr_scores[i], 4),
                "PTE_BCC": round(bcc_scores[i], 4),
                "SE": round(ccr_scores[i] / bcc_scores[i], 4) if bcc_scores[i] > 0 else None
            }
            for i in range(n)
        }

    # Summary statistics
    valid_scores = [s_["theta"] for s_ in scores if s_["theta"] is not None]
    efficient_dmus = [s_["dmu"] for s_ in scores if s_.get("efficient")]
    inefficient_dmus = [s_["dmu"] for s_ in scores if s_["theta"] is not None and not s_.get("efficient")]

    return {
        "model": model.upper(),
        "orientation": orientation,
        "n_dmus": n,
        "n_inputs": m,
        "n_outputs": s,
        "dmu_names": dmu_names,
        "input_names": input_names,
        "output_names": output_names,
        "scores": scores,
        "scale_efficiency": se_results,
        "summary": {
            "mean_efficiency": round(float(np.mean(valid_scores)), 4) if valid_scores else None,
            "min_efficiency": round(float(np.min(valid_scores)), 4) if valid_scores else None,
            "max_efficiency": round(float(np.max(valid_scores)), 4) if valid_scores else None,
            "n_efficient": len(efficient_dmus),
            "n_inefficient": len(inefficient_dmus),
            "efficient_dmus": efficient_dmus,
            "inefficient_dmus": inefficient_dmus,
        }
    }


# ─── Malmquist Productivity Index ──────────────────────────────────────────────

def run_malmquist(
    dmu_names: list[str],
    X1: np.ndarray, Y1: np.ndarray,  # period 1
    X2: np.ndarray, Y2: np.ndarray,  # period 2
    input_names: list[str],
    output_names: list[str],
) -> dict:
    """
    Malmquist Productivity Index between two periods.
    MPI = EC × TC
    EC = efficiency change (catching up)
    TC = technology change (frontier shift)
    """
    n = len(dmu_names)
    results = []

    for i in range(n):
        # D_t(x_t, y_t): efficiency under period-t frontier at period-t data
        r_tt = _solve_dmu_input_oriented(X1[i], Y1[i], X1, Y1, vrs=False)
        # D_{t+1}(x_{t+1}, y_{t+1}): efficiency under t+1 frontier at t+1 data
        r_t1t1 = _solve_dmu_input_oriented(X2[i], Y2[i], X2, Y2, vrs=False)
        # D_t(x_{t+1}, y_{t+1}): efficiency under period-t frontier at t+1 data
        r_tt1 = _solve_dmu_input_oriented(X2[i], Y2[i], X1, Y1, vrs=False)
        # D_{t+1}(x_t, y_t): efficiency under t+1 frontier at t data
        r_t1t = _solve_dmu_input_oriented(X1[i], Y1[i], X2, Y2, vrs=False)

        d_tt   = r_tt.get("theta") or 1.0
        d_t1t1 = r_t1t1.get("theta") or 1.0
        d_tt1  = r_tt1.get("theta") or 1.0
        d_t1t  = r_t1t.get("theta") or 1.0

        # Efficiency change = D_{t+1}(x_{t+1},y_{t+1}) / D_t(x_t,y_t)
        ec = (d_t1t1 / d_tt) if d_tt > 0 else None
        # Technical change = geometric mean
        tc_inner = (d_tt1 / d_t1t1) * (d_tt / d_t1t) if (d_t1t1 > 0 and d_t1t > 0) else None
        tc = float(np.sqrt(tc_inner)) if tc_inner and tc_inner > 0 else None
        mpi = ec * tc if (ec and tc) else None

        results.append({
            "dmu": dmu_names[i],
            "d_tt":    round(d_tt, 4),
            "d_t1t1":  round(d_t1t1, 4),
            "EC":      round(ec, 4) if ec else None,
            "TC":      round(tc, 4) if tc else None,
            "MPI":     round(mpi, 4) if mpi else None,
            "productivity_change": (
                "improved" if mpi and mpi > 1
                else "declined" if mpi and mpi < 1
                else "unchanged"
            ),
            "catching_up":  "yes" if ec and ec > 1 else "no" if ec else "unknown",
            "frontier_shift": "outward" if tc and tc > 1 else "inward" if tc and tc < 1 else "stable",
        })

    valid_mpi = [r["MPI"] for r in results if r["MPI"]]
    return {
        "results": results,
        "summary": {
            "mean_MPI": round(float(np.mean(valid_mpi)), 4) if valid_mpi else None,
            "mean_EC":  round(float(np.mean([r["EC"] for r in results if r["EC"]])), 4),
            "mean_TC":  round(float(np.mean([r["TC"] for r in results if r["TC"]])), 4),
        }
    }
