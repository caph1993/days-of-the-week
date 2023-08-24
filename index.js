//@ts-check
/// <reference path="./libraries/cpTools.js" />

cp.scripts.define(async () => {
  var put = cp.put;

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function getRandomDate(startDate = new Date('1940-01-01'), endDate = new Date('2050-12-31')) {
    const startT = startDate.getTime();
    const endT = endDate.getTime();
    const randomT = startT + Math.random() * (endT - startT);
    return new Date(randomT);
  }
  function decomposeDate(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const dayOfWeek = date.getDay();
    const yearsDayOfWeek = new Date(`${year}-08-08`).getDay();
    return { year, month, day, dayOfWeek, yearsDayOfWeek }
  }

  const readyBasic = new cp.events.Target(false);

  cp.styles.add(`
  span.hint {
      opacity: 0.5;
      border: 1px solid black;
  }
  `)
  function newExerciseElem(onConfirm) {
    const mainDate = getRandomDate();
    const { year, month, day } = decomposeDate(mainDate);
    const dateElem = put('span $', '');
    dateElem.textContent = `${day} ${monthNames[month]} ${year}`;
    const radioGroup = cp.ui.fixedRadioGroup([...dayNames.slice(1), dayNames[0]]);
    radioGroup.style.flexDirection = 'column';
    const confirmButton = put('button.main-button[disabled] $', 'Confirm');

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
      ${dateElem}
      ${cp.ui.vspace('1em')}
      ${radioGroup}
      ${cp.ui.vspace('1em')}
    </div>
    ${confirmButton}
    `;
  }

  function newResultsElem(result, onNext) {
    const { day, month, year, guess, dayOfWeek } = result;
    const yearsDayOfWeek = new Date(`${year}-10-10`).getDay();
    const isCorrect = guess === dayOfWeek;
    const dateStr = `${day} ${monthNames[month]} ${year}`;
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    const leapMatters = isLeap && month <= 2;
    const refDayOfMonth = [3, 14, 0, 4, 9, 6, 11, 8, 5, 10, 7, 12][month] + (leapMatters ? 1 : 0);

    const whyButton = put('button $', 'Why?');
    const whyParent = put('div');
    const nextButton = put('button.main-button $', 'Next');
    nextButton.onclick = onNext;
    const mainElem = cp.html`
    <div class="text-center master-parent">
      ${dateStr} was ${isCorrect ? '' : `not ${dayNames[guess]}. It was `} ${dayNames[dayOfWeek]}.
      ${cp.ui.vspace('1em')}
      ${year} was a ${leapMatters ? 'leap and ' : ''}${dayNames[yearsDayOfWeek]} year. ${whyButton}
      <br>
      So, ${refDayOfMonth} of ${monthNames[month]} was ${dayNames[yearsDayOfWeek]}.
      ${cp.ui.vspace('1em')}
      ${whyParent}
    </div>
    ${nextButton}
    `;
    const makeExplanation11 = () => {
      // Explanation 1
      let value = year % 100;
      let texts = [`${value}.`];
      if (value % 2 != 0) {
        value += 11;
        texts.push(`Add 11: ${value}.`);
      }
      value = value / 2;
      texts.push(`Div. by 2: ${value}.`);
      if (value % 2 != 0) {
        value += 11;
        texts.push(`Add 11: gives ${value}.`);
      }
      const next7 = 7 * Math.ceil(value / 7);
      value = next7 - value;
      if (value) {
        texts.push(`To ${next7} we need ${value}.`);
      }
      const century = (7 + yearsDayOfWeek - value) % 7;
      value += century;
      texts.push(`Add ${century} (century) gives ${value}`);
      return texts.join(' ');
    }
    whyButton.onclick = () => {
      whyParent.replaceChildren(...cp.html`
        Calculation: ${makeExplanation11()}
        ${cp.ui.vspace('1em')}
      `);
    }
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
      min-height: 15em;
    }
    .main-button{
      width: 100%;
      padding: 0.6em;
    }
  `)


  const main = cp.html`
${put('h1 $', 'Days of the week')}
${exerciseElem}
${cp.ui.vspace('1em')}
Carlos Pinzón. 2023.
  `;

  const mainWrapper = put(`div.${cp.styles.add((uid) => `
    .${uid}{
      padding-top: 1em;
      padding-bottom: calc(20vh + 5rem);
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
