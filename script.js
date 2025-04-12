const elements = {
  commentaryList: document.getElementById("commentary-list"),
  promoBanner: document.getElementById("promoBanner"),
  lastSix: document.getElementById("last-six"),
  lastFour: document.getElementById("last-four"),
  audio: document.getElementById("sixAudio"),
};

let allCommentary = [];
let latestSix = null;
let lastSixTime = null;
let promoWasShown = false;
let latestFour = null;
let audioUnlocked = false;
let soundTriggered = false;
let matchId = null;

function showMatchLoadError(message) {
  const statusElement = document.getElementById("match-status");
  if (statusElement) {
    statusElement.textContent = message;
    statusElement.style.color = "red";
    statusElement.style.fontWeight = "bold";
  }
}

async function getMatchIdAndStart() {
  try {
    const res = await fetch("https://simply-ai.online/get_current_match_id");

    if (res.ok) {
      const data = await res.json();
      matchId = data?.link;

      if (!matchId) {
        showMatchLoadError("⚠️ No match ID returned from server.");
        return;
      }

      // Start fetching only after matchId is available
      fetchCommentary();
      setInterval(fetchCommentary, 15000);
      document.getElementById("loadMoreBtn").addEventListener("click", loadMore);
    } else {
      showMatchLoadError("❌ Failed to retrieve match ID.");
    }
  } catch (err) {
    console.error("Error fetching match ID:", err);
    showMatchLoadError("❌ Unable to connect to server.");
  }
}

function enableSoundOnUserInteraction() {
  const unlock = () => {
    audioUnlocked = true;
    if (promoWasShown && !soundTriggered) {
      soundTriggered = true;

      document.getElementById("enable-sound").style.display = "none";
      setTimeout(() => {
        playSixSound();
      }, 1000);
    }
    window.removeEventListener("click", unlock);
    window.removeEventListener("touchstart", unlock);
  };

  window.addEventListener("click", unlock, { once: true });
  window.addEventListener("touchstart", unlock, { once: true });
}
enableSoundOnUserInteraction();

async function fetchCommentary() {
  const res = await fetch(`https://www.cricbuzz.com/api/cricket-match/commentary/${matchId}`);
  const data = await res.json();
  const match = data.matchHeader;
  const score = data.miniscore;

  // Update match info
  document.getElementById("match-description").textContent = `${match.matchDescription} (${match.matchFormat})`;
  document.getElementById("match-status").textContent = match.status;
  processAndMerge(data.commentaryList);
  updateMiniScore(score);
}

function updateMiniScore(miniscore) {
  const details = miniscore.matchScoreDetails;
  const teamMap = {};
  details.matchTeamInfo.forEach((team) => {
    teamMap[team.battingTeamId] = team.battingTeamShortName;
  });

  const [firstInnings, secondInnings] = details.inningsScoreList;
  console.log(firstInnings);
  const team1Short = teamMap[firstInnings.batTeamId];
  if (secondInnings) {
    const team2Short = teamMap[secondInnings.batTeamId];
  }

  // Format overs
  function formatOvers(overs) {
    const whole = Math.floor(overs);
    const partial = Math.round((overs - whole) * 10);
    return partial === 6 ? `${whole + 1}` : `${whole}.${partial}`;
  }

  // Update DOM
  document.getElementById("innings1").textContent = `${team1Short} ${firstInnings.score}/${firstInnings.wickets} (${formatOvers(firstInnings.overs)})`;
  if (secondInnings) {
    document.getElementById("innings2").textContent = `${team2Short} ${secondInnings.score}/${secondInnings.wickets} (${formatOvers(secondInnings.overs)}) ` + `CRR: ${miniscore.currentRunRate}  REQ: ${miniscore.requiredRunRate}`;
  }
  document.getElementById("statusLine").textContent = details.customStatus;
}

async function loadMore() {
  const lastTimestamp = Math.min(...allCommentary.map((c) => c.timestamp));
  const res = await fetch(`https://www.cricbuzz.com/api/cricket-match/commentary-pagination/${matchId}/1/${lastTimestamp}`);
  const data = await res.json();
  processAndMerge(data.commentaryList, true);
}

function processAndMerge(newList) {
  // Use a Set for fast lookup
  const existingTimestamps = new Set(allCommentary.map((item) => item.timestamp));

  // Add only unique items
  newList.forEach((item) => {
    if (!existingTimestamps.has(item.timestamp)) {
      allCommentary.push(item);
    }
  });

  // Sort newest first
  allCommentary.sort((a, b) => b.timestamp - a.timestamp);

  // Render it all
  renderCommentary(allCommentary);
}

