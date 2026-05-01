# CLAUDE.md — אתר שנתיים לעמית 💚

## סקירה כללית

אתר אהבה אישי ואינטראקטיבי לזוג, בנוי כ-PWA מלא עם Firebase backend.
האתר מחולק לשני נתיבים נפרדים (קישורים שונים לכל אחד) עם תוכן משותף מסונכרן בזמן אמת.

---

## Stack טכנולוגי

| שכבה | טכנולוגיה |
|------|-----------|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Backend / DB | Firebase Firestore |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| Hosting | Firebase Hosting |
| Real-time (משחקים סינכרוניים) | Firestore real-time listeners |
| PWA | Vite PWA plugin + Service Worker |

---

## ארכיטקטורת הנתיבים

```
/                  → Entry Experience (אנימציית פתיחה + כספת)
/her               → ממשק עמית (רואה פתקים שלו, כותבת פתקים שלה)
/him               → ממשק שלו (רואה פתקים שלה, כותב פתקים שלו)
```

כל נתיב מקבל token ייחודי ב-URL שמזהה את המשתמש.
**אין מסך בחירה** — כל אחד מקבל את הלינק שלו מראש.

---

## שלב 1 — Entry Experience 🐴

### 1.1 מסך פתיחה
- תמונת הסוס-חזיר (placeholder עד שהמשתמש יעלה תמונה אמיתית)
- אנימציית **החלקה ימינה** על התמונה לפתיחת הקופסה
- אפקט קופסה נפתחת (CSS 3D transform)
- **חוט בולט** בתחתית הקופסה — ניתן למשיכה

### 1.2 כספת
- משיכת החוט → לוח ספרות דיגיטלי (סגנון כספת/קלמר ישן)
- הקלדת `1105` → אנימציית פתיחה (רעד + קליק מתכתי + ירוק)
- קוד שגוי → רעידת לוח + אדום קצר
- אחרי פתיחה → redirect ל-`/her` או `/him` לפי הלינק

### קבצים רלוונטיים
```
src/pages/Entry.jsx
src/components/entry/HorsePig.jsx
src/components/entry/SafeDial.jsx
src/components/entry/WireAnimation.jsx
```

---

## שלב 2 — הצנצנת 🫙

### לוגיקה
- **Firestore collections:**
  - `notes/her_notes` — פתקים שהוא כתב (רק היא רואה)
  - `notes/him_notes` — פתקים שהיא כתבה (רק הוא רואה)
- כל פתק: `{ id, text, emoji?, imageUrl?, createdAt, pulled: false }`
- שליפה: רנדומלי מתוך `pulled: false`, לאחר שליפה → `pulled: true`
- **היסטוריה:** כל הפתקים עם `pulled: true`, מסודרים לפי `createdAt`

### ויזואל
- צנצנת זכוכית CSS 3D עם פתקים מרחפים (float animation)
- מכסה שמסתובב עם swipe ימינה
- אנימציית "פתק עולה ונפרש" לאחר שליפה
- כפתור "כתוב פתק" → modal עם:
  - textarea לטקסט
  - emoji picker
  - העלאת תמונה (אופציונלי)

### התראות
- כשנוסף פתק → FCM push לצד השני: "יש לך פתק חדש 💚"

### קבצים רלוונטיים
```
src/pages/Home.jsx
src/components/jar/Jar.jsx
src/components/jar/NoteCard.jsx
src/components/jar/WriteNoteModal.jsx
src/components/jar/NoteHistory.jsx
```

---

## שלב 3 — מסוע תמונות 🖼️

- רצועת תמונות שזזה אוטומטית משמאל לימין (CSS animation)
- לחיצה/גרירה → עצירה + גלילה ידנית
- **אין אפקטים על התמונות** — תמונות רגילות, נקיות
- תמונות placeholder בשלב ראשון, ניתנות להחלפה קלה בקוד
- כיתוב קצר אופציונלי לכל תמונה (שדה `caption`)

### קבצים רלוונטיים
```
src/components/gallery/PhotoStrip.jsx
src/assets/photos/ ← תמונות מוחלפות כאן
```

---

## שלב 4 — ספירת זמן ⏱️

