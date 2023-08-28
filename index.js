//@ts-check
/// <reference path="./libraries/cpTools.js" />

cp.scripts.define(async () => {
  var put = cp.put;

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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
  function customRandomDate() {
    const { year } = decomposeDate(new Date());
    const past = year - (cp.utils.rand32() % 2 ? 80 : 10);
    const future = year + (cp.utils.rand32() % 2 ? 30 : 5);
    return getRandomDate(`${past}-01-01`, `${future}-12-31`);
  }
  function decomposeDate(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    return { year, month, day }
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
    const yearsDayOfWeek = new Date(`${year}-10-10`).getDay();
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
    whyParent.replaceChildren(...cp.html`
      ${year} was a ${leapMatters ? 'leap and ' : ''}${dayNames[yearsDayOfWeek]} year:<br>
      ${makeExplanation11()}<br>
      ${similarYears()}
      So, ${monthNames[month]} ${refDayOfMonth} was ${dayNames[yearsDayOfWeek]}.
        ${cp.ui.vspace('1em')}
    `);
    return mainElem;
  };

  const exerciseElem = (() => {
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
    return parent;
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
  `)


  const main = cp.html`
<h3>
  ${put('img[src=$] @', './favicon.png', (self) => self.style.width = '1em')}
  ${'Days of the week'}
</h3>
<hr>
${exerciseElem}
${cp.ui.vspace('1em')}
Carlos Pinzón. 2023.
  `;

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
    button{cursor: pointer;}
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
