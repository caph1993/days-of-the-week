//@ts-check
/// <reference path="./libraries/cpTools.js" />

cp.scripts.define(async () => {
  var put = cp.put;

  const dateNamesDict = {
    en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    es: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    fr: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  }
  const monthNamesDict = {
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    fr: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
  }

  let lang = 'en';
  let dayNames = dateNamesDict[lang];
  let monthNames = monthNamesDict[lang];

  /**
   * @param {string|number|Date}  start
   * @param {string|number|Date}  end
   * */
  function getRandomDate(start = '1900-01-01', end = '2050-12-31') {
    const startT = new Date(start).getTime();
    const endT = new Date(end).getTime();
    const randomT = startT + Math.random() * (endT - startT);
    return new Date(randomT);
  }
  let customRandomDateMode = 2;
  function getDateRange() {
    customRandomDateMode = customRandomDateMode % 4;
    const { year } = decomposeDate(new Date());
    if (customRandomDateMode === 0) {
      return [year, year]
    } else if (customRandomDateMode === 1) {
      const past = year - 10;
      const future = year + 5;
      return [past, future];
    } else if (customRandomDateMode === 2) {
      const past = year - 1;
      const future = year + 1;
      return [past, future];
    } else if (customRandomDateMode === 3) {
      const past = year - (cp.utils.rand32() % 2 ? 80 : 10);
      const future = year + (cp.utils.rand32() % 2 ? 30 : 5);
      return [past, future];
    } else throw new Error('Invalid customRandomDateMode');
  }
  function decomposeDate(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    return { year, month, day }
  }
  let refRange = null;
  function customRandomDate() {
    const [start, end] = getDateRange();
    if (refRange) {
      refRange.textContent = '';
      put(refRange, '$', start == end ? `${start}` : `${start}-${end}`);
    }
    return getRandomDate(`${start}-01-01`, `${end}-12-31`);
  }

  const readyBasic = new cp.events.Target(false);

  function newExerciseElem(onConfirm) {
    const mainDate = customRandomDate();
    const { year, month, day } = decomposeDate(mainDate);
    const dateElem = put('span $', '');
    dateElem.textContent = `${monthNames[month]} ${day}, ${year}`;
    const radioGroup = cp.ui.fixedRadioGroup([...dayNames.slice(1), dayNames[0]]);
    radioGroup.style.flexDirection = 'column';
    const confirmButton = put('button.main-button[disabled] $', 'Confirm');
    radioGroup.classList.add('list-of-days-of-the-week');
    radioGroup.onclick = () => {
      put(confirmButton, '[!disabled]');
    }
    const start = new Date().getTime();
    confirmButton.onclick = () => {
      // @ts-ignore
      const selectedIdx = [...radioGroup.children].findIndex(label => label.children[0].checked);
      const result = {
        start: start,
        elapsed: new Date().getTime() - start,
        year: year,
        month: month,
        day: day,
        dayOfWeek: mainDate.getDay(),
        guess: (selectedIdx + 1) % 7,
      }
      onConfirm(result);
    }

    return cp.html`
    <div class="text-center master-parent">
      <div class="cpCenter main-date">
        ${dateElem}
      </div>
      ${cp.ui.vspace('1em')}
      ${radioGroup}
      ${cp.ui.vspace('1em')}
    </div>
    ${confirmButton}
    `;
  }

  function newResultsElem(result, onNext) {
    const { day, month, year, guess, dayOfWeek, elapsed } = result;
    const yearsDayOfWeek = new Date(year, 9, 10).getDay();
    const isCorrect = guess === dayOfWeek;
    const dateStr = `${monthNames[month]} ${day}, ${year}`;
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    const leapMatters = isLeap && month < 2;

    const whyParent = put('div');
    const nextButton = put('button.main-button $', 'Next');
    nextButton.onclick = onNext;
    const mainElem = cp.html`
    <div class="master-parent">
      <div class="cpCenter">
      ${isCorrect ? cp.html`That is <span style="color:green">correct</span>! 👍` : cp.html`That is <span style="color:red">incorrect</span> 👎`}
      ${cp.ui.hspace('1em')}
      ⏱${Math.ceil(elapsed / 1000)}s
      </div>
      <hr>
      ${dateStr} was <b>${dayNames[dayOfWeek]}</b>${isCorrect ? '' : `, not ${dayNames[guess]}`}.
      ${cp.ui.vspace('2em')}
      ${whyParent}
    </div>
    ${nextButton}
    `;
    const makeExplanation11 = () => {
      // Explanation 1
      let value = year % 100;
      let texts = [...cp.html`${value}`];
      if (value % 2 != 0) {
        value += 11;
        texts.push(...cp.html`→<sup>+11</sup> ${value}`);
      }
      value = value / 2;
      texts.push(...cp.html`→<sup>/2</sup> ${value}`);
      if (value % 2 != 0) {
        value += 11;
        texts.push(...cp.html`→<sup>+11</sup> ${value}`);
      }
      const next7 = 7 * Math.ceil(value / 7);
      value = next7 - value;
      if (value) {
        texts.push(...cp.html`→<sup>to ${next7}</sup> ${value}`);
      }
      const century = (7 + yearsDayOfWeek - value) % 7;
      value += century;
      texts.push(...cp.html`→<sup>+${century}</sup> <b>${value}</b>${value >= 7 ? cp.html` ≡ <b>${value % 7}</b>` : ''}.`);
      return texts;
    }
    const similarYears = () => {
      const mkYears = (year) => [year, year + 28, year - 28, year + 56, year - 56];
      let years = [...mkYears(year), ...(year % 2 ? mkYears(year + 11) : [])];
      years = years.filter(y => y != year && 1990 <= y && y <= 2025);
      return years.length ? cp.html`Similar years: ${years.join(', ')}.<br>` : [];
    }
    const monthShift = [4, 0, 0, 3, 5, 1, 3, 6, 2, 4, 0, 2][month];
    const monthMod = monthShift + (leapMatters ? -1 : 0);
    const total = ((yearsDayOfWeek + monthMod + day) % 7 + 7) % 7;
    whyParent.replaceChildren(...cp.html`
      Year modifier of ${year}: <b>${yearsDayOfWeek}</b>${isLeap ? ' (leap⭒)' : ''}.<br>
      <small>If you don't remember it: ${makeExplanation11()}</small><br>
      <small>${similarYears()}</small>
      ${cp.ui.vspace('0.2em')}
      Month modifier of ${monthNames[month]}: <b>${monthShift}</b>${leapMatters ? ` −1⭒ = <b>${monthMod}</b>` : ''}.
      ${cp.ui.vspace('0.2em')}
      ${yearsDayOfWeek} + ${monthMod} + ${day} = ${yearsDayOfWeek + monthMod + day} ≡ <b>${total}</b> (mod 7) → ${dayNames[dayOfWeek]}.
      ${cp.ui.vspace('1em')}
    `);
    return mainElem;
  };

  const [exerciseElem, nextExercise] = (() => {
    const parent = put('div');
    function afterGuess(result) {
      console.log(result);
      const resultsElem = newResultsElem(result, nextExercise);
      parent.replaceChildren(...resultsElem);
    }
    const nextExercise = () => {
      const exerciseElem = newExerciseElem(afterGuess);
      parent.replaceChildren(...exerciseElem);
    }
    nextExercise();
    return [parent, nextExercise];
  })();
  cp.styles.add(`
    .master-parent {
      min-height: 19em;
    }
    .main-button{
      width: 100%;
      padding: 1.5em;
    }
    .main-date{
      font-size:1.5rem;
    }
    div.list-of-days-of-the-week>label{
      margin: 0.25rem;
      border: 0.1px solid #00000010;
      border-radius: 0.3rem;
    }
  `);


  // ---------- Reference: tutorial, month tables, year tables ----------
  const monthShifts = [4, 0, 0, 3, 5, 1, 3, 6, 2, 4, 0, 2];
  const isLeapYear = (y) => (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
  const yearModifier = (y) => new Date(y, 9, 10).getDay(); // equals the weekday of Oct 10
  const hue = (k) => `hsl(${k * 51}, 45%, 94%)`;
  const chip = (k, text) => `<span class="chip" style="background:${hue(k)}">${text}</span>`;
  const shortDay = (k) => dayNames[k].slice(0, 3);

  /** The "odd + 11" steps for the last two digits, and the century anchor. */
  function yearSteps(year) {
    let value = year % 100;
    const parts = [`${value}`];
    if (value % 2) { value += 11; parts.push(`+11 → ${value}`); }
    value /= 2; parts.push(`/2 → ${value}`);
    if (value % 2) { value += 11; parts.push(`+11 → ${value}`); }
    const next7 = 7 * Math.ceil(value / 7);
    value = next7 - value;
    parts.push(`to next multiple of 7 → ${value}`);
    const century = (7 + yearModifier(year) - value) % 7;
    return { parts, value, century };
  }

  const toggleGroup = (labels, views) => {
    const wrap = put('div');
    const bar = put('div.tabs');
    const body = put('div');
    labels.forEach((label, i) => {
      const b = put('button $', label);
      b.onclick = () => {
        [...bar.children].forEach((c, j) => c.classList.toggle('active', i === j));
        body.innerHTML = views[i]();
      };
      bar.append(b);
    });
    wrap.append(bar, body);
    bar.children[0].click();
    return wrap;
  };

  const cell = (k, top, bottom, extra = '') =>
    `<div class="cell" style="background:${hue(k)};${extra}"><div>${top}</div><b>${bottom}</b></div>`;
  const groupRows = (items) => `<div class="groups">${[0, 1, 2, 3, 4, 5, 6].map(k =>
    `<div class="lead">${k} <small>${shortDay(k)}</small></div><div>${items(k) || '<i>—</i>'}</div>`).join('')}</div>`;

  const monthsMatrix = () => `
    <p class="note">Each month has a fixed number (0 = Sunday … 6 = Saturday). Same colour = same number. In a leap year, January and February get one less.</p>
    <div class="cells">${monthNames.map((n, m) => cell(monthShifts[m], n, monthShifts[m])).join('')}</div>`;

  const monthsGrouped = () => `
    <p class="note">Months with the same number are interchangeable: the same day-number falls on the same weekday in all of them.</p>
    ${groupRows(k => monthNames.map((n, i) => monthShifts[i] === k ? chip(k, n) : '').join(' '))}`;

  const yearRange = () => {
    const y = new Date().getFullYear();
    return Array.from({ length: 21 }, (_, i) => y - 10 + i);
  };
  const yearsMatrix = () => {
    const now = new Date().getFullYear();
    return `
    <p class="note">Each year has a number from 0 to 6. Leap years are marked ⭒.</p>
    <div class="cells">${yearRange().map(y => {
      const k = yearModifier(y);
      return cell(k, `${y}${isLeapYear(y) ? '⭒' : ''}`, `${k} <small>${shortDay(k)}</small>`, y === now ? 'border-color:#000;' : '');
    }).join('')}</div>`;
  };
  const yearsGrouped = () => {
    const now = new Date().getFullYear();
    return `
    <p class="note">Years with the same number have the same calendar from March to December.</p>
    ${groupRows(k => yearRange().filter(y => yearModifier(y) === k).map(y =>
      chip(k, `${y === now ? '<u>' : ''}${y}${isLeapYear(y) ? '⭒' : ''}${y === now ? '</u>' : ''}`)).join(' '))}`;
  };

  const calcWidget = () => {
    const wrap = put('div.calc');
    const input = put('input[type=date]');
    const out = put('div.calc-out');
    const today = new Date();
    input.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const update = () => {
      const [y, m, d] = input.value.split('-').map(Number);
      if (!y) { out.textContent = ''; return; }
      const month = m - 1, yk = yearModifier(y);
      const leapAdj = isLeapYear(y) && month < 2 ? -1 : 0;
      const mk = monthShifts[month] + leapAdj;
      const total = ((yk + mk + d) % 7 + 7) % 7;
      const st = yearSteps(y);
      out.innerHTML = `
        <div><b>1. Year ${y}:</b> ${st.parts.join(' ; ')}. Add the century anchor ${st.century} →
          ${chip(yk, `<b>${yk}</b>`)} (${dayNames[yk]})</div>
        <div><b>2. Month ${monthNames[month]}:</b> ${chip(mk < 0 ? mk + 7 : mk, `<b>${monthShifts[month]}</b>`)}${leapAdj ? ' − 1 (leap year) = ' + (mk + 7) % 7 : ''}</div>
        <div><b>3. Day:</b> ${d}</div>
        <div><b>Sum:</b> ${yk} + ${mk} + ${d} = ${yk + mk + d} ≡ ${chip(total, `<b>${total}</b>`)} (mod 7) → <b>${dayNames[total]}</b></div>`;
    };
    input.onchange = input.oninput = update;
    update();
    wrap.append(input, out);
    return wrap;
  };

  const tutorial = () => {
    const d = put('details.tutorial');
    d.open = false;
    d.innerHTML = `<summary><b>How to do it in your head</b> — year modifier + month modifier + day</summary>
    <div class="tut">
      <p>Number the days <b>0 = Sunday, 1 = Monday, … 6 = Saturday</b>. Then:</p>
      <p class="formula">weekday = <span class="y">year modifier</span> + <span class="m">month modifier</span> + <span class="d">day of month</span> &nbsp;(mod 7)</p>
      <ol>
        <li><span class="y"><b>Year modifier</b></span>: a number 0–6 that you learn for each year (2026 → 6, 2027 → 0, 2028 → 2, …; see the tables below).
          Each year it goes up by 1, or by 2 when the new year is a leap year.
          If you don't remember it, compute it from the last two digits:
          <ul>
            <li>if odd, add 11;</li>
            <li>halve it;</li>
            <li>if odd again, add 11;</li>
            <li>take the distance to the next multiple of 7 (0 if already a multiple);</li>
            <li>add the <b>century number</b>: 1900s → 3, 2000s → 2, 2100s → 0, 1800s → 5.</li>
          </ul>
          Example 2026: 26 → 13 → 24 → 4 (to 28) → +2 (2000s) → <b>6</b>.
        </li>
        <li><span class="m"><b>Month modifier</b></span>: a fixed number per month (see the tables below). In leap years January and February use one less.</li>
        <li><span class="d"><b>Day</b></span>: the day of the month.</li>
      </ol>
      <p>Add the three and drop multiples of 7. Example: October 24, 2026 → 6 + 4 + 24 = 34 ≡ 6 → Saturday.</p>
      <p><b>Try any date:</b></p>
    </div>`;
    d.querySelector('.tut').append(calcWidget());
    return d;
  };

  cp.styles.add(`
    .reference, .reference * { box-sizing: border-box; max-width: 100%; }
    .reference { overflow-wrap: anywhere; }
    .reference h4 { margin: 1.2em 0 0.3em; }
    .nav button, .tabs button { margin-right: 0.3em; }
    .nav button.active, .tabs button.active { background: #00000018; }
    .cells { display: grid; grid-template-columns: repeat(auto-fill, minmax(5.5em, 1fr)); gap: 0.25rem; }
    .cell { text-align: center; padding: 0.2em; border: 0.1px solid #00000020; border-radius: 0.3rem; }
    .groups { display: grid; grid-template-columns: auto 1fr; gap: 0.25rem 0.6em; align-items: center; }
    .groups .lead { white-space: nowrap; }
    .chip { display: inline-block; padding: 0 0.4em; margin: 0.1em; border-radius: 0.3rem; border: 0.1px solid #00000020; }
    .note { font-size: 0.8em; margin: 0.4em 0; opacity: 0.8; }
    details.tutorial { margin: 0.5em 0; padding: 0.4em 0.7em; border: 0.1px solid #00000020; border-radius: 0.3rem; }
    details.tutorial summary { cursor: pointer; }
    .tut ol, .tut ul { padding-left: 1.3em; }
    .formula { text-align: center; }
    .y, .m, .d { padding: 0 0.3em; border-radius: 0.3rem; border: 0.1px solid #00000020; }
    .y { background: hsl(0,45%,94%); } .m { background: hsl(102,45%,94%); } .d { background: hsl(204,45%,94%); }
    .calc-out > div { margin: 0.3em 0; }
    .calc input { font: inherit; }
  `);

  const referenceElem = () => {
    const wrap = put('div.reference');
    wrap.append(
      tutorial(),
      put('h4 $', 'Months'),
      toggleGroup(['Calendar', 'By number'], [monthsMatrix, monthsGrouped]),
      put('h4 $', 'Years around now'),
      toggleGroup(['Calendar', 'By number'], [yearsMatrix, yearsGrouped]),
    );
    return wrap;
  };
  const referenceView = referenceElem();
  const practiceView = put('div');
  const nav = put('div.nav');
  [['Practice', practiceView], ['Reference', referenceView]].forEach(([label, view]) => {
    const b = put('button $', label);
    b.onclick = () => {
      [...nav.children].forEach(c => c.classList.toggle('active', c === b));
      [practiceView, referenceView].forEach(v => v.hidden = v !== view);
    };
    nav.append(b);
  });

  practiceView.append(...cp.html`
    ${exerciseElem}
    ${cp.ui.vspace('1em')}
    <div>
      Date range:
      <button>
      ${put('span $ @click', '⇆', () => {
        customRandomDateMode++;
        nextExercise();
      })}
      </button>
      ${refRange = put('span')}
    </div>
  `);

  const main = cp.html`
    <h3>
      ${put('img[src=$] @', './favicon.png', (self) => self.style.width = '1em')}
      ${'Days of the week'}
      ${put('button $ @click', '⇆', () => { nextExercise(); })}
      ${'' && put('button $ @click', 'EN', (btn) => {
        lang = { en: 'es', es: 'fr', fr: 'en' }[lang];
        btn.textContent = lang.toUpperCase();
        dayNames = dateNamesDict[lang];
        monthNames = monthNamesDict[lang];
      })}
    </h3>
    ${nav}
    <hr>
    ${referenceView}
    ${practiceView}
    ${cp.ui.vspace('1em')}
    <div>
      Carlos Pinzón.
    </div>
  `;
  customRandomDate(); // Trigger refRange update
  nav.children[0].click();

  const mainWrapper = put(`div.${cp.styles.add((uid) => `
    .${uid}{
      padding-top: 0.2em;
      padding-bottom: 0.2em;
    }
  `)}`,
    put(`div.${cp.styles.add((uid) => `
    .${uid}{
      padding: 1% 2% 3% 2%; max-width: 45em; margin: auto;
    }
  `)}`,
      main,
    ));

  cp.styles.add(`
    button{
      cursor: pointer;
    }
    html{
      font-family: Latin Modern Roman;
      font-size: 1.2em;
    }
  `);
  document.body.append(mainWrapper);

  (async () => {
    await readyBasic.untilTrue();
    cp.styles.add(`
      body {
        background: no-repeat url(./libraries/paper-transparent.png) 0 0;
        background-color: white;
        background-repeat: repeat;
        margin: 0;
      }
    `);
    //cp.styles.load('./fonts/font-lmroman.css');
    cp.styles.add(await cp.scripts.cacheLoad('./fonts/font-lmroman.js'));
  })();
})
