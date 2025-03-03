const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const nunjucks = require('nunjucks');
const dotenv = require('dotenv');
const cors = require('cors');
const db = require('./config/db');

// 인증 미들웨어와 라우터 가져오기
const { ensureAuthenticated } = require('./middlewares/auth');
const authRouter = require('./routes/auth');

dotenv.config();
const app = express();

// 라우터 파일 임포트
const inquiryRouter = require('./routes/inquiry');
const pageRouter = require('./routes/page');
const favoritesRouter = require('./routes/favorites');
const compareRouter = require('./routes/compare');
const menuRouter = require('./routes/menu');
const storeDetailsRouter = require('./routes/store_details');
const signupRouter = require('./routes/signup');
const loginRouter = require('./routes/login');
const myInquiryRouter  = require('./routes/my_inquiry')
const situationRouter = require('./routes/situation');
const newRouter = require('./routes/new'); 
const reviewsRegisgerRouter = require('./routes/reviews_register');
const reviewDetailsRouter = require('./routes/review_details');
const recentReviewsRouter = require('./routes/recent_reviews')
const storeReviewRouter = require('./routes/store_review')
const storeRegisterRouter = require('./routes/store_register')
const randomRouter = require('./routes/random');
const affiliatesRouter = require('./routes/affiliates');
const indexRouter = require('./routes/index')
const storeSearchRouter = require('./routes/store_search');
const authRoutes = require('./routes/auth'); // auth.js 파일 경로
const myReviewRouter = require('./routes/my_review')
const nodemailer = require("nodemailer"); //이메일 인증
const email = require('./routes/email');
const freeRouter = require('./routes/free');
const freeNewRouter = require('./routes/free_new');
const myRouter = require('./routes/my');
const haksikRouter = require('./routes/haksik');
const haksikNewRouter = require('./routes/haksik_new');
const findPasswordRouter = require('./routes/find_password');
const resetPasswordRouter = require('./routes/reset_password');
const noticeRouter = require('./routes/notice')

app.set('port', process.env.PORT || 80);
app.set('view engine', 'html');
nunjucks.configure('views', {
  express: app,
  watch: true,
});

// 미들웨어 및 정적 파일 설정
app.use(cors({
  origin: ['http://localhost', 'http://sungmumuk.com'], // ✅ 로컬과 실제 웹사이트 모두 허용
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // ✅ 허용할 HTTP 메서드 추가
  allowedHeaders: ['Content-Type', 'Authorization'], // ✅ 허용할 헤더 추가
  credentials: true, // ✅ 쿠키 및 세션 인증 허용 (로그인 API 대비)
}));
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views')));
// app.use('/reset_password', express.static(path.join(__dirname, 'views')));
app.use('/', express.static(path.join(__dirname, 'views/notice')));
app.use('/restaurant', express.static(path.join(__dirname, 'restaurant')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/review', express.static(path.join(__dirname, 'review')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET || 'your-secret-key',
    cookie: {
      httpOnly: true,
      secure: false,
    },
  })
);

// 보호된 경로 설정
app.use('/free/posts', ensureAuthenticated); // 로그인된 사용자만 접근 가능
app.use('/free_new/posts', ensureAuthenticated); // 로그인된 사용자만 접근 가능
app.use('/free/comments', ensureAuthenticated); // 댓글도 보호 경로로 설정
app.use('/haksik/posts', ensureAuthenticated, ); // 학식 게시판 라우터
app.use('/haksik_new/posts', ensureAuthenticated); // 학식 게시판 라우터
app.use('/haksik/comments', ensureAuthenticated); // 학식 게시판 라우터

// 라우터 연결
app.use('/inquiry', inquiryRouter); 
app.use('/auth', authRouter); // 인증 라우터
app.use('/api/signup', signupRouter);
app.use('/api/login', loginRouter);
app.use('/store_details', storeDetailsRouter);
app.use('/menu', menuRouter);
app.use('/', compareRouter);
app.use('/', favoritesRouter);
app.use('/my-inquiry', myInquiryRouter);
app.use('/situation', situationRouter);
app.use('/new', newRouter);
app.use('/reviews', reviewsRegisgerRouter);
app.use('/',recentReviewsRouter)
app.use('/', reviewDetailsRouter);
app.use('/', storeReviewRouter); 
app.use('/', storeRegisterRouter); 
app.use('/', randomRouter);
app.use('/', affiliatesRouter);
app.use('/', indexRouter);
app.use('/store_search', storeSearchRouter);
app.use('/auth', authRoutes); 
app.use('/my_reviews', ensureAuthenticated, myReviewRouter);
app.use('/api/email', email); //이메일 추가
app.use('/my', myRouter);
app.use('/free', ensureAuthenticated, freeRouter);
app.use('/free_new',freeNewRouter);
app.use('/haksik', haksikRouter)
app.use('/haksik_new',haksikNewRouter);
app.use('/api/find_password', findPasswordRouter);
app.use('/reset_password', resetPasswordRouter);
app.use('/reset_password', express.static(path.join(__dirname, 'views')));
app.use('/notice',noticeRouter)

// 정적 HTML 파일 제공 라우트
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});
app.get('/menu', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'menu.html'));
});
app.get('/store_details', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'store_details.html'));
});
app.get('/favorites', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'favorites.html'));
});

// 에러 처리 미들웨어
app.use((req, res, next) => {
  res.status(404).send('페이지를 찾을 수 없습니다.');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('서버 오류가 발생했습니다.');
});

// 서버 실행
app.listen(app.get('port'), () => {
  console.log(`Server running at http://localhost:${app.get('port')}`);
});