- מציג **רק מספר ימים** — מספר גדול בלבד, ללא טקסט נוסף
- מתעדכן אחת לחצות
- תאריך התחלה קבוע בקוד:

```js
// src/config.js
export const ANNIVERSARY_DATE = new Date('2023-05-11'); // לעדכן!
```

### קבצים רלוונטיים
```
src/components/DayCounter.jsx
src/config.js
```

---

## שלב 5 — משחקים 🎮

### אסינכרוניים (תורות, לא בזמן אמת)

#### 1. 4 בשורה
- לוח 7×6 קלאסי
- Firestore: `games/connect4/{ board, currentTurn, winner }`
- תור נשמר ב-DB, push notification לשחקן שתורו
- מנגנון ניצחון: 4 ברצף (אופקי/אנכי/אלכסוני)

#### 2. Wordle זוגי
- מילה יומית אחת (עברית, 5 אותיות) — אותה מילה לשניהם
- כל אחד פותר בנפרד, התוצאות מוסתרות ב-Firestore עד שניהם סיימו
- בסוף → גילוי הדדי: מי ניחש בפחות ניסיונות
- מילים מרשימה מוכנה מראש (`src/data/words.js`)

#### 3. ציור מהיר (אסינכרוני)
- שחקן א' מקבל מילה, מצייר על canvas
- שחקן ב' רואה את הציור ומנחש
- תורות מתחלפים
- Firestore: `games/drawing/{ word, canvas (base64), guesser, guess }`

### סינכרוניים (בזמן אמת — Firestore real-time listeners)

#### 4. טריוויה מהירה
- שאלה מופיעה לשניהם בו זמנית
- מי שלוחץ ראשון + עונה נכון מנצח נקודה
- 10 שאלות לסשן, שאלות מ-`src/data/trivia.js`
- Firestore: `games/trivia/{ currentQ, firstClick, scores }`

#### 5. Snake Wars
- שני נחשים על לוח משותף
- כיווני שליטה: WASD לאחד, חצים לשני (מובייל: swipe)
- מי שמתנגש מפסיד
- Firestore מסנכרן מיקום כל **150ms** (לא פחות — לחסוך reads)

#### 6. זיכרון מהיר
- 16 קלפים (8 זוגות), פרופסים לשניהם
- תורות — מי שמצא זוג ממשיך
- נקודה לכל זוג שנמצא, מי שסיים עם יותר מנצח
- Firestore: `games/memory/{ cards, flipped, matched, currentTurn, scores }`

### Firestore — מבנה משחקים מלא
```
games/
  connect4/
    board: [][]
    currentTurn: 'her' | 'him'
    winner: null | 'her' | 'him'
  wordle/
    todayWord: string
    her: { guesses: [], solved: bool, done: bool }
    him: { guesses: [], solved: bool, done: bool }
  drawing/
    word: string
    canvas: string (base64)
    guesser: 'her' | 'him'
    guess: string
  trivia/
    sessionId: string
    questions: []
    scores: { her: 0, him: 0 }
    currentQ: number
    firstClick: null | 'her' | 'him'
  snake/
    her: { positions: [], direction: '' }
    him: { positions: [], direction: '' }
    food: { x, y }
    alive: { her: true, him: true }
  memory/
    cards: []
    flipped: []
    matched: []
    currentTurn: 'her' | 'him'
    scores: { her: 0, him: 0 }
```

---

## שלב 6 — לוח דירוג 🏆

### Firestore
```
scores/
  sessions/
    [sessionId]/
      date: timestamp
      results: { game: string, winner: 'her'|'him'|'tie' }[]
      totals: { her: number, him: number }
  allTime/
    her: number
    him: number
```

### תצוגה
- **סשן נוכחי:** ניקוד חי תוך כדי משחק
- **היסטוריה:** רשימת סשנים קודמים עם תאריך + תוצאה
- **הבלטת מוביל:** כתר 👑 + ירוק בהיר למוביל בכל קטגוריה

---

## שלב 7 — PWA + Notifications 📱

### manifest.json
```json
{
  "name": "💚",
  "short_name": "💚",
  "theme_color": "#1a3a2a",
  "background_color": "#0d1f16",
  "display": "standalone",
  "start_url": "/"
}
```

