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
    const refDayOfMonth = [3, 14, 0, 4, 9, 6, 11, 8, 5, 10, 7, 12][month] + (leapMatters ? 1 : 0);

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
      texts.push(...cp.html`→<sup>+${century}</sup> <b>${value}</b>.`);
      return texts;
    }
    const similarYears = () => {
      const mkYears = (year) => [year, year + 28, year - 28, year + 56, year - 56];
      let years = [...mkYears(year), ...(year % 2 ? mkYears(year + 11) : [])];
      years = years.filter(y => y != year && 1990 <= y && y <= 2025);
      return years.length ? cp.html`Similar years: ${years.join(', ')}.<br>` : [];
    }
    const monthShift = [4, 0, 0, 3, 5, 1, 3, 6, 2, 4, 0, 2][month];
    whyParent.replaceChildren(...cp.html`
      ${year} was a ${leapMatters ? 'leap⭒ and ' : ''}${dayNames[yearsDayOfWeek]} year:<br>
      ${makeExplanation11()}<br>
      ${similarYears()}
      So, ${monthNames[month]} ${refDayOfMonth}
      <a href="https://en.wikipedia.org/wiki/Doomsday_rule?section=7#The_%22odd_+_11%22_method">(doomday)</a>
      was ${dayNames[yearsDayOfWeek]}.
      ${cp.ui.vspace('0.2em')}
      The month shift for ${monthNames[month]} is ${monthShift}${leapMatters ? `-1⭒=${monthShift - 1}` : ''}. 
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
  const yearModifier = (y) => new Date(y, 9, 10).getDay(); // weekday of Oct 10 (doomsday)
  const hue = (k) => `hsl(${k * 51}, 70%, 88%)`;
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

  const monthsMatrix = () => `
    <p class="note">Each month has a fixed modifier (0 = Sunday … 6 = Saturday). Same colour = same modifier.</p>
    <table class="grid months">${[0, 1, 2].map(r => '<tr>' + [0, 1, 2, 3].map(c => {
    const m = r * 4 + c;
    return `<td style="background:${hue(monthShifts[m])}"><div>${monthNames[m]}</div><b>${monthShifts[m]}</b></td>`;
  }).join('') + '</tr>').join('')}</table>
    <p class="note">In a <b>leap year</b>, January and February get one less (3 and −1 ≡ 6).</p>`;

  const monthsGrouped = () => `
    <p class="note">Months that share a modifier behave identically: e.g. a date in any of them falls on the same weekday as the same day-number in the others.</p>
    <table class="grid">${[0, 1, 2, 3, 4, 5, 6].map(k => {
    const ms = monthNames.map((n, i) => monthShifts[i] === k ? chip(k, n) : '').join(' ');
    return `<tr><td class="lead">${chip(k, `<b>${k}</b>`)}</td><td>${ms || '<i>—</i>'}</td></tr>`;
  }).join('')}</table>`;

  const yearRange = () => {
    const y = new Date().getFullYear();
    return Array.from({ length: 21 }, (_, i) => y - 10 + i);
  };
  const yearsMatrix = () => {
    const ys = yearRange(), now = new Date().getFullYear();
    return `
    <p class="note">Year modifier = weekday of the year's doomsday (Oct 10, Dec 12, …). Leap years marked ⭒.</p>
    <table class="grid years">${[0, 1, 2].map(r => '<tr>' + [0, 1, 2, 3, 4, 5, 6].map(c => {
      const y = ys[r * 7 + c], k = yearModifier(y);
      return `<td style="background:${hue(k)};${y === now ? 'outline:2px solid #333;' : ''}"><div>${y}${isLeapYear(y) ? '⭒' : ''}</div><b>${k}</b> <small>${shortDay(k)}</small></td>`;
    }).join('') + '</tr>').join('')}</table>`;
  };
  const yearsGrouped = () => {
    const ys = yearRange(), now = new Date().getFullYear();
    return `
    <p class="note">Years grouped by modifier. Years in the same row share a calendar for March–December.</p>
    <table class="grid">${[0, 1, 2, 3, 4, 5, 6].map(k => {
      const list = ys.filter(y => yearModifier(y) === k).map(y => chip(k, `${y === now ? '<u>' : ''}${y}${isLeapYear(y) ? '⭒' : ''}${y === now ? '</u>' : ''}`)).join(' ');
      return `<tr><td class="lead">${chip(k, `<b>${k}</b> ${shortDay(k)}`)}</td><td>${list || '<i>—</i>'}</td></tr>`;
    }).join('')}</table>`;
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
        <li><span class="y"><b>Year modifier</b></span> = the weekday of the year's "doomsday" (the same weekday as Oct 10, Dec 12, Apr 4, …).
          Take the last two digits and apply the <i>odd + 11</i> method:
          <ul>
            <li>if odd, add 11;</li>
            <li>halve it;</li>
            <li>if odd again, add 11;</li>
            <li>take the distance to the next multiple of 7 (0 if already a multiple);</li>
            <li>add the <b>century anchor</b>: 1900s → 3 (Wed), 2000s → 2 (Tue), 2100s → 0 (Sun), 1800s → 5 (Fri).</li>
          </ul>
          Example 2026: 26 → 13 → 24 → 4 (to 28) → +2 (2000s) → <b>6</b> (Saturday).
        </li>
        <li><span class="m"><b>Month modifier</b></span> = a fixed number per month (see the tables below). In leap years January and February use one less.</li>
        <li><span class="d"><b>Day</b></span> = the day of the month. Add all three, drop multiples of 7.</li>
      </ol>
      <p>Why it works: each month's modifier is just <code>−(doomsday date of that month) mod 7</code>, e.g. October's doomsday is the 10th, so its modifier is −10 ≡ 4.</p>
      <p><b>Try any date:</b></p>
    </div>`;
    d.querySelector('.tut').append(calcWidget());
    return d;
  };

  const referenceElem = () => {
    const wrap = put('div.reference');
    wrap.append(
      tutorial(),
      put('h4 $', 'Months'),
      toggleGroup(['Calendar', 'Grouped by modifier'], [monthsMatrix, monthsGrouped]),
      put('h4 $', 'Years around now'),
      toggleGroup(['Calendar', 'Grouped by modifier'], [yearsMatrix, yearsGrouped]),
    );
    return wrap;
  };
  cp.styles.add(`
    .reference h4 { margin: 1em 0 0.3em; }
    .tabs button { margin-right: 0.3em; padding: 0.2em 0.7em; }
    .tabs button.active { background: #ddd; font-weight: bold; }
    .grid { border-collapse: separate; border-spacing: 3px; width: 100%; }
    .grid td { padding: 0.3em 0.4em; border-radius: 0.3rem; text-align: center; }
    .grid td.lead { width: 1%; white-space: nowrap; }
    .grid td:not(.lead) { background: none; text-align: left; }
    .grid.months td, .grid.years td { text-align: center; }
    .chip { display: inline-block; padding: 0.05em 0.5em; margin: 0.1em; border-radius: 0.6em; border: 0.1px solid #00000020; }
    .note { font-size: 0.8em; margin: 0.4em 0; opacity: 0.8; }
    details.tutorial { margin: 0.5em 0; padding: 0.4em 0.7em; border: 0.1px solid #00000030; border-radius: 0.3rem; background: #ffffff90; }
    details.tutorial summary { cursor: pointer; }
    .formula { text-align: center; font-size: 1.1em; }
    .y { background: hsl(0,70%,88%); padding: 0 0.3em; border-radius: 0.3em; }
    .m { background: hsl(102,70%,88%); padding: 0 0.3em; border-radius: 0.3em; }
    .d { background: hsl(204,70%,88%); padding: 0 0.3em; border-radius: 0.3em; }
    .calc-out > div { margin: 0.3em 0; }
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
    <hr>
    ${exerciseElem}
    ${cp.ui.vspace('1em')}
    <hr>
    ${referenceElem()}
    <hr>
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
    <div>
      Carlos Pinzón.
    </div>
  `;
  customRandomDate(); // Trigger refRange update

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
