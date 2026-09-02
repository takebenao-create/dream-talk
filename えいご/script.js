document.addEventListener("DOMContentLoaded", () => {
  // ----------------------------
  // 音声読み上げの基本設定
  // ----------------------------
  const synth = window.speechSynthesis;

  if (!synth || typeof SpeechSynthesisUtterance === "undefined") {
    console.warn("このブラウザでは音声読み上げ機能が利用できません。");
    return;
  }

  function getEnglishVoice() {
    const voices = synth.getVoices();

    return (
      voices.find(
        (voice) =>
          voice.lang === "en-US" &&
          /Samantha|Google US English|Microsoft Jenny/i.test(voice.name)
      ) ||
      voices.find((voice) => voice.lang === "en-US") ||
      voices.find((voice) => voice.lang && voice.lang.startsWith("en")) ||
      null
    );
  }

  function speak(text, rate = 0.92) {
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = rate;
    utterance.pitch = 1;

    const voice = getEnglishVoice();
    if (voice) {
      utterance.voice = voice;
    }

    synth.speak(utterance);
  }

  function speakAnswer(rate = 0.92) {
    const jobSelect = document.getElementById("job");
    if (!jobSelect) return;

    const job = jobSelect.value;
    speak(`I want to be a ${job}.`, rate);
  }

  // ブラウザによって音声一覧の読み込みが遅れるため
  if ("onvoiceschanged" in synth) {
    synth.onvoiceschanged = () => getEnglishVoice();
  }

  // ----------------------------
  // 1ページ目：発音練習
  // ----------------------------
  document.querySelectorAll(".practice-audio").forEach((button) => {
    button.addEventListener("click", () => {
      const text = button.dataset.text || "";
      const rate = Number(button.dataset.rate) || 0.92;
      speak(text, rate);
    });
  });

  document.querySelectorAll(".answer-audio").forEach((button) => {
    button.addEventListener("click", () => {
      const rate = Number(button.dataset.rate) || 0.92;
      speakAnswer(rate);
    });
  });

  // ----------------------------
  // ページ切り替え
  // ----------------------------
  const page1 = document.getElementById("page1");
  const page2 = document.getElementById("page2");
  const toPage2 = document.getElementById("toPage2");
  const toPage1 = document.getElementById("toPage1");

  function showPage(pageNumber) {
    if (!page1 || !page2) return;

    const firstPage = pageNumber === 1;
    page1.classList.toggle("active", firstPage);
    page2.classList.toggle("active", !firstPage);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  if (toPage2) {
    toPage2.addEventListener("click", () => showPage(2));
  }

  if (toPage1) {
    toPage1.addEventListener("click", () => showPage(1));
  }

  // ----------------------------
  // 2ページ目：男女の声
  // ----------------------------
  function getVoicesByGender() {
    const voices = synth
      .getVoices()
      .filter(
        (voice) =>
          voice.lang &&
          voice.lang.toLowerCase().startsWith("en")
      );

    const malePattern =
      /Alex|Daniel|Fred|Aaron|Arthur|Oliver|Tom|David|Guy|Male/i;

    const femalePattern =
      /Samantha|Victoria|Karen|Moira|Tessa|Ava|Susan|Zira|Jenny|Female/i;

    const male =
      voices.find((voice) => malePattern.test(voice.name)) ||
      voices.find((voice) => /en-US|en-GB/i.test(voice.lang)) ||
      voices[0] ||
      null;

    const female =
      voices.find(
        (voice) =>
          femalePattern.test(voice.name) &&
          (!male || voice.name !== male.name)
      ) ||
      voices.find(
        (voice) =>
          (!male || voice.name !== male.name) &&
          /en-US|en-GB/i.test(voice.lang)
      ) ||
      voices.find((voice) => !male || voice.name !== male.name) ||
      male ||
      null;

    return { male, female };
  }

  function createUtterance(text, gender, rate = 0.9) {
    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = "en-US";
    utterance.rate = rate;
    utterance.pitch = gender === "female" ? 1.08 : 0.92;

    const { male, female } = getVoicesByGender();
    const selectedVoice = gender === "female" ? female : male;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    return utterance;
  }

  function speakWithGender(text, gender, rate = 0.9) {
    synth.cancel();
    synth.speak(createUtterance(text, gender, rate));
  }

  document.querySelectorAll(".line-audio").forEach((button) => {
    button.addEventListener("click", () => {
      const text = button.dataset.text || "";
      const gender = button.dataset.voice || "male";
      speakWithGender(text, gender, 0.9);
    });
  });

  const conversationLines = [
    { text: "Hi!", voice: "male" },
    { text: "Hi!", voice: "female" },
    { text: "What do you want to be?", voice: "male" },
    { text: "I want to be a soccer player.", voice: "female" },
    { text: "Why?", voice: "male" },
    { text: "I like soccer.", voice: "female" },
    { text: "Nice! Good luck!", voice: "male" },
    { text: "Thank you!", voice: "female" },
    { text: "Thank you. See you!", voice: "male" },
    { text: "See you!", voice: "female" }
  ];

  const playConversation = document.getElementById("playConversation");
  const stopConversation = document.getElementById("stopConversation");

  function playConversationSequence(index = 0) {
    if (index >= conversationLines.length) return;

    const line = conversationLines[index];
    const utterance = createUtterance(line.text, line.voice, 0.88);

    utterance.onend = () => {
      window.setTimeout(() => {
        playConversationSequence(index + 1);
      }, 280);
    };

    synth.speak(utterance);
  }

  if (playConversation) {
    playConversation.addEventListener("click", () => {
      synth.cancel();

      window.setTimeout(() => {
        playConversationSequence(0);
      }, 100);
    });
  }

  if (stopConversation) {
    stopConversation.addEventListener("click", () => {
      synth.cancel();
    });
  }
});