### Service Worker
- Cache לכל ה-assets (offline support)
- FCM background message handler
- Push על:
  - פתק חדש נוסף
  - תורך במשחק אסינכרוני
  - הזמנה למשחק סינכרוני

### הרשאות
- בקשת הרשאת push בכניסה הראשונה לאחר פתיחת הכספת
- שמירת FCM token ב-Firestore לפי משתמש: `users/her/fcmToken` ו-`users/him/fcmToken`

---

## עיצוב — Design System 🎨

### פלטת צבעים
```css
:root {
  --bg:        #0d1f16;   /* ירוק כהה מאוד — רקע */
  --surface:   #1a3a2a;   /* ירוק כהה — כרטיסים */
  --accent:    #2d6a4f;   /* ירוק בינוני — הדגשות */
  --highlight: #52b788;   /* ירוק בהיר — CTA / active */
  --text:      #d8f3dc;   /* ירוק כמעט לבן — טקסט ראשי */
  --muted:     #74c69d;   /* ירוק — טקסט משני */
  --gold:      #f4a261;   /* כתום זהב — כתר / מוביל */
}
```

### טיפוגרפיה
- כותרות: `Playfair Display` (Google Fonts) — רומנטי, עדין
- גוף: `DM Sans` — נקי, קריא
- מספרים (ספירת ימים, כספת): `Courier Prime` — מונו, וינטג'

### אנימציות
- כניסת אלמנטים: `fadeInUp` עם stagger
- הצנצנת: `float` loop עדין על הפתקים
- מסוע: `scroll-x` אוטומטי, עצירה על hover/touch
- כספת: `shake` על קוד שגוי, `pulse-green` על הצלחה

### כיוון
- כל האתר `dir="rtl"` — עברית ראשית
- Tailwind: להוסיף `rtl` variant בהגדרות

---

## מבנה תיקיות

```
/
├── public/
│   ├── horse-pig.png              ← placeholder — להחלפה בתמונה אמיתית
│   ├── manifest.json
│   └── firebase-messaging-sw.js
├── src/
│   ├── config.js                  ← ANNIVERSARY_DATE, Firebase config, TOKENS
│   ├── firebase.js                ← Firebase init
│   ├── main.jsx
│   ├── App.jsx                    ← Router: /, /her, /him
│   ├── pages/
│   │   ├── Entry.jsx              ← כניסה + כספת
│   │   ├── Home.jsx               ← דף ראשי (צנצנת + מסוע + ספירה)
│   │   └── Games.jsx              ← רשימת משחקים + דירוג
│   ├── components/
│   │   ├── entry/
│   │   │   ├── HorsePig.jsx
│   │   │   ├── SafeDial.jsx
│   │   │   └── WireAnimation.jsx
│   │   ├── jar/
│   │   │   ├── Jar.jsx
│   │   │   ├── NoteCard.jsx
│   │   │   ├── WriteNoteModal.jsx
│   │   │   └── NoteHistory.jsx
│   │   ├── gallery/
│   │   │   └── PhotoStrip.jsx
│   │   ├── games/
│   │   │   ├── Connect4.jsx
│   │   │   ├── Wordle.jsx
│   │   │   ├── Drawing.jsx
│   │   │   ├── Trivia.jsx
│   │   │   ├── Snake.jsx
│   │   │   └── Memory.jsx
│   │   ├── Scoreboard.jsx
│   │   └── DayCounter.jsx
│   ├── hooks/
│   │   ├── useUser.js             ← זיהוי her/him מה-URL token
│   │   ├── useNotes.js
│   │   ├── useGame.js
│   │   └── useNotifications.js
│   ├── data/
│   │   ├── words.js               ← מילים עבריות 5 אותיות ל-Wordle
│   │   └── trivia.js              ← שאלות טריוויה
│   └── styles/
│       └── globals.css
├── firebase.json
├── firestore.rules
└── vite.config.js
```

---

