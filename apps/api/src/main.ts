import "reflect-metadata";
import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    credentials: true
  });

  const port = Number(
  process.env.PORT ??
  process.env.API_PORT ??
  4000
);
  await app.listen(port);
  console.log(`RetailOps API running at http://localhost:${port}/graphql`);
}

bootstrap();
