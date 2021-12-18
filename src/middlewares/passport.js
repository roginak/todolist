const passport = require("passport");
const passportConfig = require("../routes/user/passport");
const api = require("../routes");

exports.passportLoader = async (app) => {
  // passport 미들웨어
  app.use(passport.initialize());
  app.use(passport.session());

  // local passport
  passportConfig.passportLocal;

  // jwt passport
  passportConfig.passportJwt;

  app.use("/", api);
};