## Firebase Security Rules

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /notes/{doc} {
      allow read, write: if true;
    }
    match /games/{doc} {
      allow read, write: if true;
    }
    match /scores/{doc=**} {
      allow read, write: if true;
    }
    match /users/{doc} {
      allow read, write: if true;
    }
  }
}
```

> ⚠️ Rules מקלות — מתאים כי האתר סגור עם token ב-URL ולא public.

---

## config.js — ערכים לעדכון לפני Deploy

```js
// src/config.js
export const ANNIVERSARY_DATE = new Date('2023-05-11'); // ← תאריך אמיתי!

export const TOKENS = {
  her: 'REPLACE_WITH_RANDOM_STRING_1',  // ← לינק לעמית
  him: 'REPLACE_WITH_RANDOM_STRING_2',  // ← לינק שלך
};

export const firebaseConfig = {
  // ← מהגדרות Firebase Console
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
};
```

---

## סדר בנייה — Phase Plan

```
Phase 1 — תשתית (30 דק')
  □ Firebase project + Firestore + FCM + Hosting setup
  □ Vite + React + Tailwind + PWA plugin
  □ Router: /, /her, /him
  □ useUser hook (זיהוי מ-?token= ב-URL)
  □ Design system (CSS variables + Google Fonts)
  □ dir="rtl" על body

Phase 2 — Entry Experience (45 דק')
  □ תמונת סוס-חזיר + swipe ימינה → אנימציית פתיחה
  □ קופסה נפתחת (CSS 3D)
  □ חוט + משיכה (drag animation)
  □ לוח כספת דיגיטלי (ספרות מונו)
  □ קוד 1105 → redirect לפי token

Phase 3 — Core Features (60 דק')
  □ צנצנת + פתקים מרחפים (Firestore + float animation)
  □ שליפת פתק רנדומלי (pulled logic)
  □ modal כתיבת פתק (טקסט + emoji + תמונה)
  □ היסטוריית פתקים
  □ מסוע תמונות (auto-scroll, drag to pause)
  □ ספירת ימים (מספר בלבד, Courier Prime גדול)

Phase 4 — Notifications (30 דק')
  □ FCM setup + Service Worker
  □ שמירת token ב-Firestore
  □ Push על: פתק חדש / תורך / הזמנה למשחק

Phase 5 — משחקים אסינכרוניים (90 דק')
  □ 4 בשורה (עם push notification לתור)
  □ Wordle זוגי עברית
  □ ציור מהיר (canvas + base64 Firestore)

Phase 6 — משחקים סינכרוניים (90 דק')
  □ טריוויה מהירה (real-time listener)
  □ Snake Wars (150ms sync)
  □ זיכרון מהיר

Phase 7 — דירוג + Polish (45 דק')
  □ Scoreboard (סשן נוכחי + היסטוריה + כתר)
  □ אנימציות כניסה (stagger fadeInUp)
  □ בדיקות נייד — iOS Safari + Android Chrome
  □ firebase deploy
```

---

## הערות לקלוד קוד

1. **Token זיהוי** — URL יכיל `?token=X`. `useUser()` קורא אותו ומחזיר `'her' | 'him'`. שמור tokens ב-`config.js` בלבד.
2. **הפרדת פתקים** — הלוגיקה היא בקוד. `her` רואה רק `her_notes` (שהוא כתב). `him` רואה רק `him_notes` (שהיא כתבה).
3. **horse-pig.png** — placeholder. המשתמש יחליף את הקובץ. אל תשנה את שם הקובץ.
4. **ANNIVERSARY_DATE** — ב-`config.js`. המשתמש יעדכן לתאריך האמיתי.
5. **Mobile first** — כל layout מתוכנן לנייד 390px. Desktop secondary.
6. **RTL** — `dir="rtl"` על `<html>`. Tailwind RTL variants פעילים.
7. **Wordle עברית** — רשימת מילים ב-`src/data/words.js`, מילה יומית לפי `dayOfYear % words.length`.
8. **Snake 150ms** — לא פחות, לחסוך Firestore quota.
9. **ציור מהיר** — canvas נשמר כ-base64 string ב-Firestore. לדחוס לפני שמירה אם גדול מ-500KB.
10. **Deploy** — `firebase deploy --only hosting,firestore` אחרי `vite build`.
