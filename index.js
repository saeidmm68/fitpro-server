const express = require('express');
const admin = require('firebase-admin');
const cron = require('node-cron');
const app = express();

app.use(express.json());

// Firebase Admin init
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Store tokens
let userTokens = [];

// Save token endpoint
app.post('/save-token', (req, res) => {
  const { token } = req.body;
  if (token && !userTokens.includes(token)) {
    userTokens.push(token);
    console.log('Token saved:', token.substring(0, 20) + '...');
  }
  res.json({ success: true });
});

app.get('/', (req, res) => res.json({ status: 'FitPro notification server running', tokens: userTokens.length }));

app.get('/test', async (req, res) => {
  if (userTokens.length === 0) {
    return res.json({ success: false, message: 'هیچ token ذخیره نشده' });
  }
  await sendNotif('🧪 تست نوتیف', 'سعید جان، نوتیف کار میکنه! 💪');
  res.json({ success: true, message: 'نوتیف فرستاده شد' });
});

// Send notification function
async function sendNotif(title, body) {
  if (userTokens.length === 0) return;
  for (const token of userTokens) {
    try {
      await admin.messaging().send({
        token,
        notification: { title, body },
        android: { priority: 'high' },
        webpush: {
          notification: { icon: 'https://saeidmm68.github.io/MY-GYM/icon-192.png', vibrate: [200, 100, 200] },
          headers: { Urgency: 'high' }
        }
      });
    } catch (e) {
      if (e.code === 'messaging/registration-token-not-registered') {
        userTokens = userTokens.filter(t => t !== token);
      }
    }
  }
}

// Iran timezone offset = UTC+3:30
// So Iran 07:00 = UTC 03:30
const schedule = [
  { cron: '30 3 * * *',  title: '🍳 صبحانه',        body: '۳ تخم‌مرغ + ماست — پروتئین صبح رو نخور!' },
  { cron: '0 4 * * *',   title: '🦴 کلسیم',          body: 'کلسیم صبح رو با غذا بخور' },
  { cron: '30 6 * * *',  title: '💧 آب',              body: 'یه لیوان آب بنوش' },
  { cron: '0 9 * * *',   title: '🍗 ناهار',           body: '۲۰۰g پروتئین فراموش نشه' },
  { cron: '30 10 * * *', title: '💧 آب',              body: 'یه لیوان آب بنوش' },
  { cron: '30 11 * * *', title: '🍎 میان‌وعده',      body: 'میوه + ۲ تخم‌مرغ' },
  { cron: '0 13 * * *',  title: '💧 آب',              body: 'یه لیوان آب بنوش' },
  { cron: '30 14 * * *', title: '🍌 قبل تمرین',      body: 'موز یا خرما — انرژی تمرین' },
  { cron: '20 15 * * *', title: '☕ اسپرسو',          body: '۴۰ دقیقه مونده به تمرین!' },
  { cron: '0 16 * * *',  title: '🏋️ تمرین!',         body: 'وقت تمرینه سعید! بریم!' },
  { cron: '30 17 * * *', title: '⚡ ریکاوری',         body: 'وی پروتئین + کراتین ۵g' },
  { cron: '30 18 * * *', title: '🍽️ شام',             body: '۱۵۰g پروتئین + سبزیجات' },
  { cron: '30 19 * * *', title: '💊 منیزیم',          body: 'منیزیم قبل خواب فراموش نشه' },
];

schedule.forEach(({ cron: cronExpr, title, body }) => {
  cron.schedule(cronExpr, () => sendNotif(title, body));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`FitPro notification server running on port ${PORT}`));