function formatOverNum(overNum) {
  const decimal = Math.round((overNum % 1) * 10); // gives 0–6

  if (decimal === 6) {
    return Math.floor(overNum) + 1;
  }

  return overNum.toFixed(1);
}

function renderOverCardInline(data) {
  const div = document.createElement("div");
  div.className = "over-card";
  div.innerHTML = `
    <div><strong>${formatOverNum(data.overNum)}</strong></div>
    <div>Runs Scored: <strong>${data.runs}</strong><br>${data.o_summary}</div>
    <div>Score after ${formatOverNum(data.overNum)} overs<br><strong>${data.batTeamName} ${data.score}-${data.wickets}</strong></div>
    <div>${data.batStrikerNames.join(", ")} ${data.batStrikerRuns}(${data.batStrikerBalls})<br>${data.batNonStrikerNames.join(", ")} ${data.batNonStrikerRuns}(${data.batNonStrikerBalls})</div>
    <div>${data.bowlNames[0]}<br>${data.bowlOvers}-${data.bowlMaidens}-${data.bowlRuns}-${data.bowlWickets}</div>
  `;
  return div;
}

function renderCommentary(comments) {
  elements.commentaryList.innerHTML = "";
  latestSix = null;
  latestFour = null;

  comments.forEach((item) => {
    if (item.event.includes("over-break") && item.overSeparator) {
      elements.commentaryList.appendChild(renderOverCardInline(item.overSeparator));
    }

    let commText = item.commText;
    let overNumber = item.overNumber ? `<strong>${item.overNumber}</strong> - \t` : "";
    const boldIds = item.commentaryFormats?.bold?.formatId || [];
    const boldValues = item.commentaryFormats?.bold?.formatValue || [];

    boldIds.forEach((id, idx) => {
      const val = boldValues[idx];
      const boldVal = `<strong>${val}</strong>`;
      commText = commText.replaceAll(id, boldVal).replace(/\\n/g, "<br>");
    });
    commText = overNumber + commText;

    const fullText = (commText + " " + boldValues.join(" ")).toLowerCase();
    const timestamp = new Date(Number(item.timestamp));

    if (fullText.includes("six")) {
      if (!latestSix || timestamp > latestSix.time) {
        latestSix = { text: commText, time: timestamp };
      }
    }

    if (fullText.includes("four")) {
      if (!latestFour || timestamp > latestFour.time) {
        latestFour = { text: commText, time: timestamp };
      }
    }

    const p = document.createElement("p");
    p.innerHTML = commText;
    elements.commentaryList.appendChild(p);
  });

  const now = new Date();

  if (latestSix && now - latestSix.time < 6 * 60 * 1000) {
    const isNewSix = !lastSixTime || latestSix.time > lastSixTime;

    // 🔥 Also check if this is the first time showing promo
    const shouldPlaySound = isNewSix || !promoWasShown;

    if (shouldPlaySound) {
      playSixSound();
    }

    lastSixTime = latestSix.time;
    promoWasShown = true;
    document.title = "SWIGGY66 Available - Live Cricket Score"; // 🔼 Set tab title
    elements.promoBanner.style.display = "block";
  } else {
    promoWasShown = false;
    document.title = "Live Cricket Score";
    elements.promoBanner.style.display = "none";
  }

  updateLastHitDisplay();
}

function updateLastHitDisplay() {
  elements.lastSix.innerText = latestSix ? `Last Six: ${latestSix.time.toLocaleTimeString()}` : "Last Six: N/A";
  elements.lastFour.innerText = latestFour ? `Last Four: ${latestFour.time.toLocaleTimeString()}` : "Last Four: N/A";
}
function playSixSound() {
  const audio = document.getElementById("sixAudio");

  let playStart = Date.now();

  audio.currentTime = 0;
  audio.play().catch(() => {});

  // Set to loop
  audio.loop = true;

  // Stop after 15 seconds
  setTimeout(() => {
    audio.pause();
    audio.loop = false;
    audio.currentTime = 0;
  }, 6000);
}

document.getElementById("loadMoreBtn").addEventListener("click", loadMore);
getMatchIdAndStart();
setInterval(fetchCommentary, 15000);
fetchCommentary();
renderCommentary(allCommentary);
