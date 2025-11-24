<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Student Grader</title>
  <style>
    body { background-color: #1a1a2e; color: #cbd5e1; font-family: Arial, sans-serif; padding: 20px; }
    input, button, select { padding: 8px; margin: 4px; border-radius: 6px; border: none; }
    input[type="number"] { width: 80px; }
    button { background: #7f3fbf; color: white; cursor: pointer; }
    .result { margin-top: 20px; padding: 12px; background: #16213e; border-radius: 8px; }
    .row { display:flex; gap:12px; flex-wrap:wrap; align-items:center; }
    label { display:flex; gap:6px; align-items:center; }
    .muted { color: #9aa7bd; font-size: 0.9em; }
    .bar { height: 12px; background:#2b2f4a; border-radius:6px; overflow:hidden; margin-top:6px; }
    .bar > i { display:block; height:100%; background:#7f3fbf; }
  </style>
</head>
<body>
  <h1>Student Grader</h1>

  <div class="row">
    <label>Quiz 1: <input id="q1" type="number" value="0" min="0" max="100" /></label>
    <label>Quiz 2: <input id="q2" type="number" value="0" min="0" max="100" /></label>
    <label>Quiz 3: <input id="q3" type="number" value="0" min="0" max="100" /></label>
    <label>Make-up Quiz: <input id="qm" type="number" value="0" min="0" max="100" /></label>
  </div>

  <div class="row">
    <label>Midterm (out of 100): <input id="mid" type="number" value="0" min="0" max="100" /></label>
    <label>Practical (out of 100): <input id="prac" type="number" value="0" min="0" max="100" /></label>
    <label>Final (out of 50): <input id="fin" type="number" value="0" min="0" max="50" /></label>
  </div>

  <div class="row">
    <label>Take Best N quizzes:
      <select id="take">
        <option value="1">1</option>
        <option value="2" selected>2</option>
        <option value="3">3</option>
        <option value="4">4</option>
      </select>
    </label>
    <button id="calcBtn">Calculate</button>
    <button id="resetBtn" style="background:#3a3f66">Reset</button>
  </div>

  <div class="result" id="res" aria-live="polite">Results appear here</div>

  <script>
    // Utility: clamp numbers safely
    function clamp(v, min, max) {
      const n = Number(v);
      if (!isFinite(n)) return min;
      return Math.max(min, Math.min(max, n));
    }

    function letterGrade(score) {
      if (score >= 90) return 'A';
      if (score >= 80) return 'B';
      if (score >= 70) return 'C';
      if (score >= 60) return 'D';
      return 'F';
    }

    function formatPct(v) { return (v*100).toFixed(2) + '%'; }

    function calc() {
      // Read & clamp inputs
      const q = [
        clamp(document.getElementById('q1').value, 0, 100),
        clamp(document.getElementById('q2').value, 0, 100),
        clamp(document.getElementById('q3').value, 0, 100),
        clamp(document.getElementById('qm').value, 0, 100)
      ];
      const take = clamp(document.getElementById('take').value, 1, 4) | 0;
      q.sort((a,b)=>b-a);
      const sumBest = q.slice(0, take).reduce((a,b)=>a+b, 0);

      const mid = clamp(document.getElementById('mid').value, 0, 100);
      const prac = clamp(document.getElementById('prac').value, 0, 100);
      const fin = clamp(document.getElementById('fin').value, 0, 50);

      // Weights (coursework total -> normalized to 50)
      const wQuizzes = 20;
      const wMid = 25;
      const wPrac = 5;
      const totalCourseworkWeight = wQuizzes + wMid + wPrac; // 50

      // Quizzes: assume each quiz max = 100, so sumBest / (take*100) is quiz percent
      const quizPct = (take > 0) ? (sumBest / (take * 100)) : 0;
      const quizWeighted = quizPct * wQuizzes;

      const midPct = mid / 100;
      const pracPct = prac / 100;
      const midWeighted = midPct * wMid;
      const pracWeighted = pracPct * wPrac;

      const courseworkScore = quizWeighted + midWeighted + pracWeighted; // out of totalCourseworkWeight
      // Normalize coursework portion to 50 marks
      const normalized = (courseworkScore / totalCourseworkWeight) * 50;

      // Final is already out of 50, contributes directly
      const finalScore = fin; // 0..50

      let total = normalized + finalScore;
      total = Math.max(0, Math.min(100, total)); // clamp final total

      const grade = letterGrade(total);

      // Build result HTML
      const res = document.getElementById('res');
      res.innerHTML = `
        <div><strong>Total = ${total.toFixed(2)} / 100 — Grade: ${grade}</strong></div>
        <div class="muted">Breakdown</div>
        <div>Best ${take} quizzes sum = ${sumBest.toFixed(2)} (avg ${((sumBest / take)||0).toFixed(2)})</div>
        <div>Quizzes: ${quizWeighted.toFixed(2)} / ${wQuizzes} (${formatPct(quizPct)})</div>
        <div>Midterm: ${midWeighted.toFixed(2)} / ${wMid} (${formatPct(midPct)})</div>
        <div>Practical: ${pracWeighted.toFixed(2)} / ${wPrac} (${formatPct(pracPct)})</div>
        <div>Coursework weighted total: ${courseworkScore.toFixed(2)} / ${totalCourseworkWeight}</div>
        <div>Normalized coursework → ${normalized.toFixed(2)} / 50</div>
        <div>Final: ${finalScore.toFixed(2)} / 50</div>
        <div style="margin-top:8px">Overall progress</div>
        <div class="bar" aria-hidden="true"><i style="width:${total}%"></i></div>
      `;
    }

    // Wire buttons
    document.getElementById('calcBtn').addEventListener('click', calc);
    document.getElementById('resetBtn').addEventListener('click', () => {
      document.getElementById('q1').value = 0;
      document.getElementById('q2').value = 0;
      document.getElementById('q3').value = 0;
      document.getElementById('qm').value = 0;
      document.getElementById('mid').value = 0;
      document.getElementById('prac').value = 0;
      document.getElementById('fin').value = 0;
      document.getElementById('take').value = 2;
      document.getElementById('res').textContent = 'Results appear here';
    });

    // calculate once on load to show initial state
    calc();
  </script>
</body>
</html>
