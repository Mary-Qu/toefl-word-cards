(() => {
  "use strict";

  const dataset = window.TOEFL_WORD_DATA;
  const app = document.querySelector("#app");

  if (!dataset || !Array.isArray(dataset.words)) {
    app.innerHTML = '<main class="fatal"><h1>单词数据未生成</h1><p>请运行 <code>npm run parse</code>。</p></main>';
    return;
  }

  const words = dataset.words;
  const availableLists = Object.keys(dataset.listCounts).map(Number).sort((a, b) => a - b);
  const wordById = new Map(words.map((word) => [word.id, word]));
  const STORAGE_KEY = "margin-toefl-progress-v1";
  const today = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };
  const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const addDays = (key, amount) => {
    const [year, month, day] = key.split("-").map(Number);
    const date = new Date(year, month - 1, day + amount);
    return dateKey(date);
  };

  const defaultStore = () => ({
    version: 1,
    progress: {},
    activity: {},
    settings: { dailyGoal: 20, sessionSize: 20 }
  });

  function loadStore() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (stored?.version === 1) return { ...defaultStore(), ...stored };
    } catch (error) {
      console.warn("学习记录读取失败", error);
    }
    return defaultStore();
  }

  let store = loadStore();
  const state = {
    page: "home",
    study: null,
    practice: null,
    practiceMode: "choice",
    librarySearch: "",
    libraryList: "all",
    libraryStatus: "all",
    libraryStarred: false,
    libraryVisible: 36
  };

  function saveStore() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  function getProgress(id) {
    return store.progress[id] || {
      seen: 0,
      correct: 0,
      wrong: 0,
      streak: 0,
      interval: 0,
      ease: 2.2,
      due: today(),
      starred: false,
      lastReviewed: "",
      lastGrade: null
    };
  }

  function statusOf(progress) {
    if (!progress.seen) return "new";
    if (progress.interval >= 30) return "mastered";
    if (progress.interval >= 3) return "reviewing";
    return "learning";
  }

  function reviewWord(word, grade) {
    const currentDate = today();
    const previous = getProgress(word.id);
    const wasNew = previous.seen === 0;
    const progress = { ...previous };
    const currentInterval = progress.interval || 0;

    progress.seen += 1;
    progress.lastReviewed = currentDate;
    progress.lastGrade = grade;
    if (grade === 0) {
      progress.interval = 0;
      progress.due = currentDate;
      progress.ease = Math.max(1.3, progress.ease - 0.2);
      progress.streak = 0;
      progress.wrong += 1;
    } else if (grade === 1) {
      progress.interval = 1;
      progress.due = addDays(currentDate, 1);
      progress.ease = Math.max(1.3, progress.ease - 0.1);
      progress.streak = 0;
      progress.wrong += 1;
    } else if (grade === 2) {
      progress.interval = currentInterval < 3 ? 3 : Math.min(60, Math.round(currentInterval * 1.7));
      progress.due = addDays(currentDate, progress.interval);
      progress.streak += 1;
      progress.correct += 1;
    } else {
      progress.interval = currentInterval < 7 ? 7 : Math.min(120, Math.round(currentInterval * 2.2));
      progress.due = addDays(currentDate, progress.interval);
      progress.ease = Math.min(3, progress.ease + 0.1);
      progress.streak += 1;
      progress.correct += 1;
    }

    store.progress[word.id] = progress;
    const daily = store.activity[currentDate] || { learned: 0, reviewed: 0, correct: 0, wrong: 0 };
    daily[wasNew ? "learned" : "reviewed"] += 1;
    daily[grade >= 2 ? "correct" : "wrong"] += 1;
    store.activity[currentDate] = daily;
    saveStore();
  }

  function toggleStar(id) {
    const progress = { ...getProgress(id) };
    progress.starred = !progress.starred;
    store.progress[id] = progress;
    saveStore();
  }

  function shuffle(items) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
    }
    return copy;
  }

  function escapeHtml(value = "") {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function highlightWord(text, word) {
    const match = text.match(new RegExp(escapeRegex(word), "i"));
    if (!match || match.index === undefined) return escapeHtml(text);
    const start = match.index;
    const end = start + match[0].length;
    return `${escapeHtml(text.slice(0, start))}<mark>${escapeHtml(text.slice(start, end))}</mark>${escapeHtml(text.slice(end))}`;
  }

  function firstMeaning(word) {
    return word.senses[0]?.meaning || word.senses[0]?.raw || "暂无释义";
  }

  function icon(name, size = 20) {
    const paths = {
      home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10M9 20v-6h6v6"/>',
      cards: '<rect x="4" y="3" width="14" height="18" rx="2"/><path d="m8 8 6-1M8 12h6M20 7v11a2 2 0 0 1-2 2"/>',
      practice: '<path d="M4 19.5V5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0 0 4h13"/><path d="m9 10 2 2 4-5"/>',
      library: '<path d="M4 19.5V5a2 2 0 0 1 2-2h3v18H6a2 2 0 0 1-2-1.5ZM9 3h5v18H9zM14 3h3a2 2 0 0 1 2 2v16h-5z"/>',
      chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
      volume: '<path d="M11 5 6 9H3v6h3l5 4zM15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12"/>',
      star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z"/>',
      arrow: '<path d="M5 12h14M14 7l5 5-5 5"/>',
      search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
      flame: '<path d="M12 22c4 0 7-2.7 7-6.5 0-2.9-1.7-5.8-5-9.5.2 3-1.2 4.2-2.3 3.2C10.2 7.8 10.4 5.7 9 3c-1 4.1-4 6.6-4 11.5C5 18.8 8 22 12 22Z"/><path d="M9.5 17c0-1.8 1.1-3.2 2.5-4.8.1 1.7 2.5 2.6 2.5 4.8a2.5 2.5 0 0 1-5 0Z"/>',
      check: '<path d="m4 12 5 5L20 6"/>',
      reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
      close: '<path d="m6 6 12 12M18 6 6 18"/>'
    };
    return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || ""}</svg>`;
  }

  const navItems = [
    ["home", "今日", "home"],
    ["study", "词卡", "cards"],
    ["practice", "练习", "practice"],
    ["library", "词库", "library"],
    ["stats", "记录", "chart"]
  ];

  function getOverview() {
    const progressValues = words.map((word) => getProgress(word.id));
    return {
      learned: progressValues.filter((progress) => progress.seen > 0).length,
      mastered: progressValues.filter((progress) => statusOf(progress) === "mastered").length,
      due: progressValues.filter((progress) => progress.seen > 0 && progress.due <= today()).length,
      starred: progressValues.filter((progress) => progress.starred).length
    };
  }

  function streakDays() {
    let cursor = new Date();
    if (!store.activity[dateKey(cursor)]) cursor.setDate(cursor.getDate() - 1);
    let streak = 0;
    while (store.activity[dateKey(cursor)]) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  function renderShell() {
    const pageNames = { home: "今日学习", study: "单词卡片", practice: "专项练习", library: "完整词库", stats: "学习记录" };
    const now = new Date();
    const dateText = new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "long" }).format(now);
    document.title = `${pageNames[state.page]} · Margin TOEFL`;
    app.innerHTML = `
      <div class="app-shell">
        <aside class="sidebar">
          <button class="brand" data-page="home" aria-label="返回今日学习">
            <span class="brand-mark">M</span>
            <span><strong>Margin</strong><small>TOEFL WORD CARDS</small></span>
          </button>
          <nav class="side-nav" aria-label="主要导航">
            ${navItems.map(([page, label, iconName]) => `<button class="nav-item ${state.page === page ? "active" : ""}" data-page="${page}">${icon(iconName)}<span>${label}</span></button>`).join("")}
          </nav>
          <div class="source-note">
            <span class="source-label">LOCAL SOURCE</span>
            <strong>${dataset.total} words</strong>
            <span>${escapeHtml(dataset.source)}</span>
            <span>更新于 ${new Date(dataset.generatedAt).toLocaleDateString("zh-CN")}</span>
          </div>
        </aside>
        <main class="main-column">
          <header class="topbar">
            <div><span class="eyebrow">${escapeHtml(dateText)}</span><h1>${pageNames[state.page]}</h1></div>
            <button class="button button-ink top-action" data-action="quick-start">${icon("cards", 18)} 快速学习</button>
          </header>
          <div class="page page-${state.page}">${renderPage()}</div>
        </main>
        <nav class="mobile-nav" aria-label="移动端导航">
          ${navItems.map(([page, label, iconName]) => `<button class="${state.page === page ? "active" : ""}" data-page="${page}">${icon(iconName, 19)}<span>${label}</span></button>`).join("")}
        </nav>
      </div>`;
  }

  function renderPage() {
    if (state.page === "study") return renderStudy();
    if (state.page === "practice") return renderPractice();
    if (state.page === "library") return renderLibrary();
    if (state.page === "stats") return renderStats();
    return renderHome();
  }

  function renderHome() {
    const overview = getOverview();
    const daily = store.activity[today()] || { learned: 0, reviewed: 0, correct: 0, wrong: 0 };
    const completedToday = daily.learned + daily.reviewed;
    const goalPercent = Math.min(100, Math.round((completedToday / store.settings.dailyGoal) * 100));
    const errorWords = words
      .map((word) => ({ word, progress: getProgress(word.id) }))
      .filter(({ progress }) => progress.wrong > 0)
      .sort((a, b) => b.progress.wrong - a.progress.wrong || a.progress.correct - b.progress.correct)
      .slice(0, 5);

    return `
      <section class="hero-card reveal">
        <div class="hero-copy">
          <span class="folio">DAILY MARGIN / ${String(new Date().getDate()).padStart(2, "0")}</span>
          <h2>在页边，<br>留下今天记住的词。</h2>
          <p>${overview.due ? `已有 <strong>${overview.due}</strong> 个单词等待复习。` : "复习队列已经清空，可以认识一组新单词。"}</p>
          <button class="button button-accent" data-action="quick-start">开始今日学习 ${icon("arrow", 18)}</button>
        </div>
        <div class="goal-stamp" style="--progress:${goalPercent * 3.6}deg">
          <div><strong>${completedToday}</strong><span>/ ${store.settings.dailyGoal}</span><small>今日进度</small></div>
        </div>
        <span class="hero-word">vocabulary</span>
      </section>

      <section class="metric-grid reveal delay-1" aria-label="学习概况">
        ${metric("今日待复习", overview.due, "WORDS DUE", "#d4623d")}
        ${metric("已经学习", overview.learned, `OF ${words.length}`, "#173c3a")}
        ${metric("已经掌握", overview.mastered, "LONG-TERM", "#567b6d")}
        ${metric("连续学习", streakDays(), "DAYS", "#b98a38")}
      </section>

      <section class="section-block reveal delay-2">
        <div class="section-heading"><div><span class="eyebrow">CHAPTERS ${String(availableLists[0]).padStart(2, "0")}—${String(availableLists.at(-1)).padStart(2, "0")}</span><h2>选择单词表</h2></div><button class="text-button" data-page="library">浏览全部 ${icon("arrow", 16)}</button></div>
        <div class="list-grid">
          ${availableLists.map(renderListCard).join("")}
        </div>
      </section>

      <section class="home-bottom reveal delay-3">
        <article class="paper-panel">
          <div class="section-heading compact"><div><span class="eyebrow">REVISIT</span><h2>容易遗忘</h2></div><span class="hand-note">再看一眼</span></div>
          ${errorWords.length ? `<div class="trouble-list">${errorWords.map(({ word, progress }) => `
            <button data-action="study-word" data-word-id="${word.id}">
              <span><strong>${escapeHtml(word.word)}</strong><small>${escapeHtml(firstMeaning(word))}</small></span>
              <em>${progress.wrong} 次</em>
            </button>`).join("")}</div>` : '<div class="empty-inline">完成练习后，易错单词会出现在这里。</div>'}
        </article>
        <article class="shortcut-panel">
          <span class="eyebrow light">KEYBOARD</span>
          <h2>把注意力留给单词</h2>
          <div class="shortcut-row"><kbd>Space</kbd><span>翻开词卡</span></div>
          <div class="shortcut-row"><kbd>1—4</kbd><span>选择熟悉程度</span></div>
          <div class="shortcut-row"><kbd>P</kbd><span>播放英语发音</span></div>
          <div class="shortcut-row"><kbd>F</kbd><span>收藏当前单词</span></div>
        </article>
      </section>`;
  }

  function metric(label, value, note, color) {
    return `<article class="metric-card" style="--metric:${color}"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`;
  }

  function renderListCard(list) {
    const listWords = words.filter((word) => word.list === list);
    const learned = listWords.filter((word) => getProgress(word.id).seen > 0).length;
    const mastered = listWords.filter((word) => statusOf(getProgress(word.id)) === "mastered").length;
    const percent = Math.round((learned / listWords.length) * 100);
    const first = listWords[0]?.word || "";
    const last = listWords.at(-1)?.word || "";
    return `<article class="list-card">
      <div class="list-index">${String(list).padStart(2, "0")}</div>
      <div class="list-card-body">
        <span class="eyebrow">${listWords.length} WORDS</span>
        <h3>Word List ${list}</h3>
        <p>${escapeHtml(first)} — ${escapeHtml(last)}</p>
        <div class="thin-progress"><span style="width:${percent}%"></span></div>
        <div class="list-meta"><span>${learned} 已学习</span><span>${mastered} 已掌握</span></div>
      </div>
      <button class="round-button" data-action="study-list" data-list="${list}" aria-label="学习 Word List ${list}">${icon("arrow", 18)}</button>
    </article>`;
  }

  function buildStudyQueue(selectedLists, count, onlyId = "") {
    if (onlyId) return [onlyId];
    const scoped = words.filter((word) => selectedLists.includes(word.list));
    const due = shuffle(scoped.filter((word) => {
      const progress = getProgress(word.id);
      return progress.seen > 0 && progress.due <= today();
    }));
    const fresh = shuffle(scoped.filter((word) => getProgress(word.id).seen === 0));
    const maintenance = shuffle(scoped.filter((word) => {
      const progress = getProgress(word.id);
      return progress.seen > 0 && progress.due > today();
    })).sort((a, b) => getProgress(a.id).interval - getProgress(b.id).interval);
    return [...due, ...fresh, ...maintenance].slice(0, count).map((word) => word.id);
  }

  function startStudy(selectedLists = availableLists, count = store.settings.sessionSize, onlyId = "") {
    const queue = buildStudyQueue(selectedLists, count, onlyId);
    state.study = { queue, index: 0, flipped: false, retries: {}, grades: [0, 0, 0, 0], startedAt: Date.now() };
    state.page = "study";
    renderShell();
  }

  function renderStudy() {
    if (!state.study) return renderStudySetup();
    if (state.study.index >= state.study.queue.length) return renderStudyComplete();
    const word = wordById.get(state.study.queue[state.study.index]);
    if (!word) return renderStudySetup();
    const progress = getProgress(word.id);
    const percent = Math.round((state.study.index / state.study.queue.length) * 100);
    return `
      <section class="study-stage reveal">
        <div class="study-progress"><span>${state.study.index + 1} / ${state.study.queue.length}</span><div><i style="width:${percent}%"></i></div><button class="text-button muted" data-action="end-study">结束本轮</button></div>
        <div class="flashcard-wrap ${state.study.flipped ? "is-flipped" : ""}">
          <article class="flashcard" data-action="card-flip" tabindex="0" role="button" aria-label="${state.study.flipped ? "查看单词正面" : "翻开单词卡片"}">
            <div class="card-face card-front">
              <div class="card-topline"><span>WORD LIST ${word.list}</span><button class="icon-button ${progress.starred ? "active" : ""}" data-action="star" data-word-id="${word.id}" aria-label="收藏单词">${icon("star", 21)}</button></div>
              <div class="word-center">
                <span class="word-number">NO. ${String(word.sourceOrder).padStart(3, "0")}</span>
                <h2>${escapeHtml(word.word)}</h2>
                <div class="phonetics">${word.phonetics.map((phonetic) => `<span>/${escapeHtml(phonetic)}/</span>`).join("")}</div>
                <button class="speak-button" data-action="speak" data-word="${escapeHtml(word.word)}">${icon("volume", 20)} 听发音</button>
              </div>
              <div class="flip-hint"><span>点击卡片查看释义</span><kbd>Space</kbd></div>
            </div>
            <div class="card-face card-back">
              <div class="card-topline"><span>WORD LIST ${word.list}</span><button class="icon-button ${progress.starred ? "active" : ""}" data-action="star" data-word-id="${word.id}" aria-label="收藏单词">${icon("star", 21)}</button></div>
              <div class="back-content">
                <div class="back-word"><h2>${escapeHtml(word.word)}</h2><button class="icon-button" data-action="speak" data-word="${escapeHtml(word.word)}" aria-label="播放发音">${icon("volume", 20)}</button></div>
                <div class="sense-list">${renderSenses(word)}</div>
                ${word.examples.length ? `<div class="example-block"><span>IN CONTEXT</span>${word.examples.map((example) => `<p>${highlightWord(example, word.word)}</p>`).join("")}</div>` : '<div class="example-block empty-example"><span>IN CONTEXT</span><p>原始单词表未提供例句。</p></div>'}
              </div>
              <div class="flip-hint"><span>点击卡片返回正面</span><kbd>Space</kbd></div>
            </div>
          </article>
        </div>
        <div class="grade-area ${state.study.flipped ? "visible" : ""}">
          <div class="grade-guide" aria-label="熟悉度从一到四逐渐提高，一代表最不熟悉，四代表最熟悉">
            <span>数字越大，越熟悉</span>
            <strong><b>1</b> 最不熟悉</strong>
            <i aria-hidden="true">→</i>
            <strong><b>4</b> 最熟悉</strong>
          </div>
          <div class="grade-grid">
            ${gradeButton(0, "忘记", "今天再看", "1")}
            ${gradeButton(1, "模糊", "1 天后", "2")}
            ${gradeButton(2, "熟悉", nextInterval(progress, 2), "3")}
            ${gradeButton(3, "掌握", nextInterval(progress, 3), "4")}
          </div>
        </div>
      </section>`;
  }

  function nextInterval(progress, grade) {
    if (grade === 2) return `${progress.interval < 3 ? 3 : Math.min(60, Math.round(progress.interval * 1.7))} 天后`;
    return `${progress.interval < 7 ? 7 : Math.min(120, Math.round(progress.interval * 2.2))} 天后`;
  }

  function gradeButton(grade, label, note, key) {
    return `<button class="grade-button grade-${grade}" data-action="grade" data-grade="${grade}"><kbd>${key}</kbd><strong>${label}</strong><small>${note}</small></button>`;
  }

  function renderSenses(word) {
    return word.senses.map((sense) => `<div class="sense-row">
      ${sense.partOfSpeech ? `<span class="part">${escapeHtml(sense.partOfSpeech)}.</span>` : '<span class="part">phr.</span>'}
      <div><p>${escapeHtml(sense.meaning || sense.raw)}</p>${sense.synonyms.length ? `<small><em>syn.</em> ${sense.synonyms.map(escapeHtml).join(", ")}</small>` : ""}</div>
    </div>`).join("");
  }

  function renderStudySetup() {
    return `<section class="setup-layout reveal">
      <div class="setup-intro">
        <span class="folio">STUDY SESSION</span>
        <h2>选择今天要读的页码。</h2>
        <p>到期单词会排在新单词前面。每次完成回忆，系统都会重新计算复习日期。</p>
        <div class="setup-quote"><span>“</span><p>Vocabulary grows quietly—one remembered encounter at a time.</p></div>
      </div>
      <form class="setup-form paper-panel" id="study-setup">
        <fieldset>
          <legend>单词范围</legend>
          <div class="check-grid">
            ${availableLists.map((list) => `<label><input type="checkbox" name="list" value="${list}" checked><span><strong>List ${list}</strong><small>${dataset.listCounts[list]} words</small></span></label>`).join("")}
          </div>
        </fieldset>
        <fieldset>
          <legend>本轮数量</legend>
          <div class="segment-control">
            ${[10, 20, 30, 50].map((count) => `<label><input type="radio" name="count" value="${count}" ${count === store.settings.sessionSize ? "checked" : ""}><span>${count}</span></label>`).join("")}
          </div>
        </fieldset>
        <button class="button button-accent wide" type="submit">开始学习 ${icon("arrow", 18)}</button>
        <p class="form-note">今日到期：${getOverview().due} 个 · 学习记录自动保存</p>
      </form>
    </section>`;
  }

  function renderStudyComplete() {
    const total = state.study.grades.reduce((sum, count) => sum + count, 0);
    const remembered = state.study.grades[2] + state.study.grades[3];
    const accuracy = total ? Math.round((remembered / total) * 100) : 0;
    const minutes = Math.max(1, Math.round((Date.now() - state.study.startedAt) / 60000));
    return `<section class="complete-card reveal">
      <div class="complete-seal">${icon("check", 38)}</div>
      <span class="eyebrow">SESSION COMPLETE</span>
      <h2>这一页，读完了。</h2>
      <p>新的复习日期已经写入学习记录。</p>
      <div class="complete-stats"><div><strong>${total}</strong><span>完成词次</span></div><div><strong>${accuracy}%</strong><span>回忆正确</span></div><div><strong>${minutes}</strong><span>学习分钟</span></div></div>
      <div class="complete-actions"><button class="button button-accent" data-action="restart-study">继续一轮</button><button class="button button-paper" data-page="home">返回今日</button></div>
    </section>`;
  }

  function eligiblePracticeWords(mode) {
    return words.filter((word) => word.senses.length > 0 && (mode !== "cloze" || word.examples.some((example) => new RegExp(escapeRegex(word.word), "i").test(example))));
  }

  function startPractice(mode = state.practiceMode) {
    state.practiceMode = mode;
    const eligible = eligiblePracticeWords(mode);
    const weak = eligible.filter((word) => getProgress(word.id).wrong > getProgress(word.id).correct);
    const remaining = eligible.filter((word) => !weak.includes(word));
    const queue = [...shuffle(weak), ...shuffle(remaining)].slice(0, 10).map((word) => word.id);
    state.practice = { mode, queue, index: 0, answered: false, correct: null, submitted: "", choices: [] };
    preparePracticeQuestion();
    state.page = "practice";
    renderShell();
  }

  function preparePracticeQuestion() {
    if (!state.practice || state.practice.index >= state.practice.queue.length) return;
    const current = wordById.get(state.practice.queue[state.practice.index]);
    if (state.practice.mode === "choice") {
      const distractors = shuffle(words.filter((word) => word.id !== current.id && firstMeaning(word) !== firstMeaning(current))).slice(0, 3).map(firstMeaning);
      state.practice.choices = shuffle([firstMeaning(current), ...distractors]);
    }
  }

  function renderPractice() {
    const tabs = `<div class="practice-tabs">
      ${[["choice", "释义选择"], ["spelling", "中文拼写"], ["cloze", "例句填空"]].map(([mode, label]) => `<button class="${state.practiceMode === mode ? "active" : ""}" data-action="practice-mode" data-mode="${mode}">${label}</button>`).join("")}
    </div>`;
    if (!state.practice) {
      return `${tabs}<section class="practice-welcome reveal"><span class="folio">ACTIVE RECALL</span><h2>换一种方式，<br>确认你真的记住了。</h2><p>每轮十题。答题结果会影响单词的复习日期。</p><button class="button button-accent" data-action="start-practice" data-mode="${state.practiceMode}">开始练习 ${icon("arrow", 18)}</button></section>`;
    }
    if (state.practice.index >= state.practice.queue.length) {
      return `${tabs}<section class="complete-card reveal"><div class="complete-seal">${icon("check", 38)}</div><span class="eyebrow">PRACTICE COMPLETE</span><h2>十道题，完成。</h2><p>错误单词已经进入复习队列。</p><div class="complete-actions"><button class="button button-accent" data-action="start-practice" data-mode="${state.practiceMode}">再练一轮</button><button class="button button-paper" data-page="home">返回今日</button></div></section>`;
    }
    const word = wordById.get(state.practice.queue[state.practice.index]);
    return `${tabs}<section class="quiz-shell reveal">
      <div class="quiz-meta"><span>QUESTION ${String(state.practice.index + 1).padStart(2, "0")} / ${state.practice.queue.length}</span><div><i style="width:${(state.practice.index / state.practice.queue.length) * 100}%"></i></div><span>WORD LIST ${word.list}</span></div>
      ${renderQuestion(word)}
    </section>`;
  }

  function renderQuestion(word) {
    if (state.practice.mode === "choice") {
      return `<div class="question-card"><span class="question-label">选择最接近的中文释义</span><h2>${escapeHtml(word.word)}</h2><div class="phonetics">${word.phonetics.map((item) => `<span>/${escapeHtml(item)}/</span>`).join("")}</div>
        <div class="choice-grid">${state.practice.choices.map((choice, index) => {
          const isAnswer = choice === firstMeaning(word);
          let resultClass = "";
          if (state.practice.answered && isAnswer) resultClass = "correct";
          if (state.practice.answered && index === Number(state.practice.submitted) && !isAnswer) resultClass = "wrong";
          return `<button class="choice ${resultClass}" data-action="choice-answer" data-index="${index}" ${state.practice.answered ? "disabled" : ""}><span>${String.fromCharCode(65 + index)}</span><p>${escapeHtml(choice)}</p></button>`;
        }).join("")}</div>${renderQuizFeedback(word)}</div>`;
    }

    const isCloze = state.practice.mode === "cloze";
    const example = isCloze ? word.examples.find((item) => new RegExp(escapeRegex(word.word), "i").test(item)) : "";
    const prompt = isCloze
      ? `<span class="question-label">填写例句中缺少的单词</span><p class="cloze-sentence">${escapeHtml(example).replace(new RegExp(escapeRegex(escapeHtml(word.word)), "i"), '<span class="blank">________</span>')}</p>`
      : `<span class="question-label">根据中文释义拼写单词</span><div class="meaning-prompt"><span>${escapeHtml(word.senses[0]?.partOfSpeech || "word")}</span><h2>${escapeHtml(firstMeaning(word))}</h2></div>`;
    return `<div class="question-card spelling-card">${prompt}
      <form id="spelling-form" class="answer-form"><input name="answer" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="输入英文答案" value="${escapeHtml(state.practice.submitted)}" ${state.practice.answered ? "disabled" : ""} autofocus><button class="button button-ink" type="submit" ${state.practice.answered ? "disabled" : ""}>提交答案</button></form>
      ${renderQuizFeedback(word)}
    </div>`;
  }

  function renderQuizFeedback(word) {
    if (!state.practice.answered) return "";
    const correctAnswer = state.practice.mode === "choice" ? firstMeaning(word) : word.word;
    return `<div class="quiz-feedback ${state.practice.correct ? "good" : "bad"}"><div><strong>${state.practice.correct ? "回答正确" : "正确答案"}</strong><span>${state.practice.correct ? "记忆已经得到加强。" : escapeHtml(correctAnswer)}</span></div><button class="button button-paper" data-action="practice-next">下一题 ${icon("arrow", 16)}</button></div>`;
  }

  function libraryWords() {
    const query = state.librarySearch.trim().toLowerCase();
    return words.filter((word) => {
      const progress = getProgress(word.id);
      const searchable = `${word.word} ${word.senses.map((sense) => `${sense.meaning} ${sense.synonyms.join(" ")}`).join(" ")}`.toLowerCase();
      return (!query || searchable.includes(query))
        && (state.libraryList === "all" || word.list === Number(state.libraryList))
        && (state.libraryStatus === "all" || statusOf(progress) === state.libraryStatus)
        && (!state.libraryStarred || progress.starred);
    });
  }

  function renderLibrary() {
    return `<section class="library-toolbar reveal">
      <label class="search-field">${icon("search", 19)}<input id="library-search" type="search" placeholder="搜索单词、释义或同义词" value="${escapeHtml(state.librarySearch)}"></label>
      <select id="library-list" aria-label="筛选单词表"><option value="all">全部单词表</option>${availableLists.map((list) => `<option value="${list}" ${state.libraryList === String(list) ? "selected" : ""}>Word List ${list}</option>`).join("")}</select>
      <select id="library-status" aria-label="筛选学习状态"><option value="all">全部状态</option>${[["new", "未学习"], ["learning", "学习中"], ["reviewing", "复习中"], ["mastered", "已掌握"]].map(([value, label]) => `<option value="${value}" ${state.libraryStatus === value ? "selected" : ""}>${label}</option>`).join("")}</select>
      <button class="filter-star ${state.libraryStarred ? "active" : ""}" data-action="filter-star">${icon("star", 18)} 收藏</button>
    </section>
    <section class="library-summary"><span id="library-count"></span><span>点击条目查看完整释义与例句</span></section>
    <section id="library-results" class="word-list-table"></section>`;
  }

  function updateLibraryResults() {
    const container = document.querySelector("#library-results");
    const countLabel = document.querySelector("#library-count");
    if (!container || !countLabel) return;
    const filtered = libraryWords();
    countLabel.textContent = `找到 ${filtered.length} 个条目`;
    const visible = filtered.slice(0, state.libraryVisible);
    container.innerHTML = visible.length ? visible.map(renderLibraryRow).join("") + (filtered.length > visible.length ? `<button class="load-more" data-action="library-more">继续显示 · 还剩 ${filtered.length - visible.length} 个</button>` : "") : '<div class="empty-library"><strong>没有符合条件的单词</strong><span>修改搜索词或筛选条件。</span></div>';
  }

  function renderLibraryRow(word) {
    const progress = getProgress(word.id);
    const status = statusOf(progress);
    const labels = { new: "未学习", learning: "学习中", reviewing: "复习中", mastered: "已掌握" };
    return `<details class="word-row">
      <summary>
        <span class="row-index">${String(word.sourceOrder).padStart(3, "0")}</span>
        <span class="row-word"><strong>${escapeHtml(word.word)}</strong><small>${word.phonetics.map((item) => `/${escapeHtml(item)}/`).join(" · ")}</small></span>
        <span class="row-meaning">${escapeHtml(firstMeaning(word))}</span>
        <span class="status-badge status-${status}">${labels[status]}</span>
        <span class="row-list">L${word.list}</span>
      </summary>
      <div class="row-details">
        <div><div class="sense-list">${renderSenses(word)}</div>${word.examples.length ? `<div class="example-block"><span>IN CONTEXT</span>${word.examples.map((example) => `<p>${highlightWord(example, word.word)}</p>`).join("")}</div>` : ""}</div>
        <div class="row-actions"><button class="button button-paper" data-action="speak" data-word="${escapeHtml(word.word)}">${icon("volume", 17)} 发音</button><button class="button button-paper ${progress.starred ? "active" : ""}" data-action="star" data-word-id="${word.id}">${icon("star", 17)} ${progress.starred ? "已收藏" : "收藏"}</button>${progress.seen ? `<button class="button button-quiet" data-action="reset-word" data-word-id="${word.id}">${icon("reset", 16)} 重置记录</button>` : ""}</div>
      </div>
    </details>`;
  }

  function lastSevenDays() {
    return Array.from({ length: 7 }, (_, offset) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - offset));
      const key = dateKey(date);
      const activity = store.activity[key] || { learned: 0, reviewed: 0, correct: 0, wrong: 0 };
      return { key, label: ["日", "一", "二", "三", "四", "五", "六"][date.getDay()], total: activity.learned + activity.reviewed, ...activity };
    });
  }

  function renderStats() {
    const overview = getOverview();
    const learnedPercent = Math.round((overview.learned / words.length) * 100);
    const activity = lastSevenDays();
    const maxActivity = Math.max(1, ...activity.map((day) => day.total));
    const reviewedProgress = words.map((word) => ({ word, progress: getProgress(word.id) })).filter(({ progress }) => progress.seen > 0);
    const totalAnswers = reviewedProgress.reduce((sum, item) => sum + item.progress.correct + item.progress.wrong, 0);
    const correctAnswers = reviewedProgress.reduce((sum, item) => sum + item.progress.correct, 0);
    const accuracy = totalAnswers ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
    return `<section class="stats-hero reveal">
      <div class="master-ring" style="--progress:${learnedPercent * 3.6}deg"><div><strong>${learnedPercent}%</strong><span>词库覆盖</span></div></div>
      <div><span class="folio">YOUR RECORD</span><h2>${overview.learned} 个单词，<br>已经留下学习痕迹。</h2><p>其中 ${overview.mastered} 个进入长期复习，整体回答正确率为 ${accuracy}%。</p></div>
    </section>
    <section class="stats-grid reveal delay-1">
      <article class="paper-panel activity-panel"><div class="section-heading compact"><div><span class="eyebrow">LAST 7 DAYS</span><h2>学习节奏</h2></div><strong>${activity.reduce((sum, day) => sum + day.total, 0)} 词次</strong></div><div class="activity-chart">${activity.map((day) => `<div><span class="bar-value">${day.total || ""}</span><i style="height:${Math.max(4, (day.total / maxActivity) * 100)}%"></i><small>周${day.label}</small></div>`).join("")}</div></article>
      <article class="ink-panel"><span class="eyebrow light">CURRENT</span><h2>${streakDays()}</h2><strong>连续学习天数</strong><p>今日完成 ${((store.activity[today()]?.learned || 0) + (store.activity[today()]?.reviewed || 0))} 词次</p>${icon("flame", 54)}</article>
    </section>
    <section class="section-block reveal delay-2"><div class="section-heading"><div><span class="eyebrow">BY WORD LIST</span><h2>各单词表进度</h2></div></div><div class="chapter-progress">${availableLists.map((list) => {
      const listWords = words.filter((word) => word.list === list);
      const learned = listWords.filter((word) => getProgress(word.id).seen > 0).length;
      const mastered = listWords.filter((word) => statusOf(getProgress(word.id)) === "mastered").length;
      return `<div><span>Word List ${list}</span><div class="chapter-bar"><i style="width:${(learned / listWords.length) * 100}%"></i><b style="width:${(mastered / listWords.length) * 100}%"></b></div><strong>${learned} / ${listWords.length}</strong></div>`;
    }).join("")}</div></section>
    <section class="data-panel reveal delay-3"><div><span class="eyebrow">LOCAL DATA</span><h2>学习记录保存在当前浏览器</h2><p>重置操作会清除熟悉度、复习日期、收藏和统计记录。</p></div><button class="button button-danger" data-action="reset-all">重置全部记录</button></section>`;
  }

  function speak(word) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    utterance.rate = 0.82;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  function currentStudyWord() {
    if (!state.study || state.study.index >= state.study.queue.length) return null;
    return wordById.get(state.study.queue[state.study.index]);
  }

  function handleGrade(grade) {
    const word = currentStudyWord();
    if (!word || !state.study.flipped) return;
    reviewWord(word, grade);
    state.study.grades[grade] += 1;
    if (grade === 0 && !state.study.retries[word.id]) {
      state.study.retries[word.id] = 1;
      state.study.queue.push(word.id);
    }
    state.study.index += 1;
    state.study.flipped = false;
    renderShell();
  }

  function normalizeAnswer(value) {
    return value.trim().toLowerCase().replace(/[’]/g, "'").replace(/\s+/g, " ");
  }

  function submitPracticeAnswer(value, choiceIndex = null) {
    if (!state.practice || state.practice.answered) return;
    const word = wordById.get(state.practice.queue[state.practice.index]);
    let correct;
    if (state.practice.mode === "choice") {
      correct = state.practice.choices[choiceIndex] === firstMeaning(word);
      state.practice.submitted = String(choiceIndex);
    } else {
      correct = normalizeAnswer(value) === normalizeAnswer(word.word);
      state.practice.submitted = value;
    }
    state.practice.correct = correct;
    state.practice.answered = true;
    reviewWord(word, correct ? (state.practice.mode === "choice" ? 2 : 3) : 0);
    renderShell();
  }

  document.addEventListener("click", (event) => {
    const control = event.target.closest("[data-action], [data-page]");
    if (!control) return;
    const page = control.dataset.page;
    if (page) {
      state.page = page;
      renderShell();
      if (page === "library") updateLibraryResults();
      return;
    }
    const action = control.dataset.action;
    if (!action) return;
    if (action === "quick-start") startStudy();
    if (action === "study-list") startStudy([Number(control.dataset.list)], store.settings.sessionSize);
    if (action === "study-word") startStudy([], 1, control.dataset.wordId);
    if (action === "card-flip") { state.study.flipped = !state.study.flipped; renderShell(); }
    if (action === "grade") handleGrade(Number(control.dataset.grade));
    if (action === "speak") speak(control.dataset.word || currentStudyWord()?.word || "");
    if (action === "star") {
      event.stopPropagation();
      toggleStar(control.dataset.wordId);
      renderShell();
      if (state.page === "library") updateLibraryResults();
    }
    if (action === "end-study") { state.study = null; renderShell(); }
    if (action === "restart-study") startStudy();
    if (action === "practice-mode") { state.practiceMode = control.dataset.mode; state.practice = null; renderShell(); }
    if (action === "start-practice") startPractice(control.dataset.mode);
    if (action === "choice-answer") submitPracticeAnswer("", Number(control.dataset.index));
    if (action === "practice-next") {
      state.practice.index += 1;
      state.practice.answered = false;
      state.practice.correct = null;
      state.practice.submitted = "";
      state.practice.choices = [];
      preparePracticeQuestion();
      renderShell();
    }
    if (action === "filter-star") { state.libraryStarred = !state.libraryStarred; state.libraryVisible = 36; renderShell(); updateLibraryResults(); }
    if (action === "library-more") { state.libraryVisible += 36; updateLibraryResults(); }
    if (action === "reset-word" && window.confirm("确认重置这个单词的学习记录？")) {
      delete store.progress[control.dataset.wordId];
      saveStore();
      renderShell();
      updateLibraryResults();
    }
    if (action === "reset-all" && window.confirm("确认清除全部学习记录？此操作无法撤销。")) {
      store = defaultStore();
      saveStore();
      state.study = null;
      state.practice = null;
      renderShell();
    }
  });

  document.addEventListener("submit", (event) => {
    if (event.target.id === "study-setup") {
      event.preventDefault();
      const formData = new FormData(event.target);
      const lists = formData.getAll("list").map(Number);
      const count = Number(formData.get("count") || 20);
      if (!lists.length) {
        window.alert("请至少选择一个单词表。");
        return;
      }
      store.settings.sessionSize = count;
      saveStore();
      startStudy(lists, count);
    }
    if (event.target.id === "spelling-form") {
      event.preventDefault();
      const value = new FormData(event.target).get("answer")?.toString() || "";
      if (value.trim()) submitPracticeAnswer(value);
    }
  });

  document.addEventListener("input", (event) => {
    if (event.target.id === "library-search") {
      state.librarySearch = event.target.value;
      state.libraryVisible = 36;
      updateLibraryResults();
    }
  });

  document.addEventListener("change", (event) => {
    if (event.target.id === "library-list") {
      state.libraryList = event.target.value;
      state.libraryVisible = 36;
      updateLibraryResults();
    }
    if (event.target.id === "library-status") {
      state.libraryStatus = event.target.value;
      state.libraryVisible = 36;
      updateLibraryResults();
    }
  });

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
    if (state.page !== "study" || !state.study || state.study.index >= state.study.queue.length) return;
    if (event.code === "Space") {
      event.preventDefault();
      state.study.flipped = !state.study.flipped;
      renderShell();
    }
    if (["Digit1", "Digit2", "Digit3", "Digit4"].includes(event.code)) handleGrade(Number(event.code.slice(-1)) - 1);
    if (event.key.toLowerCase() === "p") speak(currentStudyWord()?.word || "");
    if (event.key.toLowerCase() === "f") {
      const word = currentStudyWord();
      if (word) { toggleStar(word.id); renderShell(); }
    }
  });

  renderShell();
  if (state.page === "library") updateLibraryResults();
})();
