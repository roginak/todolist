const express = require("express");
const chalk = require("chalk");
const { middlewareLoaders } = require("./src/middlewares");
const app = express();

console.log(chalk.blue(`===${process.env.NODE_ENV}===`));

app.set("port", process.env.PORT);

// 필요한 미들웨어 불러오는 함수 (cors, passport, mongoose 등등..)
middlewareLoaders(app);

app.listen(app.get("port"), () => {
  console.log(app.get("port"), "번 포트에서 대기 중");
});
